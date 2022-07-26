const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");
const through2 = require("through2");
const jsonlint = require("jsonlint");
const fancyLog = require("fancy-log");
const gulpIf = require("gulp-if");
const ts = require("gulp-typescript");
const streamReadAll = require("stream-read-all");
const merge = require("merge");
const { parallel, src, dest } = require("gulp");
const { Project } = require("../project.js");
const { requireUncached } = require("../utils.js");

function validateJSONBuffer(vinyl, enc, buf) /* null | Error */ {
    /* THINKME: We should validate it against actual JSON schemata, not
     * only its well-formedness. */
    try {
        jsonlint.parse(buf.toString(enc));
    }
    catch (e) {
        return Error(`${vinyl.path}: ${e.message}`);
    }
}

function validateJSON() {
    return through2.obj((vinyl, enc, cb) => {
        if (path.extname(vinyl.path) == ".json") {
            if (vinyl.isBuffer()) {
                const e = validateJSONBuffer(vinyl, enc, vinyl.contents);
                if (e) {
                    cb(e);
                }
                else {
                    cb(null, vinyl);
                }
            }
            else if (vinyl.isStream()) {
                streamReadAll(vinyl.contents.clone())
                    .then(buf => {
                        const e = validateJSONBuffer(vinyl, buf);
                        if (e) {
                            cb(e);
                        }
                        else {
                            cb(null, vinyl);
                        }
                    })
                    .else(e => cb(e));
            }
            else {
                cb(null, vinyl);
            }
        }
        else {
            cb(null, vinyl);
        }
    });
}

function transpileTypeScript(tsConfigPath) {
    const tsConfigDefault = {
        compilerOptions: {
            noImplicitOverride: true,
            noImplicitReturns: true,
            noPropertyAccessFromIndexSignature: true,
            noUncheckedIndexedAccess: true,
            strict: true,
            module: "ES2020",
            target: "ES2022",
            explainFiles: true
        }
    };
    const tsConfig = merge.recursive(
        true,
        tsConfigDefault,
        fs.existsSync(tsConfigPath) ? requireUncached(tsConfigPath) : {});
    const tsProj = ts.createProject(tsConfig.compilerOptions);

    return gulpIf(
        vinyl => {
            const isTypeScript = path.extname(vinyl.path) == ".ts";
            if (isTypeScript) {
                const relPath = path.relative(process.cwd(), vinyl.path);
                fancyLog.info("Transpiling `" + relPath + "'...");
            }
            return isTypeScript;
        },
        tsProj()
    );
}

exports.contents = function contents(cb) {
    const proj  = new Project("package.json", "src/manifest.js");
    const tasks = [];

    for (const pack of proj.packs) {
        const stagePath = pack.stagePath("dist/stage");
        for (const mod of pack.modules) {
            for (const [srcGlob, destDir] of mod.include.entries()) {
                const destPath = path.resolve(stagePath, destDir);

                switch (mod.type) {
                case "script":
                    /* Special case: the script module often needs a
                     * transpilation. */
                    tasks.push(
                        function transpile() {
                            // THINKME: Support PureScript as well!!!
                            return src(srcGlob, {cwd: "src"})
                                .pipe(transpileTypeScript("src/tsconfig.json"))
                                .pipe(dest(destPath));
                        });
                    break;

                default:
                    tasks.push(
                        function copyData() {
                            return src(srcGlob, {cwd: "src"})
                                .pipe(validateJSON())
                                .pipe(dest(destPath));
                        });
                }
            }
        }

        tasks.push(
            function copyLicense() {
                return src("LICENSE", {allowEmpty: true})
                    .pipe(src("COPYING", {allowEmpty: true}))
                    .pipe(dest(stagePath));
            });
    }

    if (tasks.length > 0) {
        parallel(tasks)(cb);
    }
    else {
        cb();
    }
};

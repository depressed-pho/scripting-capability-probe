const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");
const jsonlint = require("jsonlint");
const fancyLog = require("fancy-log");
const gulpIf = require("gulp-if");
const ts = require("gulp-typescript");
const mapStream = require("map-stream");
const streamReadAll = require("stream-read-all");
const merge = require("merge");
const { parallel, src, dest } = require("gulp");
const { Project } = require("../project.js");
const { requireUncached } = require("../utils.js");

function validateJSONBuffer(vinyl, buf) /* null | Error */ {
    /* THINKME: We should validate it against actual JSON schemata, not
     * only its well-formedness. */
    try {
        jsonlint.parse(buf.toString());
    }
    catch (e) {
        return Error(`${vinyl.path}: ${e.message}`);
    }
}

const validateJSON = mapStream((vinyl, cb) => {
    if (path.extname(vinyl.path) == ".json") {
        if (vinyl.contents instanceof Buffer) {
            const e = validateJSONBuffer(vinyl, vinyl.contents);
            if (e) {
                cb(e);
            }
            else {
                cb(null, vinyl);
            }
        }
        else if (vinyl.contents instanceof Readable) {
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

    return gulpIf(
        vinyl => {
            const isTypeScript = path.extname(vinyl.path) == ".ts";
            if (isTypeScript) {
                const relPath = path.relative(process.cwd(), vinyl.path);
                fancyLog.info("Transpiling `" + relPath + "'...");
            }
            return isTypeScript;
        },
        ts(tsConfig.compilerOptions)
    );
}

exports.contents = function contents(cb) {
    const proj  = new Project("package.json", "src/manifest.js");
    const tasks = [];

    for (const pack of proj.packs) {
        const stageDir = pack.stageDir("dist/stage");
        for (const mod of pack.modules) {
            for (const [srcGlob, destDir] of mod.include.entries()) {
                const destPath = path.resolve(stageDir, destDir);

                switch (mod.type) {
                case "script":
                    /* Special case: the script module often needs a
                     * transpilation. */
                    tasks.push(
                        function transpile() {
                            return src(srcGlob, {cwd: "src"})
                                .pipe(transpileTypeScript("src/tsconfig.json"))
                                .pipe(dest(destPath));
                        });
                    break;

                default:
                    tasks.push(
                        function copyData() {
                            return src(srcGlob, {cwd: "src"})
                                .pipe(validateJSON)
                                .pipe(dest(destPath));
                        });
                }
            }
        }
    }

    if (tasks.length > 0) {
        parallel(tasks)(cb);
    }
    else {
        cb();
    }
};

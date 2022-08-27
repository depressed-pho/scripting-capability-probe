const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");
const util = require("node:util");
const jsonlint = require("jsonlint");
const fancyLog = require("fancy-log");
const gulpIf = require("gulp-if");
const ts = require("gulp-typescript");
const streamReadAll = require("stream-read-all");
const merge = require("merge");
const { Transform, compose } = require("node:stream");
const { parallel, src, dest } = require("gulp");
const { Project } = require("../project.js");
const { requireUncached } = require("../utils.js");

class ValidateJSON extends Transform {
    constructor() {
        super({objectMode: true});
    }

    _transform(vinyl, enc, cb) {
        if (path.extname(vinyl.path) == ".json") {
            if (vinyl.isBuffer()) {
                const e = ValidateJSON.#validateJSONBuffer(vinyl, enc, vinyl.contents);
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
                        const e = ValidateJSON.#validateJSONBuffer(vinyl, enc, buf);
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
    }

    static #validateJSONBuffer(vinyl, enc, buf) /* null | Error */ {
        /* THINKME: We should validate it against actual JSON schemata, not
         * only its well-formedness. */
        try {
            jsonlint.parse(buf.toString(enc));
        }
        catch (e) {
            return Error(`${vinyl.path}: ${e.message}`);
        }
    }
}

// Why doesn't tsc does this for us? Just why?
class RewriteTypescriptImports extends Transform {
    #baseUrl;
    #paths;

    constructor(baseUrl, paths) {
        super({objectMode: true});
        this.#baseUrl = baseUrl;
        this.#paths   = paths;
    }

    _transform(vinyl, enc, cb) {
        // THINKME: We should probably update source
        // maps. gulp-transform-js-ast does that, but we can't use it
        // because it is heavily outdated and cannot parse modern ES.
        if (vinyl.isBuffer()) {
            try {
                vinyl.contents = this.#rewriteBuffer(vinyl.path, vinyl.contents, enc);
                cb(null, vinyl);
            }
            catch (e) {
                cb(e);
            }
        }
        else if (vinyl.isStream()) {
            streamReadAll(vinyl.contents.clone())
                .then(buf => {
                    try {
                        vinyl.contents = this.#rewriteBuffer(vinyl.path, buf, enc);
                        cb(null, vinyl);
                    }
                    catch (e) {
                        cb(e);
                    }
                });
        }
        else {
            cb(null, vinyl);
        }
    }

    #rewriteBuffer(sourcePath, buf, enc) {
        const sourceInput = buf.toString(enc);

        // NOTE: We want to use recast
        // (https://www.npmjs.com/package/recast) but we can't, since it
        // cannot handle some of modern ES syntaxes we use. So... the
        // "solution" is to apply a damn RegExp transformation.
        const sourceOutput = sourceInput.replaceAll(
            /(import|export)(.*?)from\s*(?:"([^"]+)"|'([^']+)')/g,
            (match, impExp, locals, dqPath, sqPath) => {
                const origPath = dqPath != null ? dqPath : sqPath;
                const newPath  = this.#rewritePath(origPath, sourcePath);
                return `${impExp}${locals}from "${newPath}"`;
            });

        return Buffer.from(sourceOutput, enc);
    }

    #rewritePath(origPath, sourcePath) {
        for (const [from, to] of Object.entries(this.#paths)) {
            if (origPath === from) {
                // Exact match
                for (const candidate of to) {
                    if (candidate.endsWith("/*")) {
                        throw new Error(`Invalid path candidate: ${candidate}`);
                    }
                    const base = path.resolve(this.#baseUrl, candidate);
                    if (fs.existsSync(base) || fs.existsSync(base + ".ts")) {
                        return path.relative(path.dirname(sourcePath), base);
                    }
                }
                throw new Error(`File ${origPath} not found in ${util.inspect(to)}`);
            }
            else if (from.endsWith("/*") && origPath.startsWith(from.slice(0, -1))) {
                // Wildcard match
                const wildcarded = origPath.slice(from.length - 1);

                for (const candidate of to) {
                    if (!candidate.endsWith("/*")) {
                        throw new Error(`Invalid path candidate: ${candidate}`);
                    }
                    const stem = candidate.slice(0, -1);
                    const base = path.resolve(this.#baseUrl, stem, wildcarded);
                    if (fs.existsSync(base) || fs.existsSync(base + ".ts")) {
                        return path.relative(path.dirname(sourcePath), base);
                    }
                }
                throw new Error(`File ${origPath} not found in ${util.inspect(to)}`);
            }
        }
        return origPath;
    }
}

function transpileTypeScript(tsConfigPath) {
    const tsConfigDefault = {
        compilerOptions: {
            noImplicitOverride: true,
            noImplicitReturns: true,
            noPropertyAccessFromIndexSignature: true,
            noUncheckedIndexedAccess: true,
            strict: true,
            baseUrl: "src",
            module: "ES2020",
            paths:  {},
            target: "ES2022",
            explainFiles: true
        }
    };
    const tsConfig = merge.recursive(
        true,
        tsConfigDefault,
        fs.existsSync(tsConfigPath)
            ? requireUncached(path.resolve(tsConfigPath))
            : {});
    const tsProj = ts.createProject(tsConfig.compilerOptions);
    const rewrite = new RewriteTypescriptImports(
        tsConfig.compilerOptions.baseUrl, tsConfig.compilerOptions.paths);

    return gulpIf(
        vinyl => {
            const isTypeScript = path.extname(vinyl.path) == ".ts";
            if (isTypeScript) {
                const relPath = path.relative(process.cwd(), vinyl.path);
                fancyLog.info("Transpiling `" + relPath + "'...");
            }
            return isTypeScript;
        },
        compose(tsProj(), rewrite)
    );
}

exports.contents = function contents(cb) {
    const proj  = new Project("package.json", "src/manifest.js");
    const tasks = [];

    for (const pack of proj.packs) {
        const buildPath = pack.stagePath("dist/build");
        for (const mod of pack.modules) {
            for (const [srcGlob, destDir] of mod.include.entries()) {
                const destPath = path.resolve(buildPath, destDir);

                switch (mod.type) {
                case "script":
                    /* Special case: the script module often needs a
                     * transpilation. */
                    tasks.push(
                        function transpile() {
                            // THINKME: Support PureScript as well!!!
                            return src(srcGlob, {cwd: "src", sourcemaps: true})
                                .pipe(transpileTypeScript("src/tsconfig.json"))
                                .pipe(dest(destPath, {sourcemaps: "."}));
                        });
                    break;

                default:
                    tasks.push(
                        function copyData() {
                            return src(srcGlob, {cwd: "src"})
                                .pipe(new ValidateJSON())
                                .pipe(dest(destPath));
                        });
                }
            }
        }

        tasks.push(
            function copyLicense() {
                return src("LICENSE", {allowEmpty: true})
                    .pipe(src("COPYING", {allowEmpty: true}))
                    .pipe(dest(buildPath));
            });
    }

    if (tasks.length > 0) {
        parallel(tasks)(cb);
    }
    else {
        cb();
    }
};

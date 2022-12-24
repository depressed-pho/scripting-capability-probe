const fs = require("node:fs");
const path = require("node:path");
const streamReadAll = require("stream-read-all");
const util = require("node:util");
const { Transform } = require("node:stream");
const { requireUncached } = require("./utils.js");

/* interface Candidate {
 *     path: string;
 *     isSource: boolean; // Whether the path points at a source file or a destination file.
 * }
 */

class RewriteImports {
    #aliasBase; // Path
    #aliases;   // Map<Pattern, Candidate[]>, relative candidates are
                // relative to aliasBase.

    constructor(...args) {
        switch (args.length) {
        case 0:
            this.#aliasBase = "/nonexistent";
            this.#aliases   = new Map();
            break;
        case 1:
            // new RewriteImports("src/tsconfig.json")
            if (fs.existsSync(args[0])) {
                const tsConfig = requireUncached(path.resolve(args[0]));
                this.#aliasBase = tsConfig.compilerOptions?.baseUrl ?? "/nonexistent";
                this.#aliases   = new Map(Object.entries(tsConfig.compilerOptions?.paths ?? []).map(([name, candidates]) => {
                    return [
                        name,
                        candidates.map(path => {
                            return {
                                path,
                                isSource: true
                            };
                        })
                    ];
                }));
            }
            else {
                this.#aliasBase = "/nonexistent";
                this.#aliases   = new Map();
            }
            break;
        case 2:
            // new RewriteImports(aliasBase, aliases)
            this.#aliasBase = args[0];
            this.#aliases   = args[1];
            break;
        default:
            throw new TypeError("wrong number of arguments");
        }
    }

    addAliases(aliases) {
        for (const [from, to] of aliases) {
            const cands0 = this.#aliases.get(from) ?? [];
            const cands1 = cands0.concat(to);
            this.#aliases.set(from, cands1);
        }
    }

    stream(destRoot) {
        return new RewriteImportsImpl(this.#aliasBase, this.#aliases, destRoot);
    }
}

class RewriteImportsImpl extends Transform {
    #aliasBase;
    #aliases;
    #destRoot;

    constructor(aliasBase, aliases, destRoot) {
        super({objectMode: true});
        this.#aliasBase = aliasBase;
        this.#aliases   = aliases;
        this.#destRoot  = destRoot;
    }

    _transform(vinyl, enc, cb) {
        // THINKME: We should probably update source
        // maps. gulp-transform-js-ast does that, but we can't use it
        // because it is heavily outdated and cannot parse modern ES.

        const srcPath  = vinyl.path;
        const destPath = path.resolve(this.#destRoot, vinyl.relative);
        if (vinyl.isBuffer()) {
            try {
                vinyl.contents = this.#rewriteBuffer(srcPath, destPath, vinyl.contents, enc);
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
                        vinyl.contents = this.#rewriteBuffer(srcPath, destPath, buf, enc);
                        cb(null, vinyl);
                    }
                    catch (e) {
                        cb(e);
                    }
                })
                .else(e => cb(e));
        }
        else {
            cb(null, vinyl);
        }
    }

    #rewriteBuffer(srcPath, destPath, buf, enc) {
        const sourceInput = buf.toString(enc);

        // NOTE: We want to use recast
        // (https://www.npmjs.com/package/recast) but we can't, since it
        // cannot handle some of modern ES syntaxes we use. So... the
        // "solution" is to apply a damn RegExp transformation.
        const sourceOutput = sourceInput.replaceAll(
            /(import|export)(?:(.*?)from)?\s*(?:"([^"]+)"|'([^']+)')/g,
            (match, impExp, locals, dqPath, sqPath) => {
                const origPath = dqPath != null ? dqPath : sqPath;
                const newPath  = this.#rewritePath(origPath, srcPath, destPath);
                if (locals == null) {
                    return `${impExp} "${newPath}"`;
                }
                else {
                    return `${impExp}${locals}from "${newPath}"`;
                }
            });

        return Buffer.from(sourceOutput, enc);
    }

    #rewritePath(origPath, srcPath, destPath) {
        if (origPath.startsWith(".")) {
            return this.#rewriteRelativePath(origPath, srcPath, destPath);
        }
        else {
            return this.#rewriteSymbolicPath(origPath, srcPath, destPath);
        }
    }

    #rewriteRelativePath(origPath, srcPath, destPath) {
        const base     = path.resolve(path.dirname(srcPath), origPath);
        const resolved = this.#resolve(origPath, srcPath, base);
        if (resolved != null) {
            return resolved;
        }
        else {
            // A special case: the referred file may reside in a different
            // root directory or is maybe not generated/copied yet.
            return origPath + ".js";
        }
    }

    #rewriteSymbolicPath(origPath, srcPath, destPath) {
        for (const [from, to] of this.#aliases) {
            if (origPath === from) {
                // Exact match
                for (const candidate of to) {
                    if (candidate.path.endsWith("*")) {
                        throw new Error(`Invalid path candidate: ${candidate.path}`);
                    }
                    const base     = path.resolve(this.#aliasBase, candidate.path);
                    const resolved = candidate.isSource
                          ? this.#resolve(origPath, srcPath, base)
                          : this.#resolve(origPath, destPath, base);
                    if (resolved != null) {
                        return resolved;
                    }
                }
                throw new Error(`${srcPath}: Module ${origPath} not found in ${util.inspect(to)}`);
            }
            else if (from.endsWith("*") && origPath.startsWith(from.slice(0, -1))) {
                // Wildcard match
                const wildcarded = origPath.slice(from.length - 1);

                for (const candidate of to) {
                    if (!candidate.path.endsWith("*")) {
                        throw new Error(`Invalid path candidate: ${candidate.path}`);
                    }
                    const stem     = candidate.path.slice(0, -1);
                    const base     = path.resolve(this.#aliasBase, stem + wildcarded);
                    const resolved = candidate.isSource
                          ? this.#resolve(origPath, srcPath, base)
                          : this.#resolve(origPath, destPath, base);
                    if (resolved != null) {
                        return resolved;
                    }
                }
                throw new Error(`${srcPath}: Module ${origPath} not found in ${util.inspect(to)}`);
            }
        }
        throw new Error(`${srcPath}: Module ${origPath} not found in the alias table or in dependencies`);
    }

    #resolve(origPath, srcPath, base) {
        function toRelative(from, to) {
            const relative = path.relative(from, to);
            if (relative.startsWith("./") || relative.startsWith("../")) {
                return relative;
            }
            else {
                return "./" + relative;
            }
        }

        if (fs.existsSync(base)) {
            return toRelative(path.dirname(srcPath), base);
        }
        else if (fs.existsSync(base + ".d.ts")) {
            // No need to rewrite this.
            return origPath;
        }
        else if (fs.existsSync(base + ".ts") || fs.existsSync(base + ".js")) {
            return toRelative(path.dirname(srcPath), base + ".js");
        }
        else {
            return null;
        }
    }
}

exports.RewriteImports = RewriteImports;

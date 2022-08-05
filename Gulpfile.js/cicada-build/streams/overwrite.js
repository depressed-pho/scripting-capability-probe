const fancyLog = require("fancy-log");
const { Writable } = require("node:stream");
const { chmod, lstat, mkdir, readdir, readlink,
        rm, symlink, writeFile } = require("node:fs/promises");
const fs = require("node:fs");
const path = require("node:path");

class Overwrite extends Writable {
    #destDir;  // string
    #destTree; // Map<string, Stats>
    #opts;     // {dryRun?: boolean, verbose?: boolean}

    constructor(destDir, opts = {}) {
        super({objectMode: true});
        this.#destDir = destDir;
        this.#opts    = opts;

        if (this.#opts.dryRun) {
            this.#opts.verbose = true;
        }
    }

    _construct(cb) {
        this.#scanDest()
            .then(cb, e => cb(e));
    }

    _write(vinyl, enc, cb) {
        this.#overwrite(vinyl)
            .then(cb, e => cb(e));
    }

    _final(cb) {
        this.#removeRemaining()
            .then(cb, e => cb(e));
    }

    async #scanDest() {
        this.#destTree = new Map();

        if (fs.existsSync(this.#destDir)) {
            // Is it really a directory?
            const st = await lstat(this.#destDir);
            if (st.isDirectory()) {
                await this.#scanDir(this.#destDir);
            }
            else {
                // No. Remove it and create a directory.
                await this.#rm(this.#destDir)
                await this.mkdir(this.#destDir);
            }
        }
    }

    async #scanDir(dirPath) {
        for await (const name of await readdir(dirPath)) {
            const entPath = path.resolve(dirPath, name);
            const st      = await lstat(entPath);

            this.#destTree.set(entPath, st);
            if (st.isDirectory()) {
                await this.#scanDir(entPath);
            }
        }
    }

    async #overwrite(vinyl) {
        const absPath = path.resolve(this.#destDir, vinyl.relative);
        const stNew   = vinyl.stat;

        // Is there an existing file with the same path?
        const stOld = this.#destTree.get(absPath);
        if (stOld) {
            if (vinyl.isDirectory()) {
                if (stOld.isDirectory()) {
                    // We can reuse an existing directory. We only need to
                    // update its permission bits.
                    if (stNew.mode != stOld.mode) {
                        await this.#chmod(absPath, stNew.mode);
                    }
                }
                else {
                    // We need it to be a directory but there is an
                    // existing non-directory there.
                    await this.#rm(absPath);
                    await this.#mkdir(absPath, stNew.mode);
                }
            }
            else if (vinyl.isSymbolic()) {
                if (!stOld.isSymbolicLink() ||
                    await readlink(absPath) !== vinyl.symlink) {

                    // Not a symlink, or a wrong destination.
                    await this.#rm(absPath);
                    await this.#symlink(vinyl.symlink, stNew.mode);
                }
            }
            else {
                if (stOld.isFile()) {
                    if (stOld.mtime < stNew.mtime) {
                        // There is an existing regular file there, but
                        // it's an old one.
                        await this.#rm(absPath);
                        await this.#writeFile(absPath, vinyl.contents, stNew.mode);
                    }
                    else {
                        // We can reuse an existing file. We only need to
                        // update its permission bits.
                        if (stNew.mode != stOld.mode) {
                            await this.#chmod(absPath, stNew.mode);
                        }

                        if (this.#opts.verbose) {
                            fancyLog.info(`keep: ${absPath}`);
                        }
                    }
                }
                else {
                    // We need it to be a regular file but it's something
                    // different.
                    await this.#rm(absPath);
                    await this.#writeFile(absPath, vinyl.contents, stNew.mode);
                }
            }
            this.#destTree.delete(absPath);
        }
    }

    async #removeRemaining() {
        for (const path of this.#destTree.keys()) {
            await this.#rm(path);
        }
    }

    async #chmod(path, mode) {
        if (this.#opts.verbose) {
            fancyLog.info(`chmod ${mode}: ${path}`);
        }
        if (!this.#opts.dryRun) {
            await chmod(path, mode);
        }
    }

    async #mkdir(path, mode = 0o777) {
        if (this.#opts.verbose) {
            fancyLog.info(`mkdir ${mode}. ${path}`);
        }
        if (!this.#opts.dryRun) {
            await mkdir(path, {mode: mode});
        }
    }

    async #rm(path) {
        if (this.#opts.verbose) {
            fancyLog.info(`rm -rf: ${path}`);
        }
        if (!this.#opts.dryRun) {
            await rm(path, {recursive: true});
        }
    }

    async #symlink(dest, src) {
        if (this.#opts.verbose) {
            fancyLog.info(`symlink: \`${src}' -> \`${dest}'`);
        }
        if (!this.#opts.dryRun) {
            await symlink(dest, src);
        }
    }

    async #writeFile(path, data, mode) {
        if (this.#opts.verbose) {
            fancyLog.info(`write ${mode}: ${path}`);
        }
        if (!this.#opts.dryRun) {
            await writeFile(path, data, {mode});
        }
    }
}

exports.overwrite = (destDir, opts) => new Overwrite(destDir, opts);

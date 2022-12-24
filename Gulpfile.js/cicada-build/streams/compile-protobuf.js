const fancyLog = require("fancy-log");
const path = require("node:path");
const npmWhich = require("npm-which")(process.cwd());
const { Writable } = require("node:stream");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { mkdir } = require("node:fs/promises");

class CompileProtobuf extends Writable {
    #destDir; // string
    #protoc; // string

    constructor(destDir) {
        super({objectMode: true});
        this.#destDir = destDir;
    }

    _write(vinyl, enc, cb) {
        this.#compile(vinyl)
            .then(cb, e => { console.error(e); cb(e) });
    }

    async #compile(vinyl) {
        let protoc = this.#protoc;
        if (!protoc) {
            protoc = await promisify(npmWhich)("protoc");
            this.#protoc = protoc;
        }

        // FIXME: Write the vinyl to a temporary file if it isn't a real
        // on-disk file.
        const destDir = path.resolve(this.#destDir, path.dirname(vinyl.relative));
        await mkdir(destDir, {recursive: true});

        const { stdout, stderr } = await promisify(execFile)(
            protoc, [
                "--ts_out", destDir,
                "--ts_opt", "ts_nocheck",
                "--proto_path", path.dirname(vinyl.path),
                vinyl.path
            ]);
        if (stderr != "") {
            fancyLog.warn(stderr);
        }
        if (stdout != "") {
            fancyLog.info(stdout);
        }
    }
}

exports.compileProtobuf = (destDir) => new CompileProtobuf(destDir);

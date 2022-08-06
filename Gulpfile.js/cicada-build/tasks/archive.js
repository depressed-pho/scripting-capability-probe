const Vinyl = require("vinyl");
const yazl = require("yazl");
const { Transform } = require("node:stream");
const { src, dest } = require("gulp");
const { Project } = require("../project.js");

class Zip extends Transform {
    #path;
    #zip;

    constructor(zipPath) {
        super({objectMode: true});

        this.#path = zipPath;
        this.#zip  = new yazl.ZipFile();
    }

    _transform(vinyl, enc, cb) {
        const stat = vinyl.stat || {};
        const opts = {
            mtime: stat.mtime,
            mode:  stat.mode
        };

        const entryPath = vinyl.relative;
        if (vinyl.isDirectory()) {
            // Ignore these. They aren't necessary. And this is why we
            // don't use gulp-vinyl-zip for this.
        }
        else if (vinyl.isBuffer()) {
            this.#zip.addBuffer(vinyl.contents, entryPath, opts);
        }
        else if (vinyl.isStream()) {
            this.#zip.addReadStream(vinyl.contents, entryPath, opts);
        }
        cb();
    }

    _flush(cb) {
        this.push(new Vinyl({ path: this.#path, contents: this.#zip.outputStream }));
        this.#zip.end(() => cb());
    }
}

exports.archive = function archive() {
    const proj = new Project("package.json", "src/manifest.js");

    return src("**", {cwd: "dist/stage"})
        .pipe(new Zip(proj.archiveName))
        .pipe(dest("dist"));
};

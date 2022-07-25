const through2 = require("through2");
const Vinyl = require("vinyl");
const yazl = require("yazl");
const { src, dest } = require("gulp");
const { Project } = require("../project.js");

function zip(zipPath) {
    const zip = new yazl.ZipFile();

    const stream = through2.obj(
        (vinyl, enc, cb) => {
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
                zip.addBuffer(vinyl.contents, entryPath, opts);
            }
            else if (vinyl.isStream()) {
                zip.addReadStream(vinyl.contents, entryPath, opts);
            }
            cb();
        },
        cb => {
            stream.push(new Vinyl({ path: zipPath, contents: zip.outputStream }));
            zip.end(() => cb());
        });
    return stream;
}

exports.archive = function archive() {
    const proj = new Project("package.json", "src/manifest.js");

    return src("**", {cwd: "dist/stage"})
        .pipe(zip(proj.archiveName))
        .pipe(dest("dist"));
};

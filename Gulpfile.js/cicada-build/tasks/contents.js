const ignore = require("gulp-ignore");
const path = require("node:path");
const { parallel, series, src, dest } = require("gulp");
const { Project } = require("../project.js");
const { Vendor } = require("../vendor.js");
const { RewriteImports } = require("../rewrite-imports.js");
const { compileProtobuf } = require("../streams/compile-protobuf");
const { transpileTypeScript } = require("../streams/transpile-typescript");
const { validateJSON } = require("../streams/validate-json");

exports.contents = function contents(cb) {
    const proj    = new Project("package.json", "src/manifest.js");
    const vendor  = new Vendor("package.json");
    const tasks   = [];

    for (const pack of proj.packs) {
        const buildPath  = pack.stagePath("dist/build");
        const genPath    = pack.stagePath("dist/generated");

        for (const mod of pack.modules) {
            const srcGlobs   = Array.from(mod.include.values());

            switch (mod.type) {
            case "script":
                /* Special case: the script module often needs a
                 * transpilation. */

                // This is unsound. We want our vendor packages to end up
                // in dist/stage/scripts but there aren't any less terrible
                // ways than this.
                const scriptRoot = mod.entry.split(path.sep)[0];
                const vendorPath = path.join(buildPath, scriptRoot);
                const rewrite    = new RewriteImports("src/tsconfig.json");
                rewrite.addAliases(vendor.aliases(vendorPath));

                tasks.push(
                    series(
                        parallel(
                            // We must run protoc before tsc because the
                            // compiler is going to need them.
                            function protoc() {
                                return src(srcGlobs, {cwd: "src", cwdbase: true})
                                    .pipe(ignore.include("**/*.proto"))
                                    .pipe(compileProtobuf(genPath));
                            },
                            // Also vendor run-time dependencies because
                            // RewriteImports is going to need them.
                            vendor.task(vendorPath)
                        ),
                        function transpile() {
                            // THINKME: Maybe support PureScript as well?
                            return src(srcGlobs, {cwd: "src", cwdbase: true, sourcemaps: true})
                                .pipe(src(srcGlobs, {cwd: genPath, cwdbase: true, sourcemaps: true}))
                                .pipe(ignore.exclude("**/*.proto"))
                                .pipe(transpileTypeScript("src/tsconfig.json"))
                                .pipe(rewrite.stream(buildPath))
                                .pipe(dest(buildPath, {sourcemaps: "."}));
                        }
                    ));
                break;
            default:
                tasks.push(
                    function copyData() {
                        return src(srcGlobs, {cwd: "src", cwdbase: true})
                            .pipe(validateJSON())
                            .pipe(dest(buildPath));
                    });
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
        parallel(...tasks)(cb);
    }
    else {
        cb();
    }
};

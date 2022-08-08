const { series, parallel, watch } = require("gulp");
const { clean, distclean, manifests, icons, contents, stage, archive,
        installIfPossible } = require("./cicada-build/tasks.js");

exports.clean = clean;

exports.distclean = distclean;

exports.build =
    series(
        clean,
        parallel(
            manifests,
            icons,
            contents
        ),
        stage,
        archive
    );

exports.install =
    series(
        exports.build,
        installIfPossible
    );

exports.watch = function() {
    watch([
        "package.json",
        "src/**"
    ], {ignoreInitial: false}, exports.install);
};

exports.default = exports.build;

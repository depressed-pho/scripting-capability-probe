const { series, parallel, watch } = require("gulp");
const { clean, manifests, icons, contents, archive,
        installIfPossible } = require("./cicada-build/tasks.js");

exports.clean = clean;

exports.build =
    series(
        clean,
        parallel(
            manifests,
            icons,
            contents
        ),
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

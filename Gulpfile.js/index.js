const { series, parallel } = require("gulp");
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

exports.default = exports.build;

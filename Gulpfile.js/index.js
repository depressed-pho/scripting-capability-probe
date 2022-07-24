const { series, parallel } = require("gulp");
const { clean, manifests, icons, contents, archive } = require("./cicada-build/tasks.js");

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

exports.default = series(exports.build);

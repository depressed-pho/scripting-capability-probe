const { series, parallel } = require("gulp");
const { clean, manifest, icon } = require("./cicada-build/tasks.js");

exports.build =
    series(
        clean,
        parallel(
            manifest,
            icon
        )
    );

exports.default = series(exports.build);

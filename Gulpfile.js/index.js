const { series, parallel } = require("gulp");
const { clean, manifest } = require("./cicada-build/tasks.js");

exports.build =
    series(
        clean,
        parallel(
            manifest
        )
    );

exports.default = series(exports.build);

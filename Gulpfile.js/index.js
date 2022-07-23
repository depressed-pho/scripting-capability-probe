const { series, parallel } = require("gulp");
const { clean, manifest, icon, contents } = require("./cicada-build/tasks.js");

exports.build =
    series(
        clean,
        parallel(
            manifest,
            icon,
            contents
        )
    );

exports.default = series(exports.build);

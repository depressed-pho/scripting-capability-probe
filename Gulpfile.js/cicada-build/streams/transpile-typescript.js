const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");
const fancyLog = require("fancy-log");
const merge = require("merge");
const { requireUncached } = require("../utils.js");

function transpileTypeScript(tsConfigPath, buildPath) {
    const ts = require("gulp-typescript");
    const tsConfigDefault = {
        compilerOptions: {
            rootDir: ".",
            rootDirs: ["src", "dist/generated"],
            baseUrl: "src",
            module: "ES2020",
            moduleResolution: "node",
            paths:  {},
            target: "ES2022",
            explainFiles: true
        }
    };
    const tsConfig = merge.recursive(
        true,
        tsConfigDefault,
        fs.existsSync(tsConfigPath)
            ? requireUncached(path.resolve(tsConfigPath))
            : {});

    return ts(tsConfig.compilerOptions);
}

exports.transpileTypeScript = transpileTypeScript;

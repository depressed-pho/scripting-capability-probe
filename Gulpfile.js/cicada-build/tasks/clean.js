const { rm } = require("node:fs/promises");

exports.distclean = async function distclean () {
    await rm("dist", {force: true, recursive: true});
};

exports.clean = async function clean () {
    await rm("dist/build", {force: true, recursive: true});
    await rm("dist/generated", {force: true, recursive: true});
};

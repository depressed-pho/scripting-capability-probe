const { rm } = require("node:fs/promises");

exports.clean = async function clean () {
    await rm("dist", {force: true, recursive: true});
};

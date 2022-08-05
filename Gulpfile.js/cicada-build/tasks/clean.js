const { rm } = require("node:fs/promises");

exports.clean = async function clean () {
    await rm("dest", {force: true, recursive: true});
};

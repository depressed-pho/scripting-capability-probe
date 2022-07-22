const del = require("delete");

exports.clean = async function clean () {
    await del(["dist"]);
};

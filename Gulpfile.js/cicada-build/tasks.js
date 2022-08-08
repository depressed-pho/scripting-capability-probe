module.exports = {
    ...require("./tasks/clean.js"),
    ...require("./tasks/manifests.js"),
    ...require("./tasks/icons.js"),
    ...require("./tasks/contents.js"),
    ...require("./tasks/stage.js"),
    ...require("./tasks/archive.js"),
    ...require("./tasks/install.js")
};

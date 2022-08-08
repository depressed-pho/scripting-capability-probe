const path = require("node:path");
const { mkdir, writeFile } = require("node:fs/promises");
const { Project } = require("../project.js");

exports.manifests = async function manifests() {
    const proj = new Project("package.json", "src/manifest.js");

    for (const pack of proj.packs) {
        const buildPath = pack.stagePath("dist/build");
        await mkdir(buildPath, {recursive: true});

        const maniStr = JSON.stringify(pack.manifest, null, 4) + "\n";
        await writeFile(path.resolve(buildPath, "manifest.json"), maniStr);
    }
};

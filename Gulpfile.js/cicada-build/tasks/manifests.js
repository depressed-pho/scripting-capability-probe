const path = require("node:path");
const { mkdir, writeFile } = require("node:fs/promises");
const { Project } = require("../project.js");

exports.manifests = async function manifests() {
    const proj = new Project("package.json", "src/manifest.js");

    for (const pack of proj.packs) {
        const stagePath = pack.stagePath("dist/stage");
        await mkdir(stagePath, {recursive: true});

        const maniStr = JSON.stringify(pack.manifest, null, 4) + "\n";
        await writeFile(path.resolve(stagePath, "manifest.json"), maniStr);
    }
};

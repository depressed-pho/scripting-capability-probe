const gm = require("gm");
const path = require("node:path");
const { mkdir } = require("node:fs/promises");
const { Project } = require("../project.js");
const { promisify } = require("node:util");

exports.icon = async function icon() {
    const proj = new Project("package.json", "src/manifest.js");

    /* FIXME: Use node-png to see if the source icon is already a PNG image
     * suitable for the pack icon, and copy it verbatim. The gm module
     * depends on GraphicsMagick externally installed to the system. */

    for (const pack of proj.packs) {
        if (pack.icon != null) {
            const stageDir = pack.stageDir("dist/stage");
            await mkdir(stageDir, {recursive: true});

            /* FIXME: Forcing the size to 256x256 is a bad idea if the icon
             * is already smaller than that, unless it's a vector image. */
            const iconSrc = gm(pack.icon).resize(256, 256);
            const iconDst = path.resolve(stageDir, "pack_icon.png");
            await promisify(iconSrc.write).bind(iconSrc)(iconDst);
        }
    }
};

const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");
const del = require("delete");
const fancyLog = require("fancy-log");
const { readdir, readFile } = require("node:fs/promises");
const { pipeline } = require("node:stream");
const { src, dest } = require("gulp");
const { Project } = require("../project.js");
require("dotenv").config();

exports.installIfPossible = async function installIfPossible() {
    const comMojangPath = process.env.MC_COM_MOJANG_PATH;

    if (comMojangPath == undefined) {
        fancyLog.warn(
            "`com.mojang' directory path has not been set. " +
            "In order to install packs to Minecraft, create a file named " +
            "`.env' on the root of the repository, and put the following " +
            "line to the file:"
        );
        fancyLog.warn(
            "MC_COM_MOJANG_PATH=\"/path/to/com.mojang\"");
    }
    else if (!fs.existsSync(comMojangPath)) {
        fancyLog.warn(
            "MC_COM_MOJANG_PATH points at a non-existent directory: " + comMojangPath);
    }
    else {
        const proj = new Project("package.json", "src/manifest.js");
        for (const pack of proj.packs) {
            const stagePath       = pack.stagePath("dist/stage");
            const installRootPath = pack.installRootPath(comMojangPath);
            const installPath     = pack.installPath(comMojangPath);

            // Now this is the most dangerous part. We have a root
            // directory where packs are installed. Before installing our
            // pack there, we must look for a pack that has the same UUID
            // as ours, and delete it if it exists.
            for (const dirent of await readdir(installRootPath, {withFileTypes: true})) {
                if (dirent.isDirectory()) {
                    const packPath = path.resolve(installRootPath, dirent.name);
                    const maniPath = path.resolve(packPath, "manifest.json");
                    if (!fs.existsSync(maniPath)) {
                        fancyLog.warn(`Manifest file missing: ${maniPath}`);
                    }

                    const manifest = JSON.parse(await readFile(maniPath));
                    if (typeof manifest             === "object" &&
                        typeof manifest.header      === "object" &&
                        typeof manifest.header.uuid === "string" &&
                        manifest.header.uuid        === pack.uuid) {
                        fancyLog.info(`Uninstalling: ${packPath}`);
                        await del.promise([packPath], {force: true});
                        break;
                    }
                }
            }

            // Copy everything from the staging directory.
            fancyLog.info(`Installing: ${installPath}`);
            await new Promise((resolve, reject) =>{
                pipeline(
                    src("**", {cwd: stagePath}),
                    dest(installPath),
                    err => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });
            });
        }
    }
};

/* This file provides additional metadata for generating manifest.json,
 * .mcpack, and .mcaddon files. The other data are read from
 * package.json. It's a JS file so it can have comments.
 */
module.exports = {
    // Common properties shared by every package (optional).
    common: {
        // Override package.json "name" (optional).
        name: "Scripting Capability Probe",

        // Generate or copy a pack icon from a file relative to manifest.js
        // (optional). The file will be copied if it's a PNG file of at
        // most 256x256 pixels, or converted otherwise. The image has to be
        // square: its width and height must be the same.
        icon: "capability-probe.png",

        // Required
        min_engine_version: "1.20.41"
    },
    // Packs to generate (required).
    packs: [
        {
            // Required
            uuid: "972bb3f0-44ff-4e01-98a0-6d6bd4637ea7",

            // Required
            modules: [
                // "version" can be ommitted.
                {
                    description: "capprobe scripts",
                    type: "script",
                    language: "javascript",
                    uuid: "1701df17-ca78-4cdf-b13f-73499791ace9",
                    entry: "scripts/server/index.js",
                    // Specify which scripts belong to this module. It must
                    // obviously contain the entry point.
                    include: ["scripts/**"]
                },
                {
                    description: "capprobe server data files",
                    type: "data",
                    uuid: "e80993fe-6d43-425d-a4c6-382bf5e65056",
                    // Specify which files belong to this module.
                    include: ["items/**"]
                }
            ],

            // Optional
            dependencies: {
                "@minecraft/server": "1.7.0-beta",
                "@minecraft/server-ui": "1.2.0-beta"
            },

            // Optional
            capabilities: ["script_eval"]
        }
    ]
};

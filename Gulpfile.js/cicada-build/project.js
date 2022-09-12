const merge = require("merge");
const semver = require("semver");
const path = require("node:path");
const { requireUncached } = require("./utils.js");

function parseVer(verStr /* string|null */) {
    if (verStr != null) {
        const ver = semver.parse(verStr);
        if (ver) {
            return ver;
        }
        else {
            throw Error(`Unparsable version: ${verStr}`);
        }
    }
    else {
        return null;
    }
}

function triplet(ver /* SemVer */) {
    if (ver.prerelease.length > 0) {
        return ver.toString();
    }
    else {
        return [ver.major, ver.minor, ver.patch];
    }
}

function parseIncl(incl /* string | string[] */) {
    if (typeof incl === "string") {
        return new Set([incl]);
    }
    else {
        return new Set(incl);
    }
}

class Module {
    constructor(modSrc) {
        this.description = modSrc.description;
        this.type        = modSrc.type;
        this.uuid        = modSrc.uuid;
        this.version     = parseVer(modSrc.version);
        this.include     = parseIncl(modSrc.include); // Set<string>
    }

    get manifest() {
        return {
            description: this.description,
            type:        this.type,
            uuid:        this.uuid,
            version:     triplet(this.version)
        };
    }

    static create(modSrc) {
        switch (modSrc.type) {
        case "resources":      return new ResourcesModule(modSrc);
        case "script":         return new ScriptModule(modSrc);
        case "data":           return new ServerDataModule(modSrc);
        case "client_data":    return new ClientDataModule(modSrc);
        case "interface":      return new InterfaceModule(modSrc);
        case "world_template": return new WorldTemplateModule(modSrc);
        case "skin_pack":      return new SkinPackModule(modSrc);
        case "javascript":     throw Error(`"javascript" is a deprecated module type. Use "script" instead.`);
        default:               throw Error(`Unknown module type: ${modSrc.type}`);
        }
    }
}
class ResourcesModule extends Module {}
class ScriptModule extends Module {
    constructor(modSrc) {
        super(modSrc);
        this.language = modSrc.language;
        this.entry    = modSrc.entry;
    }
    get manifest() {
        return {
            ...super.manifest,
            language: this.language,
            entry:    this.entry
        };
    }
}
class ServerDataModule extends Module {}
class ClientDataModule extends Module {}
class InterfaceModule extends Module {}
class WorldTemplateModule extends Module {}
class SkinPackModule extends Module {}

class Dependency {
    #init(depSrc) {
        this.uuid    = depSrc.uuid;
        this.version = parseVer(depSrc.version);
    }

    constructor(depSrc) {
        if (typeof depSrc === "string") {
            switch (depSrc) {
            case "mojang-gametest":
                this.#init({uuid: "6f4b6893-1bb6-42fd-b458-7fa3d0c89616", version: "0.1.0"});
                break;
            case "mojang-minecraft-server-admin":
                this.#init({uuid: "53d7f2bf-bf9c-49c4-ad1f-7c803d947920", version: "1.0.0-beta"});
                break;
            case "mojang-minecraft-ui":
                this.#init({uuid: "2bd50a27-ab5f-4f40-a596-3641627c635e", version: "0.1.0"});
                break;
            case "mojang-minecraft":
                this.#init({uuid: "b26a4d4c-afdf-4690-88f8-931846312678", version: "0.1.0"});
                break;
            case "mojang-net":
                this.#init({uuid: "777b1798-13a6-401c-9cba-0cf17e31a81b", version: "1.0.0-beta"});
                break;
            default:
                throw Error(`Unknown builtin module: ${depSrc}`);
            }
        }
        else {
            this.#init(depSrc);
        }
    }

    get manifest() {
        return {
            uuid:    this.uuid,
            version: triplet(this.version)
        };
    }
}

class Capabilities {
    constructor(capSrc = {}) {
        this.experimentalCustomUI = capSrc.experimental_custom_ui;
        this.chemistry            = capSrc.chemistry;
        this.raytraced            = capSrc.raytraced;
    }

    get manifest() {
        return {
            ...( this.experimentalCustomUI != null
                 ? { experimental_custom_ui: this.experimental_custom_ui }
                 : {}
               ),
            ...( this.chemistry != null
                 ? { chemistry: this.chemistry }
                 : {}
               ),
            ...( this.raytraced != null
                 ? { raytraced: this.raytraced }
                 : {}
               )
        };
    }
}

class Metadata {
    authors; // string[]
    license; // string
    generatedWith; // Map<string, SemVer[]>
    url; // string

    constructor(metaSrc = {}) {
        this.authors       = metaSrc.authors;
        this.license       = metaSrc.license;
        this.generatedWith = new Map();
        // FIXME: Put "cicada-build" once it's separated as a standalone library.
        this.url           = metaSrc.url;
    }

    get manifest() {
        return {
            ...( this.authors != null
                 ? { authors: this.authors }
                 : {}
               ),
            ...( this.license != null
                 ? { license: this.license }
                 : {}
               ),
            ...( this.generatedWith.size > 0
                 ? { generatedWith: Object.fromEntries(
                         this.generatedWith.entries.map((name, vers) => {
                             return [name, vers.map(triplet)];
                         }))
                   }
                 : {}
               ),
            ...( this.url != null
                 ? { url: this.url }
                 : {}
               )
        };
    }
}

class Pack {
    static Types = Object.freeze({
        BehaviorPack:  Symbol("BehaviorPack"),
        ResourcePack:  Symbol("ResourcePack"),
        SkinPack:      Symbol("SkinPack"),
        WorldTemplate: Symbol("WorldTemplate")
    });

    constructor(packSrc, srcDir) {
        this.name                = packSrc.name;
        this.uuid                = packSrc.uuid;
        this.description         = packSrc.description;
        this.version             = parseVer(packSrc.version);
        this.icon                = packSrc.icon != null
                                   ? path.resolve(srcDir, packSrc.icon)
                                   : null;
        this.minEngineVersion    = parseVer(packSrc.min_engine_version); // SemVer|null

        // These are specific to world templates.
        this.baseGameVersion     = parseVer(packSrc.base_game_version); // SemVer|null
        this.lockTemplateOptions = packSrc.lock_template_options; // boolean|null

        const modDefaults = {
            version: packSrc.version
        };
        this.modules = packSrc.modules.map(modSrc => {
            return Module.create(merge.recursive(true, modDefaults, modSrc));
        });

        this.dependencies = (packSrc.dependencies || []).map(depSrc => {
            return new Dependency(depSrc);
        });

        this.capabilities = new Capabilities(packSrc.capabilities);
        this.metadata     = new Metadata(packSrc.metadata);

        for (const mod of this.modules) {
            if (mod instanceof ResourcesModule  ||
                mod instanceof ClientDataModule ||
                mod instanceof InterfaceModule) {
                this.type = Pack.Types.ResourcePack;
                break;
            }
            else if (mod instanceof ScriptModule     ||
                     mod instanceof ServerDataModule) {
                this.type = Pack.Types.BehaviorPack;
                break;
            }
            else if (mod instanceof SkinPackModule) {
                this.type = Pack.Types.SkinPack;
            }
            else if (mod instanceof WorldTemplate) {
                this.type = Pack.Types.WorldTemplate;
                break;
            }
            else {
                throw Error(`Unknown module type: ${mod.type}`);
            }
        }

        this.archiveSubDir = null;
        this.installDir    = null;
    }

    stagePath(root) {
        if (this.archiveSubDir != null) {
            return path.resolve(root, this.archiveSubDir);
        }
        else {
            return root;
        }
    }

    installRootPath(comMojangDir) {
        switch (this.type) {
        case Pack.Types.BehaviorPack:
            return path.resolve(comMojangDir, "development_behavior_packs");

        case Pack.Types.ResourcePack:
            return path.resolve(comMojangDir, "development_resource_packs");

        case Pack.Types.SkinPack:
            return path.resolve(comMojangDir, "development_skin_packs");

        case Pack.Types.WorldTemplate:
            return path.resolve(comMojangDir, "world_templates");

        default:
            throw Error(`Unknown pack type: ${this.type}`);
        }
    }

    installPath(comMojangDir) {
        if (this.installDir != null) {
            return path.resolve(this.installRootPath(comMojangDir), this.installDir);
        }
        else {
            throw Error("installDir is not set");
        }
    }

    get manifest() {
        return {
            format_version: 2,
            header: {
                name:        this.name,
                uuid:        this.uuid,
                description: this.description,
                version:     triplet(this.version),
                ...( this.minEngineVersion
                     ? { min_engine_version: triplet(this.minEngineVersion) }
                     : {}
                   ),
                ...( this.baseGameVersion
                     ? { base_game_version: triplet(this.baseGameVersion) }
                     : {}
                   ),
                ...( this.lockTemplateOptions != null
                     ? { lock_template_options: this.lockTemplateOptions }
                     : {}
                   )
            },
            modules: this.modules.map(m => m.manifest),
            ...( this.dependencies.length > 0
                 ? { dependencies: this.dependencies.map(d => d.manifest) }
                 : {}
               ),
            ...( Object.keys(this.capabilities.manifest).length > 0
                 ? { capabilities: this.capabilities.manifest }
                 : {}
               ),
            ...( Object.keys(this.metadata.manifest).length > 0
                 ? { metadata: this.metadata.manifest }
                 : {}
               )
        };
    }
}

function stringifyAuthor(person) {
    if (typeof person === "string") {
        return person;
    }
    else {
        let str = person.name;
        if (person.email) {
            str += ` <${person.email}>`;
        }
        if (person.url) {
            str += ` (${person.url})`;
        }
        return str;
    }
}

function mkAuthors(meta) {
    const authors = [];
    if (meta.author) {
        authors.push(stringifyAuthor(meta.author));
    }
    if (meta.contributors) {
        meta.contributors.forEach(p => authors.push(stringifyAuthor(p)));
    }
    return authors;
}

class Project {
    name; // string
    version; // SemVer
    packs; // Pack[]

    constructor(pkgJsonPath, manifestSrcPath) {
        const meta   = requireUncached(path.resolve(pkgJsonPath));
        const src    = requireUncached(path.resolve(manifestSrcPath));
        const srcDir = path.dirname(manifestSrcPath);

        this.name    = meta.name;
        this.version = parseVer(meta.version);

        const defaults = {
            name:        meta.name,
            description: meta.description,
            version:     meta.version,
            metadata: {
                authors: mkAuthors(meta),
                license: meta.license,
                url:     meta.homepage
            }
        };
        const common   = merge.recursive(true, defaults, src.common || {});

        this.packs = src.packs.map((packSrc0, idx, array) => {
            const packSrc = merge.recursive(true, common, packSrc0);
            return new Pack(packSrc, srcDir);
        });
        if (this.packs.length == 0) {
            throw Error("A project must have at least one pack.");
        }

        const num_of = {}; // {[Pack.Types]: number}
        for (const pack of this.packs) {
            num_of[pack.type] = (num_of[pack.type] || 0) + 1;
        }

        const idx_of = {}; // {[Pack.Types]: number}
        for (const pack of this.packs) {
            // THINKME: Should we let users choose the name of this?
            const dirName = (() => {
                if (this.packs.length == 1) {
                    return this.name;
                }
                else {
                    const suffix = pack.type === Pack.Types.BehaviorPack  ? "bp"
                                 : pack.type === Pack.Types.ResourcePack  ? "rp"
                                 : pack.type === Pack.Types.SkinPack      ? "skins"
                                 : pack.type === Pack.Types.WorldTemplate ? "wt"
                                 : null;
                    if (suffix == null) {
                        throw Error(`Unknown pack type: ${pack.type}`);
                    }

                    if (num_of[pack.type] == 1) {
                        return `${this.name}-${suffix}`;
                    }
                    else {
                        return `${this.name}-${suffix}-${idx_of[pack.type]++}`;
                    }
                }
            })();
            pack.archiveSubDir = this.packs.length > 1 ? dirName : null;
            pack.installDir    = dirName;
        }
    }

    get archiveName() {
        const basename = `${this.name}-${this.version.toString()}`;
        if (this.packs.length > 1) {
            return basename + ".mcaddon";
        }
        else if (this.packs[0].type === Pack.Types.WorldTemplate) {
            return basename + ".mctemplate";
        }
        else {
            return basename + ".mcpack";
        }
    }
};

module.exports = {
    Module,
    ResourcesModule,
    ScriptModule,
    ServerDataModule,
    ClientDataModule,
    InterfaceModule,
    WorldTemplateModule,
    Dependency,
    Capabilities,
    Metadata,
    Pack,
    Project
};

const jsonlint = require("jsonlint");
const path = require("node:path");
const streamReadAll = require("stream-read-all");
const { Transform } = require("node:stream");

class ValidateJSON extends Transform {
    constructor() {
        super({objectMode: true});
    }

    _transform(vinyl, enc, cb) {
        if (path.extname(vinyl.path) == ".json") {
            if (vinyl.isBuffer()) {
                const e = ValidateJSON.#validateJSONBuffer(vinyl, enc, vinyl.contents);
                if (e) {
                    cb(e);
                }
                else {
                    cb(null, vinyl);
                }
            }
            else if (vinyl.isStream()) {
                streamReadAll(vinyl.contents.clone())
                    .then(buf => {
                        const e = ValidateJSON.#validateJSONBuffer(vinyl, enc, buf);
                        if (e) {
                            cb(e);
                        }
                        else {
                            cb(null, vinyl);
                        }
                    })
                    .else(e => cb(e));
            }
            else {
                cb(null, vinyl);
            }
        }
        else {
            cb(null, vinyl);
        }
    }

    static #validateJSONBuffer(vinyl, enc, buf) /* null | Error */ {
        /* THINKME: We should validate it against actual JSON schemata, not
         * only its well-formedness. */
        try {
            jsonlint.parse(buf.toString(enc));
        }
        catch (e) {
            return Error(`${vinyl.path}: ${e.message}`);
        }
    }
}

exports.validateJSON = () => new ValidateJSON();

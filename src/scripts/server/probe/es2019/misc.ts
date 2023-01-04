import { group, probe, expect } from "../../probing-toolkit.js";

export default group("misc", [
    group("optional catch binding", [
        probe("basic", () => {
            function f() {
                try {
                    throw 123;
                }
                catch {
                    return true;
                }
            }
            expect(f()).to.be.true;
        }),
        probe("async/await", async () => {
            async function f() {
                try {
                    await Promise.reject();
                    return false; // This line is unreachable but
                                  // TypeScript doesn't appear to detect
                                  // that.
                }
                catch {
                    return true;
                }
            }
            expect(await f()).to.be.true;
        }),
        probe("yield", () => {
            function* f() {
                try {
                    yield;
                    return false;
                }
                catch {
                    return true;
                }
            }
            const it = f();
            it.next();
            expect(it.throw(null)).to.have.a.property("value", true);
        })
    ]),
    group("Function.prototype.toString revision", [
        probe("functions created with the Function constructor", () => {
            const fn  = Function("a", " /\x2A a \x2A/ b, c /\x2A b \x2A/ //", "/\x2A c \x2A/ ; /\x2A d \x2A/ //");
            const str = "function anonymous(a, /\x2A a \x2A/ b, c /\x2A b \x2A/ //\n) {\n/\x2A c \x2A/ ; /\x2A d \x2A/ //\n}";
            expect(String(fn)).to.equal(str);
        }),
        probe("arrows", () => {
            const str = "a => b";
            expect(String(eval("(" + str + ")"))).to.equal(str);
        }),
        probe("[native code]", () => {
            const NATIVE_EVAL_RE = /\bfunction\b[\s\S]*\beval\b[\s\S]*\([\s\S]*\)[\s\S]*\{[\s\S]*\[[\s\S]*\bnative\b[\s\S]+\bcode\b[\s\S]*\][\s\S]*\}/;
            expect(NATIVE_EVAL_RE.test(String(eval))).to.be.true;
        }),
        probe("class expression with implicit constructor", () => {
            const str = "class A {}";
            expect(String(eval("(" + str + ")"))).to.equal(str);
        }),
        probe("class expression with explicit constructor", () => {
            const str = "class /\x2A a \x2A/ A /\x2A b \x2A/ extends /\x2A c \x2A/ function B(){} /\x2A d \x2A/ { /\x2A e \x2A/ constructor /\x2A f \x2A/ ( /\x2A g \x2A/ ) /\x2A h \x2A/ { /\x2A i \x2A/ ; /\x2A j \x2A/ } /\x2A k \x2A/ m /\x2A l \x2A/ ( /\x2A m \x2A/ ) /\x2A n \x2A/ { /\x2A o \x2A/ } /\x2A p \x2A/ }";
            expect(String(eval("(/\x2A before \x2A/" + str + "/\x2A after \x2A/)"))).to.equal(str);
        }),
        probe("unicode escape sequences in identifiers", () => {
            const str = "function \\u0061(\\u{62}, \\u0063) { \\u0062 = \\u{00063}; return b; }";
            expect(String(eval("(/\x2A before \x2A/" + str + "/\x2A after \x2A/)"))).to.equal(str);
        }),
        probe("methods and computed property names", () => {
            const str = "[ /\x2A a \x2A/ \"f\" /\x2A b \x2A/ ] /\x2A c \x2A/ ( /\x2A d \x2A/ ) /\x2A e \x2A/ { /\x2A f \x2A/ }";
            expect(String(eval("({ /\x2A before \x2A/" + str + "/\x2A after \x2A/ }.f)"))).to.equal(str);
        })
    ]),
    group("JSON superset", [
        probe("LINE SEPARATOR can appear in string literals", () => {
            expect(eval("'\u2028'")).to.equal("\u2028");
        }),
        probe("PARAGRAPH SEPARATOR can appear in string literals", () => {
            expect(eval("'\u2029'")).to.equal("\u2029");
        }),
        probe("Well-formed JSON.stringify", () => {
            expect(JSON.stringify("\uDF06\uD834")).to.equal("\"\\udf06\\ud834\"");
            expect(JSON.stringify("\uDEAD")).to.equal("\"\\udead\"");
        })
    ])
]);

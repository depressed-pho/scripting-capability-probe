import { group, probe, expect } from "../../probing-toolkit";

export default group("Annex B", [
    group("RegExp syntax extensions", [
        probe("hyphens in character sets", () => {
            expect(/[\w-_]/.exec("-")).to.have.a.property(0, "-");
        }),
        probe("invalid character escapes", () => {
            expect(/\z/.exec("\\z")).to.have.a.property(0, "z");
            expect(/[\z]/.exec("[\\z]")).to.have.a.property(0, "z");
        }),
        probe("invalid control-character escapes", () => {
            expect(/\c2/.exec("\\c2")).to.have.a.property(0, "\\c2");
        }),
        probe("invalid Unicode escapes", () => {
            expect(/\u1/.exec("u1")).to.have.a.property(0, "u1");
            expect(/[\u1]/.exec("u")).to.have.a.property(0, "u");
        }),
        probe("invalid hexadecimal escapes", () => {
            expect(/\x1/.exec("x1")).to.have.a.property(0, "x1");
            expect(/[\x1]/.exec("x")).to.have.a.property(0, "x");
        }),
        probe("incomplete patterns and quantifiers", () => {
            expect(/x{1/.exec("x{1")).to.have.a.property(0, "x{1");
            expect(/x]1/.exec("x]1")).to.have.a.property(0, "x]1");
        }),
        probe("octal escape sequences", () => {
            expect(/\041/.exec("!")).to.have.a.property(0, "!");
            expect(/[\041]/.exec("!")).to.have.a.property(0, "!");
        }),
        probe("invalid backreferences become octal escapes", () => {
            expect(/\41/.exec("!")).to.have.a.property(0, "!");
            expect(/[\41]/.exec("!")).to.have.a.property(0, "!");
        })
    ]),
    probe("HTML-style comments", () => {
        // TypeScript does not allow this.
        eval(`
            --> A comment
            <!-- Another comment
            const a = 3; <!-- Another comment
            expect(a).to.equal(3);
        `);
    })
]);

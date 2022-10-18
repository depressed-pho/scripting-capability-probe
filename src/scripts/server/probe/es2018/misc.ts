import { group, probe, expect } from "../../probing-toolkit";

export default group("misc", [
    probe("Proxy `ownKeys' handler, duplicate keys for non-extensible targets", () => {
        const p = new Proxy({}, {
            ownKeys() {
                return ["a", "a"];
            }
        });
        function f() {
            Object.keys(p);
        }
        expect(f).to.throw(TypeError);
    }),
    probe("template literal revision", () => {
        // @ts-ignore: `tag' is only used invisibly
        function tag(strings: TemplateStringsArray, a: number) {
            expect(strings).to.have.a.property(0, undefined);
            expect(strings).to.have.a.nested.property(
                "raw[0]", "\\01\\1\\xg\\xAg\\u0\\u0g\\u00g\\u000g\\u{g\\u{0\\u{110000}");
            expect(strings).to.have.a.property(1, "\0");
            expect(strings).to.have.a.nested.property("raw[1]", "\\0");
            expect(a).to.equal(0);
        }
        // contains invalid escapes
        eval(`tag\`\\01\\1\\xg\\xAg\\u0\\u0g\\u00g\\u000g\\u{g\\u{0\\u{110000}\${0}\\0\``);
    })
]);

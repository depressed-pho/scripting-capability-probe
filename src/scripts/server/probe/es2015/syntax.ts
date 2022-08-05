import { group, probe, expect } from "../../probing-toolkit";

export default group("Syntax", [
    group("Default function parameters", [
        probe("basic functionality", async function* () {
            const f = eval(`
                function f(a = 1, b = 2) {
                    return {a: a, b: b};
                }
                f;
            `);
            expect(f(3)).to.deeply.equal({a: 3, b: 2});
        }),
        probe("explicit undefined defers to the default", async function* () {
            const f = eval(`
                function f(a = 1, b = 2) {
                    return {a: a, b: b};
                }
                f;
            `);
            expect(f(undefined, 3)).to.deeply.equal({a: 1, b: 3});
        })
    ])
]);

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
        }),
        probe("defaults can refer to previous params", async function* () {
            const f = eval(`
                function f(a, b = a) {
                    return {a: a, b: b};
                }
                f;
            `);
            expect(f(5)).to.deeply.equal({a: 5, b: 5});
        }),
        probe("arguments object interaction", async function* () {
            const f = eval(`
                function f(a = "foo", b = "bar", c = "baz") {
                    return Array.from(arguments);
                }
                f;
            `);
            expect(f(1, 2)).to.deeply.equal([1, 2]);
        }),
        probe("temporal dead zone", async function* () {
            expect(() => eval(`function f(a=a) {} f()`)).to.throw();
            expect(() => eval(`function f(a=b, b) {} f()`)).to.throw();
        })
    ])
]);

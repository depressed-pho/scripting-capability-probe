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
            expect(() => eval(`function f(a=a) {} f()`)).to.throw(ReferenceError);
            expect(() => eval(`function f(a=b, b) {} f()`)).to.throw(ReferenceError);
        }),
        probe("separate scope", async function* () {
            const f = eval(`
                function f(a = function () { return typeof b }) {
                    let b = 1;
                    return a();
                }
                f
            `);
            expect(f()).to.equal("undefined");
        }),
        probe("new Function() support", async function* () {
            const f = new Function("a=1", "b=2", "return {a: a, b: b}");
            expect(f()).to.deeply.equal({a: 1, b: 2});
        })
    ]),
    group("Rest parameters", [
        probe("basic functionality", async function* () {
            const f = eval(`
                function f(foo, ...args) {
                    return args;
                }
                f
            `);
            expect(f("foo", "bar", "baz")).to.deeply.equal(["bar", "baz"]);
        }),
        probe("function 'length' property", async function* () {
            const f = eval(`function f(a, ...b) {} f`);
            const g = eval(`function g(   ...c) {} g`);
            expect(f.length).to.equal(1);
            expect(g.length).to.equal(0);
        }),
        probe("arguments object interaction", async function* () {
            const f = eval(`
                function f(foo, ...args) {
                    return Array.from(arguments);
                }
                f
            `);
            expect(f(1, 2, 3)).to.deeply.equal([1, 2, 3]);
        }),
        probe("can't be used in setters", async function* () {
            const f = function () {
                eval(`
                    {
                        set e(...args) {}
                    }
                `);
            }
            expect(f).to.throw(SyntaxError);
        })
    ]),
    group("Spread syntax for iterable objects", [
        probe("with arrays, in function calls", async function* () {
            expect(eval("Math.max(...[1, 2, 3])")).to.equal(3);
        }),
        probe("with arrays, in array literals", async function* () {
            expect(eval("[...[1, 2, 3]]")).to.deeply.equal([1, 2, 3]);
        }),
        probe("with sparse arrays, in function calls", async function* () {
            expect(eval("Array(...[,,])")).to.deeply.equal([,,]);
        }),
        probe("with sparse arrays, in array literals", async function* () {
            expect(eval("[...[,,]]")).to.deeply.equal([,,]);
        }),
        probe("with strings, in function calls", async function* () {
            // Implicit conversion from string to number.
            expect(eval("Math.max(...'1234')")).to.equal(4);
        }),
        probe("with strings, in array literals", async function* () {
            expect(eval("['a', ...'bcd', 'e']")).to.deeply.equal(["a", "b", "c", "d", "e"]);
        })
    ])
]);

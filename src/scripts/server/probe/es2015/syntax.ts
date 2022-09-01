import { group, probe, expect } from "../../probing-toolkit";
import { createIterableObject } from "../_utils";

export default group("Syntax", [
    group("Default function parameters", [
        probe("basic functionality", () => {
            const f = eval(`
                function f(a = 1, b = 2) {
                    return {a: a, b: b};
                }
                f;
            `);
            expect(f(3)).to.deeply.equal({a: 3, b: 2});
        }),
        probe("explicit undefined defers to the default", () => {
            const f = eval(`
                function f(a = 1, b = 2) {
                    return {a: a, b: b};
                }
                f;
            `);
            expect(f(undefined, 3)).to.deeply.equal({a: 1, b: 3});
        }),
        probe("defaults can refer to previous params", () => {
            const f = eval(`
                function f(a, b = a) {
                    return {a: a, b: b};
                }
                f;
            `);
            expect(f(5)).to.deeply.equal({a: 5, b: 5});
        }),
        probe("arguments object interaction", () => {
            const f = eval(`
                function f(a = "foo", b = "bar", c = "baz") {
                    return Array.from(arguments);
                }
                f;
            `);
            expect(f(1, 2)).to.deeply.equal([1, 2]);
        }),
        probe("temporal dead zone", () => {
            expect(() => eval(`function f(a=a) {} f()`)).to.throw(ReferenceError);
            expect(() => eval(`function f(a=b, b) {} f()`)).to.throw(ReferenceError);
        }),
        probe("separate scope", () => {
            const f = eval(`
                function f(a = function () { return typeof b }) {
                    let b = 1;
                    return a();
                }
                f
            `);
            expect(f()).to.equal("undefined");
        }),
        probe("new Function() support", () => {
            const f = new Function("a=1", "b=2", "return {a: a, b: b}");
            expect(f()).to.deeply.equal({a: 1, b: 2});
        })
    ]),
    group("Rest parameters", [
        probe("basic functionality", () => {
            const f = eval(`
                function f(foo, ...args) {
                    return args;
                }
                f
            `);
            expect(f("foo", "bar", "baz")).to.deeply.equal(["bar", "baz"]);
        }),
        probe("function 'length' property", () => {
            const f = eval(`function f(a, ...b) {} f`);
            const g = eval(`function g(   ...c) {} g`);
            expect(f.length).to.equal(1);
            expect(g.length).to.equal(0);
        }),
        probe("arguments object interaction", () => {
            const f = eval(`
                function f(foo, ...args) {
                    return Array.from(arguments);
                }
                f
            `);
            expect(f(1, 2, 3)).to.deeply.equal([1, 2, 3]);
        }),
        probe("can't be used in setters", () => {
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
        probe("with arrays, in function calls", () => {
            expect(eval("Math.max(...[1, 2, 3])")).to.equal(3);
        }),
        probe("with arrays, in array literals", () => {
            expect(eval("[...[1, 2, 3]]")).to.deeply.equal([1, 2, 3]);
        }),
        probe("with sparse arrays, in function calls", () => {
            expect(eval("Array(...[,,])")).to.deeply.equal([,,]);
        }),
        probe("with sparse arrays, in array literals", () => {
            expect(eval("[...[,,]]")).to.deeply.equal([,,]);
        }),
        probe("with strings, in function calls", () => {
            // Implicit conversion from string to number.
            expect(eval("Math.max(...'1234')")).to.equal(4);
        }),
        probe("with strings, in array literals", () => {
            expect(eval("['a', ...'bcd', 'e']")).to.deeply.equal(["a", "b", "c", "d", "e"]);
        }),
        probe("with astral plane strings, in function calls", () => {
            expect(eval("Array(...'𠮷𠮶')")).to.deeply.equal(["𠮷", "𠮶"]);
        }),
        probe("with astral plane strings, in array literals", () => {
            expect(eval("[...'𠮷𠮶']")).to.deeply.equal(["𠮷", "𠮶"]);
        }),
        probe("with generator instances, in calls", () => {
            // @ts-ignore: `gen' won't be read visibly to tsc.
            const gen = eval(`
                function* gen() {
                    yield 1;
                    yield 2;
                    yield 3;
                }
                gen
            `);
            expect(eval("Array(...gen())")).to.deeply.equal([1, 2, 3]);
        }),
        probe("with generator instances, in arrays", () => {
            // @ts-ignore: `gen' won't be read visibly to tsc.
            const gen = eval(`
                function* gen() {
                    yield 1;
                    yield 2;
                    yield 3;
                }
                gen
            `);
            expect(eval("[...gen()]")).to.deeply.equal([1, 2, 3]);
        }),
        probe("with generic iterables, in calls", () => {
            // @ts-ignore: `iterable' won't be read visibly to tsc.
            const iterable = createIterableObject([1, 2, 3]);
            expect(eval("Array(...iterable)")).to.deeply.equal([1, 2, 3]);
        }),
        probe("with generic iterables, in arrays", () => {
            // @ts-ignore: `iterable' won't be read visibly to tsc.
            const iterable = createIterableObject(["b", "c"]);
            expect(eval("['a', ...iterable]")).to.deeply.equal(["a", "b", "c"]);
        }),
        probe("with instances of iterables, in calls", () => {
            // @ts-ignore: `iterable' won't be read visibly to tsc.
            const iterable = createIterableObject([1, 2, 3]);
            expect(eval("Array(...Object.create(iterable))")).to.deeply.equal([1, 2, 3]);
        }),
        probe("with instances of iterables, in arrays", () => {
            // @ts-ignore: `iterable' won't be read visibly to tsc.
            const iterable = createIterableObject(["b", "c"]);
            expect(eval("['a', ...Object.create(iterable)]")).to.deeply.equal(["a", "b", "c"]);
        }),
        probe("spreading non-iterables is a runtime error", () => {
            const f = eval(`() => eval("[...2]")`);
            expect(f).to.throw(TypeError);
        })
    ]),
    group("Object literal extensions", [
        probe("computed properties", () => {
            // @ts-ignore: `x' won't be read visibly to tsc.
            const x = "y";
            expect(eval(`let r = {[x]: 1}; r`)).to.deeply.equal({y: 1});
        }),
        probe("shorthand properties", () => {
            // @ts-ignore: `a', `b' won't be read visibly to tsc.
            const a = 7, b = 8;
            expect(eval(`let r = {a, b}; r`)).to.deeply.equal({a: 7, b: 8});
        }),
        probe("shorthand methods", () => {
            const obj = eval(`
                let r = {
                    y() {
                        return 2;
                    }
                }; r
            `);
            expect(obj.y()).to.equal(2);
        }),
        probe("string-keyed shorthand methods", () => {
            const obj = eval(`
                let r = {
                    "foo bar"() {
                        return 4;
                    }
                }; r
            `);
            expect(obj["foo bar"]()).to.equal(4);
        }),
        probe("computed shorthand methods", () => {
            // @ts-ignore: `x' won't be read visibly to tsc.
            const x   = "y";
            const obj = eval(`
                let r = {
                    [x]() {
                        return 6;
                    }
                }; r
            `);
            expect(obj.y()).to.equal(6);
        }),
        probe("computed accessors", () => {
            let   v   = null;
            // @ts-ignore: `x' won't be read visibly to tsc.
            const x   = "y";
            const obj = eval(`
                let r = {
                    get [x] ()    { return 1 },
                    set [x] (val) { v = val  }
                }; r
            `);
            obj.y = "foo";
            expect(obj.y).to.equal(1);
            expect(v).to.equal("foo");
        })
    ]),
    group("for..of loops", [
        probe("with arrays", () => {
            const f = eval(`
                function f() {
                    for (const x of [1, 2]) {
                        return x;
                    }
                }
                f
            `);
            expect(f()).to.equal(1);
        }),
        probe("with sparse arrays", () => {
            const f = eval(`
                function f() {
                    let n = 0;
                    for (const x of ["a",,,"d"]) {
                        n += (x === undefined ? 1 : 0);
                    }
                    return n;
                }
                f
            `);
            expect(f()).to.equal(2);
        }),
        probe("with strings", () => {
            const f = eval(`
                function f() {
                    let s = "";
                    for (const x of "abc") {
                        s += "[" + x + "]";
                    }
                    return s;
                }
                f
            `);
            expect(f()).to.equal("[a][b][c]");
        }),
        probe("with astral plane strings", () => {
            const f = eval(`
                function f() {
                    let s = "";
                    for (const x of "𠮷𠮶") {
                        s += "[" + x + "]";
                    }
                    return s;
                }
                f
            `);
            expect(f()).to.equal("[𠮷][𠮶]");
        }),
        probe("with generator instances", () => {
            const f = eval(`
                function f() {
                    let n = 0;
                    let i = (function* () { yield 1; yield 2; yield 3 })();
                    for (const x of i) {
                        n += x;
                    }
                    return n;
                }
                f
            `);
            expect(f()).to.equal(6);
        }),
        probe("with generic iterables", () => {
            const f = eval(`
                function f() {
                    let s = "";
                    for (const x of createIterableObject(["b", "c"])) {
                        s += "[" + x + "]";
                    }
                    return s;
                }
                f
            `);
            expect(f()).to.equal("[b][c]");
        }),
        probe("with instances of generic iterables", () => {
            const f = eval(`
                function f() {
                    let s = "";
                    let i = createIterableObject(["b", "c"]);
                    for (const x of Object.create(i)) {
                        s += "[" + x + "]";
                    }
                    return s;
                }
                f
            `);
            expect(f()).to.equal("[b][c]");
        }),
        probe("iterator closing, break", () => {
            let closed = false;
            // @ts-ignore: `i' won't be read visibly to tsc.
            const i = createIterableObject(["b", "c"], {
                return() {
                    closed = true;
                    return {};
                }
            });
            const f = eval(`
                function f() {
                    let s = "";
                    for (const x of i) {
                        s += "[" + x + "]";
                        break;
                    }
                    return s;
                }
                f
            `);
            expect(f()).to.equal("[b]");
            expect(closed).to.be.true;
        }),
        probe("iterator closing, throw", () => {
            let closed = false;
            // @ts-ignore: `i' won't be read visibly to tsc.
            const i = createIterableObject(["b", "c"], {
                return() {
                    closed = true;
                    return {};
                }
            });
            const f = eval(`
                function f() {
                    let s = "";
                    try {
                        for (const x of i) {
                            s += "[" + x + "]";
                            throw 0;
                        }
                    }
                    catch (e) {}
                    return s;
                }
                f
            `);
            expect(f()).to.equal("[b]");
            expect(closed).to.be.true;
        })
    ]),
    group("Octal and binary literals", [
        probe("octal literals", () => {
            expect(eval("0o10")).to.equal(8);
            expect(eval("0O10")).to.equal(8);
        }),
        probe("binary literals", () => {
            expect(eval("0b10")).to.equal(2);
            expect(eval("0B10")).to.equal(2);
        }),
        probe("Number() supports octal", () => {
            expect(eval("Number('0o1')")).to.equal(1);
        }),
        probe("Number() supports binary", () => {
            expect(eval("Number('0b1')")).to.equal(1);
        })
    ]),
    group("Template literals", [
        probe("basic functionality", () => {
            const a = "ba", b = "QUX";
            const s = `foo bar
${a + "z"} ${b.toLowerCase()}`;
            expect(s).to.equal("foo bar\nbaz qux");
        }),
        probe("toString conversion", () => {
            const a = {
                toString() { return "foo" },
                valueOf()  { return "bar" }
            };
            expect(`${a}`).to.equal("foo");
        }),
        probe("tagged template literals", () => {
            let called = false;
            function fn(parts: TemplateStringsArray, a: number, b: number) {
                called = true;
                expect(parts).to.deeply.equal(["foo", "bar\n", ""]);
                expect(parts.raw).to.deeply.equal(["foo", "bar\\n", ""]);
                expect(a).to.equal(123);
                expect(b).to.equal(456);
            }
            fn`foo${123}bar\n${456}`;
            expect(called).to.be.true;
        }),
        probe("passed array is frozen", () => {
            function fn(parts: TemplateStringsArray, ..._params: any[]) {
                expect(parts).to.satisfy(Object.isFrozen);
                expect(parts.raw).to.satisfy(Object.isFrozen);
            }
            fn`foo${0}bar`;
        }),
        probe("line break normalisation", () => {
            expect(eval("`x" + String.fromCharCode(13)     + "y`")).to.equal("x\ny");
            expect(eval("`x" + String.fromCharCode(10)     + "y`")).to.equal("x\ny");
            expect(eval("`x" + String.fromCharCode(13, 10) + "y`")).to.equal("x\ny");
        }),
        probe("TemplateStrings call site caching", () => {
            function fn(parts: TemplateStringsArray) {
                return parts;
            }
            function getParts() {
                return fn`foo`;
            }
            const original = getParts();
            const other    = fn`foo`;
            expect(getParts()).to.equal(original);
            expect(other).not.to.equal(original);
        })
    ]),
    group("RegExp `y' and `u' flags", [
        probe("`y' flag", () => {
            const re = /\w/y;
            expect(re.exec("xy")).to.have.a.property(0, "x");
            expect(re.exec("xy")).to.have.a.property(0, "y");
            expect(re.exec("xy")).to.be.null;
        }),
        probe("`y' flag, lastIndex", () => {
            const re = /yy/y;
            re.lastIndex = 3;
            expect(re.exec("xxxyyxx")).to.have.a.property(0, "yy");
            expect(re.lastIndex).to.equal(5);
        }),
        probe("`u' flag", () => {
            expect("𠮷".match(/^.$/u)).to.have.a.property(0).which.has.lengthOf(2); // Because non-BMP
        }),
        probe("`u' flag, non-BMP Unicode characters", () => {
            expect("𠮷x".match(/^.x$/u)).to.have.a.property(0).which.has.lengthOf(3);
        }),
        probe("`u' flag, Unicode code point escapes", () => {
            expect("𝌆".match(/\u{1d306}/u)).to.have.a.property(0).which.has.lengthOf(2);
        }),
        probe("`u' flag, case folding", () => {
            expect("ſ".match(/S/iu)).to.have.a.property(0);
            expect("S".match(/ſ/iu)).to.have.a.property(0);
        })
    ]),
    group("destructuring, declarations", [
        probe("with arrays", () => {
            const [a,, [b], c] = [5, null, [6]] as any;
            expect(a).to.equal(5);
            expect(b).to.equal(6);
            expect(c).to.be.undefined;
        }),
        probe("with sparse arrays", () => {
            const [a,, b] = [1,, 2];
            expect(a).to.equal(1);
            expect(b).to.equal(2);
        }),
        probe("with strings", () => {
            const [a, b, c] = "ab";
            expect(a).to.equal("a");
            expect(b).to.equal("b");
            expect(c).to.be.undefined;
        }),
        probe("with astral plane strings", () => {
            const [a] = "𠮷𠮶";
            expect(a).to.equal("𠮷");
        }),
        probe("with generator instances", () => {
            const [a, b, c] = function* () {
                yield 1;
                yield 2;
            }();
            expect(a).to.equal(1);
            expect(b).to.equal(2);
            expect(c).to.be.undefined;
        }),
        probe("with generic iterables", () => {
            const [a, b, c] = createIterableObject([1, 2]);
            expect(a).to.equal(1);
            expect(b).to.equal(2);
            expect(c).to.be.undefined;
        }),
        probe("with instances of generic iterables", () => {
            const [a, b, c] = Object.create(createIterableObject([1, 2]));
            expect(a).to.equal(1);
            expect(b).to.equal(2);
            expect(c).to.be.undefined;
        }),
        probe("iterator closing", () => {
            let closed = false;
            const iter = createIterableObject([1, 2, 3], {
                return() {
                    closed = true;
                    return {};
                }
            });
            // @ts-ignore: `a', `b' won't be read.
            const [a, b] = iter;
            expect(closed).to.be.true;
        }),
        probe("trailing commas in iterable patterns", () => {
            const [a, ] = [1];
            expect(a).to.equal(1);
        }),
        probe("with objects", () => {
            const {a, x: b, c} = {a: 1, x: 2} as any;
            expect(a).to.equal(1);
            expect(b).to.equal(2);
            expect(c).to.be.undefined;
        }),
        probe("object destructuring with primitives", () => {
            const {toFixed} = 2;
            const {slice} = "";
            expect(toFixed).to.equal(Number.prototype.toFixed);
            expect(slice).to.equal(String.prototype.slice);
        }),
        probe("trailing commas in object patterns", () => {
            const {a, } = {a: 1};
            expect(a).to.equal(1);
        }),
        probe("throws on null and undefined", () => {
            const f = () => {
                // @ts-ignore: `a' won't be read.
                const {a} = null as any;
            };
            const g = () => {
                // @ts-ignore: `b' won't be read.
                const {b} = undefined as any;
            };
            expect(f).to.throw(TypeError);
            expect(g).to.throw(TypeError);
        }),
        probe("computed properties", () => {
            const k = "foo";
            const {[k]: val} = {foo: 1};
            expect(val).to.equal(1);
        }),
        probe("multiples in a single const statement", () => {
            const [a, b] = [1, 2], {c, d} = {c: 3, d: 4};
            expect([a, b, c, d]).to.deeply.equal([1, 2, 3, 4]);
        }),
        probe("nested", () => {
            const [a, {x: b, c}] = [1, {x: 2}] as any;
            const {d, x: [e]}    = {d: 3, x: [4]} as any;
            expect([a, b, c, d, e]).to.deeply.equal([1, 2, undefined, 3, 4]);
        }),
        probe("in for-in loop heads", () => {
            let res: any;
            eval(`
                for (const [a, b, c] in {foo: 1}) {
                    res = [a, b, c];
                }
            `);
            expect(res).to.deeply.equal(["f", "o", "o"]);
        }),
        probe("in for-of loop heads", () => {
            for (const [a, b, c] of [[1, 2, 3]]) {
                expect([a, b, c]).to.deeply.equal([1, 2, 3]);
            }
        }),
        probe("in catch heads", () => {
            try {
                throw [1, 2];
            }
            catch ([a, b]) {
                try {
                    throw {c: 3, d: 4};
                }
                catch ({c, d}) {
                    expect([a, b, c, d]).to.deeply.equal([1, 2, 3, 4]);
                }
            }
        }),
        probe("rest", () => {
            const [a, ...b] = [1, 2, 3];
            const [c, ...d] = [4];
            expect(a).to.equal(1);
            expect(b).to.deeply.equal([2, 3]);
            expect(c).to.equal(4);
            expect(d).to.deeply.equal([]);
        }),
        probe("defaults", () => {
            const {a = -1, b = -2, x: c = -3} = {b: 2, c: undefined} as any;
            const [d = -4, e = -5, f = -6] = [4,, undefined];
            expect(a).to.equal(-1);
            expect(b).to.equal(2);
            expect(c).to.equal(-3); // Explicit undefined also falls back to the default.
            expect(d).to.equal(4);
            expect(e).to.equal(-5);
            expect(f).to.equal(-6); // Ditto.
        }),
        probe("defaults, let temporal dead zone", () => {
            const f = () => {
                eval(`const {c = c} = {};`);
            };
            const g = () => {
                eval(`const {c = d, d} = {d: 1};`);
            };
            expect(f).to.throw(ReferenceError);
            expect(g).to.throw(ReferenceError);
        })
    ]),
    group("Destructuring, assignment", [
        probe("with arrays", () => {
            let a, b, c;
            [a,, [b], c] = [5, null, [6]] as any;
            expect(a).to.equal(5);
            expect(b).to.equal(6);
            expect(c).to.be.undefined;
        }),
        probe("with sparse arrays", () => {
            let a, b;
            [a,, b] = [1,, 2];
            expect(a).to.equal(1);
            expect(b).to.equal(2);
        }),
        probe("with strings", () => {
            let a, b, c;
            [a, b, c] = "ab";
            expect(a).to.equal("a");
            expect(b).to.equal("b");
            expect(c).to.be.undefined;
        }),
        probe("with astral plane strings", () => {
            let a;
            [a] = "𠮷𠮶";
            expect(a).to.equal("𠮷");
        }),
        probe("with generator instances", () => {
            let a, b, c;
            [a, b, c] = function* () {
                yield 1;
                yield 2;
            }();
            expect(a).to.equal(1);
            expect(b).to.equal(2);
            expect(c).to.be.undefined;
        }),
        probe("with instances of generic iterables", () => {
            let a, b, c;
            [a, b, c] = Object.create(createIterableObject([1, 2]));
            expect(a).to.equal(1);
            expect(b).to.equal(2);
            expect(c).to.be.undefined;
        }),
        probe("iterator closing", () => {
            let closed = false;
            const iter = createIterableObject([1, 2, 3], {
                return() {
                    closed = true;
                    return {};
                }
            });
            // @ts-ignore: `a', `b' won't be read.
            let a, b;
            [a, b] = iter;
            expect(closed).to.be.true;
        }),
        probe("iterable destructuring expression", () => {
            // @ts-ignore: `a', `b' won't be read.
            let a, b, iter = [1, 2];
            expect(([a, b] = iter)).to.equal(iter);
        }),
        probe("chained iterable destructuring", () => {
            let a, b, c, d;
            [a, b] = [c, d] = [1, 2];
            expect([a, b, c, d]).to.deeply.equal([1, 2, 1, 2]);
        }),
        probe("trailing commas in iterable patterns", () => {
            let a;
            [a, ] = [1];
            expect(a).to.equal(1);
        }),
        probe("with objects", () => {
            let a, b, c;
            ({a, x: b, c} = {a: 1, x: 2} as any);
            expect(a).to.equal(1);
            expect(b).to.equal(2);
            expect(c).to.be.undefined;
        }),
        probe("object destructuring with primitives", () => {
            let toFixed, slice;
            ({toFixed} = 2);
            ({slice} = "");
            expect(toFixed).to.equal(Number.prototype.toFixed);
            expect(slice).to.equal(String.prototype.slice);
        }),
        probe("trailing commas in object patterns", () => {
            let a;
            ({a, } = {a: 1});
            expect(a).to.equal(1);
        }),
        probe("object destructuring expression", () => {
            // @ts-ignore: `a', `b' won't be read.
            let a, b, obj = {a: 1, b: 2};
            expect(({a, b} = obj)).to.equal(obj);
        }),
        probe("parenthesised left-hand-side is a syntax error", () => {
            // @ts-ignore: `a', `b' won't be read.
            let a, b;
            const f = () => {
                eval(`({a, b}) = {a: 1, b: 2}`);
            };
            expect(f).to.throw(SyntaxError);
        }),
        probe("chained object destructuring", () => {
            let a, b, c, d;
            ({a, b} = {c, d} = {a: 1, b: 2, c: 3, d: 4} as any);
            expect([a, b, c, d]).to.deeply.equal([1, 2, 3, 4]);
        }),
        probe("throws on null and undefined", () => {
            const f = () => {
                // @ts-ignore: `a' won't be read.
                let a;
                ({a} = null as any);
            };
            const g = () => {
                // @ts-ignore: `b' won't be read.
                let b;
                ({b} = undefined as any);
            };
            expect(f).to.throw(TypeError);
            expect(g).to.throw(TypeError);
        }),
        probe("computed properties", () => {
            let val;
            const k = "foo";
            ({[k]: val} = {foo: 1});
            expect(val).to.equal(1);
        }),
        probe("nested", () => {
            let a, b, c, d, e;
            ([a, {x: b, c}] = [1, {x: 2}] as any);
            ({d, x: [e]}    = {d: 3, x: [4]} as any);
            expect([a, b, c, d, e]).to.deeply.equal([1, 2, undefined, 3, 4]);
        }),
        probe("rest", () => {
            let a, b, c, d;
            [a, ...b] = [1, 2, 3];
            [c, ...d] = [4];
            expect(a).to.equal(1);
            expect(b).to.deeply.equal([2, 3]);
            expect(c).to.equal(4);
            expect(d).to.deeply.equal([]);
        }),
        probe("nested rest", () => {
            let a = [1, 2, 3], first, last;
            [first, ...[a[2], last]] = a as any;
            expect(first).to.equal(1);
            expect(a).to.deeply.equal([1, 2, 2]);
            expect(last).to.equal(3);
        }),
        probe("empty patterns", () => {
            const f = () => {
                [] = [1, 2] as any;
                ({} = {a: 1, b: 2} as any);
            };
            expect(f).to.not.throw();
        }),
        probe("defaults", () => {
            let a, b, c, d, e, f;
            ({a = -1, b = -2, x: c = -3} = {b: 2, c: undefined} as any);
            [d = -4, e = -5, f = -6] = [4,, undefined];
            expect(a).to.equal(-1);
            expect(b).to.equal(2);
            expect(c).to.equal(-3); // Explicit undefined also falls back to the default.
            expect(d).to.equal(4);
            expect(e).to.equal(-5);
            expect(f).to.equal(-6); // Ditto.
        })
    ]),
    group("Destructuring, parameters", [
        probe("with arrays", () => {
            function f([a,, [b], c]: any) {
                expect(a).to.equal(1);
                expect(b).to.equal(2);
                expect(c).to.be.undefined;
            }
            f([1, null, [2]]);
        }),
        probe("with sparse arrays", () => {
            function f([a,, b]: any) {
                expect(a).to.equal(1);
                expect(b).to.equal(2);
            }
            f([1,, 2]);
        }),
        probe("with strings", () => {
            function f([a, b, c]: any) {
                expect(a).to.equal("a");
                expect(b).to.equal("b");
                expect(c).to.be.undefined;
            }
            f("ab");
        }),
        probe("with astral plane strings", () => {
            function f([a]: any) {
                expect(a).to.equal("𠮷");
            }
            f("𠮷𠮶");
        }),
        probe("with generator instances", () => {
            function f([a, b, c]: any) {
                expect(a).to.equal(1);
                expect(b).to.equal(2);
                expect(c).to.be.undefined;
            }
            function* g() {
                yield 1;
                yield 2;
            }
            f(g());
        }),
        probe("with generic iterables", () => {
            function f([a, b, c]: any) {
                expect(a).to.equal(1);
                expect(b).to.equal(2);
                expect(c).to.be.undefined;
            }
            f(createIterableObject([1, 2]));
        }),
        probe("with instances of generic iterables", () => {
            function f([a, b, c]: any) {
                expect(a).to.equal(1);
                expect(b).to.equal(2);
                expect(c).to.be.undefined;
            }
            f(Object.create(createIterableObject([1, 2])));
        }),
        probe("iterator closing", () => {
            let closed = false;
            const iter = createIterableObject([1, 2, 3], {
                return() {
                    closed = true;
                    return {};
                }
            });
            // @ts-ignore: `a' and 'b' are unused.
            function f([a, b]: any) {}
            f(iter);
            expect(closed).to.be.true;
        }),
        probe("trailing commas in iterable patterns", () => {
            function f([a, ]: any) {
                expect(a).to.equal(1);
            }
            f([1]);
        }),
        probe("with objects", () => {
            function f({a, x: b, c}: any) {
                expect(a).to.equal(1);
                expect(b).to.equal(2);
                expect(c).to.be.undefined;
            }
            f({a: 1, x: 2});
        }),
        probe("object destructuring with primitives", () => {
            function f({toFixed}: any, {slice}: any) {
                expect(toFixed).to.equal(Number.prototype.toFixed);
                expect(slice).to.equal(String.prototype.slice);
            }
            f(2, "");
        }),
        probe("trailing commas in object patterns", () => {
            function f({a, }: any) {
                expect(a).to.equal(1);
            }
            f({a: 1});
        }),
        probe("throws on null and undefined", () => {
            // @ts-ignore: `a' is unused.
            function f({a}: any) {}
            function g() {
                f(null as any);
            }
            function h() {
                f(undefined as any);
            }
            expect(g).to.throw(TypeError);
            expect(h).to.throw(TypeError);
        }),
        probe("computed properties", () => {
            const k = "foo";
            function f({[k]: val}: any) {
                expect(val).to.equal(1);
            }
            f({foo: 1});
        }),
        probe("nested", () => {
            function f([a, {x: b, c}]: any, {d, x: [e]}: any) {
                expect([a, b, c, d, e]).to.deeply.equal([1, 2, undefined, 3, 4]);
            }
            f([1, {x: 2}], {d: 3, x: [4]});
        }),
        probe("`arguments' interaction", () => {
            // @ts-ignore: Parameters are unused.
            function f({a, x: b, c}: any, [d, e]: any) {
                expect(arguments[0]).to.have.a.property("a", 1);
                expect(arguments[0]).to.have.a.property("x", 2);
                expect(arguments[0]).to.not.have.a.property("c");
                expect(arguments[1]).to.deeply.equal([3, 4]);
            }
            f({a: 1, x: 2}, [3, 4]);
        }),
        probe("new Function() support", () => {
            const f = new Function("{a, x: b, c}", "[d, e]", `
                return [a, b, c, d, e];

            `);
            expect(f({a: 1, x: 2}, [3, 4])).to.deeply.equal([1, 2, undefined, 3, 4]);
        }),
        probe("in parameters, function 'length' property", () => {
            // @ts-ignore: `a' and 'b' are unused.
            function f({a, b}: any, [c, d]: any) {}
            expect(f.length).to.equal(2);
        }),
        probe("rest", () => {
            function f([a, ...b]: any, [c, ...d]: any) {
                expect(a).to.equal(1);
                expect(b).to.deeply.equal([2, 3]);
                expect(c).to.equal(4);
                expect(d).to.deeply.equal([]);
            }
            f([1, 2, 3], [4]);
        }),
        probe("empty patterns", () => {
            function f([], {}) {
                expect(arguments[0]).to.deeply.equal([1, 2]);
                expect(arguments[1]).to.deeply.equal({a: 1, b: 2});
            }
            f([1, 2], {a: 1, b: 2});
        }),
        probe("defaults", () => {
            function f({a = -1, b = -2, x: c = -3}: any, [d = -4, e = -5, f = -6]: any) {
                expect(a).to.equal(-1);
                expect(b).to.equal(2);
                expect(c).to.equal(-3); // Explicit undefined also falls back to the default.
                expect(d).to.equal(4);
                expect(e).to.equal(-5);
                expect(f).to.equal(-6); // Ditto.
            }
            f({b: 2, c: undefined}, [4,, undefined]);
        }),
        probe("defaults, separate scope", () => {
            const f = eval(`
                function g({a = () => typeof b}) {
                    let b = 1;
                    return a();
                }
                g
            `);
            expect(f({})).to.equal("undefined");
        }),
        probe("defaults, new Function() support", () => {
            const f = new Function(
                "{a = -1, b = -2, c = -3, x: d = -4, y: e = -5}",
                "return [a, b, c, d, e]");
            expect(f({b: 2, c: undefined, x: 4})).to.deeply.equal([-1, 2, -3, 4, -5]);
        }),
        probe("aliased defaults, arrow function", () => {
            const f = (a: any, {b: x = -2, c: y = -3}: any) => {
                expect(a).to.equal(1);
                expect(x).to.equal(2);
                expect(y).to.equal(-3);
            };
            f(1, {b: 2});
        }),
        probe("shorthand defaults, arrow function", () => {
            const f = (a: any, {b = -2, c = -3}: any) => {
                expect(a).to.equal(1);
                expect(b).to.equal(2);
                expect(c).to.equal(-3);
            };
            f(1, {b: 2});
        }),
        probe("duplicate identifiers", () => {
            const d = function d([d]: any) { return d };
            expect(d([true])).to.be.true;

            function f() {
                eval(`let g = function g([id, id]) { return id }`);
            }
            expect(f).to.throw(SyntaxError);
        })
    ]),
    group("Unicode code point escapes", [
        probe("in strings", () => {
            expect("\u{1d306}").to.equal("\ud834\udf06");
        }),
        probe("in identifiers", () => {
            const \u{102C0} = 2;
            expect(\u{102C0}).to.equal(2);
        }),
        probe("in property key definitions", () => {
            const o = {\u{102C0}: 2};
            expect(o["\ud800\udec0"]).to.equal(2);
        }),
        probe("in property key accesses", () => {
            const o = {'\ud800\udec0': 2};
            expect(o.\u{102C0}).to.equal(2);
        })
    ]),
    group("new.target", [
        probe("in constructors", () => {
            let t: any;
            const f = eval(`
                function f() {
                    t = new.target;
                }
                f
            `);

            new f();
            expect(t).to.equal(f);

            f();
            expect(t).to.be.undefined;
        }),
        probe("assignment is an early error", () => {
            function f() {
                return new Function("new.target = function () {}");
            }
            expect(f).to.throw(SyntaxError);
        })
    ])
]);

import { group, probe, expect } from "../../probing-toolkit";

export default group("features", [
    group("instance class fields", [
        probe("public instance class fields", () => {
            const C = eval(`
                class C {
                    foo = "bar";
                }
                C
            `);
            expect(new C()).to.have.a.property("foo", "bar");
        }),
        probe("private instance class fields basic support", () => {
            const C = eval(`
                class C {
                    #x;
                    constructor(x) {
                        this.#x = x;
                    }
                    x() {
                        return this.#x;
                    }
                }
                C
            `);
            expect(new C(42).x()).to.equal(42);
        }),
        probe("private instance class fields initializers", () => {
            const C = eval(`
                class C {
                    #x = 42;
                    x() {
                        return this.#x;
                    }
                }
                C
            `);
            expect(new C().x()).to.equal(42);
        }),
        probe("optional private instance class fields access", () => {
            const C = eval(`
                class C {
                    #x = 42;
                    x(o = this) {
                        return o?.#x;
                    }
                }
                C
            `);
            expect(new C().x()).to.equal(42);
            expect(new C().x(null)).to.be.undefined;
        }),
        probe("optional deep private instance class fields access", () => {
            const C = eval(`
                class C {
                    #x = 42;
                    x(o = {p: this}) {
                        return o?.p.#x;
                    }
                }
                C
            `);
            expect(new C().x()).to.equal(42);
            expect(new C().x(null)).to.be.undefined;
        }),
        probe("computed instance class fields", () => {
            const C = eval(`
                class C {
                    ["x"] = 42;
                }
                C
            `);
            expect(new C().x).to.equal(42);
        }),
    ]),
    group("private class methods", [
        probe("private instance methods", () => {
            const C = eval(`
                class C {
                    #x() { return 42; }
                    x() {
                        return this.#x();
                    }
                }
                C
            `);
            expect(new C().x()).to.equal(42);
        }),
        probe("private static methods", () => {
            const C = eval(`
                class C {
                    static #x() { return 42; }
                    x() {
                        return C.#x();
                    }
                }
                C
            `);
            expect(new C().x()).to.equal(42);
        }),
        probe("private accessor properties", () => {
            let b = false;
            const C = eval(`
                class C {
                    get #x() { return 42; }
                    set #x(x) { b = x; }
                    x() {
                        this.#x = true;
                        return this.#x;
                    }
                }
                C
            `);
            expect(new C().x()).to.equal(42);
            expect(b).to.be.true;
        }),
        probe("private static accessor properties", () => {
            let b = false;
            const C = eval(`
                class C {
                    static get #x() { return 42; }
                    static set #x(x) { b = x; }
                    x() {
                        C.#x = true;
                        return C.#x;
                    }
                }
                C
            `);
            expect(new C().x()).to.equal(42);
            expect(b).to.be.true;
        })
    ]),
    probe("ergonomic brand checks for private fields", () => {
        const C = eval(`
            class C {
                #x;
                static check(obj) {
                    return #x in obj;
                }
            }
            C
        `);
        expect(C.check(new C)).to.be.true;
        expect(C.check({}   )).to.be.false;
    }),
    probe("class static initialization blocks", () => {
        let ok = false;
        eval(`
            class C {
                static { ok = true; }
            }
        `);
        expect(ok).to.be.true;
    }),
    group(".at() method on the built-in indexables", [
        probe("Array.prototype.at", () => {
            const arr = [1, 2, 3];
            expect(arr.at( 0)).to.equal(1);
            expect(arr.at(-3)).to.equal(1);
            expect(arr.at( 1)).to.equal(2);
            expect(arr.at(-2)).to.equal(2);
            expect(arr.at( 2)).to.equal(3);
            expect(arr.at(-1)).to.equal(2);
            expect(arr.at( 3)).to.be.undefined;
            expect(arr.at(-4)).to.be.undefined;
        }),
        probe("String.prototype.at()", () => {
            const str = "abc";
            expect(str.at( 0)).to.equal("a");
            expect(str.at(-3)).to.equal("a");
            expect(str.at( 1)).to.equal("b");
            expect(str.at(-2)).to.equal("b");
            expect(str.at( 2)).to.equal("c");
            expect(str.at(-1)).to.equal("c");
            expect(str.at( 3)).to.be.undefined;
            expect(str.at(-4)).to.be.undefined;
        }),
        probe("%TypedArray%.prototype.at()", () => {
            const ctors = [
                Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array,
                Int32Array, Uint32Array, Float32Array, Float64Array];
            for (const TypedArray of ctors) {
                const arr = new TypedArray([1, 2, 3]);
                expect(arr.at( 0)).to.equal(1);
                expect(arr.at(-3)).to.equal(1);
                expect(arr.at( 1)).to.equal(2);
                expect(arr.at(-2)).to.equal(2);
                expect(arr.at( 2)).to.equal(3);
                expect(arr.at(-1)).to.equal(2);
                expect(arr.at( 3)).to.be.undefined;
                expect(arr.at(-4)).to.be.undefined;
            }
        })
    ]),
    group("Object.hasOwn", [
        probe("basic functionality", () => {
            expect(Object.hasOwn({x: 2}, "x")).to.be.true;
        }),
        probe("ToObject called before ToPropertyKey", () => {
            const key = {
                toString() {
                    throw new Error("ToPropertyKey was called first!");
                }
            };
            function f() {
                // @ts-ignore: TypeScript obviously doesn't like this.
                Object.hasOwn(null, key);
            }
            expect(f).to.throw(TypeError);
        })
    ])
]);

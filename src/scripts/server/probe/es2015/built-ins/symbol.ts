import { group, probe, expect } from "../../../probing-toolkit";

export default group("Symbol", [
    probe("basic functionality", () => {
        const obj = {} as any;
        const sym = Symbol();
        const val = {};
        obj[sym] = val;

        expect(obj).to.have.a.property(sym).that.equals(val);
    }),
    probe("`typeof' supports symbols", () => {
        expect(typeof Symbol()).to.equal("symbol");
    }),
    probe("Symbolic keys are non-enumerable by default", () => {
        const obj = {} as any;
        const sym = Symbol();
        obj[sym] = 1;

        let enumerated = false;
        for (const _k in obj) {
            enumerated = true;
        }
        expect(enumerated).to.be.false;

        expect(Object.keys(obj)).to.have.lengthOf(0);
        expect(Object.getOwnPropertyNames(obj)).to.have.lengthOf(0);
    }),
    probe("`Object.defineProperty' supports symbols", () => {
        const obj = {};
        const sym = Symbol();
        const val = {};

        Object.defineProperty(obj, sym, {value: val});
        expect(obj).to.have.a.property(sym).that.equals(val);
    }),
    probe("Symbols inherit from `Symbol.prototype'", () => {
        const sym = Symbol();
        expect(Object.getPrototypeOf(sym)).to.equal(Symbol.prototype);
    }),
    probe("Symbols cannot coerce into strings or numbers", () => {
        const sym = Symbol() as any;
        function f() {
            return sym + "";
        }
        function g() {
            return sym + 0;
        }
        expect(f).to.throw(TypeError);
        expect(g).to.throw(TypeError);
    }),
    probe("`String()' can convert symbols to strings", () => {
        const sym = Symbol("foo");
        expect(String(sym)).to.equal("Symbol(foo)");
    }),
    probe("`Symbol()' isn't a constructor", () => {
        function f() {
            return eval(`new Symbol()`);
        }
        expect(f).to.throw(TypeError);
    }),
    probe("`Object()' can create a symbol wrapper object", () => {
        const sym = Symbol();
        const obj = Object(sym);

        expect(typeof obj).to.equal("object");
        expect(obj).to.be.an.instanceOf(Symbol);
        expect(obj).to.satisfy(o => o == sym);
        expect(obj).not.to.equal(sym);
        expect(obj.valueOf()).to.equal(sym);
    }),
    probe("`JSON.stringify' ignores symbol primitives", () => {
        const obj = {foo: Symbol()} as any;
        obj[Symbol()] = 1;
        expect(JSON.stringify(obj)).to.equal("{}");

        const arr = [Symbol()];
        expect(JSON.stringify(arr)).to.equal("[null]");

        const sym = Symbol();
        expect(JSON.stringify(sym)).to.be.undefined;
    }),
    probe("`JSON.stringify' ignores symbol objects", () => {
        const obj = Object(Symbol());
        const objNoToJSON = Object(Symbol());
        // Ensure it overrides toJSON but isn't callable.
        Object.defineProperty(objNoToJSON, "toJSON", {enumerable: false, value: null});

        function test(symObj: object) {
            const o = {foo: symObj} as any;
            o[symObj as any] = 1;
            expect(JSON.stringify(o)).to.equal(`{"foo":{}}`);

            const a = [symObj];
            expect(JSON.stringify(a)).to.equal("[{}]");

            expect(JSON.stringify(symObj)).to.equal("{}");
        }
        test(obj);
        test(objNoToJSON);
    }),
    probe("global symbol registry", () => {
        const foo = Symbol.for("foo");
        expect(Symbol.for("foo")).to.equal(foo);
        expect(Symbol.keyFor(foo)).to.equal("foo");
    }),
    group("well-known symbols", [
        probe("@@hasInstance", () => {
            let passed = false;
            class C {
                static [Symbol.hasInstance]() {
                    passed = true;
                    return false;
                }
            }
            ({}) instanceof C;
            expect(passed).to.be.true;
        }),
        probe("@@isConcatSpreadable, non-spreadable array", () => {
            const a: any[] = [], b: any[] = [];
            Object.defineProperty(b, Symbol.isConcatSpreadable, {value: false});
            expect(a.concat(b)).to.have.lengthOf(1)
                .and.have.a.property(0, b);
        }),
        probe("@@isConcatSpreadable, spreadable object with poisoned getter", () => {
            const obj = {
                length: 1,
                [Symbol.isConcatSpreadable]: true,
                get [0]() {
                    throw new Error("Poisoned");
                }
            };
            function f() {
                return [].concat(obj as any);
            }
            expect(f).to.throw("Poisoned");
        }),
        probe("@@iterator", () => {
            expect(Symbol).to.have.a.property("iterator").that.is.a("symbol");
        }),
        probe("@@iterator, arguments object", () => {
            function f() {
                expect(arguments).to.have.own.property(Symbol.iterator).that.is.a("function");
            }
            f();
        }),
        probe("@@species", () => {
            expect(Symbol).to.have.a.property("species").that.is.a("symbol");
        }),
        probe("@@species, Array.prototype.concat", () => {
            const obj: any[] = [];
            obj.constructor = {
                [Symbol.species]: function () {
                    return {foo: 1};
                }
            } as any;
            expect(Array.prototype.concat.call(obj, [])).to.have.a.property("foo", 1);
        }),
        probe("@@species, Array.prototype.filter", () => {
            const obj: any[] = [];
            obj.constructor = {
                [Symbol.species]: function () {
                    return {foo: 1};
                }
            } as any;
            expect(Array.prototype.filter.call(obj, Boolean)).to.have.a.property("foo", 1);
        }),
        probe("@@species, Array.prototype.map", () => {
            const obj: any[] = [];
            obj.constructor = {
                [Symbol.species]: function () {
                    return {foo: 1};
                }
            } as any;
            expect(Array.prototype.map.call(obj, Boolean)).to.have.a.property("foo", 1);
        }),
        probe("@@species, Array.prototype.slice", () => {
            const obj: any[] = [];
            obj.constructor = {
                [Symbol.species]: function () {
                    return {foo: 1};
                }
            } as any;
            expect(Array.prototype.slice.call(obj, 0)).to.have.a.property("foo", 1);
        }),
        probe("@@species, Array.prototype.splice", () => {
            const obj: any[] = [];
            obj.constructor = {
                [Symbol.species]: function () {
                    return {foo: 1};
                }
            } as any;
            expect(Array.prototype.splice.call(obj, 0, 0)).to.have.a.property("foo", 1);
        }),
        probe("@@species, RegExp.prototype[@@split]", () => {
            let passed = false;
            const obj = {
                constructor: {
                    [Symbol.species]: function () {
                        passed = true;
                        return /./;
                    }
                },
                [Symbol.split]: RegExp.prototype[Symbol.split]
            };
            "".split(obj);
            expect(passed).to.be.true;
        }),
        probe("@@species, Promise.prototype.then", () => {
            const prom  = new Promise((resolve) => resolve(42));
            const fake1 = function (exec: any) { exec(() => {}, () => {}) };
            const fake2 = function (exec: any) { exec(() => {}, () => {}) };
            prom.constructor = fake1;
            Object.defineProperty(fake1, Symbol.species, {value: fake2});
            expect(prom.then(() => {})).to.be.an.instanceOf(fake2);
        }),
        probe("@@replace", () =>  {
            const obj = {
                [Symbol.replace]() {
                    return "foo";
                }
            };
            expect("".replace(obj, "bar")).to.equal("foo");
        }),
        probe("@@search", () =>  {
            const obj = {
                [Symbol.search]() {
                    return 42;
                }
            };
            expect("".search(obj)).to.equal(42);
        }),
        probe("@@split", () =>  {
            const obj = {
                [Symbol.split]() {
                    return ["foo"];
                }
            };
            expect("".split(obj)).to.deeply.equal(["foo"]);
        }),
        probe("@@match", () => {
            const obj = {
                [Symbol.match]() {
                    return ["foo"];
                }
            };
            // @ts-ignore: TypeScript doesn't like this.
            expect("".match(obj)).to.deeply.equal(["foo"]);
        }),
        probe("@@match, RegExp constructor", () => {
            const re = /./;
            re[Symbol.match] = false as any;
            expect(RegExp(re)).not.to.equal(re);

            const obj = {
                constructor: RegExp,
                [Symbol.match]: true as any
            };
            // @ts-ignore: TypeScript doesn't like this ofc.
            expect(RegExp(obj)).to.equal(obj);
        }),
        probe("@@match, String.prototype.startsWith", () => {
            const re = /./;
            function f() {
                return "foo".startsWith(re as any);
            }
            expect(f).to.throw(TypeError);

            re[Symbol.match] = false as any;
            expect(f).to.not.throw();
        }),
        probe("@@match, String.prototype.endsWith", () => {
            const re = /./;
            function f() {
                return "foo".endsWith(re as any);
            }
            expect(f).to.throw(TypeError);

            re[Symbol.match] = false as any;
            expect(f).to.not.throw();
        }),
        probe("@@match, String.prototype.includes", () => {
            const re = /./;
            function f() {
                return "foo".includes(re as any);
            }
            expect(f).to.throw(TypeError);

            re[Symbol.match] = false as any;
            expect(f).to.not.throw();
        }),
        probe("@@toPrimitive", () => {
            let passed = 0;
            const a = {
                [Symbol.toPrimitive](hint: string) {
                    expect(hint).to.equal("number");
                    passed++;
                    return 0;
                }
            };
            const b = {
                [Symbol.toPrimitive](hint: string) {
                    expect(hint).to.equal("string");
                    passed++;
                    return 0;
                }
            };
            const c = {
                [Symbol.toPrimitive](hint: string) {
                    expect(hint).to.equal("default");
                    passed++;
                    return 0;
                }
            };
            (a as any) >= 0;
            (b as any) in ({});
            (c as any) == 0;
            expect(passed).to.equal(3);
        }),
        probe("@@toStringTag", () => {
            const obj = {
                [Symbol.toStringTag]: "foo"
            };
            expect(String(obj)).to.equal("[object foo]");
        }),
    ])
]);

import { group, probe, expect } from "../../../probing-toolkit";
import { createIterableObject } from "../../_utils";

export default group("Built-in extensions", [
    group("Object static methods", [
        probe("Object.assign", () => {
            const obj = Object.assign({a: true}, {b: true}, {c: true});
            expect(obj).to.have.a.property("a", true);
            expect(obj).to.have.a.property("b", true);
            expect(obj).to.have.a.property("c", true);
        }),
        probe("Object.is", () => {
            expect(Object.is(NaN, NaN)).to.be.true;
            expect(Object.is(-0, 0)).to.be.false;
        }),
        probe("Object.getOwnPropertySymbols", () => {
            const sym1 = Symbol(), sym2 = Symbol(), sym3 = Symbol();
            const obj  = {
                [sym1]: true,
                [sym2]: true,
                [sym3]: true
            };
            expect(Object.getOwnPropertySymbols(obj)).to.have.members([sym1, sym2, sym3]);
        }),
        probe("Object.setPrototypeOf", () => {
            const obj = Object.setPrototypeOf({}, Array.prototype);
            expect(obj).to.be.an.instanceOf(Array);
        })
    ]),
    group("function `name' property", [
        probe("function statements", () => {
            function foo() {}
            expect(foo).to.have.a.property("name", "foo");
            expect(function () {}).to.have.a.property("name", "");
        }),
        probe("function expressions", () => {
            expect(function foo() {}).to.have.a.property("name", "foo");
            expect(function () {}).to.have.a.property("name", "");
        }),
        probe("new Function", () => {
            expect(new Function).to.have.a.property("name", "anonymous");
        }),
        probe("bound functions", () => {
            function foo() {}
            expect(foo.bind({})).to.have.a.property("name", "bound foo");
            expect((function () {}).bind({})).to.have.a.property("name", "bound ");
        }),
        probe("variables (function)", () => {
            const foo = function () {};
            const bar = function baz() {};
            expect(foo).to.have.a.property("name", "foo");
            expect(bar).to.have.a.property("name", "baz");
        }),
        probe("object methods (function)", () => {
            const obj: any = {
                foo: function () {},
                bar: function baz() {}
            };
            obj.qux = function () {};
            expect(obj.foo).to.have.a.property("name", "foo");
            expect(obj.bar).to.have.a.property("name", "baz");
            expect(obj.qux).to.have.a.property("name", "");
        }),
        probe("accessor properties", () => {
            const obj = {
                get foo() { return null },
                set foo(_x) {}
            };
            expect(obj).to.have.ownPropertyDescriptor("foo")
                .that.has.a.nested.property("get.name", "get foo");
            expect(obj).to.have.ownPropertyDescriptor("foo")
                .that.has.a.nested.property("set.name", "set foo");
        }),
        probe("shorthand methods", () => {
            const obj = {
                foo() {}
            };
            expect(obj.foo).to.have.a.property("name", "foo");
        }),
        probe("symbol-keyed methods", () => {
            const sym1 = Symbol("foo");
            const sym2 = Symbol();
            const obj  = {
                [sym1]: function () {},
                [sym2]: function () {}
            };
            expect(obj[sym1]).to.have.a.property("name", "[foo]");
            expect(obj[sym2]).to.have.a.property("name", "");
        }),
        probe("class statements", () => {
            class Foo {}
            class Bar {
                // @ts-ignore: We knowingly declare a conflicting property here.
                static name() {}
            }
            expect(Foo).to.have.a.property("name", "Foo");
            expect(Bar).to.have.a.property("name").that.is.a("function");
        }),
        probe("class expressions", () => {
            expect(class Foo {}).to.have.a.property("name", "Foo");
            // @ts-ignore: We knowingly declare a conflicting property here.
            expect(class Bar { static name() {} }).to.have.a.property("name").that.is.a("function");
        }),
        probe("variables (class)", () => {
            const Foo = class {};
            const Bar = class Baz {};
            // @ts-ignore: We knowingly declare a conflicting property here.
            const Qux = class { static name() {} };
            expect(Foo).to.have.a.property("name", "Foo");
            expect(Bar).to.have.a.property("name", "Baz");
            expect(Qux).to.have.a.property("name").that.is.a("function");
        }),
        probe("object methods (class)", () => {
            const obj: any = {
                Foo: class {},
                Bar: class Baz {}
            };
            obj.Qux = class {};
            expect(obj.Foo).to.have.a.property("name", "Foo");
            expect(obj.Bar).to.have.a.property("name", "Baz");
            expect(obj.Qux).to.have.a.property("name", "");
        }),
        probe("class prototype methods", () => {
            class C {
                foo() {}
            }
            expect(new C).to.have.a.nested.property("foo.name", "foo");
        }),
        probe("class static methods", () => {
            class C {
                static foo() {}
            }
            expect(C).to.have.a.nested.property("foo.name", "foo");
        }),
        probe("isn't writable, is configurable", () => {
            function f() {}
            expect(f).to.have.ownPropertyDescriptor("name").that.includes({
                enumerable:   false,
                writable:     false,
                configurable: true
            });
        })
    ]),
    group("String static methods", [
        probe("String.raw", () => {
            expect(String.raw`foo\n${"bar"}`).to.equal("foo\\nbar");
        }),
        probe("String.fromCodePoint", () => {
            expect(String.fromCodePoint(9733)).to.equal("★");
        })
    ]),
    group("String.prototype methods", [
        probe("String.prototype.codePointAt", () => {
            expect("★".codePointAt(0)).to.equal(9733);
        }),
        probe("String.prototype.normalize", () => {
            expect("c\u0327\u0301".normalize("NFC")).to.equal("\u1e09");
            expect("\u1e09".normalize("NFD")).to.equal("c\u0327\u0301");
        }),
        probe("String.prototype.repeat", () => {
            expect("ab".repeat(3)).to.equal("ababab");
        }),
        probe("String.prototype.startsWith", () => {
            expect("foobar".startsWith("foo")).to.be.true;
        }),
        probe("String.prototype.endsWith", () => {
            expect("foobar".endsWith("bar")).to.be.true;
        }),
        probe("String.prototype.includes", () => {
            expect("foobar".includes("oob")).to.be.true;
        }),
        probe("String.prototype[@@iterator]", () => {
            expect("foobar"[Symbol.iterator]).to.be.a("function");
        }),
        probe("String iterator prototype chain", () => {
            // Iterator instance
            const iter   = ''[Symbol.iterator]();
            // %StringIteratorPrototype%
            const proto1 = Object.getPrototypeOf(iter);
            // %IteratorPrototype%
            const proto2 = Object.getPrototypeOf(proto1);

            expect(proto2).to.have.own.property(Symbol.iterator);
            expect(proto1).to.not.have.own.property(Symbol.iterator);
            expect(iter).to.not.have.own.property(Symbol.iterator);
            expect(iter[Symbol.iterator]()).to.equal(iter);
        }),
    ]),
    group("RegExp.prototype properties", [
        probe("RegExp.prototype.flags", () => {
            expect(/./igm).to.have.a.property("flags", "gim");
            expect(/./).to.have.a.property("flags", "");
        }),
        probe("RegExp.prototype[@@match]", () => {
            expect(RegExp.prototype).to.have.a.property(Symbol.match).that.is.a("function");
        }),
        probe("RegExp.prototype[@@replace]", () => {
            expect(RegExp.prototype).to.have.a.property(Symbol.replace).that.is.a("function");
        }),
        probe("RegExp.prototype[@@split]", () => {
            expect(RegExp.prototype).to.have.a.property(Symbol.split).that.is.a("function");
        }),
        probe("RegExp.prototype[@@search]", () => {
            expect(RegExp.prototype).to.have.a.property(Symbol.search).that.is.a("function");
        }),
        probe("RegExp[@@species]", () => {
            expect(RegExp).to.have.ownPropertyDescriptor(Symbol.species)
                .that.has.a.property("get");
            expect(RegExp).to.have.a.property(Symbol.species, RegExp);
        })
    ]),
    group("Array static methods", [
        probe("Array.from, array-like objects", () => {
            const obj = {0: "foo", 1: "bar", length: 2};
            expect(Array.from(obj)).to.deeply.equal(["foo", "bar"]);
        }),
        probe("Array.from, generator instances", () => {
            function* g() {
                yield 1;
                yield 2;
            }
            expect(Array.from(g())).to.deeply.equal([1, 2]);
        }),
        probe("Array.from, generic iterables", () => {
            const iter = createIterableObject([1, 2]);
            expect(Array.from(iter)).to.deeply.equal([1, 2]);
        }),
        probe("Array.from, instances of generic iterables", () => {
            const iter = createIterableObject([1, 2]);
            expect(Array.from(Object.create(iter))).to.deeply.equal([1, 2]);
        }),
        probe("Array.from map function, array-like objects", () => {
            const obj = {0: "foo", 1: "bar", length: 2};
            function f(this: any, e: string, i: number): string {
                return e + this.baz + String(i);
            }
            expect(Array.from(obj, f, {baz: "*"})).to.deeply.equal(["foo*0", "bar*1"]);
        }),
        probe("Array.from map function, generator instances", () => {
            function* g() {
                yield "foo";
                yield "bar";
            }
            function f(this: any, e: string, i: number): string {
                return e + this.baz + String(i);
            }
            expect(Array.from(g(), f, {baz: "*"})).to.deeply.equal(["foo*0", "bar*1"]);
        }),
        probe("Array.from map function, generic iterables", () => {
            const iter = createIterableObject(["foo", "bar"]);
            function f(this: any, e: string, i: number): string {
                return e + this.baz + String(i);
            }
            expect(Array.from(iter, f, {baz: "*"})).to.deeply.equal(["foo*0", "bar*1"]);
        }),
        probe("Array.from map function, instances of generic iterables", () => {
            const iter = createIterableObject(["foo", "bar"]);
            function f(this: any, e: string, i: number): string {
                return e + this.baz + String(i);
            }
            expect(Array.from(Object.create(iter), f, {baz: "*"})).to.deeply.equal(["foo*0", "bar*1"]);
        }),
        probe("Array.from, iterator closing", () => {
            let closed = false;
            const iter = createIterableObject([1, 2, 3], {
                return() {
                    closed = true;
                    return {};
                }
            });
            function f() {
                return Array.from(iter, () => { throw 42 });
            }
            expect(f).to.throw();
            expect(closed).to.be.true;
        }),
        probe("Array.of", () => {
            expect(Array.of(2)).to.deeply.equal([2]);
        }),
        probe("Array[@@species]", () => {
            expect(Array).to.have.ownPropertyDescriptor(Symbol.species)
                .that.has.a.property("get");
            expect(Array).to.have.a.property(Symbol.species, Array);
        })
    ]),
    group("Array.prototype methods", [
        probe("Array.prototype.copyWithin", () => {
            const arr = ["a", "b", "c", "d", "e"];
            arr.copyWithin(0, 3, 4);
            expect(arr).to.deeply.equal(["d", "b", "c", "d", "e"]);
        }),
        probe("Array.prototype.find", () => {
            const arr = [10, 11, 12, 13, 44];
            function f(n: number) {
                return n % 2 === 1;
            }
            expect(arr.find(f)).to.equal(11);
        }),
        probe("Array.prototype.findIndex", () => {
            const arr = [10, 11, 12, 13, 44];
            function f(n: number) {
                return n % 2 === 1;
            }
            expect(arr.findIndex(f)).to.equal(1);
        }),
        probe("Array.prototype.fill", () => {
            const arr = [1, 2, 3];
            arr.fill(6);
            expect(arr).to.deeply.equal([6, 6, 6]);
        }),
        probe("Array.prototype.keys", () => {
            const arr = ["a", "b", "c"];
            expect(Array.from(arr.keys())).to.deeply.equal([0, 1, 2]);
        }),
        probe("Array.prototype.values", () => {
            const arr = ["a", "b", "c"];
            expect(Array.from(arr.values())).to.deeply.equal(["a", "b", "c"]);
        }),
        probe("Array.prototype.entries", () => {
            const arr = ["a", "b", "c"];
            expect(Array.from(arr.entries())).to.deeply.equal([[0, "a"], [1, "b"], [2, "c"]]);
        }),
        probe("Array.prototype.splice", () => {
            // IE <= 8 and other pre-ES6 engines fail this check.
            expect([0, 1, 2].splice(0)).to.have.lengthOf(3);

            // Safari 5.0 has this bug.
            {
                const arr = [1, 2];
                const res = (arr.splice as any)();
                expect(arr).to.have.lengthOf(2);
                expect(res).to.have.lengthOf(0);
            }

            // Is this really supposed to behave this way?
            {
                const obj = {};
                Array.prototype.splice.call(obj, 0, 0, 1);
                expect(obj).to.have.lengthOf(1);
            }

            // Per https://github.com/es-shims/es5-shim/issues/295 Safari
            // 7/8 breaks with sparse arrays of size 1e5 or greater.
            {
                const arr = new Array(1e5);
                // note: the index MUST be 8 or larger or the test will false pass
                arr[8] = "x";
                arr.splice(1, 1);
                expect(arr.findIndex((c: any) => c === "x")).to.equal(7);
            }

            // Per https://github.com/es-shims/es5-shim/issues/295 Opera
            // 12.15 breaks on this, no idea why.
            {
                const n = 256;
                const arr = [];
                arr[n] = "a";
                arr.splice(n + 1, 0, "b");
                expect(arr[n]).to.equal("a");
            }
        }),
        probe("Array.prototype[@@iterator]", () => {
            const iter = [1, 2][Symbol.iterator]();
            expect(Array.from(iter)).to.deeply.equal([1, 2]);
        }),
        probe("Array iterator prototype chain", () => {
            // Iterator instance
            const iter   = [][Symbol.iterator]();
            // %SetIteratorPrototype%
            const proto1 = Object.getPrototypeOf(iter);
            // %IteratorPrototype%
            const proto2 = Object.getPrototypeOf(proto1);

            expect(proto2).to.have.own.property(Symbol.iterator);
            expect(proto1).to.not.have.own.property(Symbol.iterator);
            expect(iter).to.not.have.own.property(Symbol.iterator);
            expect(iter[Symbol.iterator]()).to.equal(iter);
        }),
    ]),
    group("Number properties", [
        probe("Number.isFinite", () => {
            expect(Number.isFinite(1e6)).to.be.true;
        }),
        probe("Number.isInteger", () => {
            expect(Number.isInteger(3.0)).to.be.true;
        }),
        probe("Number.isSafeInteger", () => {
            expect(Number.isSafeInteger(666)).to.be.true;
        }),
        probe("Number.isNaN", () => {
            expect(Number.isNaN(0 / 0)).to.be.true;
        }),
        probe("Number.parseFloat", () => {
            expect(Number.parseFloat("666")).to.equal(666);
            expect(Number.parseFloat).to.equal(globalThis.parseFloat);
        }),
        probe("Number.parseInt", () => {
            expect(Number.parseInt("0xA", 16)).to.equal(10);
            expect(Number.parseInt).to.equal(globalThis.parseInt);
        }),
        probe("Number.EPSILON", () => {
            expect(Number.EPSILON).to.be.a("number");
        }),
        probe("Number.MIN_SAFE_INTEGER", () => {
            expect(Number.MIN_SAFE_INTEGER).to.be.a("number");
        }),
        probe("Number.MAX_SAFE_INTEGER", () => {
            expect(Number.MAX_SAFE_INTEGER).to.be.a("number");
        })
    ]),
    group("Math methods", [
        probe("Math.clz32", () => {
            expect(Math.clz32(4)).to.equal(29);
        }),
        probe("Math.imul", () => {
            expect(Math.imul(-5, 12)).to.equal(-60);
        }),
        probe("Math.sign", () => {
            expect(Math.sign(-666)).to.equal(-1);
        }),
        probe("Math.log10", () => {
            expect(Math.log10(1000)).to.equal(3);
        }),
        probe("Math.log2", () => {
            expect(Math.log2(16)).to.equal(4);
        }),
        probe("Math.log1p", () => {
            expect(Math.log1p(0)).to.equal(0);
        }),
        probe("Math.expm1", () => {
            expect(Math.expm1(0)).to.equal(0);
        }),
        probe("Math.cosh", () => {
            expect(Math.cosh(0)).to.equal(1);
        }),
        probe("Math.sinh", () => {
            expect(Math.sinh(0)).to.equal(0);
        }),
        probe("Math.tanh", () => {
            expect(Math.tanh(0)).to.equal(0);
        }),
        probe("Math.acosh", () => {
            expect(Math.acosh(1)).to.equal(0);
        }),
        probe("Math.asinh", () => {
            expect(Math.asinh(0)).to.equal(0);
        }),
        probe("Math.atanh", () => {
            expect(Math.atanh(0)).to.equal(0);
        }),
        probe("Math.trunc", () => {
            expect(Math.trunc(-6.66)).to.equal(-6);
        }),
        probe("Math.fround", () => {
            expect(Math.fround(5.5)).to.equal(5.5);
        }),
        probe("Math.cbrt", () => {
            expect(Math.cbrt(-1)).to.equal(-1);
        }),
        probe("Math.hypot", () => {
            expect(Math.hypot(3, 4)).to.equal(5);
        })
    ]),
    probe("Date.prototype[@@toPrimitive]", () => {
        const tp = Date.prototype[Symbol.toPrimitive];
        expect(tp.call(Object(2), "number")).to.equal(2);
        expect(tp.call(Object(2), "string")).to.equal("2");
        expect(tp.call(Object(2), "default")).to.equal("2");
    })
]);

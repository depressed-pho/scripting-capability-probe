import { group, probe, expect } from "../../probing-toolkit.js";
import { createIterableObject } from "../_utils.js";

export default group("Functions", [
    group("Arrow functions", [
        probe("0 parameters", () => {
            const f = eval(`() => 5`);
            expect(f()).to.equal(5);
        }),
        probe("1 parameter, no brackets", () => {
            const f = eval(`x => x + "bar"`);
            expect(f("foo")).to.equal("foobar");
        }),
        probe("multiple parameters", () => {
            const f = eval(`(a, b) => a * 10 + b`);
            expect(f(1, 2)).to.equal(12);
        }),
        probe("lexical `this' binding", () => {
            const a = {x: "foo", y: function () { return (z: string) => this.x + z }}.y();
            const b = {x: "bar", y: a};
            expect(a("baz")).to.equal("foobaz");
            expect(b.y("qux")).to.equal("fooqux"); // NOT "barqux".
        }),
        probe("`this' unchanged by call or apply", () => {
            const a = {x: "foo", y: function () { return () => this.x }};
            const b = {x: "bar", y: a};
            expect(a.y().call(b)).to.equal("foo");
            expect(a.y().apply(b)).to.equal("foo");
        }),
        probe("can't be bound, can be curried", () => {
            const a = {x: "foo", y: function () { return (z: string) => this.x + z }};
            const b = {x: "bar" };
            expect(a.y().bind(b, "baz")()).to.equal("foobaz");
        }),
        probe("lexical `arguments' binding", () => {
            const f = (function () { return (_z: any) => arguments[0] } as any)(1);
            expect(f(2)).to.equal(1);
        }),
        probe("no line break between params and =>", () => {
            function f() {
                return Function("x\n => 2");
            }
            expect(f).to.throw(SyntaxError);
        }),
        probe("correct precedence", () => {
            function f() {
                return Function("0 || () => 2");
            }
            expect(f).to.throw(SyntaxError);
        }),
        probe("no `prototype' property", () => {
            const f = () => 0;
            expect(f).to.not.have.own.property("prototype");
        }),
        probe("lexical `super' binding in constructors", () => {
            let received;
            eval(`
                class Base {
                    constructor(arg) {
                        received = arg;
                    }
                }
                class Inherited extends Base {
                    constructor() {
                        const f = () => super("foo");
                        f();
                    }
                }
                new Inherited();
            `);
            expect(received).to.equal("foo");
        }),
        probe("lexical `super' binding in methods", () => {
            class Base {
                foo() {
                    return "foo";
                }
            }
            class Inherited extends Base {
                bar() {
                    return () => super.foo();
                }
            }
            const f = new Inherited().bar();
            expect(f()).to.equal("foo");
        }),
        probe("lexical `new.target' binding", () => {
            function C() {
                return () => new.target;
            }
            expect(eval(`new C()()`)).to.equal(C);
            expect(eval(`C()()`)).to.be.undefined;
        })
    ]),
    group("Classes", [
        probe("class statement", () => {
            class C {}
            expect(C).to.be.a("function");
        }),
        probe("is block-scoped", () => {
            class C {}
            const c1 = C;
            {
                class C {}
                // @ts-ignore: `c2' won't be read.
                const c2 = C;
            }
            expect(C).to.equal(c1);
        }),
        probe("class expression", () => {
            expect(class C {}).to.be.a("function");
        }),
        probe("constructor", () => {
            class C {
                x: number;
                constructor() {
                    this.x = 1;
                }
            }
            expect(C).to.have.a.nested.property("prototype.constructor", C);
            expect(new C()).to.have.a.property("x", 1);
        }),
        probe("prototype methods", () => {
            class C {
                method() {
                    return 1;
                }
            }
            expect(C).to.respondTo("method");
            expect(new C().method()).to.equal(1);
        }),
        probe("string-keyed methods", () => {
            class C {
                "foo bar"() {
                    return 1;
                }
            }
            expect(C).to.respondTo("foo bar");
            expect(new C()["foo bar"]()).to.equal(1);
        }),
        probe("computed prototype methods", () => {
            const key = "foo";
            class C {
                [key]() {
                    return 1;
                }
            }
            expect(C).to.respondTo("foo");
            expect(new C().foo()).to.equal(1);
        }),
        probe("optional semicolons", () => {
            class C {
                ;
                method1() { return 1 };
                method2() { return 2 }
                method3() { return 3 };
            }
            expect(C).to.respondTo("method1");
            expect(C).to.respondTo("method2");
            expect(C).to.respondTo("method3");
        }),
        probe("static methods", () => {
            class C {
                static method() {
                    return 1;
                }
            }
            expect(C).itself.to.respondTo("method");
            expect(C.method()).to.equal(1);
        }),
        probe("computed static methods", () => {
            const key = "foo";
            class C {
                static [key]() {
                    return 1;
                }
            }
            expect(C).itself.to.respondTo("foo");
            expect(C.foo()).to.equal(1);
        }),
        probe("accessor properties", () => {
            let baz = false;
            class C {
                get foo() {
                    return 1;
                }
                set bar(b: boolean) {
                    baz = b;
                }
            }
            new C().bar = true;
            expect(new C()).to.have.a.property("foo", 1);
            expect(baz).to.be.true;
        }),
        probe("computed accessor properties", () => {
            const key1 = "foo";
            const key2 = "bar";
            let baz = false;
            class C {
                get [key1]() {
                    return 1;
                }
                set [key2](b: boolean) {
                    baz = b;
                }
            }
            new C().bar = true;
            expect(new C()).to.have.a.property("foo", 1);
            expect(baz).to.be.true;
        }),
        probe("static accessor properties", () => {
            let baz = false;
            class C {
                static get foo() {
                    return 1;
                }
                static set bar(b: boolean) {
                    baz = b;
                }
            }
            C.bar = true;
            expect(C).to.have.a.property("foo", 1);
            expect(baz).to.be.true;
        }),
        probe("computed static accessor properties", () => {
            const key1 = "foo";
            const key2 = "bar";
            let baz = false;
            class C {
                static get [key1]() {
                    return 1;
                }
                static set [key2](b: boolean) {
                    baz = b;
                }
            }
            C.bar = true;
            expect(C).to.have.a.property("foo", 1);
            expect(baz).to.be.true;
        }),
        probe("class name is lexically scoped", () => {
            class C {
                method() {
                    return typeof C;
                }
            }
            const m = C.prototype.method;
            eval(`C = undefined`);
            expect(C).to.be.undefined;
            expect(m()).to.equal("function");
        }),
        probe("computed names, temporal dead zone", () => {
            function f() {
                eval(`
                    class C {
                        [C]() {}
                    }
                `);
            }
            expect(f).to.throw(ReferenceError);
        }),
        probe("methods aren't enumerable", () => {
            class C {
                foo() {}
                static bar() {}
            }
            expect(C.prototype).to.have.ownPropertyDescriptor("foo").that.has.a.property("enumerable", false);
            expect(C).to.have.ownPropertyDescriptor("bar").that.has.a.property("enumerable", false);
        }),
        probe("implicit strict mode", () => {
            class C {
                static method() {
                    return this;
                }
            }
            expect(C.method.call(null)).to.be.null;
        }),
        probe("constructors require new", () => {
            // @ts-ignore: `C' won't be visibly read.
            class C {}
            function f() {
                return eval(`C()`);
            }
            expect(f).to.throw(TypeError);
        }),
        probe("extends", () => {
            class Base {}
            class Inherited extends Base {}
            expect(new Inherited()).to.be.an.instanceof(Base);
            expect(Base).to.be.a.prototypeOf(Inherited);
        }),
        probe("extends expressions", () => {
            let Base;
            class Inherited extends (Base = class {}) {}
            expect(new Inherited()).to.be.an.instanceof(Base);
            expect(Base).to.be.a.prototypeOf(Inherited);
        }),
        probe("extends null", () => {
            class C extends null {}
            expect(C).to.be.a("function");
            expect(Object.getPrototypeOf(C.prototype)).to.be.null;
        }),
        probe("new.target", () => {
            function f() {
                expect(new.target).to.equal(f);
            }
            new (f as any)();

            class Base {
                constructor() {
                    expect(new.target).to.equal(Inherited);
                }
            }
            class Inherited extends Base {}
            new Inherited();
        })
    ]),
    group("super", [
        probe("statement in constructors", () => {
            class Base {
                constructor(a: string) {
                    expect(a).to.equal("foobar");
                }
            }
            class Inherited extends Base {
                constructor(a: string) {
                    super("foo" + a);
                }
            }
            new Inherited("bar");
        }),
        probe("expression in constructors", () => {
            class Base {
                constructor(a: string) {
                    return ["foo" + a];
                }
            }
            class Inherited extends Base {
                constructor(a: string) {
                    return super("bar" + a) as any;
                }
            }
            expect(new Inherited("baz")).to.deeply.equal(["foobarbaz"]);
        }),
        probe("in methods, property access", () => {
            class Base {}
            eval(`
                Base.prototype.foo = "foo";
                Base.prototype.baz = "baz";
            `);
            class Inherited extends Base {
                // @ts-ignore: `a' isn't used visibly to tsc.
                method(a: string) {
                    return eval(`super.foo + a + super["baz"]`);
                }
            }
            eval(`
                Inherited.prototype.foo = "FOO";
            `);
            expect(new Inherited().method("bar")).to.equal("foobarbaz");
        }),
        probe("in methods, method calls", () => {
            class Base {
                method(a: string) {
                    return "foo" + a;
                }
            }
            class Inherited extends Base {
                override method(a: string) {
                    return super.method("bar" + a);
                }
            }
            expect(new Inherited().method("baz")).to.equal("foobarbaz");
        }),
        probe("method calls use correct `this' binding", () => {
            class Base {
                // @ts-ignore: `a' isn't used visibly to tsc.
                method(a: string) {
                    return eval(`this.foo + a`);
                }
            }
            class Inherited extends Base {
                override method(a: string) {
                    return super.method("bar" + a);
                }
            }
            const obj = new Inherited();
            eval(`
                obj.foo = "foo";
            `);
            expect(obj.method("baz")).to.equal("foobarbaz");
        }),
        probe("constructor calls use correct `new.target' binding", () => {
            class Base {
                constructor() {
                    expect(new.target).to.equal(Inherited);
                }
            }
            class Inherited extends Base {
                constructor() {
                    super();
                }
            }
            new Inherited();
        }),
        probe("is lexically bound", () => {
            class Base {
                method() {
                    return "foo";
                }
            }
            class Inherited extends Base {
                override method() {
                    return eval(`super.method() + this.bar`);
                }
            }
            const obj = {
                method: Inherited.prototype.method,
                bar: "bar"
            };
            expect(obj.method()).to.equal("foobar");
        }),
        probe("super() invokes the correct constructor", () => {
            // Checks that super() is *not* a synonym of super.constructor().
            let passed;
            class Base {
                constructor() {
                    passed = true;
                }
            }
            eval(`
                Base.prototype.constructor = function () {
                    passed = false;
                };
            `);
            class Inherited extends Base {}
            new Inherited;
            expect(passed).to.be.true;
        })
    ]),
    group("generators", [
        probe("basic functionality", () => {
            function* g() {
                yield 1; yield 2;
            }
            const it = g();
            expect(it.next()).to.be.an("object").that.includes({value: 1        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: 2        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: undefined, done: true });
        }),
        probe("generator function expressions", () => {
            const g = function* () {
                yield 1; yield 2;
            }
            const it = g();
            expect(it.next()).to.be.an("object").that.includes({value: 1        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: 2        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: undefined, done: true });
        }),
        probe("correct `this' binding", () => {
            const g = eval(`
                function* g() {
                    yield this.x;
                    yield this.y;
                }
                g
            `);
            const it = {g, x: 1, y: 2}.g();
            expect(it.next()).to.be.an("object").that.includes({value: 1        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: 2        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: undefined, done: true });
        }),
        probe("can't use `this' with `new'", () => {
            const g = eval(`
                function* g() {
                    yield this.x;
                    yield this.y;
                }
                g
            `);
            function f() {
                return new g().next();
            }
            expect(f).to.throw(TypeError);
        }),
        probe("sending", () => {
            let sent;
            function* g(): Generator<number, void, string> {
                sent = [yield 1, yield 2];
            }
            const it = g();
            expect(it.next())     .to.be.an("object").that.includes({value: 1        , done: false});
            expect(it.next("foo")).to.be.an("object").that.includes({value: 2        , done: false});
            expect(it.next("bar")).to.be.an("object").that.includes({value: undefined, done: true });
            expect(sent).to.be.deeply.equal(["foo", "bar"]);
        }),
        probe("%GeneratorPrototype%", () => {
            function* g() {}

            const ownProto = Object.getPrototypeOf(g());
            expect(ownProto).to.equal(g.prototype);

            const sharedProto = Object.getPrototypeOf(ownProto);
            expect(sharedProto).to.not.equal(Object.prototype);
            expect(sharedProto).to.equal(Object.getPrototypeOf(function* () {}.prototype));
            expect(sharedProto).to.have.own.property("next");
        }),
        probe("%GeneratorPrototype% prototype chain", () => {
            function* g() {}

            const it          = g();
            const ownProto    = Object.getPrototypeOf(it);
            const sharedProto = Object.getPrototypeOf(ownProto);
            const iterProto   = Object.getPrototypeOf(sharedProto);
            expect(iterProto  ).to    .have.own.property(Symbol.iterator);
            expect(sharedProto).to.not.have.own.property(Symbol.iterator);
            expect(ownProto   ).to.not.have.own.property(Symbol.iterator);
            expect(it[Symbol.iterator]()).to.equal(it);
        }),
        probe("%GeneratorPrototype%.constructor", () => {
            function* g() {}

            const h  = eval(`new g.constructor("a", "b", "c", "yield a; yield b; yield c")`);
            const it = h(1, 2, 3);
            expect(it.next()).to.be.an("object").that.includes({value: 1        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: 2        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: 3        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: undefined, done: true });
            expect(g.constructor).to.equal(function* () {}.constructor);
        }),
        probe("%GeneratorPrototype%.throw", () => {
            let threw = false;
            function* g() {
                try {
                    yield 1;
                }
                catch (e) {
                    threw = true;
                    expect(e).to.equal("foo");
                }
            }

            const it = g();
            it.next();
            it.throw("foo");
            expect(threw).to.be.true;
        }),
        probe("%GeneratorPrototype%.return", () => {
            function* g() {
                yield 1;
                yield 2;
                return -666;
            }

            const it = g();
            expect(it.next()     ).to.be.an("object").that.includes({value: 1        , done: false});
            expect(it.return(666)).to.be.an("object").that.includes({value: 666      , done: true });
            expect(it.next()     ).to.be.an("object").that.includes({value: undefined, done: true });
        }),
        probe("yield operator precedence", () => {
            let passed = false;
            function* g(): Generator<boolean, void, boolean> {
                passed = yield 0 ? true : false; // Interpreted as yield (0 ? true : false).
            }

            const it = g();
            it.next();
            it.next(true);
            expect(passed).to.be.true;
        }),
        probe("yield*, arrays", () => {
            function* g() {
                yield* [1, 2];
            }
            const it = g();
            expect(it.next()).to.be.an("object").that.includes({value: 1        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: 2        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: undefined, done: true });
        }),
        probe("yield*, sparse arrays", () => {
            function* g() {
                yield* [,,];
            }
            const it = g();
            expect(it.next()).to.be.an("object").that.includes({value: undefined, done: false});
            expect(it.next()).to.be.an("object").that.includes({value: undefined, done: false});
            expect(it.next()).to.be.an("object").that.includes({value: undefined, done: true });
        }),
        probe("yield*, strings", () => {
            function* g() {
                yield* "ab";
            }
            const it = g();
            expect(it.next()).to.be.an("object").that.includes({value: "a"      , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: "b"      , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: undefined, done: true });
        }),
        probe("yield*, astral plane strings", () => {
            function* g() {
                yield* "𠮷𠮶";
            }
            const it = g();
            expect(it.next()).to.be.an("object").that.includes({value: "𠮷"     , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: "𠮶"     , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: undefined, done: true });
        }),
        probe("yield*, generator instances", () => {
            function* g() {
                yield* h();
            }
            function* h() {
                yield 1;
                yield 2;
            }
            const it = g();
            expect(it.next()).to.be.an("object").that.includes({value: 1        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: 2        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: undefined, done: true });
        }),
        probe("yield*, generic iterables", () => {
            function* g() {
                yield* createIterableObject([1, 2]);
            }
            const it = g();
            expect(it.next()).to.be.an("object").that.includes({value: 1        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: 2        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: undefined, done: true });
        }),
        probe("yield*, instances of iterables", () => {
            function* g() {
                yield* Object.create(createIterableObject([1, 2]));
            }
            const it = g();
            expect(it.next()).to.be.an("object").that.includes({value: 1        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: 2        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: undefined, done: true });
        }),
        probe("yield* on non-iterables is a runtime error", () => {
            const g = eval(`
                function* g() {
                    yield* 1;
                }
                g
            `);
            function f() {
                const it = g();
                it.next();
            }
            expect(f).to.throw(TypeError);
        }),
        probe("yield*, iterator closing", () => {
            const closed: string[] = [];
            const iterable = createIterableObject([1, 2], {
                return() {
                    closed.push("return");
                    return {done: true};
                }
            });
            function* g() {
                try {
                    yield* iterable;
                }
                finally {
                    closed.push("finally");
                }
            }
            const it = g();
            it.next();
            it.return();
            expect(closed).to.deeply.equal(["return", "finally"]);
        }),
        probe("yield*, iterator closing via throw()", () => {
            let closed = false;
            const iterable = createIterableObject([1, 2], {
                return() {
                    closed = true;
                    return {done: true};
                }
            });
            function* g() {
                try {
                    yield* iterable;
                }
                catch (e) {}
            }
            const it = g();
            it.next();
            it.throw("foo");
            expect(closed).to.be.true;
        }),
        probe("shorthand generator methods", () => {
            const obj = {
                * method() {
                    yield 1;
                    yield 2;
                }
            };
            const it = obj.method();
            expect(it.next()).to.be.an("object").that.includes({value: 1        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: 2        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: undefined, done: true });
        }),
        probe("string-keyed shorthand generator methods", () => {
            const obj = {
                * "foo bar"() {
                    yield 1;
                    yield 2;
                }
            };
            const it = obj["foo bar"]();
            expect(it.next()).to.be.an("object").that.includes({value: 1        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: 2        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: undefined, done: true });
        }),
        probe("computed shorthand generators", () => {
            const key = "method";
            const obj = {
                * [key]() {
                    yield 1;
                    yield 2;
                }
            };
            const it = obj.method();
            expect(it.next()).to.be.an("object").that.includes({value: 1        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: 2        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: undefined, done: true });
        }),
        probe("shorthand generator methods, classes", () => {
            class C {
                * method() {
                    yield 1;
                    yield 2;
                }
            }
            const it = new C().method();
            expect(it.next()).to.be.an("object").that.includes({value: 1        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: 2        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: undefined, done: true });
        }),
        probe("computed shorthand generators, classes", () => {
            const key = "method";
            class C {
                * [key]() {
                    yield 1;
                    yield 2;
                }
            }
            const it = new C().method();
            expect(it.next()).to.be.an("object").that.includes({value: 1        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: 2        , done: false});
            expect(it.next()).to.be.an("object").that.includes({value: undefined, done: true });
        }),
        probe("shorthand generators can't be constructors", () => {
            function f() {
                eval(`
                    class C {
                        * constructor() {}
                    }
                `);
            }
            expect(f).to.throw(SyntaxError);
        })
    ])
]);

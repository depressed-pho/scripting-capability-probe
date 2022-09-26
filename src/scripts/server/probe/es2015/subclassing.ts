import { group, probe, expect } from "../../probing-toolkit";

export default group("Subclassing", [
    group("Array is subclassable", [
        probe("length property (getting)", () => {
            class A extends Array {}
            const a = new A();
            expect(a).to.have.lengthOf(0);
            a[2] = "foo";
            expect(a).to.have.lengthOf(3);
        }),
        probe("length property (setting)", () => {
            class A extends Array {}
            const a = new A();
            a[2] = "foo";
            a.length = 1;
            expect(a).to.have.lengthOf(1);
            expect(a).to.not.have.a.property(2);
        }),
        probe("correct prototype chain", () => {
            class A extends Array {}
            const a = new A();
            expect(a).to.be.an.instanceOf(A);
            expect(a).to.be.an.instanceOf(Array);
            expect(Object.getPrototypeOf(A)).to.equal(Array);
        }),
        probe("Array.isArray support", () => {
            class A extends Array {}
            expect(Array.isArray(new A())).to.be.true;
        }),
        probe("Array.prototype.concat", () => {
            class A extends Array {}
            const a = new A();
            expect(a.concat(1)).to.be.an.instanceOf(A);
        }),
        probe("Array.prototype.filter", () => {
            class A extends Array {}
            const a = new A();
            expect(a.filter(Boolean)).to.be.an.instanceOf(A);
        }),
        probe("Array.prototype.map", () => {
            class A extends Array {}
            const a = new A();
            expect(a.map(Boolean)).to.be.an.instanceOf(A);
        }),
        probe("Array.prototype.slice", () => {
            class A extends Array {}
            const a = new A();
            a.push(2, 4, 6);
            expect(a.slice(1, 2)).to.be.an.instanceOf(A);
        }),
        probe("Array.prototype.splice", () => {
            class A extends Array {}
            const a = new A();
            a.push(2, 4, 6);
            expect(a.splice(1, 2)).to.be.an.instanceOf(A);
        }),
        probe("Array.from", () => {
            class A extends Array {}
            expect(A.from({length: 0})).to.be.an.instanceOf(A);
        }),
        probe("Array.of", () => {
            class A extends Array {}
            expect(A.of(0)).to.be.an.instanceOf(A);
        })
    ]),
    group("RegExp is subclassable", [
        probe("basic functinality", () => {
            class R extends RegExp {}
            const r = new R("foo", "g");
            expect(r).to.have.a.property("global", true);
            expect(r).to.have.a.property("source", "foo");
        }),
        probe("correct prototype chain", () => {
            class R extends RegExp {}
            const r = new R("foo", "g");
            expect(r).to.be.an.instanceOf(R);
            expect(r).to.be.an.instanceOf(RegExp);
            expect(Object.getPrototypeOf(R)).to.equal(RegExp);
        }),
        probe("RegExp.prototype.exec", () => {
            class R extends RegExp {}
            const r = new R("baz", "g");
            expect(r.exec("foobarbaz")).to.have.a.property(0, "baz");
            expect(r).to.have.a.property("lastIndex", 9);
        }),
        probe("RegExp.prototype.test", () => {
            class R extends RegExp {}
            const r = new R("baz");
            expect(r.test("foobarbaz")).to.be.true;
        })
    ]),
    group("Function is subclassable", [
        probe("can be called", () => {
            class F extends Function {}
            const f = new F("return 666");
            expect(f()).to.equal(666);
        }),
        probe("correct prototype chain", () => {
            class F extends Function {}
            const f = new F("return 666");
            expect(f).to.be.an.instanceOf(F);
            expect(f).to.be.an.instanceOf(Function);
            expect(Object.getPrototypeOf(F)).to.equal(Function);
        }),
        probe("can be used with `new'", () => {
            class F extends Function {}
            const f = new F("this.foo = 666") as any;
            f.prototype.bar = 333;
            expect(new f()).to.have.a.property("foo", 666);
            expect(new f()).to.have.a.property("bar", 333);
        }),
        probe("Function.prototype.call", () => {
            class F extends Function {}
            const f = new F("x", "return this.foo + x");
            expect(f.call({foo: 1}, 2)).to.equal(3);
        }),
        probe("Function.prototype.apply", () => {
            class F extends Function {}
            const f = new F("x", "return this.foo + x");
            expect(f.apply({foo: 1}, [2])).to.equal(3);
        }),
        probe("Function.prototype.bind", () => {
            class F extends Function {}
            const f = new F("x", "y", "return this.foo + x + y").bind({foo: 1}, 2);
            expect(f(6)).to.equal(9);
            expect(f).to.be.an.instanceOf(F);
        })
    ]),
    group("Promise is subclassable", [
        probe("basic functionality", async () => {
            class P<T> extends Promise<T> {}
            const p1 = new P((resolve) => { resolve("foo") });
            const p2 = new P((_, reject) => { reject("bar") });
            expect(p1).to.be.an.instanceOf(P);

            function thenFn (res: any) { expect(res).to.equal("foo") }
            function catchFn(res: any) { expect(res).to.equal("bar") }
            function shouldNotRun() { expect.fail() }

            await p1.then(thenFn, shouldNotRun);
            await p2.then(shouldNotRun, catchFn);
            await p1.catch(shouldNotRun);
            await p2.catch(catchFn);

            await p1.then(() => {
                // P.prototype.then() should return a new P.
                expect(p1.then()).to.be.an.instanceOf(P);
                expect(p1.then()).to.not.equal(p1);
            });
        }),
        probe("correct prototype chain", () => {
            class P<T> extends Promise<T> {}
            const p = new P((resolve) => { resolve("foo") });
            expect(p).to.be.an.instanceOf(P);
            expect(p).to.be.an.instanceOf(Promise);
            expect(Object.getPrototypeOf(P)).to.equal(Promise);
        }),
        probe("Promise.all", async () => {
            class P<T> extends Promise<T> {}
            const fulfills = P.all([
                new Promise((resolve) => resolve("foo")),
                new Promise((resolve) => resolve("bar"))
            ]);
            const rejects = P.all([
                new Promise((_, reject) => reject("baz")),
                new Promise((_, reject) => reject("qux"))
            ]);
            expect(fulfills).to.be.an.instanceOf(P);
            expect(await fulfills).to.have.members(["foo", "bar"]);
            expect(await rejects.catch(x => x)).to.satisfy((str: string) => {
                return str === "baz" || str === "qux";
            });
        }),
        probe("Promise.race", async () => {
            class P<T> extends Promise<T> {}
            const fulfills = P.race([
                new Promise((resolve) => resolve("foo")),
                new Promise((resolve) => resolve("bar"))
            ]);
            const rejects = P.race([
                new Promise((_, reject) => reject("baz")),
                new Promise((_, reject) => reject("qux"))
            ]);
            expect(fulfills).to.be.an.instanceOf(P);
            expect(await fulfills).to.satisfy((str: string) => {
                return str === "foo" || str === "bar";
            });
            expect(await rejects.catch(x => x)).to.satisfy((str: string) => {
                return str === "baz" || str === "qux";
            });
        })
    ]),
    group("miscellaneous subclassables", [
        probe("Boolean is subclassable", () => {
            class B extends Boolean {}
            const b = new B(true);
            expect(b).to.be.an.instanceOf(B);
            expect(b).to.be.an.instanceOf(Boolean);
            expect(b).to.satisfy(x => x == true);
        }),
        probe("Number is subclassable", () => {
            class N extends Number {}
            const n = new N(6);
            expect(n).to.be.an.instanceOf(N);
            expect(n).to.be.an.instanceOf(Number);
            expect(n).to.satisfy(x => x == 6);
        }),
        probe("String is subclassable", () => {
            class S extends String {}
            const s = new S("foo");
            expect(s).to.be.an.instanceOf(S);
            expect(s).to.be.an.instanceOf(String);
            expect(s).to.satisfy(x => x == "foo");
            expect(s).to.have.a.property(0, "f");
            expect(s).to.have.lengthOf(3);
        }),
        probe("Error is subclassable", () => {
            class E extends Error {}
            const e = new E();
            expect(e).to.be.an.instanceOf(E);
            expect(e).to.be.an.instanceOf(Error);
            expect(Object.prototype.toString.call(e)).to.equal("[object Error]");
        }),
        probe("Map is subclassable", () => {
            class M extends Map {}
            const m = new M();
            const k = {};
            m.set(k, 123);
            expect(m).to.be.an.instanceOf(M);
            expect(m).to.be.an.instanceOf(Map);
            expect(m.has(k)).to.be.true;
            expect(m.get(k)).to.equal(123);
        }),
        probe("Set is subclassable", () => {
            class S extends Set {}
            const s = new S();
            s.add(123);
            s.add(123);
            expect(s).to.be.an.instanceOf(S);
            expect(s).to.be.an.instanceOf(Set);
            expect(s.has(123)).to.be.true;
        })
    ])
]);

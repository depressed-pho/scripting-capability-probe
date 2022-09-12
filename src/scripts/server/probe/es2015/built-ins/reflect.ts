import { group, probe, expect } from "../../../probing-toolkit";

export default group("Reflect", [
    probe("Reflect.get", () => {
        const obj = {foo: 123};
        expect(Reflect.get(obj, "foo")).to.equal(123);
    }),
    probe("Reflect.set", () => {
        const obj = {};
        Reflect.set(obj, "foo", 123);
        expect(obj).to.have.a.property("foo", 123);
    }),
    probe("Reflect.has", () => {
        const obj = {foo: 123};
        expect(Reflect.has(obj, "foo")).to.be.true;
        expect(Reflect.has(obj, "bar")).to.be.false;
    }),
    probe("Reflect.deleteProperty", () => {
        const obj = {foo: 123};
        Reflect.deleteProperty(obj, "foo");
        expect(obj).to.not.have.a.property("foo");
    }),
    probe("Reflect.getOwnPropertyDescriptor", () => {
        const obj  = {foo: 123};
        const desc = Reflect.getOwnPropertyDescriptor(obj, "foo");
        expect(desc).to.deeply.equal({
            value:        123,
            configurable: true,
            writable:     true,
            enumerable:   true
        });
    }),
    probe("Reflect.defineProperty", () => {
        const obj1 = {};
        Reflect.defineProperty(obj1, "foo", {value: 123});
        expect(obj1).to.have.a.property("foo", 123);

        const obj2 = Object.freeze({});
        const succeeded = Reflect.defineProperty(obj2, "foo", {value: 123});
        expect(succeeded).to.be.false;
    }),
    probe("Reflect.getPrototypeOf", () => {
        const proto = Reflect.getPrototypeOf([]);
        expect(proto).to.equal(Array.prototype);
    }),
    probe("Reflect.setPrototypeOf", () => {
        const obj = {};
        Reflect.setPrototypeOf(obj, Array.prototype);
        expect(obj).to.be.an.instanceOf(Array);
    }),
    probe("Reflect.isExtensible", () => {
        expect(Reflect.isExtensible({})).to.be.true;
        expect(Reflect.isExtensible(Object.preventExtensions({}))).to.be.false;
    }),
    probe("Reflect.preventExtensions", () => {
        const obj = {};
        Reflect.preventExtensions(obj);
        expect(obj).not.to.be.extensible;
    }),
    probe("`Reflect.ownKeys', string keys", () => {
        const obj = Object.create({C: true});
        obj.A = true;
        Object.defineProperty(obj, "B", {value: true, enumerable: false});

        expect(Reflect.ownKeys(obj)).to.have.members(["A", "B"]);
    }),
    probe("`Reflect.ownKeys', symbol keys", () => {
        const s1    = Symbol();
        const s2    = Symbol();
        const s3    = Symbol();
        const proto = {[s1]: true};
        const obj   = Object.create(proto);
        obj[s2] = true;
        Object.defineProperty(obj, s3, {value: true, enumerable: false});

        expect(Reflect.ownKeys(obj)).to.have.members([s2, s3]);
    }),
    probe("Reflect.apply", () => {
        expect(Reflect.apply(Array.prototype.push, [1, 2], [3, 4, 5])).to.equal(5);
    }),
    probe("Reflect.construct", () => {
        function f(this: any, a: string, b: string) {
            this.val = a + b;
        }
        expect(Reflect.construct(f, ["foo", "bar"])).to.have.a.property("val", "foobar");
    }),
    probe("`Reflect.construct' sets `new.target' meta-property", () => {
        let passed = false;
        function f() {
            expect(new.target).to.equal(Object);
            passed = true;
        }
        Reflect.construct(f, [], Object);
        expect(passed).to.be.true;
    }),
    probe("`Reflect.construct' creates instances from third argument", () => {
        function F() {}
        function f(this: any, a: number) {
            this.field = a;
        }
        const obj = Reflect.construct(f, [666], F);
        expect(obj).to.have.a.property("field", 666);
        expect(obj).to.be.an.instanceOf(F);
    }),
    probe("`Reflect.construct', Array subclassing", () => {
        function F() {}
        const obj = Reflect.construct(Array, [], F);
        obj[2] = 'foo';
        expect(obj).to.have.lengthOf(3);
        expect(obj).to.be.an.instanceOf(F);
    }),
    probe("`Reflect.construct', RegExp subclassing", () => {
        function F() {}
        const obj = Reflect.construct(RegExp, ["baz", "g"], F);
        expect(RegExp.prototype.exec.call(obj, "foobarbaz")).to.have.a.property(0, "baz");
        expect(obj).to.have.a.property("lastIndex", 9);
        expect(obj).to.be.an.instanceOf(F);
    }),
    probe("`Reflect.construct', Function subclassing", () => {
        function F() {}
        const obj = Reflect.construct(Function, ["return 2"], F);
        expect(obj()).to.equal(2);
        expect(obj).to.be.an.instanceOf(F);
    }),
    probe("`Reflect.construct', Promise subclassing", async () => {
        function F() {}
        const p1 = Reflect.construct(Promise, [(resolve: any      ) => resolve("foo")], F);
        const p2 = Reflect.construct(Promise, [(_: any, reject: any) => reject("bar")], F);
        expect(p1).to.be.an.instanceOf(F);
        expect(p2).to.be.an.instanceOf(F);

        p1.then = p2.then = Promise.prototype.then;
        p1.catch = p2.catch = Promise.prototype.catch;

        function thenFn (res: any) { expect(res).to.equal("foo") }
        function catchFn(res: any) { expect(res).to.equal("bar") }
        function shouldNotRun() { expect.fail() }

        await p1.then(thenFn, shouldNotRun);
        await p2.then(shouldNotRun, catchFn);
        await p1.catch(shouldNotRun);
        await p2.catch(catchFn);
    }),
]);

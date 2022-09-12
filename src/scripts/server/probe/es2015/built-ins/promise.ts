import { group, probe, expect } from "../../../probing-toolkit";
import { createIterableObject } from "../../_utils";

export default group("Promise", [
    probe("basic functionality", async () => {
        const p1 = new Promise((resolve ) => resolve("foo"));
        const p2 = new Promise((_, reject) => reject("bar"));

        function thenFn (res: any) { expect(res).to.equal("foo") }
        function catchFn(res: any) { expect(res).to.equal("bar") }
        function shouldNotRun() { expect.fail() }

        await p1.then(thenFn, shouldNotRun);
        await p2.then(shouldNotRun, catchFn);
        await p1.catch(shouldNotRun);
        await p2.catch(catchFn);

        await p1.then(() => {
            // Promise.prototype.then() should return a new Promise.
            expect(p1.then()).to.not.equal(p1);
        });
    }),
    probe("constructor requires `new'", () => {
        function f() {
            return eval(`Promise(() => {})`);
        }
        expect(f).to.throw(TypeError);
    }),
    probe("`Promise.prototype' isn't an instance", () => {
        function f() {
            Promise.prototype.then(() => {});
        }
        expect(f).to.throw(TypeError);
    }),
    probe("Promise.all", async () => {
        const fulfills = Promise.all([
            new Promise((resolve) => resolve("foo")),
            new Promise((resolve) => resolve("bar"))
        ]);
        const rejects = Promise.all([
            new Promise((_, reject) => reject("baz")),
            new Promise((_, reject) => reject("qux"))
        ]);
        expect(await fulfills).to.have.members(["foo", "bar"]);
        expect(await rejects.catch(x => x)).to.satisfy((str: string) => {
            return str === "baz" || str === "qux";
        });
    }),
    probe("`Promise.all', generic iterables", async () => {
        const fulfills = Promise.all(createIterableObject([
            new Promise((resolve) => resolve("foo")),
            new Promise((resolve) => resolve("bar"))
        ]));
        const rejects = Promise.all(createIterableObject([
            new Promise((_, reject) => reject("baz")),
            new Promise((_, reject) => reject("qux"))
        ]));
        expect(await fulfills).to.have.members(["foo", "bar"]);
        expect(await rejects.catch(x => x)).to.satisfy((str: string) => {
            return str === "baz" || str === "qux";
        });
    }),
    probe("Promise.race", async () => {
        const fulfills = Promise.race([
            new Promise((resolve) => resolve("foo")),
            new Promise((resolve) => resolve("bar"))
        ]);
        const rejects = Promise.race([
            new Promise((_, reject) => reject("baz")),
            new Promise((_, reject) => reject("qux"))
        ]);
        expect(await fulfills).to.satisfy((str: string) => {
            return str === "foo" || str === "bar";
        });
        expect(await rejects.catch(x => x)).to.satisfy((str: string) => {
            return str === "baz" || str === "qux";
        });
    }),
    probe("`Promise.race', generic iterables", async () => {
        const fulfills = Promise.race(createIterableObject([
            new Promise((resolve) => resolve("foo")),
            new Promise((resolve) => resolve("bar"))
        ]));
        const rejects = Promise.race(createIterableObject([
            new Promise((_, reject) => reject("baz")),
            new Promise((_, reject) => reject("qux"))
        ]));
        expect(await fulfills).to.satisfy((str: string) => {
            return str === "foo" || str === "bar";
        });
        expect(await rejects.catch(x => x)).to.satisfy((str: string) => {
            return str === "baz" || str === "qux";
        });
    }),
    probe("Promise[@@species]", () => {
        expect(Promise).to.have.ownPropertyDescriptor(Symbol.species).that.has.a.property("get");
        expect(Promise).to.have.a.property(Symbol.species).that.equals(Promise);
    })
]);

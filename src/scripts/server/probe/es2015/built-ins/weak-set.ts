import { group, probe, expect } from "../../../probing-toolkit";
import { createIterableObject, withObjectMethodChanged } from "../../_utils";

export default group("WeakSet", [
    probe("basic functionality", () => {
        const elem = {};
        const set  = new WeakSet();
        set.add(elem);
        set.add(elem);
        expect(set.has(elem)).to.be.true;
    }),
    probe("constructor arguments", () => {
        const e1  = {};
        const e2  = {};
        const set = new WeakSet([e1, e2]);

        expect(set.has(e1)).to.be.true;
        expect(set.has(e2)).to.be.true;
    }),
    probe("constructor requires `new'", () => {
        function f() {
            return eval(`WeakSet()`);
        }
        expect(f).to.throw(TypeError);
    }),
    probe("constructor accepts null", () => {
        function f() {
            return new WeakSet(null);
        }
        expect(f).to.not.throw();
    }),
    probe("constructor invokes `add'", () => {
        let passed = false;
        withObjectMethodChanged(
            WeakSet, "add",
            () => {
                passed = true;
            },
            () => {
                new WeakSet([{}]);
            });
        expect(passed).to.be.true;
    }),
    probe("constructor closes iterator", () => {
        let closed = false;
        const iter = createIterableObject([1], {
            return() {
                closed = true;
                return {};
            }
        });
        try {
            new WeakSet(iter as any);
        }
        catch (e) {}
        expect(closed).to.be.true;
    }),
    probe("WeakSet.prototype.add returns `this'", () => {
        const set = new WeakSet();
        expect(set.add({})).to.equal(set);
    }),
    probe("WeakSet.prototype.delete", () => {
        expect(WeakSet).to.respondTo("delete");
    }),
    probe("No WeakSet.prototype.clear", () => {
        expect(WeakSet).not.to.respondTo("clear");
    }),
    probe("`has' and `delete' accepts primitives", () => {
        const set = new WeakSet();
        expect(set.has(1 as any)).to.be.false;
        expect(set.delete(1 as any)).to.be.false;
    }),
    probe("WeakSet.prototype isn't an instance", () => {
        function f() {
            return WeakSet.prototype.has({});
        }
        expect(f).to.throw(TypeError);
    })
]);

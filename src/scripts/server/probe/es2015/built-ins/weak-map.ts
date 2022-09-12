import { group, probe, expect } from "../../../probing-toolkit";
import { createIterableObject, withObjectMethodChanged } from "../../_utils";

export default group("WeakMap", [
    probe("basic functionality", () => {
        const key = {};
        const map = new WeakMap();

        map.set(key, 123);
        expect(map.has(key)).to.be.true;
        expect(map.get(key)).to.equal(123);
    }),
    probe("constructor arguments", () => {
        const k1  = {};
        const k2  = {};
        const map = new WeakMap([[k1, 123], [k2, 456]]);

        expect(map.has(k1)).to.be.true;
        expect(map.get(k1)).to.equal(123);
        expect(map.has(k2)).to.be.true;
        expect(map.get(k2)).to.equal(456);
    }),
    probe("constructor requires `new'", () => {
        function f() {
            return eval(`WeakMap()`);
        }
        expect(f).to.throw(TypeError);
    }),
    probe("constructor accepts null", () => {
        function f() {
            return new WeakMap(null);
        }
        expect(f).to.not.throw();
    }),
    probe("constructor invokes `set'", () => {
        let passed = false;
        withObjectMethodChanged(
            WeakMap, "set",
            () => {
                passed = true;
            },
            () => {
                new WeakMap([[{}, 2]]);
            });
        expect(passed).to.be.true;
    }),
    probe("frozen objects as keys", () => {
        const k = Object.freeze({});
        const m = new WeakMap();
        m.set(k, 42);
        expect(m.get(k)).to.equal(42);
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
            new WeakMap(iter as any);
        }
        catch (e) {}
        expect(closed).to.be.true;
    }),
    probe("WeakMap.prototype.set returns `this'", () => {
        const map = new WeakMap();
        expect(map.set({}, 0)).to.equal(map);
    }),
    probe("WeakMap.prototype.delete", () => {
        expect(WeakMap).to.respondTo("delete");
    }),
    probe("No WeakMap.prototype.clear", () => {
        expect(WeakMap).not.to.respondTo("clear");
    }),
    probe("`has', `get', and `delete' accepts primitives", () => {
        const map = new WeakMap();
        expect(map.has(1 as any)).to.be.false;
        expect(map.get(1 as any)).to.be.undefined;
        expect(map.delete(1 as any)).to.be.false;
    }),
    probe("WeakMap.prototype isn't an instance", () => {
        function f() {
            return WeakMap.prototype.has({});
        }
        expect(f).to.throw(TypeError);
    })
]);

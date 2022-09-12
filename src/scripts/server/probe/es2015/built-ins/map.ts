import { group, probe, expect } from "../../../probing-toolkit";
import { createIterableObject, withObjectMethodChanged } from "../../_utils";

const mapMethods = [
    "delete",
    "clear",
    "forEach",
    "keys",
    "values",
    "entries"
];

export default group("Map", [
    probe("basic functionality", () => {
        const key = {};
        const map = new Map();

        map.set(key, 123);
        expect(map.has(key)).to.be.true;
        expect(map.get(key)).to.equal(123);
    }),
    probe("constructor arguments", () => {
        const k1  = {};
        const k2  = {};
        const map = new Map([[k1, 123], [k2, 456]]);

        expect(map.has(k1)).to.be.true;
        expect(map.get(k1)).to.equal(123);
        expect(map.has(k2)).to.be.true;
        expect(map.get(k2)).to.equal(456);
    }),
    probe("constructor requires `new'", () => {
        function f() {
            return eval(`Map()`);
        }
        expect(f).to.throw(TypeError);
    }),
    probe("constructor accepts null", () => {
        function f() {
            return new Map(null);
        }
        expect(f).to.not.throw();
    }),
    probe("constructor invokes `set'", () => {
        let passed = false;
        withObjectMethodChanged(
            Map, "set",
            () => {
                passed = true;
            },
            () => {
                new Map([[1, 2]]);
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
            new Map(iter as any);
        }
        catch (e) {}
        expect(closed).to.be.true;
    }),
    probe("Map.prototype.set returns `this'", () => {
        const map = new Map();
        expect(map.set(0, 0)).to.equal(map);
    }),
    probe("-0 key converts to +0", () => {
        const map = new Map();
        map.set(-0, "foo");

        let k;
        map.forEach((_value, key) => {
            k = 1 / key;
        });

        expect(k).to.equal(Infinity);
        expect(map.get(+0)).to.equal("foo");
    }),
    probe("Map.prototype.size", () => {
        const map = new Map();
        map.set({}, 123);
        expect(map).to.have.a.property("size", 1);
    }),
    ...(mapMethods.map(method => {
        return probe("Map.prototype." + method, () => {
            expect(Map).to.respondTo(method);
        });
    })),
    probe("Map.prototype[@@iterator]", () => {
        expect(Map).to.respondTo(Symbol.iterator);
    }),
    probe("Map.prototype isn't an instance", () => {
        function f() {
            return Map.prototype.has({});
        }
        expect(f).to.throw(TypeError);
    }),
    probe("Map iterator prototype chain", () => {
        // Iterator instance
        const iter   = new Map()[Symbol.iterator]();
        // %MapIteratorPrototype%
        const proto1 = Object.getPrototypeOf(iter);
        // %IteratorPrototype%
        const proto2 = Object.getPrototypeOf(proto1);

        expect(proto2).to.have.own.property(Symbol.iterator);
        expect(proto1).to.not.have.own.property(Symbol.iterator);
        expect(iter).to.not.have.own.property(Symbol.iterator);
        expect(iter[Symbol.iterator]()).to.equal(iter);
    }),
    probe("Map[@@species]", () => {
        expect(Map).to.have.ownPropertyDescriptor(Symbol.species).that.has.a.property("get");
        expect(Map).to.have.a.property(Symbol.species).that.equals(Map);
    })
]);

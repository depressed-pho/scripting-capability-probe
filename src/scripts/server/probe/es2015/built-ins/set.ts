import { group, probe, expect } from "../../../probing-toolkit";
import { createIterableObject, withObjectMethodChanged } from "../../_utils";

const setMethods = [
    "delete",
    "clear",
    "forEach",
    "keys",
    "values",
    "entries"
];

export default group("Set", [
    probe("basic functionality", () => {
        const set = new Set();
        set.add(123);
        set.add(123);
        expect(set.has(123)).to.be.true;
    }),
    probe("constructor arguments", () => {
        const e1  = {};
        const e2  = {};
        const set = new Set([e1, e2]);

        expect(set.has(e1)).to.be.true;
        expect(set.has(e2)).to.be.true;
    }),
    probe("constructor requires `new'", () => {
        function f() {
            return eval(`Set()`);
        }
        expect(f).to.throw(TypeError);
    }),
    probe("constructor accepts null", () => {
        function f() {
            return new Set(null);
        }
        expect(f).to.not.throw();
    }),
    probe("constructor invokes `add'", () => {
        let passed = false;
        withObjectMethodChanged(
            Set, "add",
            () => {
                passed = true;
            },
            () => {
                new Set([1]);
            });
        expect(passed).to.be.true;
    }),
    probe("constructor closes iterator", () => {
        let closed = false;
        const iter = createIterableObject([1, 2, 3], {
            return() {
                closed = true;
                return {};
            }
        });
        withObjectMethodChanged(
            Set, "add",
            () => {
                throw 0;
            },
            () => {
                try {
                    new Set(iter);
                }
                catch (e) {}
            });
        expect(closed).to.be.true;
    }),
    probe("Set.prototype.add returns `this'", () => {
        const set = new Set();
        expect(set.add(0)).to.equal(set);
    }),
    probe("-0 element converts to +0", () => {
        const set = new Set<number>();
        set.add(-0);

        let v;
        set.forEach(elem => {
            v = 1 / elem;
        });

        expect(v).to.equal(Infinity);
        expect(set.has(+0)).to.be.true;
    }),
    probe("Set.prototype.size", () => {
        const set = new Set();
        set.add(123);
        set.add(123);
        set.add(456);
        expect(set).to.have.a.property("size", 2);
    }),
    ...(setMethods.map(method => {
        return probe("Set.prototype." + method, () => {
            expect(Set).to.respondTo(method);
        });
    })),
    probe("Set.prototype[@@iterator]", () => {
        expect(Set).to.respondTo(Symbol.iterator);
    }),
    probe("Set.prototype isn't an instance", () => {
        function f() {
            return Set.prototype.has({});
        }
        expect(f).to.throw(TypeError);
    }),
    probe("Set iterator prototype chain", () => {
        // Iterator instance
        const iter   = new Set()[Symbol.iterator]();
        // %SetIteratorPrototype%
        const proto1 = Object.getPrototypeOf(iter);
        // %IteratorPrototype%
        const proto2 = Object.getPrototypeOf(proto1);

        expect(proto2).to.have.own.property(Symbol.iterator);
        expect(proto1).to.not.have.own.property(Symbol.iterator);
        expect(iter).to.not.have.own.property(Symbol.iterator);
        expect(iter[Symbol.iterator]()).to.equal(iter);
    }),
    probe("Set[@@species]", () => {
        expect(Set).to.have.ownPropertyDescriptor(Symbol.species).that.has.a.property("get");
        expect(Set).to.have.a.property(Symbol.species).that.equals(Set);
    })
]);

import { group, probe, expect } from "../../probing-toolkit";
import { createIterableObject } from "../_utils";

const typedArrayViews = [
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array
];

const typedArrayStaticMethods = [
    "from",
    "of"
];

const typedArrayMethods = [
    "subarray",
    "join",
    "indexOf",
    "lastIndexOf",
    "slice",
    "every",
    "filter",
    "forEach",
    "map",
    "reduce",
    "reduceRight",
    "reverse",
    "some",
    "sort",
    "copyWithin",
    "find",
    "findIndex",
    "fill",
    "keys",
    "values",
    "entries"
];

const mapMethods = [
    "delete",
    "clear",
    "forEach",
    "keys",
    "values",
    "entries"
];

const setMethods = [
    "delete",
    "clear",
    "forEach",
    "keys",
    "values",
    "entries"
];

function withObjectMethodChanged<R>(ctor: any, method: PropertyKey, impl: Function, fn: () => R): R {
    const saved = ctor.prototype[method];
    try {
        ctor.prototype[method] = impl;
        return fn();
    }
    finally {
        ctor.prototype[method] = saved;
    }
}

export default group("Built-ins", [
    group("Typed arrays", [
        probe("Int8Array", () => {
            const buf  = new ArrayBuffer(64);
            const view = new Int8Array(buf);
            view[0] = 0x80;
            expect(view[0]).to.equal(-0x80);
        }),
        probe("Uint8Array", () => {
            const buf  = new ArrayBuffer(64);
            const view = new Uint8Array(buf);
            view[0] = 0x100;
            expect(view[0]).to.equal(0);
        }),
        probe("Uint8ClampedArray", () => {
            const buf  = new ArrayBuffer(64);
            const view = new Uint8ClampedArray(buf);
            view[0] = 0x100;
            expect(view[0]).to.equal(0xFF);
        }),
        probe("Int16Array", () => {
            const buf  = new ArrayBuffer(64);
            const view = new Int16Array(buf);
            view[0] = 0x8000;
            expect(view[0]).to.equal(-0x8000);
        }),
        probe("Uint16Array", () => {
            const buf  = new ArrayBuffer(64);
            const view = new Uint16Array(buf);
            view[0] = 0x10000;
            expect(view[0]).to.equal(0);
        }),
        probe("Int32Array", () => {
            const buf  = new ArrayBuffer(64);
            const view = new Int32Array(buf);
            view[0] = 0x80000000;
            expect(view[0]).to.equal(-0x80000000);
        }),
        probe("Uint32Array", () => {
            const buf  = new ArrayBuffer(64);
            const view = new Uint32Array(buf);
            view[0] = 0x100000000;
            expect(view[0]).to.equal(0);
        }),
        probe("Float32Array", () => {
            const buf  = new ArrayBuffer(64);
            const view = new Float32Array(buf);
            view[0] = 0.1;
            expect(view[0]).to.equal(0.10000000149011612);
        }),
        probe("Float64Array", () => {
            const buf  = new ArrayBuffer(64);
            const view = new Float64Array(buf);
            view[0] = 0.1;
            expect(view[0]).to.equal(0.1);
        }),
        probe("DataView (Int8)", () => {
            const buf  = new ArrayBuffer(64);
            const view = new DataView(buf);
            view.setInt8(0, 0x80);
            expect(view.getInt8(0)).to.equal(-0x80);
        }),
        probe("DataView (Uint8)", () => {
            const buf  = new ArrayBuffer(64);
            const view = new DataView(buf);
            view.setUint8(0, 0x100);
            expect(view.getUint8(0)).to.equal(0);
        }),
        probe("DataView (Int16)", () => {
            const buf  = new ArrayBuffer(64);
            const view = new DataView(buf);
            view.setInt16(0, 0x8000);
            expect(view.getInt16(0)).to.equal(-0x8000);
        }),
        probe("DataView (Uint16)", () => {
            const buf  = new ArrayBuffer(64);
            const view = new DataView(buf);
            view.setUint16(0, 0x10000);
            expect(view.getUint16(0)).to.equal(0);
        }),
        probe("DataView (Int32)", () => {
            const buf  = new ArrayBuffer(64);
            const view = new DataView(buf);
            view.setInt32(0, 0x80000000);
            expect(view.getInt32(0)).to.equal(-0x80000000);
        }),
        probe("DataView (Uint32)", () => {
            const buf  = new ArrayBuffer(64);
            const view = new DataView(buf);
            view.setUint32(0, 0x100000000);
            expect(view.getUint32(0)).to.equal(0);
        }),
        probe("DataView (Float32)", () => {
            const buf  = new ArrayBuffer(64);
            const view = new DataView(buf);
            view.setFloat32(0, 0.1);
            expect(view.getFloat32(0)).to.equal(0.10000000149011612);
        }),
        probe("DataView (Float64)", () => {
            const buf  = new ArrayBuffer(64);
            const view = new DataView(buf);
            view.setFloat64(0, 0.1);
            expect(view.getFloat64(0)).to.equal(0.1);
        }),
        probe("ArrayBuffer[@@species]", () => {
            expect(ArrayBuffer).itself.to.respondTo(Symbol.species);
        }),
        probe("constructors require `new'", () => {
            function f() {
                return eval(`ArrayBuffer(64)`);
            }
            expect(f).to.throw(TypeError);

            function g(ctor: Function) {
                return ctor(new ArrayBuffer(64));
            }
            for (const ctor of [DataView, ...typedArrayViews]) {
                expect(() => g(ctor)).to.throw(TypeError);
            }
        }),
        probe("constructors accept generic iterables", () => {
            for (const ctor of typedArrayViews) {
                const arr = new ctor(createIterableObject([1, 2, 3]));
                expect(arr).to.have.lengthOf(3);
                expect(arr[0]).to.equal(1);
                expect(arr[1]).to.equal(2);
                expect(arr[2]).to.equal(3);
            }
        }),
        probe("correct prototype chains", () => {
            const i8Ctor  = Object.getPrototypeOf(Int8Array);
            const i8Proto = Object.getPrototypeOf(Int8Array.prototype);
            expect(i8Ctor).not.to.equal(Function.prototype);
            expect(i8Proto).not.to.equal(Object.prototype);

            for (const ctor of typedArrayViews) {
                expect(Object.getPrototypeOf(ctor)).to.equal(i8Ctor);
                expect(Object.getPrototypeOf(ctor.prototype)).to.equal(i8Proto);
                expect(ctor.prototype).to.have.own.property("BYTES_PER_ELEMENT");
                expect(ctor.prototype).to.have.own.property("constructor");
            }
        }),
        ...(typedArrayStaticMethods.map(method => {
            return probe("%TypedArray%." + method, () => {
                for (const ctor of typedArrayViews) {
                    expect(ctor).itself.to.respondTo(method);
                }
            });
        })),
        ...(typedArrayMethods.map(method => {
            return probe("%TypedArray%.prototype." + method, () => {
                for (const ctor of typedArrayViews) {
                    expect(ctor).to.respondTo(method);
                }
            });
        })),
        probe("%TypedArray%.prototype[@@iterator]", () => {
            for (const ctor of typedArrayViews) {
                expect(ctor).to.respondTo(Symbol.iterator);
            }
        }),
        probe("%TypedArray%[@@species]", () => {
            for (const ctor of typedArrayViews) {
                expect(ctor).itself.to.respondTo(Symbol.species);
            }
        })
    ]),
    group("Map", [
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
    ]),
    group("Set", [
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
    ]),
    group("WeakMap", [
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
    ]),
    group("WeakSet", [
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
    ]),
    group("Proxy", [
        probe("constructor requires `new'", () => {
            function f() {
                return new Proxy({}, {});
            }
            function g() {
                return eval(`Proxy({}, {})`);
            }
            expect(f).to.not.throw();
            expect(g).to.throw(TypeError);
        }),
        probe("`Proxy' doesn't have a prototype", () => {
            expect(Proxy).to.not.have.own.property('prototype');
        }),
        probe("`get' handler", () => {
            const target = {};
            const proxy  = new Proxy(target, {
                get(t, k, r) {
                    if (k === "foo") {
                        expect(t).to.equal(target);
                        expect(r).to.equal(proxy);
                        return 5;
                    }
                    else {
                        return;
                    }
                }
            });
            expect((proxy as any).foo).to.equal(5);
        }),
        probe("`get' handler, instances of proxies", () => {
            const target = {};
            const proxy  = Object.create(new Proxy(target, {
                get(t, k, r) {
                    if (k === "foo") {
                        expect(t).to.equal(target);
                        expect(r).to.equal(proxy);
                        return 5;
                    }
                    else {
                        return;
                    }
                }
            }));
            expect((proxy as any).foo).to.equal(5);
        }),
        probe("`get' handler invariants", () => {
            const target = {};
            const proxy  = new Proxy(target, {
                get() {
                    return 4;
                }
            });

            // The value reported for a property must be the same as the
            // value of the corresponding target object property if the
            // target object property is a non-writable, non-configurable
            // own data property.
            Object.defineProperty(target, "foo", {value: 5, enumerable: true});
            function f() {
                return (proxy as any).foo;
            }
            expect(f).to.throw(TypeError);

            // The value reported for a property must be undefined if the
            // corresponding target object property is a non-configurable
            // own accessor property that has undefined as its [[Get]]
            // attribute.
            Object.defineProperty(target, "bar", {set() {}, enumerable: true});
            function g() {
                return (proxy as any).bar;
            }
            expect(g).to.throw(TypeError);
        }),
        probe("`set' handler", () => {
            let   passed = false;
            const target = {};
            const proxy  = new Proxy(target, {
                set(t, k, v, r) {
                    expect(t).to.equal(target);
                    expect(k).to.equal("foo");
                    expect(v).to.equal("bar");
                    expect(r).to.equal(proxy);
                    passed = true;
                    return true;
                }
            });
            (proxy as any).foo = "bar";
            expect(passed).to.be.true;
        }),
        probe("`set' handler, instances of proxies", () => {
            let   passed = false;
            const target = {};
            const proxy  = Object.create(new Proxy(target, {
                set(t, k, v, r) {
                    expect(t).to.equal(target);
                    expect(k).to.equal("foo");
                    expect(v).to.equal("bar");
                    expect(r).to.equal(proxy);
                    passed = true;
                    return true;
                }
            }));
            (proxy as any).foo = "bar";
            expect(passed).to.be.true;
        }),
        probe("`set' handler invariants", () => {
            const target = {};
            const proxy  = new Proxy(target, {
                set() {
                    return true;
                }
            });

            // Cannot change the value of a property to be different from
            // the value of the corresponding target object if the
            // corresponding target object property is a non-writable,
            // non-configurable own data property.
            Object.defineProperty(target, "foo", {value: 2, enumerable: true});
            function f() {
                (proxy as any).foo = 2;
            }
            function g() {
                (proxy as any).foo = 4;
            }
            expect(f).not.to.throw();
            expect(g).to.throw(TypeError);

            // Cannot set the value of a property if the corresponding
            // target object property is a non-configurable own accessor
            // property that has undefined as its [[Set]] attribute.
            Object.defineProperty(target, "bar", {get: () => {}, enumerable: true});
            function h() {
                (proxy as any).bar = 2;
            }
            expect(h).to.throw(TypeError);
        }),
        probe("`has' handler", () => {
            let   passed = false;
            const target = {};
            const proxy  = new Proxy(target, {
                has(t, k) {
                    if (k === "foo") {
                        expect(t).to.equal(target);
                        passed = true;
                        return true;
                    }
                    else {
                        return false;
                    }
                }
            });
            expect("foo" in proxy).to.be.true;
            expect(passed).to.be.true;
        }),
        probe("`has' handler, instances of proxies", () => {
            let   passed = false;
            const target = {};
            const proxy  = Object.create(new Proxy(target, {
                has(t, k) {
                    if (k === "foo") {
                        expect(t).to.equal(target);
                        passed = true;
                        return true;
                    }
                    else {
                        return false;
                    }
                }
            }));
            expect("foo" in proxy).to.be.true;
            expect(passed).to.be.true;
        }),
        probe("`has' handler invariants", () => {
            const target = {};
            const proxy  = new Proxy(target, {
                has() {
                    return false;
                }
            });

            // A property cannot be reported as non-existent, if it exists
            // as a non-configurable own property of the target object.
            Object.defineProperty(target, "foo", {value: 2, writable: true, enumerable: true});
            function f() {
                return "foo" in proxy;
            }
            expect(f).to.throw(TypeError);

            // A property cannot be reported as non-existent, if it exists
            // as an own property of the target object and the target
            // object is not extensible.
            (proxy as any).bar = 2;
            Object.preventExtensions(target);
            function g() {
                return "bar" in proxy;
            }
            expect(g).to.throw(TypeError);
        }),
        probe("`deleteProperty' handler", () => {
            let   passed = false;
            const target = {};
            const proxy  = new Proxy(target, {
                deleteProperty(t, k) {
                    if (k === "foo") {
                        expect(t).to.equal(target);
                        passed = true;
                        return true;
                    }
                    else {
                        return false;
                    }
                }
            });
            delete (proxy as any).foo;
            expect(passed).to.be.true;
        }),
        probe("`deleteProperty' handler invariants", () => {
            const target = {};
            const proxy  = new Proxy(target, {
                deleteProperty() {
                    return true;
                }
            });
            // A property cannot be reported as deleted, if it exists as a
            // non-configurable own property of the target object.
            Object.defineProperty(target, "foo", {value: 2, writable: true, enumerable: true});
            function f() {
                delete (proxy as any).foo;
            }
            expect(f).to.throw(TypeError);
        }),
        probe("`getOwnPropertyDescriptor' handler", () => {
            const target = {};
            const proxy  = new Proxy(target, {
                getOwnPropertyDescriptor(t, k) {
                    if (k === "foo") {
                        expect(t).to.equal(target);
                        return {value: "foo", configurable: true};
                    }
                    else {
                        return;
                    }
                }
            });
            expect(Object.getOwnPropertyDescriptor(proxy as any, "foo")).to.include({
                value:        "foo",
                configurable: true,
                writable:     false,
                enumerable:   false
            });
        }),
        probe("`getOwnPropertyDescriptor' handler invariants", () => {
            const target = {};
            const proxy  = new Proxy(target, {
                getOwnPropertyDescriptor(_t, k) {
                    if (k === "baz") {
                        return {
                            value:        "baz",
                            configurable: true,
                            writable:     true,
                            enumerable:   true
                        };
                    }
                    else {
                        return;
                    }
                }
            });

            // A property cannot be reported as non-existent, if it exists
            // as a non-configurable own property of the target object.
            Object.defineProperty(target, "foo", {value: 2, writable: true, enumerable: true});
            function f() {
                return Object.getOwnPropertyDescriptor(proxy as any, "foo");
            }
            expect(f).to.throw(TypeError);

            // A property cannot be reported as non-existent, if it exists
            // as an own property of the target object and the target
            // object is not extensible.
            Object.defineProperty(target, "bar", {value: 3, configurable: true});
            Object.preventExtensions(target);
            function g() {
                return Object.getOwnPropertyDescriptor(proxy as any, "bar");
            }
            expect(g).to.throw(TypeError);

            // A property cannot be reported as existent, if it does not
            // exists as an own property of the target object and the
            // target object is not extensible.
            function h() {
                return Object.getOwnPropertyDescriptor(proxy as any, "baz");
            }
            expect(h).to.throw(TypeError);

            // A property cannot be reported as non-configurable, if it
            // does not exists as an own property of the target object or
            // if it exists as a configurable own property of the target
            // object.
            function i() {
                const proxy = new Proxy({}, {
                    getOwnPropertyDescriptor() {
                        return {
                            value:        2,
                            configurable: false,
                            writable:     true,
                            enumerable:   true
                        };
                    }
                });
                Object.getOwnPropertyDescriptor(proxy as any, "baz");
            }
            function j() {
                const proxy = new Proxy({baz: 1}, {
                    getOwnPropertyDescriptor() {
                        return {
                            value:        2,
                            configurable: false,
                            writable:     true,
                            enumerable:   true
                        };
                    }
                });
                Object.getOwnPropertyDescriptor(proxy as any, "baz");
            }
            expect(i).to.throw(TypeError);
            expect(j).to.throw(TypeError);
        }),
        probe("`defineProperty' handler", () => {
            let   passed = false;
            const target = {};
            const proxy  = new Proxy(target, {
                defineProperty(t, k, d) {
                    if (k === "foo") {
                        expect(t).to.equal(target);
                        expect(d).to.have.a.property("value", 5);
                        passed = true;
                        return true;
                    }
                    else {
                        return false;
                    }
                }
            });
            Object.defineProperty(proxy, "foo", {value: 5, configurable: true});
            expect(passed).to.be.true;
        }),
        probe("`defineProperty' handler invariants", () => {
            // A property cannot be added, if the target object is not extensible.
            function f() {
                const target = Object.preventExtensions({});
                const proxy  = new Proxy(target, {
                    defineProperty() {
                        return true;
                    }
                });
                Object.defineProperty(proxy, "foo", {value: 2, configurable: true});
            }
            expect(f).to.throw(TypeError);

            // A property cannot be non-configurable, unless there exists a
            // corresponding non-configurable own property of the target
            // object.
            function g() {
                const target = {bar: true};
                const proxy  = new Proxy(target, {
                    defineProperty() {
                        return true;
                    }
                });
                Object.defineProperty(proxy, "bar", {
                    value:        5,
                    configurable: false,
                    writable:     true,
                    enumerable:   true
                });
            }
            expect(g).to.throw(TypeError);
        }),
    ])
]);

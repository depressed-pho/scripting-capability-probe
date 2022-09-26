import { group, probe, expect } from "../../probing-toolkit";

export default group("misc", [
    group("prototype of bound functions", [
        probe("regular functions", () => {
            function correctProtoBound(proto: any) {
                var f = function () {};
                Object.setPrototypeOf(f, proto);

                var boundF = Function.prototype.bind.call(f, null);
                expect(Object.getPrototypeOf(boundF)).to.equal(proto);
            }
            correctProtoBound(Function.prototype);
            correctProtoBound({});
            correctProtoBound(null);
        }),
        probe("generator functions", () => {
            function correctProtoBound(proto: any) {
                var f = function* () {};
                Object.setPrototypeOf(f, proto);

                var boundF = Function.prototype.bind.call(f, null);
                expect(Object.getPrototypeOf(boundF)).to.equal(proto);
            }
            correctProtoBound(Function.prototype);
            correctProtoBound({});
            correctProtoBound(null);
        }),
        probe("arrow functions", () => {
            function correctProtoBound(proto: any) {
                var f = () => 5;
                Object.setPrototypeOf(f, proto);

                var boundF = Function.prototype.bind.call(f, null);
                expect(Object.getPrototypeOf(boundF)).to.equal(proto);
            }
            correctProtoBound(Function.prototype);
            correctProtoBound({});
            correctProtoBound(null);
        }),
        probe("classes", () => {
            function correctProtoBound(proto: any) {
                class C {}
                Object.setPrototypeOf(C, proto);

                var boundF = Function.prototype.bind.call(C, null);
                expect(Object.getPrototypeOf(boundF)).to.equal(proto);
            }
            correctProtoBound(Function.prototype);
            correctProtoBound({});
            correctProtoBound(null);
        }),
        probe("subclasses", () => {
            function correctProtoBound(superclass: any) {
                class C extends superclass {
                    // @ts-ignore: We don't call super() here.
                    constructor() {
                        return Object.create(null);
                    }
                }
                var boundF = Function.prototype.bind.call(C, null);
                expect(Object.getPrototypeOf(boundF)).to.equal(Object.getPrototypeOf(C));
            }
            correctProtoBound(function () {});
            correctProtoBound(Array);
            correctProtoBound(null);
        })
    ]),
    group("Proxy, internal `get' calls", [
        probe("ToPrimitive", () => {
            // ToPrimitive -> Get -> [[Get]]
            const get: PropertyKey[] = [];
            const obj = {
                toString: Function()
            };
            const p = new Proxy(obj, {
                get(o: any, k: PropertyKey) {
                    get.push(k);
                    return o[k];
                }
            });
            p + 3;
            expect(get).to.deeply.equal([Symbol.toPrimitive, "valueOf", "toString"]);
        }),
        probe("CreateListFromArrayLike", () => {
            // CreateListFromArrayLike -> Get -> [[Get]]
            const get: PropertyKey[] = [];
            const obj = {
                length: 2,
                0: 0,
                1: 0
            };
            const p = new Proxy(obj, {
                get(o: any, k: PropertyKey) {
                    get.push(k);
                    return o[k];
                }
            });
            Function.prototype.apply({}, p);
            expect(get).to.deeply.equal(["length", "0", "1"]);
        }),
        probe("instanceof operator", () => {
            // InstanceofOperator -> GetMethod -> GetV -> [[Get]]
            // InstanceofOperator -> OrdinaryHasInstance -> Get -> [[Get]]
            const get: PropertyKey[] = [];
            const obj = Function();
            const p = new Proxy(obj, {
                get(o: any, k: PropertyKey) {
                    get.push(k);
                    return o[k];
                }
            });
            ({}) instanceof p;
            expect(get).to.deeply.equal([Symbol.hasInstance, "prototype"]);
        }),
    ]),
]);

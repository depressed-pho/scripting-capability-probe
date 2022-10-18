import { group, probe, expect } from "../../probing-toolkit";
import { PropGetRecorder, PropSetRecorder, PropDefineRecorder,
         PropDeleteRecorder, PropDescRecorder, OwnKeysRecorder } from "../_utils";

const propOrderObj = (() => {
    const obj: any = {
        // Non-negative integer names appear first in value order
        2: true,
        0: true,
        1: true,
        // Other string names appear in source order
        " ": true,
        // Non-negative integers are sorted above other names
        9: true,
        D: true,
        B: true,
        // Negative integers are treated as other names
        "-1": true
    };
    // Other string names are added in order of creation
    obj.A = true;
    // Non-negative integer names, conversely, ignore order of creation
    obj[3] = true;
    // Having a total of 20+ properties doesn't affect property order
    for (const key of "EFGHIJKLMNOPQRSTUVWXYZ") {
        obj[key] = true;
    }
    // Object.defineProperty doesn't affect the above rules
    Object.defineProperty(obj, "C", {value: true, enumerable: true});
    Object.defineProperty(obj, "4", {value: true, enumerable: true});
    // Deleting and reinserting a property doesn't preserve its position
    delete obj[2];
    obj[2] = true;

    return obj;
})();

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
            const rec = new PropGetRecorder({
                toString: Function()
            });
            rec.target + 3;
            rec.assertOrdered([Symbol.toPrimitive, "valueOf", "toString"]);
        }),
        probe("CreateListFromArrayLike", () => {
            // CreateListFromArrayLike -> Get -> [[Get]]
            const rec = new PropGetRecorder({
                length: 2,
                0: 0,
                1: 0
            });
            Function.prototype.apply({}, rec.target);
            rec.assertOrdered(["length", "0", "1"]);
        }),
        probe("instanceof operator", () => {
            // InstanceofOperator -> GetMethod -> GetV -> [[Get]]
            // InstanceofOperator -> OrdinaryHasInstance -> Get -> [[Get]]
            const rec = new PropGetRecorder(Function());
            ({}) instanceof rec.target;
            rec.assertOrdered([Symbol.hasInstance, "prototype"]);
        }),
        probe("CreateDynamicFunction", () => {
            // CreateDynamicFunction -> GetPrototypeFromConstructor -> Get -> [[Get]]
            const rec = new PropGetRecorder(Function);
            new rec.target;
            rec.assertOrdered(["prototype"]);
        }),
        probe("ClassDefinitionEvaluation", () => {
            // ClassDefinitionEvaluation -> Get -> [[Get]]
            const rec = new PropGetRecorder(Function());
            // @ts-ignore: C is defined but isn't used.
            class C extends rec.target {}
            rec.assertOrdered(["prototype"]);
        }),
        probe("IteratorComplete, IteratorValue", () => {
            // IteratorComplete -> Get -> [[Get]]
            // IteratorValue -> Get -> [[Get]]
            const rec  = new PropGetRecorder({value: 2, done: false});
            const iter = {
                [Symbol.iterator]() {
                    return {
                        next() {
                            return rec.target;
                        }
                    };
                }
            };
            let i = 0;
            for (const _e of iter) {
                if (++i >= 2) break;
            }
            rec.assertOrdered(["done", "value", "done", "value"]);
        }),
        probe("ToPropertyDescriptor", () => {
            // ToPropertyDescriptor -> Get -> [[Get]]
            const rec = new PropGetRecorder({
                enumerable: true, configurable: true, value: true,
                writable: true, get: Function(), set: Function()
            });
            function f() {
                // This will throw since it will have both "get" and
                // "value", but not before performing a Get on every
                // property.
                Object.defineProperty({}, "foo", rec.target);
            }
            expect(f).to.throw(TypeError);
            // The spec
            // (https://262.ecma-international.org/6.0/#sec-topropertydescriptor)
            // implies that implementations are supposed to access
            // properties *in this specific order*, but hey... why the heck
            // do they need to? QuickJS doesn't comply with that but nobody
            // can blame it.
            rec.assertUnordered(
                ["enumerable", "configurable", "value", "writable", "get", "set"]);
        }),
        probe("Object.assign", () => {
            // Object.assign -> Get -> [[Get]]
            const rec = new PropGetRecorder({foo: 1, bar: 2});
            Object.assign({}, rec.target);
            rec.assertUnordered(["foo", "bar"]);
        }),
        probe("Object.defineProperties", () => {
            // Object.defineProperties -> Get -> [[Get]]
            const rec = new PropGetRecorder({foo: {}, bar: {}});
            Object.defineProperties({}, rec.target);
            rec.assertUnordered(["foo", "bar"]);
        }),
        probe("Function.prototype.bind", () => {
            // Function.prototype.bind -> Get -> [[Get]]
            const rec = new PropGetRecorder(Function());
            Function.prototype.bind.call(rec.target, null);
            rec.assertUnordered(["length", "name"]);
        }),
        probe("Error.prototype.toString", () => {
            // Error.prototype.toString -> Get -> [[Get]]
            const rec = new PropGetRecorder({});
            Error.prototype.toString.call(rec.target);
            rec.assertUnordered(["name", "message"]);
        }),
        probe("String.raw", () => {
            // String.raw -> Get -> [[Get]]
            const raw = new PropGetRecorder({
                length: 2,
                0: "",
                1: ""
            });
            const p = new PropGetRecorder({raw: raw.target});
            String.raw(p.target);
            raw.assertUnordered(["length", "0", "1"]);
            p.assertUnordered(["raw"]);
        }),
        probe("RegExp constructor", () => {
            // RegExp -> Get -> [[Get]]
            const rec = new PropGetRecorder({
                constructor: null,
                [Symbol.match]: true
            });
            RegExp(rec.target);
            rec.assertUnordered([Symbol.match, "constructor", "source", "flags"]);
        }),
        probe("RegExp.prototype.flags", () => {
            // RegExp.prototype.flags -> Get -> [[Get]]
            const rec = new PropGetRecorder({});
            Object.getOwnPropertyDescriptor(RegExp.prototype, "flags")!.get!.call(rec.target);
            rec.assertContain(["global", "ignoreCase", "multiline", "dotAll", "unicode", "sticky"]);
        }),
        probe("RegExp.prototype.test", () => {
            // RegExp.prototype.test -> RegExpExec -> Get -> [[Get]]
            const rec = new PropGetRecorder({
                exec() {
                    return null;
                }
            });
            RegExp.prototype.test.call(rec.target, "");
            rec.assertUnordered(["exec"]);
        }),
        probe("RegExp.prototype.toString", () => {
            // RegExp.prototype.toString -> Get -> [[Get]]
            const rec = new PropGetRecorder({});
            RegExp.prototype.toString.call(rec.target);
            rec.assertUnordered(["source", "flags"]);
        }),
        probe("RegExp.prototype[@@match]", () => {
            // RegExp.prototype[@@match] -> Get -> [[Get]]
            const rec = new PropGetRecorder({
                exec() {
                    return null;
                },
                global: true
            });
            RegExp.prototype[Symbol.match].call(rec.target, "");
            rec.assertUnordered(["global", "exec", "unicode"]);
        }),
        probe("RegExp.prototype[@@replace]", () => {
            // RegExp.prototype[@@replace] -> Get -> [[Get]]
            const rec = new PropGetRecorder({
                exec() {
                    return null;
                },
                global: true
            });
            RegExp.prototype[Symbol.replace].call(rec.target, "", () => "");
            rec.assertUnordered(["global", "exec", "unicode"]);
        }),
        probe("RegExp.prototype[@@search]", () => {
            // RegExp.prototype[@@search] -> Get -> [[Get]]
            const rec = new PropGetRecorder({
                exec() {
                    return null;
                }
            });
            RegExp.prototype[Symbol.search].call(rec.target, "");
            rec.assertUnordered(["lastIndex", "exec"]);
        }),
        probe("RegExp.prototype[@@split]", () => {
            // RegExp.prototype[@@split] -> Get -> [[Get]]
            const ctor: any = Function();
            ctor[Symbol.species] = Object;
            const rec = new PropGetRecorder({
                constructor: ctor,
                flags: "",
                exec() {
                    return null;
                }
            });
            RegExp.prototype[Symbol.split].call(rec.target, "");
            rec.assertUnordered(["constructor", "flags", "exec"]);
        }),
        probe("Array.from", () => {
            // Array.from -> Get -> [[Get]]
            const rec = new PropGetRecorder({
                length: 2,
                0: 0,
                1: 0
            });
            Array.from(rec.target);
            rec.assertOrdered([Symbol.iterator, "length", "0", "1"]);
        }),
        probe("Array.prototype.concat", () => {
            // Array.prototype.concat -> Get -> [[Get]]
            const arr: any = [1];
            arr.constructor = undefined;
            const rec = new PropGetRecorder(arr);
            Array.prototype.concat.call(rec.target, rec.target);
            rec.assertOrdered([
                "constructor",
                Symbol.isConcatSpreadable,
                "length",
                "0",
                Symbol.isConcatSpreadable,
                "length",
                "0"
            ]);
        }),
        probe("Array.prototype iteration methods", () => {
            // Array.prototype iteration methods -> Get -> [[Get]]
            const methods = {
                copyWithin:  ["length", "0", "1"],
                every:       ["length", "0"],
                fill:        ["length"],
                filter:      ["length", "0", "1"],
                find:        ["length", "0", "1"],
                findIndex:   ["length", "0", "1"],
                forEach:     ["length", "0", "1"],
                indexOf:     ["length", "0", "1"],
                join:        ["length", "0", "1"],
                lastIndexOf: ["length", "1", "0"],
                map:         ["length", "0", "1"],
                reduce:      ["length", "0", "1"],
                reduceRight: ["length", "1", "0"],
                some:        ["length", "0", "1"]
            };
            for (const [method, props] of Object.entries(methods)) {
                const rec = new PropGetRecorder({
                    length: 2,
                    0: "",
                    1: ""
                });
                (Array.prototype as any)[method].call(rec.target, Function());
                rec.assertOrdered(props);
            }
        }),
        probe("Array.prototype.pop", () => {
            // Array.prototype.pop -> Get -> [[Get]]
            const rec = new PropGetRecorder([0, 1, 2, 3]);
            Array.prototype.pop.call(rec.target);
            rec.assertOrdered(["length", "3"]);
        }),
        probe("Array.prototype.reverse", () => {
            // Array.prototype.reverse -> Get -> [[Get]]
            const rec = new PropGetRecorder([0, , 2, , 4, , ]);
            Array.prototype.reverse.call(rec.target);
            rec.assertOrdered(["length", "0", "4", "2"]);
        }),
        probe("Array.prototype.shift", () => {
            // Array.prototype.shift -> Get -> [[Get]]
            const rec = new PropGetRecorder([0, 1, 2, 3]);
            Array.prototype.shift.call(rec.target);
            rec.assertOrdered(["length", "0", "1", "2", "3"]);
        }),
        probe("Array.prototype.splice", () => {
            // Array.prototype.splice -> Get -> [[Get]]
            const rec = new PropGetRecorder([0, 1, 2, 3]);
            Array.prototype.splice.call(rec.target, 1, 1);
            rec.assertOrdered(["length", "constructor", "1", "2", "3"]);
        }),
        probe("Array.prototype.toString", () => {
            // Array.prototype.toString -> Get -> [[Get]]
            const rec = new PropGetRecorder({ join: Function() });
            Array.prototype.toString.call(rec.target);
            rec.assertOrdered(["join"]);
        }),
        probe("JSON.stringify", () => {
            // JSON.stringify -> Get -> [[Get]]
            const rec = new PropGetRecorder({});
            JSON.stringify(rec.target);
            rec.assertOrdered(["toJSON"]);
        }),
        probe("Promise resolve functions", () => {
            // Promise resolve functions -> Get -> [[Get]]
            const rec = new PropGetRecorder({});
            new Promise((resolve) => resolve(rec.target));
            rec.assertOrdered(["then"]);
        }),
        probe("String.prototype.match", () => {
            // String.prototype.match -> Get -> [[Get]]
            const rec = new PropGetRecorder({
                [Symbol.toPrimitive]: Function()
            });
            "".match(rec.target);
            rec.assertOrdered([Symbol.match, Symbol.toPrimitive]);
        }),
        probe("String.prototype.replace", () => {
            // String.prototype.replace -> Get -> [[Get]]
            const rec = new PropGetRecorder({
                [Symbol.toPrimitive]: Function()
            });
            "".replace(rec.target, "");
            rec.assertOrdered([Symbol.replace, Symbol.toPrimitive]);
        }),
        probe("String.prototype.search", () => {
            // String.prototype.search -> Get -> [[Get]]
            const rec = new PropGetRecorder({
                [Symbol.toPrimitive]: Function()
            });
            "".search(rec.target);
            rec.assertOrdered([Symbol.search, Symbol.toPrimitive]);
        }),
        probe("String.prototype.split", () => {
            // String.prototype.split -> Get -> [[Get]]
            const rec = new PropGetRecorder({
                [Symbol.toPrimitive]: Function()
            });
            "".split(rec.target);
            rec.assertOrdered([Symbol.split, Symbol.toPrimitive]);
        }),
        probe("Date.prototype.toJSON", () => {
            // Date.prototype.toJSON -> ToPrimitive -> Get -> [[Get]]
            // Date.prototype.toJSON -> Invoke -> GetMethod -> GetV -> [[Get]]
            const rec = new PropGetRecorder({
                toString: Function(),
                toISOString: Function()
            });
            Date.prototype.toJSON.call(rec.target);
            rec.assertUnordered([Symbol.toPrimitive, "valueOf", "toString", "toISOString"]);
        }),
    ]),
    group("Proxy, internal `set' calls", [
        probe("Object.assign", () => {
            // Object.assign -> Set -> [[Set]]
            const rec = new PropSetRecorder({});
            Object.assign(rec.target, {foo: 1, bar: 2});
            rec.assertUnordered(["foo", "bar"]);
        }),
        probe("Array.from", () => {
            // Array.from -> Set -> [[Set]]
            const rec = new PropSetRecorder({});
            (Array.from as any).call(
                function () { return rec.target },
                {length: 2, 0: "foo", 1: "bar"});
            rec.assertOrdered(["length"]);
        }),
        probe("Array.of", () => {
            // Array.of -> Set -> [[Set]]
            const rec = new PropSetRecorder({});
            (Array.of as any).call(
                function () { return rec.target },
                1, 2, 3);
            rec.assertOrdered(["length"]);
        }),
        probe("Array.prototype.copyWithin", () => {
            // Array.prototype.copyWithin -> Set -> [[Set]]
            const rec = new PropSetRecorder([1, 2, 3, 4, 5, 6]);
            rec.target.copyWithin(0, 3);
            rec.assertOrdered(["0", "1", "2"]);
        }),
        probe("Array.prototype.fill", () => {
            // Array.prototype.fill -> Set -> [[Set]]
            const rec = new PropSetRecorder([1, 2, 3, 4, 5, 6]);
            rec.target.fill(0, 3);
            rec.assertOrdered(["3", "4", "5"]);
        }),
        probe("Array.prototype.pop", () => {
            // Array.prototype.pop -> Set -> [[Set]]
            const rec = new PropSetRecorder([1, 2, 3, 4, 5, 6]);
            rec.target.pop();
            rec.assertOrdered(["length"]);
        }),
        probe("Array.prototype.push", () => {
            // Array.prototype.push -> Set -> [[Set]]
            const rec = new PropSetRecorder([]);
            rec.target.push(0, 0, 0);
            rec.assertOrdered(["0", "1", "2", "length"]);
        }),
        probe("Array.prototype.reverse", () => {
            // Array.prototype.reverse -> Set -> [[Set]]
            const rec = new PropSetRecorder([0, 0, 0, , ]);
            rec.target.reverse();
            rec.assertOrdered(["3", "1", "2"]);
        }),
        probe("Array.prototype.shift", () => {
            // Array.prototype.shift -> Set -> [[Set]]
            const rec = new PropSetRecorder([0, 0, , 0]);
            rec.target.shift();
            rec.assertOrdered(["0", "2", "length"]);
        }),
        probe("Array.prototype.splice", () => {
            // Array.prototype.splice -> Set -> [[Set]]
            const rec = new PropSetRecorder([1, 2, 3]);
            rec.target.splice(1, 0, 0);
            rec.assertOrdered(["3", "2", "1", "length"]);
        }),
        probe("Array.prototype.unshift", () => {
            // Array.prototype.unshift -> Set -> [[Set]]
            const rec = new PropSetRecorder([0, 0, , 0]);
            rec.target.unshift(0, 1);
            rec.assertOrdered(["5", "3", "2", "0", "1", "length"]);
        })
    ]),
    group("Proxy, internal `defineProperty' calls", [
        probe("[[Set]]", () => {
            // [[Set]] -> [[DefineOwnProperty]]
            const rec = new PropDefineRecorder({foo: 1, bar: 2});
            rec.target.foo = 2;
            rec.target.bar = 4;
            rec.assertOrdered(["foo", "bar"]);
        }),
        probe("SetIntegrityLevel", () => {
            // SetIntegrityLevel -> DefinePropertyOrThrow -> [[DefineOwnProperty]]
            const rec = new PropDefineRecorder({foo: 1, bar: 2});
            Object.freeze(rec.target);
            rec.assertUnordered(["foo", "bar"]);
        }),
    ]),
    group("Proxy, internal 'deleteProperty' calls", [
        probe("Array.prototype.copyWithin", () => {
            // Array.prototype.copyWithin -> DeletePropertyOrThrow -> [[Delete]]
            const rec = new PropDeleteRecorder([0, 0, 0, , , , ]);
            rec.target.copyWithin(0,3);
            rec.assertOrdered(["0", "1", "2"]);
        }),
        probe("Array.prototype.pop", () => {
            // Array.prototype.pop -> DeletePropertyOrThrow -> [[Delete]]
            const rec = new PropDeleteRecorder([0, 0, 0]);
            rec.target.pop();
            rec.assertOrdered(["2"]);
        }),
        probe("Array.prototype.reverse", () => {
            // Array.prototype.reverse -> DeletePropertyOrThrow -> [[Delete]]
            const rec = new PropDeleteRecorder([0, , 2, , 4, , ]);
            rec.target.reverse();
            rec.assertOrdered(["0", "4", "2"]);
        }),
        probe("Array.prototype.shift", () => {
            // Array.prototype.shift -> DeletePropertyOrThrow -> [[Delete]]
            const rec = new PropDeleteRecorder([0, , 0, , 0, 0]);
            rec.target.shift();
            rec.assertOrdered(["0", "2", "5"]);
        }),
        probe("Array.prototype.splice", () => {
            // Array.prototype.splice -> DeletePropertyOrThrow -> [[Delete]]
            const rec = new PropDeleteRecorder([0, 0, 0, 0, , 0]);
            rec.target.splice(2, 2, 0);
            rec.assertOrdered(["3", "5"]);
        }),
        probe("Array.prototype.unshift", () => {
            // Array.prototype.unshift -> DeletePropertyOrThrow -> [[Delete]]
            const rec = new PropDeleteRecorder([0, 0, , 0, , 0]);
            rec.target.unshift(0);
            rec.assertOrdered(["5", "3"]);
        })
    ]),
    group("Proxy, internal 'getOwnPropertyDescriptor' calls", [
        probe("[[Set]]", () => {
            // [[Set]] -> [[GetOwnProperty]]
            const rec = new PropDescRecorder({});
            rec.target.foo = 1;
            rec.target.bar = 1;
            rec.assertOrdered(["foo", "bar"]);
        }),
        probe("Object.assign", () => {
            // Object.assign -> [[GetOwnProperty]]
            const rec = new PropDescRecorder({foo: 1, bar: 2});
            Object.assign({}, rec.target);
            rec.assertOrdered(["foo", "bar"]);
        }),
        probe("Object.prototype.hasOwnProperty", () => {
            // Object.prototype.hasOwnProperty -> HasOwnProperty -> [[GetOwnProperty]]
            const rec = new PropDescRecorder({foo: 1, bar: 2});
            rec.target.hasOwnProperty("foo");
            rec.assertOrdered(["foo"]);
        }),
        probe("Function.prototype.bind", () => {
            // Function.prototype.bind -> HasOwnProperty -> [[GetOwnProperty]]
            const rec = new PropDescRecorder(Function());
            rec.target.bind();
            rec.assertOrdered(["length"]);
        })
    ]),
    group("Proxy, internal 'ownKeys' calls", [
        probe("SetIntegrityLevel", () => {
            // SetIntegrityLevel -> [[OwnPropertyKeys]]
            const rec = new OwnKeysRecorder({});
            Object.freeze(rec.target);
            rec.assertOccured(1);
        }),
        probe("TestIntegrityLevel", () => {
            // TestIntegrityLevel -> [[OwnPropertyKeys]]
            const rec = new OwnKeysRecorder(Object.preventExtensions({}));
            Object.isFrozen(rec.target);
            rec.assertOccured(1);
        }),
        probe("SerializeJSONObject", () => {
            // SerializeJSONObject -> EnumerableOwnNames -> [[OwnPropertyKeys]]
            const rec = new OwnKeysRecorder({});
            JSON.stringify({a: rec.target, b: rec.target});
            rec.assertOccured(2);
        })
    ]),
    group("Object static methods accept primitives", [
        probe("Object.getPrototypeOf", () => {
            expect(Object.getPrototypeOf("a").constructor).to.equal(String);
        }),
        probe("Object.getOwnPropertyDescriptor", () => {
            expect(Object.getOwnPropertyDescriptor("a", "foo")).to.be.undefined;
        }),
        probe("Object.getOwnPropertyNames", () => {
            expect(Object.getOwnPropertyNames("a")).to.have.members(["length", "0"]);
        }),
        probe("Object.seal", () => {
            expect(Object.seal("a")).to.equal("a");
        }),
        probe("Object.freeze", () => {
            expect(Object.freeze("a")).to.equal("a");
        }),
        probe("Object.preventExtensions", () => {
            expect(Object.preventExtensions("a")).to.equal("a");
        }),
        probe("Object.isSealed", () => {
            expect(Object.isSealed("a")).to.be.true;
        }),
        probe("Object.isFrozen", () => {
            expect(Object.isFrozen("a")).to.be.true;
        }),
        probe("Object.isExtensible", () => {
            expect(Object.isExtensible("a")).to.be.false;
        }),
        probe("Object.keys", () => {
            expect(Object.keys("a")).to.deeply.equal(["0"]);
        }),
    ]),
    group("own property order", [
        probe("Object.keys", () => {
            const forInOrder: PropertyKey[] = [];
            for (const key in propOrderObj) {
                forInOrder.push(key);
            }

            expect(Object.keys(propOrderObj)).to.deeply.equal(forInOrder);
        }),
        probe("Object.getOwnPropertyNames", () => {
            expect(Object.getOwnPropertyNames(propOrderObj).join(""))
                .to.equal("012349 DB-1AEFGHIJKLMNOPQRSTUVWXYZC");
        }),
        probe("Object.assign", () => {
            let result = "";
            const target: any = {};
            for (const key of [..."012349 DBACEFGHIJKLMNOPQRST".split(""), -1]) {
                Object.defineProperty(target, key, {
                    set() {
                        result += key;
                    }
                });
            }

            const obj: any = {2: 2, 0: 0, 1: 1, " ": " ", 9: 9, D: "D", B: "B", "-1": "-1"};
            Object.defineProperty(obj, "A", {value: "A",  enumerable: true});
            Object.defineProperty(obj, "3", {value: "3",  enumerable: true});
            Object.defineProperty(obj, "C", {value: "C",  enumerable: true});
            Object.defineProperty(obj, "4", {value: "4",  enumerable: true});
            delete obj[2];
            obj[2] = true;

            for (const key of "EFGHIJKLMNOPQRST") {
                obj[key] = key;
            }

            Object.assign(target, obj);

            expect(result).to.equal("012349 DB-1ACEFGHIJKLMNOPQRST");
        }),
        probe("JSON.stringify", () => {
            expect(JSON.stringify(propOrderObj)).to.equal(
                '{"0":true,"1":true,"2":true,"3":true,"4":true,"9":true," ":true,"D":true,"B":true,"-1":true,"A":true,"E":true,"F":true,"G":true,"H":true,"I":true,"J":true,"K":true,"L":true,"M":true,"N":true,"O":true,"P":true,"Q":true,"R":true,"S":true,"T":true,"U":true,"V":true,"W":true,"X":true,"Y":true,"Z":true,"C":true}');
        }),
        probe("JSON.parse", () => {
            let result = "";
            JSON.parse(
                '{"0":true,"1":true,"2":true,"3":true,"4":true,"9":true," ":true,"D":true,"B":true,"-1":true,"E":true,"F":true,"G":true,"H":true,"I":true,"J":true,"K":true,"L":true,"A":true,"C":true}',
                (k: PropertyKey, v: any) => {
                    result += String(k);
                    return v;
                });
            expect(result).to.equal("012349 DB-1EFGHIJKLAC");
        }),
        probe("Reflect.ownKeys, string key order", () => {
            expect(Reflect.ownKeys(propOrderObj).join(""))
                .to.equal("012349 DB-1AEFGHIJKLMNOPQRSTUVWXYZC");
        }),
        probe("Reflect.ownKwys, symbol key order", () => {
            const sym1 = Symbol(), sym2 = Symbol(), sym3 = Symbol();
            const obj: any = {
                1: true,
                A: true
            };
            obj.B = true;
            obj[sym1] = true;
            obj[2] = true;
            obj[sym2] = true;
            Object.defineProperty(obj, "C",  {value: true, enumerable: true});
            Object.defineProperty(obj, sym3, {value: true, enumerable: true});
            Object.defineProperty(obj, "D",  {value: true, enumerable: true});

            const result = Reflect.ownKeys(obj);
            const l      = result.length;
            expect(result[l-3]).to.equal(sym1);
            expect(result[l-2]).to.equal(sym2);
            expect(result[l-1]).to.equal(sym3);
        })
    ]),
    group("Updated identifier syntax", [
        probe("var ⸯ;", () => {
            // U+2E2F VERTICAL TILDE; Lm (letter, modifier)
            function f() {
                eval(`var ⸯ;`);
            }
            expect(f).to.throw(SyntaxError);
        }),
        probe("var 𐋀;", () => {
            // U+102C0 CARIAN LETTER G; Lo (letter, other)
            // @ts-ignore: unused variable
            let 𐋀;
        }),
        probe("no escaped reserved words as identifiers", () => {
            // @ts-ignore: unused variable
            var \u0061;

            function f() {
                eval("var v\\u0061r");
            }
            expect(f).to.throw(SyntaxError);
        })
    ]),
    group("miscellaneous", [
        probe("duplicate property names in strict mode", () => {
            "use strict";
            // @ts-ignore: duplicate property names
            expect({a: 1, a: 1}).to.have.a.property("a", 1);
        }),
        probe("no semicolon needed after do-while", () => {
            do {} while (false) expect(true).to.be.true;
        }),
        probe("no assignments allowed in for-in head in strict mode", () => {
            function f() {
                "use strict";
                eval(`for (var i = 0 in {}) {}`);
            }
            expect(f).to.throw(SyntaxError);
        }),
        probe("accessors aren't constructors", () => {
            const obj = {
                get a() {
                    return 1;
                }
            };
            const a: any = Object.getOwnPropertyDescriptor(obj, "a")!.get;

            function f() {
                new a;
            }
            expect(f).to.throw(TypeError);
        }),
        probe("invalid Date", () => {
            expect(String(new Date(NaN))).to.equal("Invalid Date");
        }),
        probe("RegExp constructor can alter flags", () => {
            expect(new RegExp(/./im, "g")).to.have.a.property("global", true);
        }),
        probe("RegExp.prototype.toString generic and uses `flags' property", () => {
            expect(RegExp.prototype.toString.call({source: "foo", flags: "bar"})).to.equal("/foo/bar");
        }),
        probe("built-in prototypes are not instances", () => {
            function f() {
                RegExp.prototype.exec("");
            }
            expect(f).to.throw(TypeError);

            function g() {
                Date.prototype.valueOf();
            }
            expect(g).to.throw(TypeError);

            for (const E of [Error, EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError]) {
                expect(Object.prototype.toString.call(E.prototype)).to.equal("[object Object]");
            }
        }),
        probe("function `length' is configurable", () => {
            function fn(_a: any, _b: any) {}
            expect(fn).to.have.ownPropertyDescriptor("length")
                .that.has.a.property("configurable", true);

            Object.defineProperty(fn, "length", {value: 1});
            expect(fn).to.have.a.property("length", 1);
        })
    ]),
]);

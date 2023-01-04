import { group, probe, expect } from "../../probing-toolkit.js";

export default group("features", [
    group("Symbol.prototype.description", [
        probe("basic", () => {
            expect(Object(Symbol("foo"))).to.have.a.property("description", "foo");
        }),
        probe("empty description", () => {
            expect(Object(Symbol(""))).to.have.a.property("description", "");
        }),
        probe("undefined description", () => {
            expect(Symbol).to.have.a.property("prototype").that.has.own.property("description");
            expect(Object(Symbol())).to.have.a.property("description", undefined);
        })
    ]),
    probe("Object.fromEntries", () => {
        const obj = Object.fromEntries(new Map([["foo", 42], ["bar", 23]]));
        expect(obj).to.deeply.equal({foo: 42, bar: 23});
    }),
    group("string trimming", [
        probe("String.prototype.trimLeft", () => {
            expect(" \t \n abc   \t\n".trimLeft()).to.equal("abc   \t\n");
        }),
        probe("String.prototype.trimRight", () => {
            expect(" \t \n abc   \t\n".trimRight()).to.equal(" \t \n abc");
        }),
        probe("String.prototype.trimStart", () => {
            expect(" \t \n abc   \t\n".trimStart()).to.equal("abc   \t\n");
        }),
        probe("String.prototype.trimEnd", () => {
            expect(" \t \n abc   \t\n".trimEnd()).to.equal(" \t \n abc");
        })
    ]),
    group("Array.prototype.{flat, flatMap}", [
        probe("Array.prototype.flat", () => {
            expect([1, [2, 3], [4, [5, 6]]].flat()).to.deeply.equal([1, 2, 3, 4, [5, 6]]);
        }),
        probe("Array.prototype.flatMap", () => {
            const a = [{a: 1, b: 2}, {a: 3, b: 4}].flatMap(it => [it.a, it.b]);
            expect(a).to.deeply.equal([1, 2, 3, 4]);
        }),
    ])
]);

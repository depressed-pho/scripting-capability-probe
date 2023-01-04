import { group, probe, expect } from "../../../probing-toolkit.js";
import { createIterableObject } from "../../_utils.js";

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

export default group("Typed arrays", [
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
]);

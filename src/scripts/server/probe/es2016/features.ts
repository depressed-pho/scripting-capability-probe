import { group, probe, expect } from "../../probing-toolkit";

export default group("features", [
    group("exponentiation (**) operator", [
        probe("basic support", () => {
            expect(2 ** 3).to.equal(8);
            expect(-(5 ** 2)).to.equal(-25);
            expect((-5) ** 2).to.equal(25);
        }),
        probe("assignment", () => {
            let a = 2;
            a **= 3;
            expect(a).to.equal(8);
        }),
        probe("early syntax error for unary negation without parens", () => {
            function f() {
                Function("-5 ** 2")();
            }
            expect(f).to.throw(SyntaxError);
        })
    ]),
    group("Array.prototype.includes", [
        probe("Array.prototype.includes", () => {
            expect([1, 2, 3].includes(1)).to.be.true;
            expect([1, 2, 3].includes(4)).to.be.false;
            expect([1, 2, 3].includes(1, 1)).to.be.false;
            expect([NaN].includes(NaN)).to.be.true;
        }),
        probe("Array.prototype.includes handles sparse arrays", () => {
            expect([,].includes(undefined)).to.be.true;
            expect(Array(1).includes(undefined)).to.be.true;
        }),
        probe("Array.prototype.includes is generic", () => {
            let passed = 0;
            expect([].includes.call({
                get "0"() {
                    passed = NaN;
                    return "foo";
                },
                get "11"() {
                    passed += 1;
                    return 0;
                },
                get "19"() {
                    passed += 1;
                    return "foo";
                },
                get "21"() {
                    passed = NaN;
                    return "foo";
                },
                get length() {
                    passed += 1;
                    return 24;
                }
                // @ts-ignore: Of course TypeScript doesn't like this.
            }, "foo", 6)).to.be.true;
            expect(passed).to.equal(3);
        }),
        probe("%TypedArray%.prototype.includes", () => {
            const ctors = [
                Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array,
                Int32Array, Uint32Array, Float32Array, Float64Array];
            for (const TypedArray of ctors) {
                expect(new TypedArray([1, 2, 3]).includes(1)).to.be.true;
                expect(new TypedArray([1, 2, 3]).includes(4)).to.be.false;
                expect(new TypedArray([1, 2, 3]).includes(1, 1)).to.be.false;
            }
        })
    ]),
]);

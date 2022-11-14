import { group, probe, expect } from "../../probing-toolkit";

export default group("features", [
    probe("String.prototype.replaceAll", () => {
        expect("foobar".replaceAll("o", "-")).to.equal("f--bar");
    }),
    probe("numeric separators", () => {
        expect(eval("1_000_000.000_001")).to.equal(1000000.000001);
        expect(eval("0b1010_0001_1000_0101")).to.equal(0b1010000110000101);
    }),
    group("Promise.any", [
        probe("fulfillment", async () => {
            const it = await Promise.any([
                Promise.reject(1),
                Promise.resolve(2),
                Promise.resolve(3)
            ]);
            expect(it).to.equal(2);
        }),
        probe("AggregateError", async () => {
            const e = await Promise.any([
                Promise.reject(1),
                Promise.reject(2),
                Promise.reject(3)
            ]).catch(e => e);
            expect(e).to.be.an.instanceOf(AggregateError);
            expect(e.errors).to.have.lengthOf(3);
        })
    ]),
    group("weak references", [
        probe("WeakRef minimal support", () => {
            const o   = {};
            const ref = new WeakRef(o);
            expect(ref.deref()).to.equal(o);
        }),
        probe("FinalizationRegistry minimal support", () => {
            const reg = new FinalizationRegistry(() => {});
            expect(Object.getPrototypeOf(reg)).to.equal(FinalizationRegistry.prototype);
        })
    ]),
    group("logical assignment", [
        probe("||= basic assignment", () => {
            let a;
            let b = 0;
            let c = 1;
            eval(`
                a ||= 2;
                b ||= 2;
                c ||= 2;
            `);
            expect(a).to.equal(2);
            expect(b).to.equal(2);
            expect(c).to.equal(1);
        }),
        probe("||= short-circuiting behaviour", () => {
            let a = 1;
            let i = 1;
            eval(`
                a ||= ++i;
            `);
            expect(a).to.equal(1);
            expect(i).to.equal(1);
        }),
        probe("||= setter not unnecessarily invoked", () => {
            let i = 1;
            // @ts-ignore: obj is not visibly used
            const obj = {
                get x() {
                    return 1;
                },
                set x(_n) {
                    i++;
                }
            };
            eval(`
                obj.x ||= 2;
            `);
            expect(i).to.equal(1);
        }),
        probe("&&= basic assignment", () => {
            let a;
            let b = 0;
            let c = 1;
            eval(`
                a &&= 2;
                b &&= 2;
                c &&= 2;
            `);
            expect(a).to.be.undefined;
            expect(b).to.equal(0);
            expect(c).to.equal(2);
        }),
        probe("&&= short-circuiting behaviour", () => {
            let a;
            let i = 1;
            eval(`
                a &&= ++i;
            `);
            expect(a).to.be.undefined;
            expect(i).to.equal(1);
        }),
        probe("&&= setter not unecessarily invoked", () => {
            let i = 1;
            // @ts-ignore: obj is not visibly used
            const obj = {
                get x() {
                    return 0;
                },
                set x(_n) {
                    i++;
                }
            };
            eval(`
                obj.x &&= 2;
            `);
            expect(i).to.equal(1);
        }),
        probe("??= basic assignment", () => {
            let a;
            let b = 0;
            let c = 1;
            eval(`
                a ??= 2;
                b ??= 2;
                c ??= 2;
            `);
            expect(a).to.equal(2);
            expect(b).to.equal(0);
            expect(c).to.equal(1);
        }),
        probe("??= short-circuiting behaviour", () => {
            let a = 1;
            let i = 1;
            eval(`
                a ??= ++i;
            `);
            expect(a).to.equal(1);
            expect(i).to.equal(1);
        }),
        probe("??= setter not unecessarily invoked", () => {
            let i = 1;
            // @ts-ignore: obj is not visibly used
            const obj = {
                get x() {
                    return 1;
                },
                set x(_n) {
                    i++;
                }
            };
            eval(`
                obj.x ??= 2;
            `);
            expect(i).to.equal(1);
        })
    ])
]);

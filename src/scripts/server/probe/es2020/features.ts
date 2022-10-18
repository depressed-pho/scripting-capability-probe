import { group, probe, expect } from "../../probing-toolkit";
import { withPropertyChanged } from "../_utils";

export default group("features", [
    group("String.prototype.matchAll", [
        probe("basic functionality", () => {
            const iterator = "11a2bb".matchAll(/(\d)(\D)/g);
            let a = "", b = "", c = "", step;
            while (!(step = iterator.next()).done) {
                a += step.value[0];
                b += step.value[1];
                c += step.value[2];
            }
            expect(a).to.equal("1a2b");
            expect(b).to.equal("12");
            expect(c).to.equal("ab");
        }),
        probe("throws on non-global regex", () => {
            function f() {
                "11a2bb".matchAll(/(\d)(\D)/);
            }
            expect(f).to.throw(TypeError);
        })
    ]),
    group("BigInt", [
        probe("basic functionality", () => {
            eval(`
                expect(1n + 2n).to.equal(3n);
            `);
        }),
        probe("constructor", () => {
            eval(`
                expect(BigInt("3")).to.equal(3n);
            `);
        }),
        probe("BigInt.asUintN", () => {
            eval(`
                expect(BigInt.asUintN(3, -10n)).to.equal(6n);
            `);
        }),
        probe("BigInt.asIntN", () => {
            eval(`
                expect(BigInt.asIntN(3, -10n)).to.equal(-2n);
            `);
        }),
        probe("BigInt64Array", () => {
            eval(`
                const buffer = new ArrayBuffer(64);
                const view   = new BigInt64Array(buffer);
                view[0] = 0x8000000000000000n;
                expect(view[0]).to.equal(-0x8000000000000000n);
            `);
        }),
        probe("BigUint64Array", () => {
            eval(`
                const buffer = new ArrayBuffer(64);
                const view   = new BigUint64Array(buffer);
                view[0] = 0x10000000000000000n
                expect(view[0]).to.equal(0n);
            `);
        }),
        probe("DataView.prototype.getBigInt64", () => {
            eval(`
                const buffer = new ArrayBuffer(64);
                const view   = new DataView(buffer);
                view.setBigInt64(0, 1n);
                expect(view.getBigInt64(0)).to.equal(1n);
            `);
        }),
        probe("DataView.prototype.getBigUint64", () => {
            eval(`
                const buffer = new ArrayBuffer(64);
                const view   = new DataView(buffer);
                view.setBigUint64(0, 1n);
                expect(view.getBigUint64(0)).to.equal(1n);
            `);
        })
    ]),
    probe("Promise.allSettled", async () => {
        const ps = await Promise.allSettled([
            Promise.resolve(1),
            Promise.reject(2),
            Promise.resolve(3)
        ]);
        expect(ps).to.have.lengthOf(3);
        expect(ps[0]).to.contain({status: "fulfilled", value: 1});
        expect(ps[1]).to.contain({status: "rejected", reason: 2});
        expect(ps[2]).to.contain({status: "fulfilled", value: 3});
    }),
    probe("nullish coalescing operator (??)", () => {
        eval(`
            expect(null ?? 42).to.equal(42);
            expect(undefined ?? 42).to.equal(42);
            expect(false ?? 42).to.be.false;
            expect("" ?? 42).to.equal("");
            expect(0 ?? 42).to.equal(0);
            expect(Number.isNaN(NaN ?? 42)).to.be.true;
        `);
    }),
    group("globalThis", [
        probe("`globalThis' global property is the global object", () => {
            const global = Function("return this")();
            withPropertyChanged(global, "__system_global_test__", 42, () => {
                expect(globalThis).to.be.an("object");
                expect(globalThis).to.equal(global);
                expect(globalThis).to.have.a.property("__system_global_test__", 42);
            });
        }),
        probe("`globalThis' global property has the correct property descriptor", () => {
            const global = Function("return this")();
            expect(global).to.have.own.ownPropertyDescriptor("globalThis").that.contains({
                value: global,
                enumerable: false,
                configurable: true,
                writable: true
            });
        })
    ]),
    group("optional chaining operator (?.)", [
        probe("optional property access", () => {
            eval(`
                const foo = {baz: 42};
                const bar = null;
                expect(foo?.baz).to.equal(42);
                expect(bar?.baz).to.be.undefined;
            `);
        }),
        probe("optional bracket access", () => {
            eval(`
                const foo = {baz: 42};
                const bar = null;
                expect(foo?.["baz"]).to.equal(42);
                expect(bar?.["baz"]).to.be.undefined;
            `);
        }),
        probe("optional method call", () => {
            eval(`
                const foo = {
                    baz() {
                        return this.value;
                    },
                    value: 42
                };
                const bar = null;
                expect(foo?.baz()).to.equal(42);
                expect(bar?.baz()).to.be.undefined;
            `);
        }),
        probe("optional function call", () => {
            eval(`
                const foo = {
                    baz() {
                        return 42;
                    }
                };
                const bar = {};
                function baz() {
                    return 42;
                }
                let n;
                expect(foo.baz?.()).to.equal(42);
                expect(bar.baz?.()).to.be.undefined;
                expect(baz?.()).to.equal(42);
                expect(n?.()).to.be.undefined;
            `);
        }),
        probe("spread parameters after optional chaining", () => {
            eval(`
                const fn = null;
                const n  = null;
                const o  = {};
                expect(fn?.(...[], 1)).to.be.undefined;
                expect(fn?.(...[], ...[])).to.be.undefined;
                expect(o.method?.(...[], 1)).to.be.undefined;
                expect(n?.method(...[], 1)).to.be.undefined;
            `);
        })
    ])
]);

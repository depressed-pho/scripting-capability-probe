import { Expectation, group, probe, expect } from "../../probing-toolkit";

export default group("features", [
    group("Object static methods", [
        probe("Object.values", () => {
            const obj = Object.create({a: "qux", d: "qux"});
            obj.a = "foo";
            obj.b = "bar";
            obj.c = "baz";
            expect(Object.values(obj)).to.deeply.equal(["foo", "bar", "baz"]);
        }),
        probe("Object.entires", () => {
            const obj = Object.create({a: "qux", d: "qux"});
            obj.a = "foo";
            obj.b = "bar";
            obj.c = "baz";
            expect(Object.entries(obj)).to.deeply.equal([
                ["a", "foo"],
                ["b", "bar"],
                ["c", "baz"]
            ]);
        }),
        probe("Object.getOwnPropertyDescriptors", () => {
            const B   = Symbol('b');
            const obj = {a: 1, [B]: 2};
            const O   = Object.defineProperty(obj, "c", {value: 3});
            const D   = Object.getOwnPropertyDescriptors(O);
            expect(D).to.have.a.property("a").that.contains({
                value:        1,
                enumerable:   true,
                configurable: true,
                writable:     true
            });
            expect(D).to.have.a.property(B).that.contains({
                value:        2,
                enumerable:   true,
                configurable: true,
                writable:     true
            });
            expect(D).to.have.a.property("c").that.contains({
                value:        3,
                enumerable:   false,
                configurable: false,
                writable:     false
            });
        }),
        probe("Object.getOwnPropertyDescriptors doesn't provide undefined descriptors", () => {
            var P = new Proxy({a: 1}, {
                getOwnPropertyDescriptor() {
                    return undefined;
                }
            });
            expect(Object.getOwnPropertyDescriptors(P)).to.not.have.a.property("a");
        })
    ]),
    group("String padding", [
        probe("String.prototype.padStart", () => {
            expect("hello".padStart(10)).to.equal("     hello");
            expect("hello".padStart(10, "1234")).to.equal("12341hello");
            expect("hello".padStart(6, "123")).to.equal("1hello");
            expect("hello".padStart(3)).to.equal("hello");
            expect("hello".padStart(3, "123")).to.equal("hello");
        }),
        probe("String.prototype.padEnd", () => {
            expect("hello".padEnd(10)).to.equal("hello     ");
            expect("hello".padEnd(10, "1234")).to.equal("hello12341");
            expect("hello".padEnd(6, "123")).to.equal("hello1");
            expect("hello".padEnd(3)).to.equal("hello");
            expect("hello".padEnd(3, "123")).to.equal("hello");
        })
    ]),
    group("trailing commas in function syntax", [
        probe("in parameter lists", () => {
            const f = eval(`
                function f(a, b, ) {}
                f
            `);
            expect(f).to.be.a("function").that.has.a.property("length", 2);
        }),
        probe("in arguments lists", () => {
            const a = eval(`Array.of(1, 2, 3, )`);
            expect(a).to.deeply.equal([1, 2, 3]);
        })
    ]),
    group("async functions", [
        probe("return", async () => {
            async function a() {
                return "foo";
            }
            const p = a();
            expect(p).to.be.a("Promise");
            expect(await p.then(x => x)).to.equal("foo");
        }),
        probe("throw", async () => {
            async function a() {
                throw "foo";
            }
            var p = a();
            expect(p).to.be.a("Promise");
            expect(await p.catch(x => x)).to.equal("foo");
        }),
        probe("no line break between async and function", () => {
            function f() {
                Function("async\n function a() {}")();
            }
            expect(f).to.throw(ReferenceError); // for "async" not being
                                                // defined. Dunno if that's
                                                // correct though.
        }),
        probe("doesn't have a prototype", () => {
            async function a() {}
            expect(a).to.not.have.own.property("prototype");
        }),
        probe("await", async () => {
            const x = await new Promise(resolve => resolve("foo"));
            expect(x).to.equal("foo");
        }),
        probe("await, rejection", async () => {
            try {
                await new Promise((_, reject) => reject("foo"));
                Expectation.fail();
            }
            catch (e) {
                expect(e).to.equal("foo");
            }
        }),
        probe("must await a value", () => {
            function f() {
                eval(`
                    async function a() {
                        await;
                    }
                    a()
                `);
            }
            expect(f).to.throw(SyntaxError);
        }),
        probe("can await non-Promise values", async () => {
            expect(await "foo").to.equal("foo");
        }),
        probe("no await in function parameter defaults", () => {
            function f() {
                eval(`
                    async function a(x = await 123) {}
                    a()
                `);
            }
            expect(f).to.throw(SyntaxError);
        }),
        probe("async methods, object literals", async () => {
            const obj = {
                async a() {
                    return await Promise.resolve("foo");
                }
            };
            const p = obj.a();
            expect(p).to.be.a("Promise");
            expect(await p).to.equal("foo");
        }),
        probe("async methods, classes", async () => {
            class C {
                async a() {
                    return await Promise.resolve("foo");
                }
            }
            const p = new C().a();
            expect(p).to.be.a("Promise");
            expect(await p).to.equal("foo");
        }),
        probe("async arrow functions in methods, classes", async () => {
            function invoke<T>(cb: () => T): T {
                return cb();
            }
            class C {
                async a() {
                    await invoke(async () => {
                        expect(await 1).to.equal(1);
                    });
                }
            }
            await new C().a();
        }),
        probe("async arrow functions", async () => {
            const a = async () => await Promise.resolve("foo");
            const p = a();
            expect(p).to.be.a("Promise");
            expect(await p).to.equal("foo");
        }),
        probe("correct prototype chain", () => {
            const asyncFunctionProto = Object.getPrototypeOf(async function () {});
            expect(asyncFunctionProto).to.not.equal(function () {}.prototype);
            expect(Object.getPrototypeOf(asyncFunctionProto)).to.equal(Function.prototype);
        }),
        probe("async function prototype, Symbol.toStringTag", () => {
            const asyncFunctionProto = Object.getPrototypeOf(async function () {});
            expect(asyncFunctionProto).to.have.a.property(Symbol.toStringTag, "AsyncFunction");
        }),
        probe("async function constructor", async () => {
            const a = async function () {}.constructor(`return "foo"`);
            const p = a();
            expect(p).to.be.a("Promise");
            expect(await p).to.equal("foo");
        })
    ]),
    group("shared memory and atomics", [
        probe("SharedArrayBuffer", () => {
            expect(new SharedArrayBuffer(8)).to.be.a("SharedArrayBuffer");
        }),
        probe("SharedArrayBuffer[@@species]", () => {
            expect(SharedArrayBuffer).to.have.a.property(Symbol.species, SharedArrayBuffer);
        }),
        probe("SharedArrayBuffer.prototype.byteLength", () => {
            expect(new SharedArrayBuffer(8)).to.have.a.property("byteLength", 8);
        }),
        probe("SharedArrayBuffer.prototype.slice", () => {
            const buf = new SharedArrayBuffer(8);
            expect(buf.slice(1)).to.have.a.property("byteLength", 7);
        }),
        probe("SharedArrayBuffer.prototype[@@toStringTag]", () => {
            expect(SharedArrayBuffer).to.have.a.property("prototype")
                .that.has.a.property(Symbol.toStringTag, "SharedArrayBuffer");
        }),
        probe("Atomics.add", () => {
            const u8 = new Uint8Array(new SharedArrayBuffer(8));
            u8[0] = 7;
            expect(Atomics.add(u8, 0, 2)).to.equal(7);
            expect(u8[0]).to.equal(9);
        }),
        probe("Atomics.and", () => {
            const u8 = new Uint8Array(new SharedArrayBuffer(8));
            u8[0] = 0b101;
            expect(Atomics.and(u8, 0, 0b110)).to.equal(0b101);
            expect(u8[0]).to.equal(0b100);
        }),
        probe("Atomics.compareExchange", () => {
            const u8 = new Uint8Array(new SharedArrayBuffer(8));
            u8[0] = 6;
            expect(Atomics.compareExchange(u8, 0, 6, 7)).to.equal(6);
            expect(u8[0]).to.equal(7);
            expect(Atomics.compareExchange(u8, 0, 6, 8)).to.equal(7);
            expect(u8[0]).to.equal(7);
        }),
        probe("Atomics.exchange", () => {
            const u8 = new Uint8Array(new SharedArrayBuffer(8));
            u8[0] = 6;
            expect(Atomics.exchange(u8, 0, 7)).to.equal(6);
            expect(u8[0]).to.equal(7);
        }),
        probe("Atomics.wait", () => {
            // NOTE: Atomics.wait might not be allowed to block the main
            // thread but there are currently no known ways to spawn a
            // thread in Minecraft (aside from the non-standard os.Worker
            // from QuickJS). We can't actually test its functionality.
            expect(Atomics).to.have.a.property("wait").that.is.a("function");
        }),
        probe("Atomics.notify", () => {
            // NOTE: We can't actually have anyone blocking a thread. See
            // above.
            const i32 = new Int32Array(new SharedArrayBuffer(8));
            expect(Atomics.notify(i32, 0)).to.equal(0);
        }),
        probe("Atomics.isLockFree", () => {
            // We don't know if shared buffers are lock-free or not.
            expect(Atomics.isLockFree(4)).to.be.a("boolean");
        }),
        probe("Atomics.load", () => {
            const u8 = new Uint8Array(new SharedArrayBuffer(8));
            u8[0] = 6;
            expect(Atomics.load(u8, 0)).to.equal(6);
        }),
        probe("Atomics.or", () => {
            const u8 = new Uint8Array(new SharedArrayBuffer(8));
            u8[0] = 0b101;
            expect(Atomics.or(u8, 0, 0b110)).to.equal(0b101);
            expect(u8[0]).to.equal(0b111);
        }),
        probe("Atomics.store", () => {
            const u8 = new Uint8Array(new SharedArrayBuffer(8));
            expect(Atomics.store(u8, 0, 6)).to.equal(6);
            expect(u8[0]).to.equal(6);
        }),
        probe("Atomics.sub", () => {
            const u8 = new Uint8Array(new SharedArrayBuffer(8));
            u8[0] = 6;
            expect(Atomics.sub(u8, 0, 2)).to.equal(6);
            expect(u8[0]).to.equal(4);
        }),
        probe("Atomics.xor", () => {
            const u8 = new Uint8Array(new SharedArrayBuffer(8));
            u8[0] = 0b101;
            expect(Atomics.xor(u8, 0, 0b110)).to.equal(0b101);
            expect(u8[0]).to.equal(0b011);
        }),
    ])
]);

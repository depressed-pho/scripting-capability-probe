import { group, probe, expect } from "../../probing-toolkit.js";

export default group("features", [
    group("object rest/spread properties", [
        probe("object rest properties", () => {
            const {a, ...rest} = {a: 1, b: 2, c: 3};
            expect(a).to.equal(1);
            expect(rest).to.deeply.equal({b: 2, c: 3});
        }),
        probe("object spread properties", () => {
            const spread = {b: 2, c: 3};
            const obj    = {a: 1, ...spread};
            expect(obj).to.deeply.equal({a: 1, b: 2, c: 3});
        })
    ]),
    group("Promise.prototype.finally", [
        probe("basic support", async () => {
            const res    = Promise.resolve("foo");
            const rej    = Promise.reject("bar");
            let   passed = 0;
            function fin() {
                passed++;
            }
            expect(await res.finally(fin)).to.equal("foo");
            expect(await rej.finally(fin).catch(x => x)).to.equal("bar");
            expect(passed).to.equal(2);
        }),
        probe("doesn't change resolution values", async () => {
            const res = Promise.resolve("foo");
            const rej = Promise.reject("bar");
            function fin() {
                return Promise.resolve("bar");
            }
            expect(await res.finally(fin)).to.equal("foo");
            expect(await rej.finally(fin).catch(x => x)).to.equal("bar");
        }),
        probe("changes rejection values", async () => {
            const res = Promise.resolve("foo");
            const rej = Promise.reject("bar");
            function fin() {
                return Promise.reject("baz");
            }
            expect(await res.finally(fin).catch(x => x)).to.equal("baz");
            expect(await rej.finally(fin).catch(x => x)).to.equal("baz");
        })
    ]),
    group("regular expressions", [
        probe("s (dotAll) flag", () => {
            const regex = /foo.bar/s;
            expect(regex.test("foo\nbar")).to.be.true;
        }),
        probe("named capture groups", () => {
            const res = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/.exec("2016-03-11");
            expect(res).to.have.a.property("groups")
                .that.contains({year: "2016", month: "03", day: "11"});
            expect(res).to.have.a.property(0, "2016-03-11");
            expect(res).to.have.a.property(1, "2016");
            expect(res).to.have.a.property(2, "03");
            expect(res).to.have.a.property(3, "11");
        }),
        probe("lookbehind assertions", () => {
            expect(/(?<=a)b/.test("ab")).to.be.true;
            expect(/(?<!a)b/.test("cb")).to.be.true;
            expect(/(?<=a)b/.test("b")).to.be.false;
        }),
        probe("Unicode property escapes", () => {
            expect(/\p{Script=Greek}/u.test("π")).to.be.true;
        })
    ]),
    group("Asynchronous iterators", [
        probe("async generators", async () => {
            async function* generator() {
                yield 42;
            }
            var iterator = generator();
            await iterator.next().then(step => {
                expect(iterator[Symbol.asyncIterator]()).to.equal(iterator);
                expect(step).to.have.a.property("done", false);
                expect(step).to.have.a.property("value", 42);
            });
        }),
        probe("for-await-of loops", async () => {
            const asyncIterable = {
                [Symbol.asyncIterator]() {
                    let i = 0;
                    return {
                        next() {
                            switch (++i) {
                                case 1: return Promise.resolve({done: false, value: "a"});
                                case 2: return Promise.resolve({done: false, value: "b"});
                            }
                            return Promise.resolve({done: true, value: undefined});
                        }
                    };
                }
            };
            const result = [];
            for await (const value of asyncIterable) {
                result.push(value);
            }
            expect(result).to.deeply.equal(["a", "b"]);
        })
    ])
]);

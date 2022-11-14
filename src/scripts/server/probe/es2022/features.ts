import { group, probe, expect } from "../../probing-toolkit";

export default group("features", [
    group("instance class fields", [
        probe("public instance class fields", () => {
            const C = eval(`
                class C {
                    foo = "bar";
                }
                C
            `);
            expect(new C()).to.have.a.property("foo", "bar");
        }),
        probe("private instance class fields basic support", () => {
            const C = eval(`
                class C {
                    #x;
                    constructor(x) {
                        this.#x = x;
                    }
                    x() {
                        return this.#x;
                    }
                }
                C
            `);
            expect(new C(42).x()).to.equal(42);
        }),
        probe("private instance class fields initializers", () => {
            const C = eval(`
                class C {
                    #x = 42;
                    x() {
                        return this.#x;
                    }
                }
                C
            `);
            expect(new C().x()).to.equal(42);
        }),
        probe("optional private instance class fields access", () => {
            const C = eval(`
                class C {
                    #x = 42;
                    x(o = this) {
                        return o?.#x;
                    }
                }
                C
            `);
            expect(new C().x()).to.equal(42);
            expect(new C().x(null)).to.be.undefined;
        }),
    ])
]);

import { group, probe, expect } from "../../probing-toolkit";

export default group("Subclassing", [
    group("Array is subclassable", [
        probe("length property (getting)", () => {
            class C extends Array {}
            const c = new C();
            expect(c).to.have.lengthOf(0);
            c[2] = "foo";
            expect(c).to.have.lengthOf(3);
        }),
        probe("length property (setting)", () => {
            class C extends Array {}
            const c = new C();
            c[2] = "foo";
            c.length = 1;
            expect(c).to.have.lengthOf(1);
            expect(c).to.not.have.a.property(2);
        }),
        probe("correct prototype chain", () => {
            class C extends Array {}
            const c = new C();
            expect(c).to.be.an.instanceOf(C);
            expect(c).to.be.an.instanceOf(Array);
            expect(Object.getPrototypeOf(C)).to.equal(Array);
        }),
        probe("Array.isArray support", () => {
            class C extends Array {}
            expect(Array.isArray(new C())).to.be.true;
        }),
        probe("Array.prototype.concat", () => {
            class C extends Array {}
            const c = new C();
            expect(c.concat(1)).to.be.an.instanceOf(C);
        }),
        probe("Array.prototype.filter", () => {
            class C extends Array {}
            const c = new C();
            expect(c.filter(Boolean)).to.be.an.instanceOf(C);
        }),
    ])
]);

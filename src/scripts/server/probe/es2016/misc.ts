import { group, probe, expect } from "../../probing-toolkit.js";
import { PropGetRecorder } from "../_utils.js";

export default group("misc", [
    probe("generator functions can't be used with `new'", () => {
        function* generator() {
            yield 3;
        }
        function f() {
            new (generator as any)();
        }
        expect(f).to.throw(TypeError);
    }),
    probe("generator throw() caught by inner generator", () => {
        function* generator() {
            function* inner() {
                try {
                    yield "foo";
                }
                catch (e) {}
            }
            yield* inner();
            yield "bar";
        }
        const iter = generator();
        iter.next();
        expect(iter.throw(undefined)).to.have.a.property("value", "bar");
    }),
    probe("nested rest destructuring, declarations", () => {
        const [x, ...[y, ...z]] = [1, 2, 3, 4];
        expect(x).to.equal(1);
        expect(y).to.equal(2);
        expect(z).to.deeply.equal([3, 4]);
    }),
    probe("nested rest destructuring, parameters", () => {
        function f([x, ...[y, ...z]]: any) {
            expect(x).to.equal(1);
            expect(y).to.equal(2);
            expect(z).to.deeply.equal([3, 4]);
        }
        f([1, 2, 3, 4]);
    }),
    probe("Proxy, `enumerate' handler is removed", () => {
        let   passed = true;
        const proxy  = new Proxy({}, {
            enumerate() {
                passed = false;
            }
        } as any);
        for (const _key in proxy); // Should not throw, nor execute the 'enumerate' method.
        expect(passed).to.be.true;
    }),
    probe("Proxy internal calls, Array.prototype.includes", () => {
        // Array.prototype.includes -> Get -> [[Get]]
        const rec1 = new PropGetRecorder({
            length: 3,
            0: "",
            1: "",
            2: "",
            3: ""
        });
        Array.prototype.includes.call(rec1.target, {});
        rec1.assertOrdered(["length", "0", "1", "2"]);

        const rec2 = new PropGetRecorder({
            length: 4,
            0: NaN,
            1: "",
            2: NaN,
            3: ""
        });
        Array.prototype.includes.call(rec2.target, NaN, 1);
        rec2.assertOrdered(["length", "1", "2"]);
    })
]);

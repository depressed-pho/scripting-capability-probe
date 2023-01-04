import { group, probe, expect } from "../../probing-toolkit.js";

export default group("Optimisation", [
    group("Tail call optimisation", [
        probe("direct recursion", () => {
            "use strict";
            function f(n: number): string {
                if (n <= 0) {
                    return "foo";
                }
                else {
                    return f(n - 1);
                }
            }
            expect(f(1e6)).to.equal("foo");
        }),
        probe("mutual recursion", () => {
            "use strict";
            function f(n: number): string {
                if (n <= 0) {
                    return "foo";
                }
                else {
                    return g(n - 1);
                }
            }
            function g(n: number): string {
                if (n <= 0) {
                    return "foo";
                }
                else {
                    return f(n - 1);
                }
            }
            expect(f(1e6)).to.equal("foo");
            expect(f(1e6+1)).to.equal("bar");
        })
    ])
]);

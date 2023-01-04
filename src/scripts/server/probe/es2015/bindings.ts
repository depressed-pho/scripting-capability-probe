import { group, probe, expect } from "../../probing-toolkit.js";

export default group("Bindings", [
    group("const", [
        probe("basic support", () => {
            const foo = 123;
            expect(foo).to.equal(123);
        }),
        probe("is block-scoped", () => {
            const foo = 123;
            // @ts-ignore: `foo' won't be read.
            { const foo = 456; }
            expect(foo).to.equal(123);
        }),
        probe("scope shadow resolution", () => {
            // @ts-ignore: `foo' won't be read.
            { const foo = 456; }
            const foo = 123;
            expect(foo).to.equal(123);
        }),
        probe("cannot be in statements", () => {
            function f() {
                eval(`if (true) const foo = 1;`);
            }
            expect(f).to.throw(SyntaxError);
        }),
        probe("redefining a const is an error", () => {
            function f() {
                eval(`const foo = 1; const foo = 2;`);
            }
            expect(f).to.throw(SyntaxError);
        }),
        probe("for loop statement scope", () => {
            const foo = 0;
            // @ts-ignore: `foo' won't be read.
            for (const foo = 1; false; ) {}
            expect(foo).to.equal(0);
        }),
        probe("for-in loop iteration scope", () => {
            const scopes = [];
            for (const i in {a: 1, b: 1}) {
                scopes.push(function () { return i });
            }
            expect(scopes[0]!()).to.equal("a");
            expect(scopes[1]!()).to.equal("b");
        }),
        probe("for-of loop iteration scope", () => {
            const scopes = [];
            for (const i of ["a", "b"]) {
                scopes.push(function () { return i });
            }
            expect(scopes[0]!()).to.equal("a");
            expect(scopes[1]!()).to.equal("b");
        }),
        probe("temporal dead zone", () => {
            const f = function () {
                return qux;
            };
            expect(f).to.throw(ReferenceError);

            function g() {
                return qux;
            }
            const qux = 123;

            expect(g()).to.equal(123);
        })
    ]),
    group("let", [
        probe("basic support", () => {
            let foo = 123;
            expect(foo).to.equal(123);
        }),
        probe("is block-scoped", () => {
            let foo = 123;
            // @ts-ignore: `foo' won't be read.
            { let foo = 456; }
            expect(foo).to.equal(123);
        }),
        probe("scope shadow resolution", () => {
            // @ts-ignore: `foo' won't be read.
            { let foo = 456; }
            let foo = 123;
            expect(foo).to.equal(123);
        }),
        probe("cannot be in statements", () => {
            function f() {
                eval(`if (true) let foo = 1;`);
            }
            expect(f).to.throw(SyntaxError);
        }),
        probe("for loop statement scope", () => {
            let foo = 0;
            // @ts-ignore: `foo' won't be read.
            for (let foo = 1; false; ) {}
            expect(foo).to.equal(0);
        }),
        probe("for-in loop iteration scope", () => {
            let scopes = [];
            for (let i in {a: 1, b: 1}) {
                scopes.push(function () { return i });
            }
            expect(scopes[0]!()).to.equal("a");
            expect(scopes[1]!()).to.equal("b");
        }),
        probe("for-of loop iteration scope", () => {
            let scopes = [];
            for (let i of ["a", "b"]) {
                scopes.push(function () { return i });
            }
            expect(scopes[0]!()).to.equal("a");
            expect(scopes[1]!()).to.equal("b");
        }),
        probe("temporal dead zone", () => {
            let f = function () {
                return qux;
            };
            expect(f).to.throw(ReferenceError);

            function g() {
                return qux;
            }
            let qux = 123;

            expect(g()).to.equal(123);
        })
    ]),
    probe("block-level function declaration", () => {
        expect(f()).to.equal(1);
        function f() {
            return 1;
        }

        {
            expect(f()).to.equal(2);
            function f() {
                return 2;
            }
            expect(f()).to.equal(2);
        }

        expect(f()).to.equal(1);
    })
]);

import { group, probe, expect } from "../../probing-toolkit";

export default group("misc", [
    probe("RegExp `u' flag, case folding", () => {
        expect("ſ".match(/\w/iu)).not.to.be.null;
        expect("ſ".match(/\W/iu)).to.be.null;
        expect("\u212a".match(/\w/iu)).not.to.be.null;
        expect("\u212a".match(/\W/iu)).to.be.null;
        expect("\u212a".match(/.\b/iu)).not.to.be.null;
        expect("ſ".match(/.\b/iu)).not.to.be.null;
        expect("\u212a".match(/.\B/iu)).to.be.null;
        expect("ſ".match(/.\B/iu)).to.be.null;
    }),
    probe("arguments.caller is removed", () => {
        function f() {
            "use strict";
            expect(arguments).to.not.have.own.property("caller");
        }
        f();
    })
]);

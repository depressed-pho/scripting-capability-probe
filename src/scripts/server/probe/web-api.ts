import { group, probe, expect } from "../probing-toolkit.js";

export default group("Web APIs", [
    probe("`WebAssembly' object exists", () => {
        expect(WebAssembly).to.be.an("object");
    }),
    probe("`Worker' constructor exists", () => {
        expect(Worker).to.be.a("function");
    })
]);

import { group, probe } from "../../probing-toolkit";

export default group("system modules", [
    probe("`std' module exists", async () => {
        // @ts-ignore: TypeScript of course knows nothing about it.
        await import("std");
    }),
    probe("`os' module exists", async () => {
        // @ts-ignore
        await import("os");
    })
]);

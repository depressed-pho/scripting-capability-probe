import { console } from "cicada-lib/console";
import { hasInstance } from "cicada-lib/has-instance";
import * as Fmt from "cicada-lib/fmt-code";
import { Probe } from "./probe";
import { useFormatCodes } from "./config";

export class Group {
    readonly #title?: string; // Groups can be anonymous.
    readonly #children: (Group|Probe)[];

    public constructor(title: string|undefined, children: (Group|Probe)[]) {
        this.#title    = title;
        this.#children = children;
    }

    /** Get the total number of probes in this group or its subgroups. */
    public get size(): number {
        let n = 0;
        for (const child of this.#children) {
            if (child instanceof Group) {
                n += child.size;
            }
            else {
                console.assert(child instanceof Probe);
                n++;
            }
        }
        return n;
    }

    #enter(groupLevel: number): void {
        if (this.#title != null) {
            if (useFormatCodes) {
                const style: Fmt.Code[] = (() => {
                    switch (groupLevel) {
                        case 0:  return [Fmt.bold, Fmt.italicise];
                        case 1:  return [Fmt.bold];
                        case 2:  return [Fmt.setColour(Fmt.Colour.Gold)];
                        default: return [];
                    }
                })();
                console.group(
                    Fmt.toString(style)
                        + this.#title
                        + Fmt.toString([Fmt.reset]));
            }
            else {
                console.group(this.#title);
            }
        }
    }

    #leave(): void {
        if (this.#title != null) {
            console.groupEnd();
        }
    }

    public async *run(beforeProbe?: () => Promise<unknown>,
                      afterProbe?:  () => Promise<unknown>,
                      groupLevel: number = 0): AsyncGenerator {
        this.#enter(groupLevel);
        try {
            for (const child of this.#children) {
                if (child instanceof Group) {
                    yield* child.run(beforeProbe, afterProbe, groupLevel + 1);
                }
                else {
                    console.assert(child instanceof Probe);
                    if (beforeProbe) {
                        await beforeProbe();
                    }
                    yield* child;
                    if (afterProbe) {
                        await afterProbe();
                    }
                }
            }
        }
        finally {
            this.#leave();
        }
    }

    public [Symbol.asyncIterator](): AsyncGenerator {
        return this.run();
    }

    /* Workaround for
     * https://github.com/MicrosoftDocs/minecraft-creator/issues/353 */
    static [Symbol.hasInstance](obj: any): boolean {
        return hasInstance(obj, this);
    }
}

export function group(children: (Group|Probe)[]): Group;
export function group(title: string, children: (Group|Probe)[]): Group;

export function group(arg0: string|(Group|Probe)[], arg1?: (Group|Probe)[]): Group {
    if (typeof arg0 === "string") {
        return new Group(arg0, arg1!);
    }
    else {
        return new Group(undefined, arg0);
    }
}

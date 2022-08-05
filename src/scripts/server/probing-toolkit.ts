import { console } from "../cicada-lib/console";
import { deepEqual } from "../cicada-lib/deep-equal";
import { hasInstance } from "../cicada-lib/has-instance";
import { inspect, InspectOptions } from "../cicada-lib/inspect";
import { ThreadCancellationRequested } from "../cicada-lib/thread";
import { format } from "../cicada-lib/format";
import * as Fmt from "../cicada-lib/fmt-code";

// THINKME: These should be controllable with UI.
const useFormatCodes = true;
const showFailureDetails = false;

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
                      groupLevel: number = 0): AsyncGenerator {
        this.#enter(groupLevel);
        for (const child of this.#children) {
            if (child instanceof Group) {
                yield* child.run(beforeProbe, groupLevel + 1);
            }
            else {
                console.assert(child instanceof Probe);
                if (beforeProbe) {
                    await beforeProbe();
                }
                yield* child;
            }
        }
        this.#leave();
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

export class Probe {
    readonly #title: string;
    readonly #worker: () => AsyncGenerator;

    public constructor(title: string, worker: () => AsyncGenerator) {
        this.#title  = title;
        this.#worker = worker;
    }

    public async *[Symbol.asyncIterator](): AsyncGenerator {
        // The worker function may throw exceptions. Catch and treat them
        // as failure except for ThreadCancellationRequested which should
        // only be caught by the thread root.
        try {
            yield* this.#worker();
            if (useFormatCodes) {
                console.log(
                    Fmt.toString([Fmt.setColour(Fmt.Colour.Green)])
                        + "✓ "
                        + Fmt.toString([Fmt.setColour(Fmt.Colour.Gray)])
                        + this.#title
                        + Fmt.toString([Fmt.reset]));
            }
            else {
                console.log("✓ " + this.#title);
            }
        }
        catch (e) {
            if (e instanceof ThreadCancellationRequested) {
                throw e;
            }
            else {
                if (useFormatCodes) {
                    console.log(
                        Fmt.toString([Fmt.setColour(Fmt.Colour.Red)])
                            + "✗ "
                            + Fmt.toString([Fmt.setColour(Fmt.Colour.Gray)])
                            + this.#title
                            + Fmt.toString([Fmt.reset]));
                }
                else {
                    console.log("✗ " + this.#title);
                }

                if (showFailureDetails) {
                    console.log(e);
                }
            }
        }
    }

    /* Workaround for
     * https://github.com/MicrosoftDocs/minecraft-creator/issues/353 */
    static [Symbol.hasInstance](obj: any): boolean {
        return hasInstance(obj, this);
    }
}

export function probe(title: string, worker: () => AsyncGenerator) {
    return new Probe(title, worker);
}

// Chai.js-like expectation API.
export function expect(val: any): Expectation {
    return new Expectation(val);
}

export class ExpectationFailed extends Error {
    public constructor(message?: string, options?: ErrorOptions) {
        super(message, options);
    }
}

export class Expectation {
    #val: any;
    #deep: boolean;
    #own: boolean;

    public constructor(val: any) {
        this.#val  = val;
        this.#deep = false;
        this.#own  = false;
    }

    static #pretty(val: any): string {
        return inspect(val, {
            colors:  useFormatCodes,
            compact: true
        });
    }

    // Language chains
    public get to():    this { return this; }
    public get be():    this { return this; }
    public get been():  this { return this; }
    public get is():    this { return this; }
    public get that():  this { return this; }
    public get which(): this { return this; }
    public get and():   this { return this; }
    public get has():   this { return this; }
    public get have():  this { return this; }
    public get with():  this { return this; }
    public get at():    this { return this; }
    public get of():    this { return this; }
    public get same():  this { return this; }
    public get but():   this { return this; }
    public get does():  this { return this; }
    public get still(): this { return this; }
    public get also():  this { return this; }

    /** Make subsequent calls of {@link equal} test for deep equality as
     * opposed to strict equality. */
    public get deep(): this {
        this.#deep = true;
        return this;
    }

    /** Equivalent to {@link deep}. */
    public get deeply(): this {
        return this.deep;
    }

    /** Deep equality or strict equality (===) */
    public equal(val: any, msg?: string): this {
        if (this.#deep) {
            if (deepEqual(this.#val, val)) {
                return this;
            }
            else {
                throw new ExpectationFailed(
                    msg != null
                        ? msg
                        : format("%s isn't deeply equal to %s.",
                                 Expectation.#pretty(this.#val),
                                 Expectation.#pretty(val)));
            }
        }
        else {
            if (this.#val === val) {
                return this;
            }
            else {
                throw new ExpectationFailed(
                    msg != null
                        ? msg
                        : format("%s isn't strictly equal to %s.",
                                 Expectation.#pretty(this.#val),
                                 Expectation.#pretty(val)));
            }
        }
    }

    /** Make subsequent calls of {@link property} search for only own properties
     * of the value, ignoring their inherited ones. */
    public get own(): this {
        this.#own = true;
        return this;
    }

    /** Existence of a property with optional value */
    public property(key: PropertyKey, val?: any, msg?: string): this {
        if (this.#own) {
            if (!Object.prototype.hasOwnProperty.call(this.#val, key)) {
                throw new ExpectationFailed(
                    msg != null
                        ? msg
                        : format("%s does not have its own property %s",
                                 Expectation.#pretty(this.#val),
                                 Expectation.#pretty(key)));
            }
        }
        else {
            if (!(key in this.#val)) {
                throw new ExpectationFailed(
                    msg != null
                        ? msg
                        : format("%s does not have a property %s",
                                 Expectation.#pretty(this.#val),
                                 Expectation.#pretty(key)));
            }
        }

        this.#val = this.#val[key];

        if (arguments.length > 1) {
            return this.equal(val, msg);
        }
        else {
            return this;
        }
    }
}

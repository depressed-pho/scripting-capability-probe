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
                    // It's possible that the probe didn't yield even once. Do
                    // it now, or we wouldn't be able to cancel the thread.
                    yield;
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
    #not: boolean;
    #own: boolean;

    public constructor(val: any) {
        this.#val  = val;
        this.#deep = false;
        this.#not  = false;
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

    /** Negate subsequent tests. */
    public get not(): this {
        this.#not = true;
        return this;
    }

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
            if (this.#not) {
                if (!deepEqual(this.#val, val)) {
                    return this;
                }
                else {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s is deeply equal to %s.",
                                     Expectation.#pretty(this.#val),
                                     Expectation.#pretty(val)));
                }
            }
            else {
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
        }
        else {
            if (this.#not) {
                if (this.#val !== val) {
                    return this;
                }
                else {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s is strictly equal to %s.",
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
    }

    /** Make subsequent calls of {@link property} search for only own properties
     * of the value, ignoring their inherited ones. */
    public get own(): this {
        this.#own = true;
        return this;
    }

    /** Existence of a property with optional value. */
    public property(key: PropertyKey, val?: any, msg?: string): this {
        if (this.#own) {
            if (this.#not) {
                if (Object.prototype.hasOwnProperty.call(this.#val, key)) {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s has its own property %s",
                                     Expectation.#pretty(this.#val),
                                     Expectation.#pretty(key)));
                }
            }
            else {
                if (!Object.prototype.hasOwnProperty.call(this.#val, key)) {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s does not have its own property %s",
                                     Expectation.#pretty(this.#val),
                                     Expectation.#pretty(key)));
                }
            }
        }
        else {
            if (this.#not) {
                if (key in this.#val) {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s does not have a property %s",
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
        }

        this.#val = this.#val[key];

        if (arguments.length > 1) {
            return this.equal(val, msg);
        }
        else {
            return this;
        }
    }

    /** Expectation of an exception by calling the value as a nullary
     * function. */
    public throw(): this;
    public throw(errorCtor: Function): this;
    public throw(errorMsg: string|RegExp): this;
    public throw(errorCtor: Function, errorMsg: string|RegExp, msg?: string): this;
    public throw(...args: any[]): this {
        let errorCtor: Function|null = null;
        let errorMsg: RegExp|null = null;
        let msg: string|null = null;

        function toRegExp(msg: string|RegExp): RegExp {
            return typeof msg === "string"
                ? new RegExp(msg)
                : msg;
        }

        switch (args.length) {
            case 0:
                break;
            case 1:
                if (typeof args[0] === "function") {
                    errorCtor = args[0];
                }
                else {
                    errorMsg = toRegExp(args[0]);
                }
                break;
            case 2:
                errorCtor = args[0];
                errorMsg  = toRegExp(args[1]);
                break;
            case 3:
                errorCtor = args[0];
                errorMsg  = toRegExp(args[1]);
                msg       = args[2];
                break;
        }

        if (typeof this.#val !== "function") {
            throw new TypeError("The value is not a function");
        }

        let error: any;
        try {
            this.#val();
        }
        catch (e) {
            error = e;
        }

        if (this.#not) {
            if (error) {
                if (errorCtor && error instanceof errorCtor) {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format(
                                "The function was expected not to throw an" +
                                    " error of type %s but it did threw %s.",
                                Expectation.#pretty(errorCtor),
                                Expectation.#pretty(error)));
                }
                if (errorMsg && errorMsg.test(error.message)) {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format(
                                "The function threw an error whose message" +
                                    " matches %s: %s",
                                Expectation.#pretty(errorMsg),
                                Expectation.#pretty(error)));
                }
                if (!errorCtor && !errorMsg) {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format(
                                "The function was expected not to throw an"+
                                    " error but it did threw %s.",
                                Expectation.#pretty(error)));
                }
                this.#val = error;
                return this;
            }
            else {
                return this;
            }
        }
        else {
            if (error) {
                if (errorCtor && !(error instanceof errorCtor)) {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format(
                                "The function was expected to throw an error" +
                                    " of type %s but actually threw %s.",
                                Expectation.#pretty(errorCtor),
                                Expectation.#pretty(error)));
                }
                if (errorMsg && !errorMsg.test(error.message)) {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format(
                                "The function threw an error whose message" +
                                    " doesn't match %s: %s",
                                Expectation.#pretty(errorMsg),
                                Expectation.#pretty(error)));
                }
                this.#val = error;
                return this;
            }
            else {
                throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : "The function was expected to throw an error " +
                              "but it didn't");
            }
        }
    }
}

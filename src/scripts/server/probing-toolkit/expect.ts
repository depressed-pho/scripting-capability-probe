import { deepEqual } from "cicada-lib/deep-equal";
import { detailedTypeOf } from "cicada-lib/detailed-type-of";
import { inspect } from "cicada-lib/inspect";
import { getPathInfo } from "cicada-lib/objpath";
import { format } from "cicada-lib/format";
import { useFormatCodes } from "./config";

export class ExpectationFailed extends Error {
    public constructor(message?: string, options?: ErrorOptions) {
        super(message, options);
    }
}

/** Create a callable object that calls `asFunc` when called, and invokes
 * `asChain` when used as a language chain. */
function makeHybrid<T, F1 extends (this: unknown, ...args: any[]) => any>(asFunc: F1, asChain: () => T): F1 & T {
    return new Proxy(asFunc, {
        apply(_targ: any, _this: any, args: Parameters<F1>): ReturnType<F1> {
            return asFunc.apply(null, args);
        },
        get(_targ: any, key: PropertyKey): any {
            const self = asChain();
            const prop: any = (self as any)[key];
            if (typeof prop === "function") {
                // If the property is a function, we need to recover `this'
                // or it won't work as a method.
                return prop.bind(self);
            }
            else {
                return prop;
            }
        }
    });
}

export class Expectation {
    #val: any;
    #deep: boolean;
    #include: boolean;
    #itself: boolean;
    #nested: boolean;
    #not: boolean;
    #own: boolean;

    public constructor(val: any) {
        this.#val     = val;
        this.#deep    = false;
        this.#include = false;
        this.#itself  = false;
        this.#nested  = false;
        this.#not     = false;
        this.#own     = false;
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

    /** Force subsequent calls of {@link respondTo} to treat the target as
     * a non-function object even if it's a function. In other words, test
     * for static methods of a class instead of non-static ones. */
    public get itself(): this {
        this.#itself = true;
        return this;
    }

    /** Boolean tests */
    public get true(): this {
        return this.equal(true);
    }
    public get false(): this {
        return this.equal(false);
    }

    /** Expect that the value is strictly equal (`===`) to `null`. */
    public get null(): this {
        return this.equal(null);
    }

    /** Expect that the value is strictly equal (`===`) to `undefined`. */
    public get undefined(): this {
        return this.equal(undefined);
    }

    /** Expect that the value is of a given type. This can also be used as
     * a language chain. */
    public get a(): ((ty: string, msg?: string) => this) & this {
        /* This is tricky. Create and return a function taking a type name
         * and an optional message, and have it proxy "this". */
        const fn = (ty: string, msg?: string): this => {
            if (this.#not) {
                if (detailedTypeOf(this.#val) !== ty) {
                    return this;
                }
                else {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s is expected not to be of type %s but it is.",
                                     Expectation.#pretty(this.#val), ty));
                }
            }
            else {
                const actualType = detailedTypeOf(this.#val);
                if (actualType === ty) {
                    return this;
                }
                else {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s is expected to be of type %s but it's %s.",
                                     Expectation.#pretty(this.#val), ty, actualType));
                }
            }
        };
        // The reason why we can't just do Object.setPrototypeOf(fn, this)
        // is that the function would then cease to be a Function
        // object. The easiest and the most logical way to do the trick is
        // to create a proxy to `fn'. Note that the proxy cannot target
        // `this' because it would then be non-callable.
        return makeHybrid(fn, () => this);
    }

    /** Alias to {link a} */
    public get an(): ((ty: string, msg?: string) => this) & this {
        return this.a;
    }

    /** Deep equality or strict equality (`===`) */
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
                            : format("%s is expected not to be deeply equal to %s.",
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
                            : format("%s is expected to be deeply equal to %s.",
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
                            : format("%s is expected not to be strictly equal to %s.",
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
                            : format("%s is expected to be strictly equal to %s.",
                                     Expectation.#pretty(this.#val),
                                     Expectation.#pretty(val)));
                }
            }
        }
    }

    /** Alias to {@link equal}. */
    public equals(val: any, msg?: string): this {
        return this.equal(val, msg);
    }

    /** Make subsequent calls of {@link property} search for only own properties
     * of the value, ignoring their inherited ones. */
    public get own(): this {
        if (this.#nested) {
            throw new Error(".own cannot be combined with .nested");
        }
        else {
            this.#own = true;
            return this;
        }
    }

    /** Make subsequent calls of {@link property} accept dot- and bracket-
     * notations for the property keys. */
    public get nested(): this {
        if (this.#own) {
            throw new Error(".nested cannot be combined with .own");
        }
        else {
            this.#nested = true;
            return this;
        }
    }

    /** Assert that the target value is not a primitive and is
     * extensible. */
    public get extensible(): this {
        if (this.#not) {
            if (Object(this.#val) !== this.#val ||
                !Object.isExtensible(this.#val)) {
                return this;
            }
            else {
                throw new ExpectationFailed(
                    format("%s is expected not to be an extensible object.",
                           Expectation.#pretty(this.#val)));
            }
        }
        else {
            if (Object(this.#val) === this.#val &&
                Object.isExtensible(this.#val)) {
                return this;
            }
            else {
                throw new ExpectationFailed(
                    format("%s is expected to be an extensible object.",
                           Expectation.#pretty(this.#val)));
            }
        }
    }

    /** Assert that the value has a property `length` or `size` whose value
     * equals to a given number. */
    public lengthOf(n: number, msg?: string): this {
        if (this.#not) {
            if (this.#val.length !== undefined) {
                if (this.#val.length != n) {
                    return this;
                }
                else {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s is expected not to have length of %d.",
                                     Expectation.#pretty(this.#val), n));
                }
            }
            else if (this.#val.size !== undefined) {
                if (this.#val.size != n) {
                    return this;
                }
                else {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s is expected not to have size of %d.",
                                     Expectation.#pretty(this.#val), n));
                }
            }
            else {
                throw new TypeError(
                    format("%s does not have length or size.",
                           Expectation.#pretty(this.#val)));
            }
        }
        else {
            if (this.#val.length !== undefined) {
                if (this.#val.length == n) {
                    return this;
                }
                else {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s is expected to have length of %d.",
                                     Expectation.#pretty(this.#val), n));
                }
            }
            else if (this.#val.size !== undefined) {
                if (this.#val.size == n) {
                    return this;
                }
                else {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s is expected to have size of %d.",
                                     Expectation.#pretty(this.#val), n));
                }
            }
            else {
                throw new TypeError(
                    format("%s does not have length or size.",
                           Expectation.#pretty(this.#val)));
            }
        }
    }

    /** Existence of a property with optional value. */
    public property(key: PropertyKey, val?: any, msg?: string): this {
        const ty = typeof this.#val;
        if (ty !== "object" && ty !== "function") {
            throw new ExpectationFailed(
                msg != null
                    ? msg
                    : format("%s is not an object",
                             Expectation.#pretty(this.#val)));
        }

        if (this.#own) {
            if (this.#not) {
                if (Object.prototype.hasOwnProperty.call(this.#val, key)) {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s does have its own property %s",
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
            this.#val = this.#val[key];
        }
        else if (this.#nested) {
            const pathInfo = getPathInfo(this.#val, key);
            if (this.#not) {
                if (pathInfo.exists) {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s does have a nested property %s",
                                     Expectation.#pretty(this.#val),
                                     Expectation.#pretty(key)));
                }
            }
            else {
                if (!pathInfo.exists) {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s does not have a nested property %s",
                                     Expectation.#pretty(this.#val),
                                     Expectation.#pretty(key)));
                }
            }
            this.#val = pathInfo.value;
        }
        else {
            if (this.#not) {
                if (key in this.#val) {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s does have a property %s",
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
        }

        if (arguments.length > 1) {
            return this.equal(val, msg);
        }
        else {
            return this;
        }
    }

    /** Expect that a string value includes a given substring, an array,
     * Set, or WeakSet value includes a given iterable as a subset, a Map
     * or WeakMap value includes a given iterable as a submap, an object
     * value includes a given object as a subset.
     *
     * `include` can also be used as a language chain, causing all {@link
     * members} and {@link keys} assertions that follow in the chain to
     * require the target to be a superset of the expected set, rather than
     * an identical set. Note that {@link members} ignores duplicates in
     * the subset when `include` is in effect.
     */
    public get include(): ((obj: any, msg?: string) => this) & this {
        const fn = (obj: any, msg?: string): this => {
            if (this.#not) {
                if (!this.#includeImpl(obj)) {
                    return this;
                }
                else {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s does include %s",
                                     Expectation.#pretty(this.#val),
                                     Expectation.#pretty(obj)));
                }
            }
            else {
                if (this.#includeImpl(obj)) {
                    return this;
                }
                else {
                    throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s does not include %s",
                                     Expectation.#pretty(this.#val),
                                     Expectation.#pretty(obj)));
                }
            }
        };
        return makeHybrid(fn, () => {
            this.#include = true;
            return this;
        });
    }

    #includeImpl(obj: any): boolean {
        const ty = detailedTypeOf(this.#val);
        switch (ty) {
            case "string":
            case "String":
                return this.#val.indexOf(obj as string) !== -1;

            case "Array":
                if (this.#deep) {
                    for (const e of obj) {
                        if (!this.#val.some((elem: any) => deepEqual(e, elem))) {
                            return false;
                        }
                    }
                    return true;
                }
                else {
                    for (const e of obj) {
                        if (!this.#val.indexOf(e)) {
                            return false;
                        }
                    }
                    return true;
                }

            case "Set":
                if (this.#deep) {
                    for (const e of obj) {
                        let found = false;
                        for (const elem of this.#val) {
                            if (deepEqual(e, elem)) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            return false;
                        }
                    }
                    return true;
                }
                else {
                    for (const e of obj) {
                        if (!this.#val.has(e)) {
                            return false;
                        }
                    }
                    return true;
                }

            case "WeakSet":
                if (this.#deep) {
                    throw new TypeError(
                        format("Weak containers are incompatible with .deep: %s",
                               Expectation.#pretty(this.#val)));
                }
                else {
                    for (const e of obj) {
                        if (!this.#val.has(e)) {
                            return false;
                        }
                    }
                    return true;
                }

            case "Map":
                if (this.#deep) {
                    for (const [k, v] of obj) {
                        let found = false;
                        for (const [key, value] of this.#val) {
                            if (deepEqual(k, key) && deepEqual(v, value)) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            return false;
                        }
                    }
                    return true;
                }
                else {
                    for (const [k, v] of obj) {
                        if (!(this.#val.has(k) && this.#val.get(k) === v)) {
                            return false;
                        }
                    }
                    return true;
                }

            case "WeakMap":
                if (this.#deep) {
                    throw new TypeError(
                        format("Weak containers are incompatible with .deep: %s",
                               Expectation.#pretty(this.#val)));
                }
                else {
                    for (const [k, v] of obj) {
                        if (!(this.#val.has(k) && this.#val.get(k) === v)) {
                            return false;
                        }
                    }
                    return true;
                }

            default:
                if (this.#val !== Object(this.#val)) {
                    throw new TypeError(
                        format("Unsupported type: %s",
                               Expectation.#pretty(this.#val)));
                }
                else {
                    const hasProp = this.#own
                        ? (k: PropertyKey) => Object.prototype.hasOwnProperty.call(this.#val, k)
                        : (k: PropertyKey) => k in this.#val;

                    const equal = this.#deep
                        ? deepEqual
                        : (x: any, y: any) => x === y;

                    for (const k in obj) {
                        if (!(hasProp(k) && equal(this.#val[k], obj[k]))) {
                            return false;
                        }
                    }
                    return true;
                }
        }
    }

    /** Alias to {@include}. */
    public includes(obj: any, msg?: string): this {
        return this.include(obj, msg);
    }

    /** Alias to {@include}. */
    public contain(obj: any, msg?: string): this {
        return this.include(obj, msg);
    }

    /** Alias to {@include}. */
    public contains(obj: any, msg?: string): this {
        return this.include(obj, msg);
    }

    /** Expect that the target set (`Set` or `Array`) has the same
     * elements as the given iterable object. */
    public members(set: Iterable<any>, msg?: string): this {
        if (this.#not) {
            if (!this.#membersImpl(set)) {
                return this;
            }
            else {
                throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s is a superset of %s",
                                     Expectation.#pretty(this.#val),
                                     Expectation.#pretty(set)));
            }
        }
        else {
            if (this.#membersImpl(set)) {
                return this;
            }
            else {
                throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s isn't a superset of %s",
                                     Expectation.#pretty(this.#val),
                                     Expectation.#pretty(set)));
            }
        }
    }

    #membersImpl(set: Iterable<any>): boolean {
        const superset = new Set(this.#val as any);

        // Is `set' a subset of this.#val?
        for (const elem of set) {
            if (this.#deep) {
                let found = false;
                for (const e of superset) {
                    if (deepEqual(e, elem)) {
                        superset.delete(e);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    return false;
                }
            }
            else {
                if (!superset.delete(elem)) {
                    return false;
                }
            }
        }

        if (!this.#include) {
            // Is `set' identical to this.#val?
            return superset.size == 0;
        }
        else {
            return true;
        }
    }

    /** Expect that the value is found in the prototype chain of a given
     * object. */
    public prototypeOf(obj: any, msg?: string): this {
        const ty = typeof this.#val;
        if (ty !== "object" && ty !== "function") {
            throw new ExpectationFailed(
                msg != null
                    ? msg
                    : format("%s is not an object",
                             Expectation.#pretty(this.#val)));
        }

        if (this.#not) {
            if (!Object.prototype.isPrototypeOf.call(this.#val, obj)) {
                return this;
            }
            else {
                throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s is a prototype of %s",
                                     Expectation.#pretty(this.#val),
                                     Expectation.#pretty(obj)));
            }
        }
        else {
            if (Object.prototype.isPrototypeOf.call(this.#val, obj)) {
                return this;
            }
            else {
                throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s is not a prototype of %s",
                                     Expectation.#pretty(this.#val),
                                     Expectation.#pretty(obj)));
            }
        }
    }

    /** Expectation of a property descriptor with an optional
     * deep-equality **/
    public ownPropertyDescriptor(key: PropertyKey, val?: PropertyDescriptor, msg?: string): this {
        const ty = typeof this.#val;
        if (ty !== "object" && ty !== "function") {
            throw new ExpectationFailed(
                msg != null
                    ? msg
                    : format("%s is not an object",
                             Expectation.#pretty(this.#val)));
        }

        const desc = Object.getOwnPropertyDescriptor(this.#val, key);
        if (this.#not) {
            if (desc) {
                throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s does have its own property %s",
                                     Expectation.#pretty(this.#val),
                                     Expectation.#pretty(key)));
            }
        }
        else {
            if (!desc) {
                throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format("%s does not have its own property %s",
                                     Expectation.#pretty(this.#val),
                                     Expectation.#pretty(key)));
            }
        }

        this.#val = desc;
        if (arguments.length > 1) {
            // .deeply modifies the state of "this".
            return new (this.constructor as any)(this.#val)
                .to.deeply.equal(val, msg);
        }
        else {
            return this;
        }
    }

    /** Expect that a given method exists in a class or an object. */
    public respondTo(method: PropertyKey, msg?: string): this {
        if (this.#not) {
            if (typeof this.#val === "object" || typeof this.#val === "function") {
                if (typeof this.#val === "function" && !this.#itself) {
                    if (typeof this.#val.prototype === "object") {
                        if (typeof this.#val.prototype[method] === "function") {
                            throw new ExpectationFailed(
                                msg != null
                                    ? msg
                                    : format("%s does respond to %s",
                                             Expectation.#pretty(this.#val),
                                             Expectation.#pretty(method)));
                        }
                    }
                }
                else {
                    if (typeof this.#val[method] === "function") {
                        throw new ExpectationFailed(
                            msg != null
                                ? msg
                                : format("%s does respond to %s",
                                         Expectation.#pretty(this.#val),
                                         Expectation.#pretty(method)));
                    }
                }
            }
            return this;
        }
        else {
            // We don't want .own to affect .property() here.
            if (typeof this.#val === "function" && !this.#itself) {
                return new (this.constructor as any)(this.#val)
                    .to.have.a.property("prototype")
                    .that.has.a.property(method)
                    .that.is.a("function", msg);
            }
            else {
                return new (this.constructor as any)(this.#val)
                    .to.have.a.property(method)
                    .that.is.a("function", msg);
            }
        }
    }

    /** Alias to {link respondTo}. */
    public respondsTo(method: PropertyKey, msg?: string): this {
        return this.respondTo(method, msg);
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

    /** Expect that the value is an instance of some class. */
    public instanceof(ctor: Function, msg?: string): this {
        if (this.#not) {
            if (!(this.#val instanceof ctor)) {
                return this;
            }
            else {
                throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format(
                                "The value %s is expected not to be an instance of %s but it is.",
                                Expectation.#pretty(this.#val),
                                Expectation.#pretty(ctor)));
            }
        }
        else {
            if (this.#val instanceof ctor) {
                return this;
            }
            else {
                throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format(
                                "The value %s is expected to be an instance of %s but it isn't.",
                                Expectation.#pretty(this.#val),
                                Expectation.#pretty(ctor)));
            }
        }
    }

    /** Alias to {@link instanceof}. */
    public instanceOf(ctor: Function, msg?: string): this {
        return this.instanceof(ctor, msg);
    }

    /** Expect that a given function applied to the value returns true. */
    public satisfy(pred: (v: any) => boolean, msg?: string): this {
        if (this.#not) {
            if (!pred(this.#val)) {
                return this;
            }
            else {
                throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format(
                                "The value %s is expected not to satisfy the predicate %s but it does.",
                                Expectation.#pretty(this.#val),
                                Expectation.#pretty(pred)));
            }
        }
        else {
            if (pred(this.#val)) {
                return this;
            }
            else {
                throw new ExpectationFailed(
                        msg != null
                            ? msg
                            : format(
                                "The value %s is expected to satisfy the predicate %s but it doesn't.",
                                Expectation.#pretty(this.#val),
                                Expectation.#pretty(pred)));
            }
        }
    }

    /** Alias to {@link satisfy}. */
    public satisfies(pred: (v: any) => boolean, msg?: string): this {
        return this.satisfy(pred, msg);
    }

    public static fail(msg?: string): never {
        throw new ExpectationFailed(
            msg != null
                ? msg
                : "Expectation failed");
    }
}

interface IExpect {
    (val: any): Expectation;
    fail(msg?: string): never;
}

/// Chai.js-like expectation API.
export const expect: IExpect = (() => {
    const fn = (val: any) => new Expectation(val);
    fn.fail = Expectation.fail;
    return fn;
})();

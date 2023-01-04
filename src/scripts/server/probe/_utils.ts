import { expect } from "../probing-toolkit.js";

export function createIterableObject<T>(src: Iterable<T>, extraMethods: any = {}): Iterable<T> {
    return {
        [Symbol.iterator]: () => {
            const iter = src[Symbol.iterator].call(src);
            return {
                next() {
                    return iter.next();
                },
                ...extraMethods
            };
        }
    };
}

export function withObjectMethodChanged<R>(
    ctor: any, method: PropertyKey, impl: Function, fn: () => R): R {

    return withPropertyChanged(ctor.prototype, method, impl, fn);
}

export function withPropertyChanged<R>(
    obj: any, key: PropertyKey, value: any, fn: () => R): R {

    const saved = Object.getOwnPropertyDescriptor(obj, key);
    try {
        Object.defineProperty(obj, key, {value, writable: true, configurable: true});
        return fn();
    }
    finally {
        if (saved) {
            Object.defineProperty(obj, key, saved);
        }
        else {
            delete obj[key];
        }
    }
}

export class PropAccessRecorder {
    readonly #accessedProps: PropertyKey[];
    readonly #proxy: any;

    public constructor(accessedProps: PropertyKey[], proxy: any) {
        this.#accessedProps = accessedProps;
        this.#proxy = proxy;
    }

    public get accessedProps(): PropertyKey[] {
        return this.#accessedProps;
    }

    public get target(): any {
        return this.#proxy;
    }

    public assertOrdered(props: PropertyKey[]): void {
        expect(this.#accessedProps).to.deeply.equal(props);
    }

    public assertUnordered(props: PropertyKey[]): void {
        expect(this.#accessedProps).to.have.members(props);
    }

    public assertContain(props: PropertyKey[]): void {
        expect(this.#accessedProps).to.contain.members(props);
    }
}

export class PropGetRecorder extends PropAccessRecorder {
    public constructor(target: any) {
        const accessedProps: PropertyKey[] = [];
        const proxy = new Proxy(target, {
            get(o: any, k: PropertyKey) {
                accessedProps.push(k);
                return o[k];
            }
        });
        super(accessedProps, proxy);
    }
}

export class PropSetRecorder extends PropAccessRecorder {
    public constructor(target: any) {
        const accessedProps: PropertyKey[] = [];
        const proxy = new Proxy(target, {
            set(o: any, k: PropertyKey, v: any) {
                accessedProps.push(k);
                o[k] = v;
                return true;
            }
        });
        super(accessedProps, proxy);
    }
}

export class PropDefineRecorder extends PropAccessRecorder {
    public constructor(target: any) {
        const accessedProps: PropertyKey[] = [];
        const proxy = new Proxy(target, {
            defineProperty(o: any, k: PropertyKey, desc: PropertyDescriptor) {
                accessedProps.push(k);
                Object.defineProperty(o, k, desc);
                return true;
            }
        });
        super(accessedProps, proxy);
    }
}

export class PropDeleteRecorder extends PropAccessRecorder {
    public constructor(target: any) {
        const accessedProps: PropertyKey[] = [];
        const proxy = new Proxy(target, {
            deleteProperty(o: any, k: PropertyKey) {
                accessedProps.push(k);
                return delete o[k];
            }
        });
        super(accessedProps, proxy);
    }
}

export class PropDescRecorder extends PropAccessRecorder {
    public constructor(target: any) {
        const accessedProps: PropertyKey[] = [];
        const proxy = new Proxy(target, {
            getOwnPropertyDescriptor(o: any, k: PropertyKey) {
                accessedProps.push(k);
                return Object.getOwnPropertyDescriptor(o, k);
            }
        });
        super(accessedProps, proxy);
    }
}

export class OwnKeysRecorder {
    #numOccured: number;
    readonly #proxy: any;

    public constructor(target: any) {
        this.#numOccured = 0;

        const self  = this;
        this.#proxy = new Proxy(target, {
            ownKeys(o: any) {
                self.#numOccured++;
                return Object.keys(o);
            }
        });
    }

    public get target(): any {
        return this.#proxy;
    }

    public assertOccured(num?: number): void {
        if (num !== undefined) {
            expect(this.#numOccured).to.equal(num);
        }
        else {
            expect(this.#numOccured).to.be.above(0);
        }
    }
}

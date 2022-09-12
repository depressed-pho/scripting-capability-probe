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

    const saved = ctor.prototype[method];
    try {
        ctor.prototype[method] = impl;
        return fn();
    }
    finally {
        ctor.prototype[method] = saved;
    }
}

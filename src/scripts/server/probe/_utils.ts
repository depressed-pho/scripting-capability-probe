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

/** Create a proxy object with a thunk to compute its target. As soon as
 * any of their properties are accessed, the thunk is evaluated and the
 * result is memorised.
 */
export function lazy<T>(thunk: () => T): T {
    let isEvaluated = false;
    let value: T;

    return new Proxy({}, {
        get(_target: any, key: PropertyKey, _receiver: any): any {
            if (!isEvaluated) value = thunk();

            const prop: any = (value as any)[key];
            if (typeof prop === "function") {
                // If the property is a function, we need to recover "this"
                // or it won't work as a method.
                return prop.bind(value);
            }
            else {
                return prop;
            }
        },
        set(_target: any, key: PropertyKey, v: any, _receiver: any): boolean {
            if (!isEvaluated) value = thunk();

            (value as any)[key] = v;
            return true;
        }
    });
}

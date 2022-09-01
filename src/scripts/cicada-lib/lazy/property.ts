export type LazyPropertyDescriptor = Omit<PropertyDescriptor, "value"|"get"|"set">;
export interface LazyPropertyMap<T> {
    [key: PropertyKey]: (() => any & ThisType<T>) | any;
}

const defaults: LazyPropertyDescriptor = {
    configurable: true,
    enumerable:   true,
    writable:     true
};

/** Define an object property whose value is lazily evaluated.
 */
export function defineLazyProperty<T, V>(obj: T,
                                         key: PropertyKey,
                                         value: (() => V & ThisType<T>) | V,
                                         attrs: LazyPropertyDescriptor = defaults): T {
    return Object.defineProperty(obj, key, describe(key, value, attrs));
}

/** Define several object properties whose values are lazily evaluated.
 */
export function defineLazyProperties<T>(obj: T,
                                        props: LazyPropertyMap<T>,
                                        attrs: LazyPropertyDescriptor = defaults): T {
    let descs: PropertyDescriptorMap = {};
    for (const key in props) {
        descs[key] = describe(key, props[key], attrs);
    }
    return Object.defineProperties(obj, descs);
}

function describe<T, V>(key: PropertyKey,
                        value: (() => V & ThisType<T>) | V,
                        attrs: LazyPropertyDescriptor): PropertyDescriptor {
    if (typeof value === "function") {
        function get(this: T) {
            const v = (value as () => V).call(this);

            // @ts-ignore: exactOptionalPropertyTypes isn't quite helpful here.
            Object.defineProperty(this, key, {
                value:        v,
                configurable: attrs.configurable,
                enumerable:   attrs.enumerable,
                writable:     attrs.writable
            });

            return v;
        }

        function set(this: T, value: any) {
            // @ts-ignore: exactOptionalPropertyTypes isn't quite helpful here.
            Object.defineProperty(this, key, {
                value,
                configurable: attrs.configurable,
                enumerable:   attrs.enumerable,
                writable:     attrs.writable
            });
        }

        // @ts-ignore: exactOptionalPropertyTypes isn't quite helpful here.
        return {
            get,
            set:          attrs.writable ? set : undefined,
            configurable: true,
            enumerable:   attrs.enumerable,
        };
    }
    else {
        // It's not actually lazy.
        // @ts-ignore: exactOptionalPropertyTypes isn't quite helpful here.
        return {
            value,
            configurable: attrs.configurable,
            enumerable:   attrs.enumerable,
            writable:     attrs.writable
        };
    }
}

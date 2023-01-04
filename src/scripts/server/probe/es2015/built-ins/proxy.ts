import { group, probe, expect } from "../../../probing-toolkit.js";

export default group("Proxy", [
    probe("constructor requires `new'", () => {
        function f() {
            return new Proxy({}, {});
        }
        function g() {
            return eval(`Proxy({}, {})`);
        }
        expect(f).to.not.throw();
        expect(g).to.throw(TypeError);
    }),
    probe("`Proxy' doesn't have a prototype", () => {
        expect(Proxy).to.not.have.own.property('prototype');
    }),
    probe("`get' handler", () => {
        const target = {};
        const proxy  = new Proxy(target, {
            get(t, k, r) {
                if (k === "foo") {
                    expect(t).to.equal(target);
                    expect(r).to.equal(proxy);
                    return 5;
                }
                else {
                    return;
                }
            }
        });
        expect((proxy as any).foo).to.equal(5);
    }),
    probe("`get' handler, instances of proxies", () => {
        const target = {};
        const proxy  = Object.create(new Proxy(target, {
            get(t, k, r) {
                if (k === "foo") {
                    expect(t).to.equal(target);
                    expect(r).to.equal(proxy);
                    return 5;
                }
                else {
                    return;
                }
            }
        }));
        expect((proxy as any).foo).to.equal(5);
    }),
    probe("`get' handler invariants", () => {
        const target = {};
        const proxy  = new Proxy(target, {
            get() {
                return 4;
            }
        });

        // The value reported for a property must be the same as the
        // value of the corresponding target object property if the
        // target object property is a non-writable, non-configurable
        // own data property.
        Object.defineProperty(target, "foo", {value: 5, enumerable: true});
        function f() {
            return (proxy as any).foo;
        }
        expect(f).to.throw(TypeError);

        // The value reported for a property must be undefined if the
        // corresponding target object property is a non-configurable
        // own accessor property that has undefined as its [[Get]]
        // attribute.
        Object.defineProperty(target, "bar", {set() {}, enumerable: true});
        function g() {
            return (proxy as any).bar;
        }
        expect(g).to.throw(TypeError);
    }),
    probe("`set' handler", () => {
        let   passed = false;
        const target = {};
        const proxy  = new Proxy(target, {
            set(t, k, v, r) {
                expect(t).to.equal(target);
                expect(k).to.equal("foo");
                expect(v).to.equal("bar");
                expect(r).to.equal(proxy);
                passed = true;
                return true;
            }
        });
        (proxy as any).foo = "bar";
        expect(passed).to.be.true;
    }),
    probe("`set' handler, instances of proxies", () => {
        let   passed = false;
        const target = {};
        const proxy  = Object.create(new Proxy(target, {
            set(t, k, v, r) {
                expect(t).to.equal(target);
                expect(k).to.equal("foo");
                expect(v).to.equal("bar");
                expect(r).to.equal(proxy);
                passed = true;
                return true;
            }
        }));
        (proxy as any).foo = "bar";
        expect(passed).to.be.true;
    }),
    probe("`set' handler invariants", () => {
        const target = {};
        const proxy  = new Proxy(target, {
            set() {
                return true;
            }
        });

        // Cannot change the value of a property to be different from
        // the value of the corresponding target object if the
        // corresponding target object property is a non-writable,
        // non-configurable own data property.
        Object.defineProperty(target, "foo", {value: 2, enumerable: true});
        function f() {
            (proxy as any).foo = 2;
        }
        function g() {
            (proxy as any).foo = 4;
        }
        expect(f).not.to.throw();
        expect(g).to.throw(TypeError);

        // Cannot set the value of a property if the corresponding
        // target object property is a non-configurable own accessor
        // property that has undefined as its [[Set]] attribute.
        Object.defineProperty(target, "bar", {get: () => {}, enumerable: true});
        function h() {
            (proxy as any).bar = 2;
        }
        expect(h).to.throw(TypeError);
    }),
    probe("`has' handler", () => {
        let   passed = false;
        const target = {};
        const proxy  = new Proxy(target, {
            has(t, k) {
                if (k === "foo") {
                    expect(t).to.equal(target);
                    passed = true;
                    return true;
                }
                else {
                    return false;
                }
            }
        });
        expect("foo" in proxy).to.be.true;
        expect(passed).to.be.true;
    }),
    probe("`has' handler, instances of proxies", () => {
        let   passed = false;
        const target = {};
        const proxy  = Object.create(new Proxy(target, {
            has(t, k) {
                if (k === "foo") {
                    expect(t).to.equal(target);
                    passed = true;
                    return true;
                }
                else {
                    return false;
                }
            }
        }));
        expect("foo" in proxy).to.be.true;
        expect(passed).to.be.true;
    }),
    probe("`has' handler invariants", () => {
        const target = {};
        const proxy  = new Proxy(target, {
            has() {
                return false;
            }
        });

        // A property cannot be reported as non-existent, if it exists
        // as a non-configurable own property of the target object.
        Object.defineProperty(target, "foo", {value: 2, writable: true, enumerable: true});
        function f() {
            return "foo" in proxy;
        }
        expect(f).to.throw(TypeError);

        // A property cannot be reported as non-existent, if it exists
        // as an own property of the target object and the target
        // object is not extensible.
        (proxy as any).bar = 2;
        Object.preventExtensions(target);
        function g() {
            return "bar" in proxy;
        }
        expect(g).to.throw(TypeError);
    }),
    probe("`deleteProperty' handler", () => {
        let   passed = false;
        const target = {};
        const proxy  = new Proxy(target, {
            deleteProperty(t, k) {
                if (k === "foo") {
                    expect(t).to.equal(target);
                    passed = true;
                    return true;
                }
                else {
                    return false;
                }
            }
        });
        delete (proxy as any).foo;
        expect(passed).to.be.true;
    }),
    probe("`deleteProperty' handler invariants", () => {
        const target = {};
        const proxy  = new Proxy(target, {
            deleteProperty() {
                return true;
            }
        });
        // A property cannot be reported as deleted, if it exists as a
        // non-configurable own property of the target object.
        Object.defineProperty(target, "foo", {value: 2, writable: true, enumerable: true});
        function f() {
            delete (proxy as any).foo;
        }
        expect(f).to.throw(TypeError);
    }),
    probe("`getOwnPropertyDescriptor' handler", () => {
        const target = {};
        const proxy  = new Proxy(target, {
            getOwnPropertyDescriptor(t, k) {
                if (k === "foo") {
                    expect(t).to.equal(target);
                    return {value: "foo", configurable: true};
                }
                else {
                    return;
                }
            }
        });
        expect(Object.getOwnPropertyDescriptor(proxy as any, "foo")).to.include({
            value:        "foo",
            configurable: true,
            writable:     false,
            enumerable:   false
        });
    }),
    probe("`getOwnPropertyDescriptor' handler invariants", () => {
        const target = {};
        const proxy  = new Proxy(target, {
            getOwnPropertyDescriptor(_t, k) {
                if (k === "baz") {
                    return {
                        value:        "baz",
                        configurable: true,
                        writable:     true,
                        enumerable:   true
                    };
                }
                else {
                    return;
                }
            }
        });

        // A property cannot be reported as non-existent, if it exists
        // as a non-configurable own property of the target object.
        Object.defineProperty(target, "foo", {value: 2, writable: true, enumerable: true});
        function f() {
            return Object.getOwnPropertyDescriptor(proxy as any, "foo");
        }
        expect(f).to.throw(TypeError);

        // A property cannot be reported as non-existent, if it exists
        // as an own property of the target object and the target
        // object is not extensible.
        Object.defineProperty(target, "bar", {value: 3, configurable: true});
        Object.preventExtensions(target);
        function g() {
            return Object.getOwnPropertyDescriptor(proxy as any, "bar");
        }
        expect(g).to.throw(TypeError);

        // A property cannot be reported as existent, if it does not
        // exists as an own property of the target object and the
        // target object is not extensible.
        function h() {
            return Object.getOwnPropertyDescriptor(proxy as any, "baz");
        }
        expect(h).to.throw(TypeError);

        // A property cannot be reported as non-configurable, if it
        // does not exists as an own property of the target object or
        // if it exists as a configurable own property of the target
        // object.
        function i() {
            const proxy = new Proxy({}, {
                getOwnPropertyDescriptor() {
                    return {
                        value:        2,
                        configurable: false,
                        writable:     true,
                        enumerable:   true
                    };
                }
            });
            Object.getOwnPropertyDescriptor(proxy as any, "baz");
        }
        function j() {
            const proxy = new Proxy({baz: 1}, {
                getOwnPropertyDescriptor() {
                    return {
                        value:        2,
                        configurable: false,
                        writable:     true,
                        enumerable:   true
                    };
                }
            });
            Object.getOwnPropertyDescriptor(proxy as any, "baz");
        }
        expect(i).to.throw(TypeError);
        expect(j).to.throw(TypeError);
    }),
    probe("`defineProperty' handler", () => {
        let   passed = false;
        const target = {};
        const proxy  = new Proxy(target, {
            defineProperty(t, k, d) {
                if (k === "foo") {
                    expect(t).to.equal(target);
                    expect(d).to.have.a.property("value", 5);
                    passed = true;
                    return true;
                }
                else {
                    return false;
                }
            }
        });
        Object.defineProperty(proxy, "foo", {value: 5, configurable: true});
        expect(passed).to.be.true;
    }),
    probe("`defineProperty' handler invariants", () => {
        // A property cannot be added, if the target object is not extensible.
        function f() {
            const target = Object.preventExtensions({});
            const proxy  = new Proxy(target, {
                defineProperty() {
                    return true;
                }
            });
            Object.defineProperty(proxy, "foo", {value: 2, configurable: true});
        }
        expect(f).to.throw(TypeError);

        // A property cannot be non-configurable, unless there exists a
        // corresponding non-configurable own property of the target
        // object.
        function g() {
            const target = {bar: true};
            const proxy  = new Proxy(target, {
                defineProperty() {
                    return true;
                }
            });
            Object.defineProperty(proxy, "bar", {
                value:        5,
                configurable: false,
                writable:     true,
                enumerable:   true
            });
        }
        expect(g).to.throw(TypeError);
    }),
    probe("`getPrototypeOf' handler", () => {
        const target = {};
        const proto  = {};
        const proxy  = new Proxy(target, {
            getPrototypeOf(t) {
                expect(t).to.equal(target);
                return proto;
            }
        });
        expect(Object.getPrototypeOf(proxy)).to.equal(proto);
    }),
    probe("`getPrototypeOf' handler invariants", () => {
        let   passed = false;
        const target = Object.preventExtensions({});
        const proxy  = new Proxy(target, {
            getPrototypeOf() {
                passed = true;
                return {};
            }
        });
        // If the target object is not extensible, [[GetPrototypeOf]]
        // applied to the proxy object must return the same value as
        // [[GetPrototypeOf]] applied to the proxy object's target
        // object.
        function f() {
            return Object.getPrototypeOf(proxy);
        }
        expect(f).to.throw(TypeError);
        expect(passed).to.be.true;
    }),
    probe("`setPrototypeOf' handler", () => {
        let   passed = false;
        const target = {};
        const proto  = {};
        const proxy  = new Proxy(target, {
            setPrototypeOf(t, p) {
                expect(t).to.equal(target);
                expect(p).to.equal(proto);
                passed = true;
                return true;
            }
        });
        Object.setPrototypeOf(proxy, proto);
        expect(passed).to.be.true;
    }),
    probe("`setPrototypeOf' handler invariants", () => {
        let   passed = false;
        const target = Object.preventExtensions({});
        const proxy  = new Proxy(target, {
            setPrototypeOf() {
                passed = true;
                return true;
            }
        });
        // If the target object is not extensible, the argument value
        // must be the same as the result of [[GetPrototypeOf]] applied
        // to target object.
        function f() {
            Object.setPrototypeOf(proxy, {});
        }
        expect(f).to.throw(TypeError);
        expect(passed).to.be.true;
    }),
    probe("`isExtensible' handler", () => {
        let   passed = false;
        const target = {};
        const proxy  = new Proxy(target, {
            isExtensible(t) {
                expect(t).to.equal(target);
                passed = true;
                return true;
            }
        });
        Object.isExtensible(proxy);
        expect(passed).to.be.true;
    }),
    probe("`isExtensible' handler invariants", () => {
        // [[IsExtensible]] applied to the proxy object must return the
        // same value as [[IsExtensible]] applied to the proxy object's
        // target object with the same argument.
        function f() {
            const target = {};
            const proxy  = new Proxy(target, {
                isExtensible() {
                    return false;
                }
            });
            return Object.isExtensible(proxy);
        }
        function g() {
            const target = Object.preventExtensions({});
            const proxy  = new Proxy(target, {
                isExtensible() {
                    return true;
                }
            });
            return Object.isExtensible(proxy);
        }
        expect(f).to.throw(TypeError);
        expect(g).to.throw(TypeError);
    }),
    probe("`preventExtensions' handler", () => {
        let   passed = false;
        const target = {};
        const proxy  = new Proxy(target, {
            preventExtensions(t) {
                expect(t).to.equal(target);
                passed = true;
                Object.preventExtensions(t);
                return true;
            }
        });
        Object.preventExtensions(proxy);
        expect(passed).to.be.true;
    }),
    probe("`preventExtensions' handler invariants", () => {
        let   passed = false;
        const target = {};
        // [[PreventExtensions]] applied to the proxy object may return
        // true only if [[IsExtensible]] applied to the proxy object's
        // target object is false.
        const proxy = new Proxy(target, {
            preventExtensions() {
                passed = true;
                return true;
            }
        });
        function f() {
            Object.preventExtensions(proxy);
        }
        expect(f).to.throw(TypeError);
        expect(passed).to.be.true;
    }),
    probe("`ownKeys' handler", () => {
        const target = {};
        const proxy  = new Proxy(target, {
            ownKeys(t) {
                expect(t).to.equal(target);
                return ["foo"];
            }
        });
        expect(Reflect.ownKeys(proxy)).to.deeply.equal(["foo"]);
    }),
    probe("`ownKeys' handler invariants", () => {
        // The Type of each result List element is either String or
        // Symbol.
        function f() {
            const target = {};
            const proxy  = new Proxy(target, {
                ownKeys() {
                    return [2] as any;
                }
            });
            return Reflect.ownKeys(proxy);
        }
        expect(f).to.throw(TypeError);

        // The result List must contain the keys of all
        // non-configurable own properties of the target object.
        function g() {
            const target = {};
            const proxy  = new Proxy(target, {
                ownKeys() {
                    return [];
                }
            });
            Object.defineProperty(target, "foo", {value: 2, writable: true, enumerable: true});
            return Reflect.ownKeys(proxy);
        }
        expect(g).to.throw(TypeError);

        // If the target object is not extensible, then the result List
        // must contain all the keys of the own properties of the
        // target object and no other values.
        function h() {
            const target = Object.preventExtensions({b: 1});
            const proxy  = new Proxy(target, {
                ownKeys() {
                    return ["a"];
                }
            });
            return Reflect.ownKeys(proxy);
        }
        expect(h).to.throw(TypeError);
    }),
    probe("`apply' handler", () => {
        let   passed = false;
        const target = (_a: string, _b: string) => {};
        const object = {
            method: new Proxy(target, {
                apply(t, thisArg, args) {
                    expect(t).to.equal(target);
                    expect(thisArg).to.equal(object);
                    expect(args).to.deeply.equal(["foo", "bar"]);
                    passed = true;
                }
            })
        };
        object.method("foo", "bar");
        expect(passed).to.be.true;
    }),
    probe("`apply' handler invariants", () => {
        const target = {};
        const proxy  = new Proxy(target, {
            apply() {}
        });
        // A Proxy exotic object only has a [[Call]] internal method if
        // the initial value of its [[ProxyTarget]] internal slot is an
        // object that has a [[Call]] internal method.
        function f() {
            return (proxy as any)();
        }
        expect(f).to.throw(TypeError);
    }),
    probe("`construct' handler", () => {
        let   passed = false;
        const target = class {
            constructor(_a: string, _b: string) {}
        };
        const proxy  = new Proxy(target, {
            construct(t, args) {
                expect(t).to.equal(target);
                expect(args).to.deeply.equal(["foo", "bar"]);
                passed = true;
                return {};
            }
        });
        new proxy("foo", "bar");
        expect(passed).to.be.true;
    }),
    probe("`construct' handler invariants", () => {
        // A Proxy exotic object only has a [[Construct]] internal
        // method if the initial value of its [[ProxyTarget]] internal
        // slot is an object that has a [[Construct]] internal method.
        function f() {
            const target = {};
            const proxy  = new Proxy(target, {
                construct() {
                    return {};
                }
            });
            return new (proxy as any)();
        }
        expect(f).to.throw(TypeError);

        // The result of [[Construct]] must be an Object.
        function g() {
            const target = class {};
            const proxy  = new Proxy(target, {
                construct() {
                    return 5 as any;
                }
            });
            return new proxy();
        }
        expect(g).to.throw(TypeError);
    }),
    probe("Proxy.revocable", () => {
        const target = {};
        const ret    = Proxy.revocable(target, {
            get() {
                return 5;
            }
        });
        expect((ret.proxy as any).foo).to.equal(5);

        function f() {
            return (ret.proxy as any).foo;
        }
        ret.revoke();
        expect(f).to.throw(TypeError);
    }),
    probe("`Array.isArray' supports proxies", () => {
        const proxy = new Proxy([], {});
        expect(Array.isArray(proxy)).to.be.true;
    }),
    probe("`JSON.stringify' supports proxies", () => {
        const proxy = new Proxy(["a"], {});
        expect(JSON.stringify(proxy)).to.equal(`["a"]`);
    })
]);

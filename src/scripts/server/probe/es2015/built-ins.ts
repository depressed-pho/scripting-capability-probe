import { group } from "../../probing-toolkit.js";
import typedArrays from "./built-ins/typed-arrays.js";
import map from "./built-ins/map.js";
import set from "./built-ins/set.js";
import weakMap from "./built-ins/weak-map.js";
import weakSet from "./built-ins/weak-set.js";
import proxy from "./built-ins/proxy.js";
import reflect from "./built-ins/reflect.js";
import promise from "./built-ins/promise.js";
import symbol from "./built-ins/symbol.js";
import extensions from "./built-ins/extensions.js";

export default group("Built-ins", [
    typedArrays,
    map,
    set,
    weakMap,
    weakSet,
    proxy,
    reflect,
    promise,
    symbol,
    extensions
]);

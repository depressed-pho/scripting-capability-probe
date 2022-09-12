import { group } from "../../probing-toolkit";
import typedArrays from "./built-ins/typed-arrays";
import map from "./built-ins/map";
import set from "./built-ins/set";
import weakMap from "./built-ins/weak-map";
import weakSet from "./built-ins/weak-set";
import proxy from "./built-ins/proxy";
import reflect from "./built-ins/reflect";
import promise from "./built-ins/promise";
import symbol from "./built-ins/symbol";

export default group("Built-ins", [
    typedArrays,
    map,
    set,
    weakMap,
    weakSet,
    proxy,
    reflect,
    promise,
    symbol
]);

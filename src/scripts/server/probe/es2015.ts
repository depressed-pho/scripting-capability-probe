import { group } from "../probing-toolkit";
import optimisation from "./es2015/optimisation";
import syntax from "./es2015/syntax";
import bindings from "./es2015/bindings";
import functions from "./es2015/functions";
import builtins from "./es2015/built-ins";

export default group("ES2015 Support", [
    optimisation,
    syntax,
    bindings,
    functions,
    builtins
]);

import { group } from "../probing-toolkit.js";
import optimisation from "./es2015/optimisation.js";
import syntax from "./es2015/syntax.js";
import bindings from "./es2015/bindings.js";
import functions from "./es2015/functions.js";
import builtins from "./es2015/built-ins.js";
import subclassing from "./es2015/subclassing.js";
import misc from "./es2015/misc.js";
import annexB from "./es2015/annex-B.js";

export default group("ES2015 Support", [
    optimisation,
    syntax,
    bindings,
    functions,
    builtins,
    subclassing,
    misc,
    annexB
]);

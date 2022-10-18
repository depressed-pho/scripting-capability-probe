import { group } from "../probing-toolkit";
import optimisation from "./es2015/optimisation";
import syntax from "./es2015/syntax";
import bindings from "./es2015/bindings";
import functions from "./es2015/functions";
import builtins from "./es2015/built-ins";
import subclassing from "./es2015/subclassing";
import misc from "./es2015/misc";
import annexB from "./es2015/annex-B";

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

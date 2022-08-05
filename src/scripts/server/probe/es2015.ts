import { group } from "../probing-toolkit";
import optimisation from "./es2015/optimisation";
import syntax from "./es2015/syntax";

export default group("ES2015 Support", [
    optimisation,
    syntax
]);

import { group } from "../probing-toolkit.js";
import features from "./es2017/features.js";
import misc from "./es2017/misc.js";

export default group("ES2017 Support", [
    features,
    misc
]);

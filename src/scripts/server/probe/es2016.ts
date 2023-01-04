import { group } from "../probing-toolkit.js";
import features from "./es2016/features.js";
import misc from "./es2016/misc.js";

export default group("ES2016 Support", [
    features,
    misc
]);

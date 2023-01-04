import { group } from "../probing-toolkit.js";
import features from "./es2018/features.js";
import misc from "./es2018/misc.js";

export default group("ES2018 Support", [
    features,
    misc
]);

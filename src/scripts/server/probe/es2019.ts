import { group } from "../probing-toolkit.js";
import features from "./es2019/features.js";
import misc from "./es2019/misc.js";

export default group("ES2019 Support", [
    features,
    misc
]);

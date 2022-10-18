import { group } from "../probing-toolkit";
import features from "./es2017/features";
import misc from "./es2017/misc";

export default group("ES2017 Support", [
    features,
    misc
]);

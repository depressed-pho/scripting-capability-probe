import { group } from "../probing-toolkit";
import features from "./es2016/features";
import misc from "./es2016/misc";

export default group("ES2016 Support", [
    features,
    misc
]);

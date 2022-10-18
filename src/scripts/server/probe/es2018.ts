import { group } from "../probing-toolkit";
import features from "./es2018/features";
import misc from "./es2018/misc";

export default group("ES2018 Support", [
    features,
    misc
]);

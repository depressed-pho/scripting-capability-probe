import { group } from "./probing-toolkit.js";
import es2015 from "./probe/es2015.js";
import es2016 from "./probe/es2016.js";
import es2017 from "./probe/es2017.js";
import es2018 from "./probe/es2018.js";
import es2019 from "./probe/es2019.js";
import es2020 from "./probe/es2020.js";
import es2021 from "./probe/es2021.js";
import es2022 from "./probe/es2022.js";
import quickjs from "./probe/quickjs.js";
import webAPI from "./probe/web-api.js";

export default group([
    es2015,
    es2016,
    es2017,
    es2018,
    es2019,
    es2020,
    es2021,
    es2022,
    quickjs,
    webAPI
]);

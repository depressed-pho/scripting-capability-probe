import { inspect } from "./inspect";

export function format(fmt: string, ...args: any[]): string {
    const str = fmt.replaceAll(
        /%(%|[oO]|(?:([0-9]*)\.([0-9]*))?[di]|s|(?:([0-9]*)\.([0-9]*))?f)/g,
        (matched, subst, intWidth, intPrec, floatWidth, floatPrec) => {
            switch (subst) {
                case "%":
                    return "%";
                case "o":
                case "O":
                case "d":
                case "i":
                case "s":
                    const removed = args.splice(1, 1);
                    return removed.length > 0 ? stringify(removed[0]) : matched;
                default:
                    if (intWidth != null || intPrec != null) {
                        const removed = args.splice(1, 1);
                        if (removed.length > 0) {
                            return String(removed[0])
                                .padStart(intPrec  || 0, "0")
                                .padStart(intWidth || 0, " ");
                        }
                        else {
                            return matched;
                        }
                    }
                    else if (floatWidth != null || floatPrec != null) {
                        const removed = args.splice(1, 1);
                        if (removed.length > 0) {
                            let str = floatPrec != null
                                ? Number(removed[0]).toFixed(floatPrec)
                                : String(removed[0]);
                            return str.padStart(floatWidth || 0, " ");
                        }
                        else {
                            return matched;
                        }
                    }
                    else {
                        throw Error("internal error: impossible");
                    }
            }
        });
    /* Any remaining arguments should be appended to the result. They
     * weren't consumed by the format string. */
    return [str, ...(args.map(stringify))].join(" ");
}

export function stringify(val: any): string {
    switch (typeof val) {
        case "string":
            return val;
        default:
            return inspect(val);
    }
}

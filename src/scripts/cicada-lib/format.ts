import { inspect } from "./inspect";

export function format(fmt: string, ...args: any[]): string {
    const str = fmt.replaceAll(
        /%(%|[oO]|(?:([0-9]*)\.([0-9]*))?[di]|s|(?:([0-9]*)\.([0-9]*))?f)/g,
        (matched, subst, intWidth, intPrec, floatWidth, floatPrec) => {
            switch (subst) {
                case "%":
                    return "%";
                case "o":
                    return args.length > 0
                        ? inspect(args.shift())
                        : matched;
                case "O":
                    return args.length > 0
                        ? inspect(args.shift(), {showHidden: true})
                        : matched;
                case "d":
                case "i":
                case "s":
                    return args.length > 0
                        ? stringify(args.shift())
                        : matched;
                default:
                    if (intWidth != null || intPrec != null) {
                        if (args.length > 0) {
                            const int = args.shift();
                            return String(int)
                                .padStart(intPrec  || 0, "0")
                                .padStart(intWidth || 0, " ");
                        }
                        else {
                            return matched;
                        }
                    }
                    else if (floatWidth != null || floatPrec != null) {
                        if (args.length > 0) {
                            const float = args.shift();
                            const str   = floatPrec != null
                                ? Number(float).toFixed(floatPrec)
                                : String(float);
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

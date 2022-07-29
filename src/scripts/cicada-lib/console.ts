/** The Bedrock API has a global "console" object, which redirects messages
 * to the content log. However, its functionality is very limited at the
 * moment, such as not displaying stack traces of Error objects. This
 * module provides an alternative "console" object that works better. We
 * hope it will eventually go away.
 */
import { format, stringify } from "./format";

export enum Severity {
    Debug,
    Info,
    Log,
    Warning,
    Error
}

class Console {
    /** A non-standard property that controls the threshold of severity. */
    public logLevel: Severity = Severity.Debug;

    public error(...args: any[]): void {
        this.#log(Severity.Error, args);
    }
    // FIXME: more methods

    #log(sev: Severity, args: any[]): void {
        if (sev >= this.logLevel) {
            const func = sev == Severity.Error ? console.error : console.warn;
            func.call(
                console,
                Console.#severityToString(sev),
                Console.#timestamp(),
                Console.#format(...args));
        }
    }

    static #severityToString(sev: Severity): string {
        switch (sev) {
            case Severity.Debug:   return "[DEBUG]";
            case Severity.Info:    return "[INFO]";
            case Severity.Log:     return "[LOG]";
            case Severity.Warning: return "[WARNING]";
            case Severity.Error:   return "[Error]";
            default:
                throw Error(`Unknown severity: ${sev}`);
        }
    }

    static #timestamp(): string {
        return `[${new Date().toLocaleTimeString()}]`;
    }

    static #format(...args: any[]): string {
        if (args.length > 0) {
            if (typeof args[0] === "string") {
                /* The first argument being a string means that it may
                 * contain substitution specifications. */
                return format(args[0], ...(args.slice(1)));
            }
            else {
                return args.map(stringify).join(" ");
            }
        }
        else {
            return "";
        }
    }
}

const altConsole = new Console();
export { altConsole as console };

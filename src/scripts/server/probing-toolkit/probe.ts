import { hasInstance } from "cicada-lib/has-instance";
import { ThreadCancellationRequested } from "cicada-lib/thread";
import * as Fmt from "cicada-lib/fmt-code";
import { useFormatCodes, showFailureDetails } from "./config";

export type ProbeWorker = () => (void|Promise<unknown>|AsyncGenerator);

export class Probe {
    readonly #title: string;
    readonly #worker: ProbeWorker;

    public constructor(title: string, worker: ProbeWorker) {
        this.#title  = title;
        this.#worker = worker;
    }

    public async *[Symbol.asyncIterator](): AsyncGenerator {
        // The worker function may throw exceptions. Catch and treat them
        // as failure except for ThreadCancellationRequested which should
        // only be caught by the thread root.
        try {
            const ret = this.#worker();
            if (ret) {
                if (ret instanceof Promise) {
                    await ret;
                }
                else {
                    // It's an AsyncGenerator.
                    yield* ret;
                }
            }

            if (useFormatCodes) {
                console.log(
                    Fmt.toString([Fmt.setColour(Fmt.Colour.Green)])
                        + "✓ "
                        + Fmt.toString([Fmt.setColour(Fmt.Colour.Gray)])
                        + this.#title
                        + Fmt.toString([Fmt.reset]));
            }
            else {
                console.log("✓ " + this.#title);
            }
        }
        catch (e) {
            if (e instanceof ThreadCancellationRequested) {
                throw e;
            }
            else {
                if (useFormatCodes) {
                    console.log(
                        Fmt.toString([Fmt.setColour(Fmt.Colour.Red)])
                            + "✗ "
                            + Fmt.toString([Fmt.setColour(Fmt.Colour.Gray)])
                            + this.#title
                            + Fmt.toString([Fmt.reset]));
                }
                else {
                    console.log("✗ " + this.#title);
                }

                if (showFailureDetails) {
                    console.log(e);
                }
            }
        }
        finally {
            // It's possible that the probe didn't yield even once. Do
            // it now, or we wouldn't be able to cancel the thread.
            yield;
        }
    }

    /* Workaround for
     * https://github.com/MicrosoftDocs/minecraft-creator/issues/353 */
    static [Symbol.hasInstance](obj: any): boolean {
        return hasInstance(obj, this);
    }
}

export function probe(title: string, worker: ProbeWorker): Probe {
    return new Probe(title, worker);
}

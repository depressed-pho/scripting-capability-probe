import { ThreadCancellationRequested } from "cicada-lib/thread";
import * as Fmt from "cicada-lib/fmt-code";
import { PlayerPrefs } from "../player-prefs";

export type ProbeWorker = () => (void|Promise<unknown>|AsyncGenerator);

export class Probe {
    readonly #title: string;
    readonly #worker: ProbeWorker;

    public constructor(title: string, worker: ProbeWorker) {
        this.#title  = title;
        this.#worker = worker;
    }

    /** The generator returns (not yields) true if the test passes, or
     * false otherwise.
     */
    public async *run(prefs: PlayerPrefs): AsyncGenerator<unknown, boolean> {
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

            if (prefs.noUseFormatCodes) {
                console.log("✓ " + this.#title);
            }
            else {
                console.log(
                    Fmt.toString([Fmt.setColour(Fmt.Colour.Green)])
                        + "✓ "
                        + Fmt.toString([Fmt.setColour(Fmt.Colour.Gray)])
                        + this.#title
                        + Fmt.toString([Fmt.reset]));
            }
            return true;
        }
        catch (e) {
            if (e instanceof ThreadCancellationRequested) {
                throw e;
            }
            else {
                if (prefs.noUseFormatCodes) {
                    console.log("✗ " + this.#title);
                }
                else {
                    console.log(
                        Fmt.toString([Fmt.setColour(Fmt.Colour.Red)])
                            + "✗ "
                            + Fmt.toString([Fmt.setColour(Fmt.Colour.Gray)])
                            + this.#title
                            + Fmt.toString([Fmt.reset]));
                }

                if (prefs.showFailureDetails) {
                    console.log(e);
                }

                return false;
            }
        }
        finally {
            // It's possible that the probe didn't yield even once. Do
            // it now, or we wouldn't be able to cancel the thread.
            yield;
        }
    }
}

export function probe(title: string, worker: ProbeWorker): Probe {
    return new Probe(title, worker);
}

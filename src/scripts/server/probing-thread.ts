import { Player } from "cicada-lib/player.js";
import { ProgressBar } from "cicada-lib/progress-bar.js";
import { Thread, ThreadCancellationRequested } from "cicada-lib/thread.js";
import { Timer } from "cicada-lib/timer.js";
import { PlayerPrefs } from "./player-prefs_pb.js";
import probeRoot from "./probe.js";

export class ProbingThread extends Thread {
    static readonly #lineWidth = 40;
    static readonly #lines = ["━", "┄"];

    public constructor(player: Player) {
        /* We really want to produce the result of probing as a
         * minecraft:written_book, but the API doesn't (yet) provide a
         * component for the contents of a book. So we have no choice but
         * to just dump it to the content log.
         */
        super(async function* () {
            const timer   = new Timer();
            const progBar = new ProgressBar(probeRoot.size);

            console.log(ProbingThread.#line(0));
            console.log(
                "%s initiated a probe: there are %i features to be probed.",
                player.name, progBar.total);
            console.log("Swing the wand again to cancel it.");
            console.log(ProbingThread.#line(1));

            let numPassed: number;
            try {
                numPassed = yield* probeRoot.run(
                    player.getPreferences(PlayerPrefs),
                    async () => {
                        player.onScreenDisplay.setActionBar("Probing:\n" + progBar.toString());
                    },
                    async () => {
                        progBar.done++;
                    });
            }
            catch (e) {
                if (e instanceof ThreadCancellationRequested) {
                    console.log(ProbingThread.#line(1));
                    console.log("Cancelled after %i/%i probes (%s).", progBar.done, progBar.total, timer);
                    console.log(ProbingThread.#line(0));

                    player.onScreenDisplay.setActionBar("Probing cancelled");
                    throw e;
                }
                else {
                    throw e;
                }
            }

            console.log(ProbingThread.#line(1));
            console.log("Completed probing features after %s, of which %i tests passed (%i failed).",
                        timer, numPassed, progBar.total - numPassed);
            console.log(ProbingThread.#line(0));

            player.onScreenDisplay.setActionBar("Probing completed");
        });
    }

    static #line(sym: number): string {
        return this.#lines[sym]!.repeat(this.#lineWidth);
    }
}

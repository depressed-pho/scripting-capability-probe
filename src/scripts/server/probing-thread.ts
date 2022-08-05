import { console } from "../cicada-lib/console";
import { delay } from "../cicada-lib/delay";
import { Player } from "../cicada-lib/player";
import { ProgressBar } from "../cicada-lib/progress-bar";
import { Thread, ThreadCancellationRequested } from "../cicada-lib/thread";
import { Timer } from "../cicada-lib/timer";
import probeRoot from "./probe";

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

            try {
                yield* probeRoot.run(async () => {
                    player.title.setActionBar("Probing:\n" + progBar.toString());
                });
            }
            catch (e) {
                if (e instanceof ThreadCancellationRequested) {
                    console.log(ProbingThread.#line(1));
                    console.log(`Cancelled after ${timer}.`);
                    console.log(ProbingThread.#line(0));

                    player.title.setActionBar("Probing cancelled");
                    throw e;
                }
            }

            console.log(ProbingThread.#line(1));
            console.log(`Completed after ${timer}.`);
            console.log(ProbingThread.#line(0));

            player.title.setActionBar("Probing completed");
        });
    }

    static #line(sym: number): string {
        return this.#lines[sym]!.repeat(this.#lineWidth);
    }
}

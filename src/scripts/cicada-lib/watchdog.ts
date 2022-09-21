import { WatchdogTerminateReason } from "mojang-minecraft";
import * as MC from "mojang-minecraft";

export { WatchdogTerminateReason };

export class BeforeWatchdogTerminateEvent {
    readonly #event: MC.BeforeWatchdogTerminateEvent;

    /** The constructor is public only because of a language
     * limitation. User code must never call it directly. */
    public constructor(rawEvent: MC.BeforeWatchdogTerminateEvent) {
        this.#event = rawEvent;
    }

    public cancel(): void {
        this.#event.cancel = true;
    }

    public get terminateReason(): WatchdogTerminateReason {
        return this.#event.terminateReason;
    }
}

import { EventEmitter } from "./event-emitter"
import { BeforeWatchdogTerminateEvent } from "./watchdog";
import * as MC from "mojang-minecraft";

export class System extends EventEmitter {
    readonly #system: MC.System;

    /** The constructor is public only because of a language
     * limitation. User code must never call it directly. */
    public constructor(rawSystem: MC.System) {
        super();

        this.#system = rawSystem;

        this.#glueEvents();
    }

    #glueEvents(): void {
        this.#system.events.beforeWatchdogTerminate.subscribe(rawEv => {
            const ev = new BeforeWatchdogTerminateEvent(rawEv);
            this.emit("beforeWatchdogTerminate", ev);
        });
    }
}

export const system = new System(MC.system);

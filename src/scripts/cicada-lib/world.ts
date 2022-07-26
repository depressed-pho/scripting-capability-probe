import { EventEmitter, EventName } from "./event-emitter"
import * as MC from "mojang-minecraft";

interface Event {
    name: EventName,
    event: any
}

export class World extends EventEmitter {
    readonly #world: MC.World;
    #isReady: boolean;
    #pendingEvents: Event[];

    /** The constructor is public only because of a language
     * limitation. User code must never call it directly. */
    public constructor() {
        super();

        this.#world         = MC.world;
        this.#isReady       = false;
        this.#pendingEvents = [];

        this.#glueEvents();
    }

    #glueEvents(): void {
        /* The game starts ticking the world even before it's fully
         * loaded. Players can even join it (and possibly leave it) before
         * it's ready. This is strange and is very inconvenient but is
         * apparently an intended behaviour.
         */
        this.#world.events.tick.subscribe(ev => {
            if (!this.#isReady) {
                try {
                    this.#world.getDimension("overworld").runCommand("testfor @a");
                    this.#isReady = true;
                }
                catch (e) {}

                if (this.#isReady) {
                    this.emit("ready");

                    for (const ev of this.#pendingEvents) {
                        this.emit(ev.name, ev.event);
                    }
                    this.#pendingEvents = [];
                }
            }
        });

        this.#world.events.playerJoin.subscribe(ev => {
            if (this.#isReady) {
                this.emit("playerJoin", ev);
            }
            else {
                // NOTE: Don't know why but saving "ev" and using it later
                // will cause a strange ReferenceError. We apparently need
                // to do a shallow cloning.
                this.#pendingEvents.push({name: "playerJoin", event: {player: ev.player}});
            }
        });
    }
}

export const world = new World();

import { EventEmitter, EventName } from "./event-emitter"
import { Entity, ItemUseEvent } from "./entity";
import { ItemStack } from "./item-stack";
import { Player, PlayerJoinEvent } from "./player"
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
    public constructor(rawWorld: MC.World) {
        super();

        this.#world         = rawWorld;
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
        this.#world.events.tick.subscribe(() => {
            if (!this.#isReady) {
                try {
                    // Strange... this works even if the only player
                    // resides in the Nether.
                    this.#world
                        .getDimension(MC.MinecraftDimensionTypes.overworld)
                        .runCommand("testfor @a"); // would fail if no players exist.
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

        this.#world.events.playerJoin.subscribe(rawEv => {
            const ev: PlayerJoinEvent = { player: new Player(rawEv.player) };
            if (this.#isReady) {
                this.emit("playerJoin", ev);
            }
            else {
                // NOTE: Don't know why but saving "ev" and using it later
                // will cause a strange ReferenceError. We apparently need
                // to do a shallow cloning.
                this.#pendingEvents.push({name: "playerJoin", event: ev});
            }
        });

        this.#world.events.playerLeave.subscribe(ev => {
            if (this.#isReady) {
                this.emit("playerLeave", ev);
            }
            else {
                this.#pendingEvents.push({name: "playerLeave", event: ev});
            }
        });

        this.#world.events.itemUse.subscribe(rawEv => {
            const ev: ItemUseEvent = {
                item:   new ItemStack(rawEv.item),
                source: rawEv.source instanceof MC.Player
                    ? new Player(rawEv.source)
                    : new Entity(rawEv.source)
            };
            this.emit("itemUse", ev);
        });
    }
}

export const world = new World(MC.world);

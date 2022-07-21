import { EventEmitter } from "./event-emitter"
import * as MC from "mojang-minecraft";

export class World extends EventEmitter {
    #world: MC.World;

    /** The constructor is public only because of a language
     * limitation. User code must never call it directly. */
    public constructor() {
        super();

        this.#world = MC.world;

        //this.glueEvents();
    }
}

export const world = new World();

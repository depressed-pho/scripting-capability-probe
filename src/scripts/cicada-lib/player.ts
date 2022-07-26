import { EntityInventory } from "./entity/inventory";
import * as MC from "mojang-minecraft";

export class Player {
    readonly #player: MC.Player;

    /** The constructor is public only because of a language
     * limitation. User code must never call it directly. */
    public constructor(rawPlayer: MC.Player) {
        this.#player = rawPlayer;
    }

    public get name(): string {
        return this.#player.name;
    }

    public get inventory(): EntityInventory {
        return new EntityInventory(
            this.#player.getComponent("minecraft:inventory") as MC.EntityInventoryComponent);
    }
}

export interface PlayerJoinEvent {
    readonly player: Player;
}

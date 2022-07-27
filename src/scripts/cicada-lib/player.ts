import { Entity } from "./entity";
import { EntityInventory } from "./entity/inventory";
export { PlayerLeaveEvent } from "mojang-minecraft";
import * as MC from "mojang-minecraft";

export class Player extends Entity {
    readonly #player: MC.Player;

    /** The constructor is public only because of a language
     * limitation. User code must never call it directly. */
    public constructor(rawPlayer: MC.Player) {
        super(rawPlayer);
        this.#player = rawPlayer;
    }

    public get name(): string {
        return this.#player.name;
    }

    public get inventory(): EntityInventory {
        return new EntityInventory(
            this.#player.getComponent("minecraft:inventory") as MC.EntityInventoryComponent);
    }

    /* This is needed because "entity instanceof Player" will be fragile
     * otherwise. */
    static [Symbol.hasInstance](entity: Entity): boolean {
        return entity.id === "minecraft:player";
    }
}

export interface PlayerJoinEvent {
    readonly player: Player;
}

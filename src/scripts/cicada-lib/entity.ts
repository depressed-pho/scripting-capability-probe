import { ItemStack } from "./item-stack";
import * as MC from "mojang-minecraft";

export class Entity {
    readonly #entity: MC.Entity;

    /** The constructor is public only because of a language
     * limitation. User code must never call it directly. */
    public constructor(rawEntity: MC.Entity) {
        this.#entity = rawEntity;
    }

    public get id(): string {
        return this.#entity.id;
    }
}

export interface ItemUseEvent {
    readonly item: ItemStack;
    readonly source: Entity;
}

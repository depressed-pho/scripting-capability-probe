import { ItemStack } from "./item-stack";
import * as MC from "@minecraft/server";

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

    public get typeId(): string {
        return this.#entity.typeId;
    }
}

export interface ItemUseEvent {
    readonly item: ItemStack;
    readonly source: Entity;
}

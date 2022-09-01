import { Container } from "../container";
import * as MC from "mojang-minecraft";

export class EntityInventory extends Container {
    // @ts-ignore: #inventory isn't used yet.
    readonly #inventory: MC.EntityInventoryComponent;

    /** The constructor is public only because of a language
     * limitation. User code must never call it directly. */
    public constructor(rawInventory: MC.EntityInventoryComponent) {
        super(rawInventory.container);

        this.#inventory = rawInventory;
    }
}

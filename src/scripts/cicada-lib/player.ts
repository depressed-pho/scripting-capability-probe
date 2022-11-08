import { Entity } from "./entity";
import { EntityInventory } from "./entity/inventory";
import { RawText } from "./raw-text";
export { PlayerLeaveEvent } from "@minecraft/server";
import * as MC from "@minecraft/server";

export class Player extends Entity {
    readonly #player: MC.Player;

    /** The constructor is public only because of a language
     * limitation. User code must never call it directly. */
    public constructor(rawPlayer: MC.Player) {
        super(rawPlayer);
        this.#player = rawPlayer;
    }

    /** Package private: user code should not use this. */
    public get raw(): MC.Player {
        return this.#player;
    }

    public get name(): string {
        return this.#player.name;
    }

    public get inventory(): EntityInventory {
        return new EntityInventory(
            this.#player.getComponent("minecraft:inventory") as MC.EntityInventoryComponent);
    }

    public get title(): ScreenTitle {
        return new ScreenTitle(this);
    }

    /* Workaround for
     * https://github.com/MicrosoftDocs/minecraft-creator/issues/353 */
    static [Symbol.hasInstance](entity: Entity): boolean {
        return entity.typeId === "minecraft:player";
    }
}

export interface PlayerJoinEvent {
    readonly player: Player;
}

export class ScreenTitle {
    readonly #player: Player;

    /** The constructor is public only because of a language
     * limitation. User code must never call it directly. */
    public constructor(player: Player) {
        this.#player = player;
    }

    /** Clear the screen title, subtitle, and action bar from the screens
     * of the specified player(s). */
    public clear(): this {
        this.#player.raw.runCommand("titleraw @s clear");
        return this;
    }

    /** Clear the screen title, subtitle, and action bar and also reset
     * fade-in, stay, and fade-out times.
     */
    public reset(): this {
        this.#player.raw.runCommand("titleraw @s reset");
        return this;
    }

    /** Display a screen title to the specified player(s). */
    public setTitle(text: string|RawText): this {
        const rawText = typeof text === "string" ? new RawText(text) : text;
        this.#player.raw.runCommand(`titleraw @s title ${rawText}`);
        return this;
    }

    /** Display a screen subtitle to the specified player(s) if a screen
     * title is currently displayed for them, or specify the subtitle for
     * their next screen title to be displayed. */
    public setSubtitle(text: string|RawText): this {
        const rawText = typeof text === "string" ? new RawText(text) : text;
        this.#player.raw.runCommand(`titleraw @s subtitle ${rawText}`);
        return this;
    }

    /** Display an action bar to the specified player(s). */
    public setActionBar(text: string|RawText): this {
        const rawText = typeof text === "string" ? new RawText(text) : text;
        this.#player.raw.runCommand(`titleraw @s actionbar ${rawText}`);
        return this;
    }

    /** Change the fade-in, stay, and fade-out times (measured in
     * *seconds*, not game ticks) of all current and future screen titles
     * for the specified player(s).
     */
    public setTimes(fadeIn: number, stay: number, fadeOut: number): this {
        function secToTicks(sec: number): number {
            return Math.floor(sec * MC.TicksPerSecond);
        }
        this.#player.raw.runCommand(
            `titleraw @s times ${secToTicks(fadeIn)} ${secToTicks(stay)} ${secToTicks(fadeOut)}`);
        return this;
    }
}

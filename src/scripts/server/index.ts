import { sessionManager } from "./player-session";
import { world } from "../cicada-lib/world";
import { Enchantment } from "../cicada-lib/enchantment";
import { ItemUseEvent } from "../cicada-lib/entity";
import { ItemStack } from "../cicada-lib/item-stack";
import { Player, PlayerJoinEvent, PlayerLeaveEvent } from "../cicada-lib/player";

import { Thread } from "../cicada-lib/thread";
import { console } from "../cicada-lib/console";
import { inspect } from "../cicada-lib/inspect";

world.on("playerJoin", (ev: PlayerJoinEvent) => {
    const player = ev.player;
    sessionManager.create(player.name);

    //player.runCommand(
    //    `tellraw @s {"rawtext": [{"text": "${player.name} joined the world."}]}`);
    let tmp = inspect(console, {colors: true, showHidden: true});
    tmp = JSON.stringify(tmp);
    player.raw.runCommand(
        `tellraw @s {"rawtext": [{"text": ${tmp}}]}`);

    /* When a player joins the world, give them a Wand of Probing if they
     * don't already have one in their inventory. */
    if (!player.inventory.some(item => item.id == "capprobe:wand_of_probing")) {
        const wand = new ItemStack("capprobe:wand_of_probing", 1);
        wand.lore = ["Swing this in the air to",
                     "probe the nature of the world."];
        player.inventory.add(wand);
    }
});

world.on("playerLeave", (ev: PlayerLeaveEvent) => {
    sessionManager.destroy(ev.playerName);
});

world.on("itemUse", async (ev: ItemUseEvent) => {
    if (ev.source instanceof Player) {
        const pl = ev.source;
        const session = sessionManager.get(ev.source.name);
        if (session.probingThread) {
            await session.probingThread.cancel();
            session.probingThread = null;
        }
        else {
            /* We really want to produce the result of probing as a
             * minecraft:written_book, but the API doesn't (yet) provide a
             * component for the contents of a book. So we have no choice
             * but to just dump it to the content log. */
            session.probingThread = new Thread(
                async function* () {
                    while (true) {
                        const isCanceled = yield;
                        if (isCanceled) {
                            pl.raw.runCommand(
                                `titleraw @s actionbar {"rawtext": [{"text": "."}]}`);
                            throw Error("foo");
                            break;
                        }

                        pl.raw.runCommand(
                            `titleraw @s actionbar {"rawtext": [{"text": "thread"}]}`);
                    }
                });
        }
    }
});

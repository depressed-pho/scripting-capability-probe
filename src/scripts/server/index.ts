import "cicada-lib/shims/console.js";
import { declareNamespace } from "cicada-lib/preferences.js";
import { system } from "cicada-lib/system.js";
import { WatchdogTerminateReason } from "cicada-lib/watchdog.js";
import { world } from "cicada-lib/world.js";
import { ItemStack } from "cicada-lib/item/stack.js";
import { Player  } from "cicada-lib/player.js";
import { sessionManager } from "./player-session.js";
import { ProbingThread } from "./probing-thread.js";
import { PlayerPrefsUI } from "./player-prefs-ui.js";

declareNamespace("capprobe");

system.beforeEvents.watchdogTerminate.subscribe(ev => {
    switch (ev.terminateReason) {
        case WatchdogTerminateReason.StackOverflow:
            /* There is a probe that can knowingly cause a stack
             * overflow. Do not terminate the server on that. */
            ev.cancel();
            break;
    }
});

world.afterEvents.playerSpawn.subscribe(ev => {
    const player = ev.player;
    sessionManager.create(player.id);

    /* When a player joins the world, give them a Wand of Probing if they
     * don't already have one in their inventory. */
    if (!player.inventory.some(item => item.typeId == "capprobe:wand_of_probing")) {
        const wand = new ItemStack("capprobe:wand_of_probing", 1);
        wand.lore = ["Swing this in the air to",
                     "probe the nature of the world.",
                     "Sneak-use to open preferences window."];
        player.inventory.add(wand);
    }
});

world.afterEvents.playerLeave.subscribe(ev => {
    sessionManager.destroy(ev.playerId);
});

world.afterEvents.itemUse.subscribe(async ev => {
    if (ev.source instanceof Player &&
        ev.itemStack.typeId === "capprobe:wand_of_probing") {

        const player = ev.source;
        if (player.isSneaking) {
            PlayerPrefsUI.open(player);
        }
        else {
            const session = sessionManager.get(ev.source.id);
            if (session.probingThread) {
                session.probingThread.cancel();
            }
            else {
                session.probingThread = new ProbingThread(player);
                await session.probingThread.join();
                session.probingThread = null;
            }
        }
    }
});

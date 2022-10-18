import "cicada-lib/shims/console";
import { system } from "cicada-lib/system";
import { world } from "cicada-lib/world";
import { BeforeWatchdogTerminateEvent,
         WatchdogTerminateReason } from "cicada-lib/watchdog";
import { ItemUseEvent } from "cicada-lib/entity";
import { ItemStack } from "cicada-lib/item-stack";
import { Player, PlayerJoinEvent, PlayerLeaveEvent } from "cicada-lib/player";
import { sessionManager } from "./player-session";
import { ProbingThread } from "./probing-thread";

system.on("beforeWatchdogTerminate", (ev: BeforeWatchdogTerminateEvent) => {
    switch (ev.terminateReason) {
        case WatchdogTerminateReason.stackOverflow:
            /* There is a probe that can knowingly cause a stack
             * overflow. Do not terminate the server on that. */
            ev.cancel();
            break;
    }
});

world.on("playerJoin", (ev: PlayerJoinEvent) => {
    const player = ev.player;
    sessionManager.create(player.name);

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
            session.probingThread.cancel();
        }
        else {
            session.probingThread = new ProbingThread(pl);
            await session.probingThread.join();
            session.probingThread = null;
        }
    }
});

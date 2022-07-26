import { world } from "../cicada-lib/world";
import { Enchantment } from "../cicada-lib/enchantment";
import { ItemStack } from "../cicada-lib/item-stack";
import { PlayerJoinEvent } from "../cicada-lib/player";

world.on("playerJoin", (ev: PlayerJoinEvent) => {
    const player = ev.player;
    //player.runCommand(
    //    `tellraw @s {"rawtext": [{"text": "${player.name} joined the world."}]}`);

    /* When a player joins the world, give them a Wand of Probing if they
     * don't already have one in their inventory. */
    if (!player.inventory.some(item => item.id == "capprobe:wand_of_probing")) {
        const wand = new ItemStack("capprobe:wand_of_probing", 1);
        wand.lore = ["Swing this in the air to",
                     "probe the nature of the world."];
        player.inventory.add(wand);
    }
});

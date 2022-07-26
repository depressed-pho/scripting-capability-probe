import { world } from "../cicada-lib/world";
import { PlayerJoinEvent } from "mojang-minecraft";

world.on("playerJoin", (ev: PlayerJoinEvent) => {
    ev.player.runCommand(
        `tellraw @s {"rawtext": [{"text": "${ev.player.name} joined the world."}]}`);
    throw Error("test");
});

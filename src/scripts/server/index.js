import { world } from "mojang-minecraft";

/* The first player joining the world triggers a PlayerJoinEvent even
 * before the world is fully loaded. Isn't it a bug...? */
let isReady = false;
const pendingJoins = [];
world.events.tick.subscribe(ev => {
    if (!isReady) {
        try {
            world.getDimension("overworld").runCommand("testfor @a");
            isReady = true;
        }
        catch (e) {}

        if (isReady) {
            for (const player of pendingJoins) {
                onPlayerJoin(player);
            }
            pendingJoins.splice(0);
        }
    }
});
world.events.playerJoin.subscribe(ev => {
    if (isReady) {
        onPlayerJoin(ev.player);
    }
    else {
        pendingJoins.push(ev.player);
    }
});

function onPlayerJoin(player) {
    player.runCommand(`tellraw @s {"rawtext": [{"text": "${player.name} joined the world."}]}`);
}

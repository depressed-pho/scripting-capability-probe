import { Player } from "cicada-lib/player";
import { PlayerPrefs } from "./player-prefs";

export class PlayerPrefsUI {
    public static open(pl: Player): void {
        const prefs = pl.preferences(PlayerPrefs);
        console.log("%O", prefs);

        prefs.useFormatCodes = true;
    }
}

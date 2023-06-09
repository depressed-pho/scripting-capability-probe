import { Player } from "cicada-lib/player.js";
import { ModalFormData } from "cicada-lib/ui.js";
import { PlayerPrefs } from "./player-prefs_pb.js";

export class PlayerPrefsUI {
    public static async open(player: Player): Promise<void> {
        const prefs = player.getPreferences(PlayerPrefs);
        const form  = new ModalFormData()
            .title("Preferences")
            .toggle("Use format codes in probing result", !prefs.noUseFormatCodes)
            .toggle("Show details of failed probes", prefs.showFailureDetails);

        const resp  = await form.show(player);
        if (resp.formValues) {
            prefs.noUseFormatCodes   = !(resp.formValues[0] as boolean);
            prefs.showFailureDetails = resp.formValues[1] as boolean;
            player.setPreferences(PlayerPrefs, prefs);
        }
    }
}

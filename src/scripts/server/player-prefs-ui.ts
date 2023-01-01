import { Player } from "cicada-lib/player";
import { ModalFormData } from "cicada-lib/ui";
import { PlayerPrefs } from "./player-prefs_pb";

export class PlayerPrefsUI {
    public static async open(player: Player): Promise<void> {
        const prefs = player.preferences(PlayerPrefs);
        const form  = new ModalFormData()
            .title("Preferences")
            .toggle("Use format codes in probing result", !prefs.noUseFormatCodes)
            .toggle("Show details of failed probes", prefs.showFailureDetails);

        const resp  = await form.show(player);
        if (resp.formValues) {
            // THINKME: Isn't autosave bad because it would have a
            // performance cost...?
            prefs.noUseFormatCodes   = !resp.formValues[0];
            prefs.showFailureDetails = resp.formValues[1];
        }
    }
}

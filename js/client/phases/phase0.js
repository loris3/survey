import { advancePhase } from "../api";
import { showLoadingError } from "../util";

export async function loadPhase0(loadPhase) {
    const template = document.querySelector("#template-phase0-instructions-card");
    const node = template.content.cloneNode(true);
    document.querySelector("#card-container").appendChild(node);

    const template_text = document.querySelector("#template-phase0-text");
    const node_text = template_text.content.cloneNode(true);
    document.querySelector(".phase-0-text").appendChild(node_text)

    document.querySelector("#btn-continue-to-phase1").addEventListener("click", async(event) => {
        try {
            await advancePhase(1);
        } catch (error) {
            showLoadingError();
            return;
        }
        loadPhase();
    })
}

export function showPhase0Instructions() {
    if (document.querySelector("#instructions-dialog") == null) {
        const template = document.querySelector("#template-instructions-dialog");
        const node = template.content.cloneNode(true);
        document.querySelector("body").appendChild(node);

        const template_text = document.querySelector("#template-phase0-text");
        const node_text = template_text.content.cloneNode(true);
        document.querySelector(".phase-0-text").appendChild(node_text)
    }


    document.querySelector("#instructions-dialog").setAttribute('open', '')

}
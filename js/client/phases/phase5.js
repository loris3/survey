import { clearCookie } from "../api";
import { loadAuthCard } from "../auth";
import { clearCardContainerAndDisplayLoadingAnimation, downloadBackup, updateProgressBar } from "../util";

export async function loadPhase5(loadPhase) {
    const template = document.querySelector("#template-phase5-card");
    const node = template.content.cloneNode(true);
    document.querySelector("#card-container").appendChild(node);

    document.querySelector("#btn-exit").addEventListener("click", (event) => {
        console.log("Clearing cookie")
        clearCookie();
        clearCardContainerAndDisplayLoadingAnimation();
        loadAuthCard();
        updateProgressBar();
        
    })
    downloadBackup();
}
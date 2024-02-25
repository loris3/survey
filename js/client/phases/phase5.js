import { clearCookie, getHeaders } from "../api";
import { loadAuthCard } from "../auth";
import { clearCardContainerAndDisplayLoadingAnimation, updateProgressBar } from "../util";

export async function loadPhase5(loadPhase, download=false) {
    const template = document.querySelector("#template-phase5-card");
    const node = template.content.cloneNode(true);
    document.querySelector("#card-container").appendChild(node);

    document.querySelector("#btn-exit").addEventListener("click", (event) => {
        console.log("Clearing cookie")
        clearCookie();
        clearCardContainerAndDisplayLoadingAnimation();
        loadAuthCard(loadPhase);
        updateProgressBar();
        
    })

    document.querySelector("#btn-download").addEventListener("click", downloadBackup);
    if(download) downloadBackup();
}

export async function downloadBackup(){
    let dump = await fetch("./api/dump", { method: "GET", headers: getHeaders()});
    // needed as api/dump requires the auth_token https://stackoverflow.com/questions/19327749/javascript-blob-filename-without-link
    const objURL = window.URL.createObjectURL(await dump.blob());
    const a = document.createElement("a");
    a.style = "display: none";
    document.body.appendChild(a);
    a.href = objURL;
    a.setAttribute("target", "_blank");
    a.download = "user-study-backup.pdf";
    a.click();
    window.URL.revokeObjectURL(objURL);
}
import { getHeaders, getState } from "./api";

// https://stackoverflow.com/questions/2592092/executing-script-elements-inserted-with-innerhtml
export function setInnerHTML(elm, html) {

    elm.innerHTML = html;

    Array.from(elm.querySelectorAll("script"))
        .forEach(oldScriptEl => {
            const newScriptEl = document.createElement("script");

            Array.from(oldScriptEl.attributes).forEach(attr => {
                newScriptEl.setAttribute(attr.name, attr.value)
            });

            const scriptText = document.createTextNode(oldScriptEl.innerHTML);
            newScriptEl.appendChild(scriptText);

            oldScriptEl.parentNode.replaceChild(newScriptEl, oldScriptEl);
        });
}
export async function checkMinViewportWidhtAndDisplayWarning() {
    let current_phase = -1;
    try {
        current_phase = (await getState()).current_phase;
    } catch (error) {
        
    }
    if (screen.availWidth <= 600 && screen.availHeight > screen.availWidth && current_phase == 3) {
        document.getElementById("dialog-viewport-width-to-low").setAttribute('open', '')
    } else {
        document.getElementById("dialog-viewport-width-to-low").removeAttribute("open")
    }


}
export async function downloadBackup(){
    let dump = await fetch("./api/dump", { method: "GET", headers: getHeaders()});
    // needed as api/dump requires the auth_token https://stackoverflow.com/questions/19327749/javascript-blob-filename-without-link
    const objURL = window.URL.createObjectURL(await dump.blob());
    const a = document.createElement("a");
    a.style = "display: none";
    document.body.appendChild(a);
    a.href = objURL;
    a.download = "user-study-backup.pdf";
    a.click();
    window.URL.revokeObjectURL(objURL);
}

export function toggleFullscreen() {

    if (document.fullscreenElement !== null) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            document.querySelector("#enter-fullscreen").style.visibility = "visible";
            document.querySelector("#exit-fullscreen").style.visibility = "collapse";
        } else {
            alert("Your browser doesn't support this")
        }

    } else {
        elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
            document.querySelector("#enter-fullscreen").style.visibility = "collapse";
            document.querySelector("#exit-fullscreen").style.visibility = "visible";
        } else {
            alert("Your browser doesn't support this")
        }
    }
}


export async function updateProgressBar() {
    let state; 
    try {
        state = await getState();
    } catch (error) {
        document.querySelector("#progress-bar").setAttribute("value", 0)
        document.querySelector("#progress-bar").removeAttribute("indeterminate")
        return;
    }
    let total_progress = 0;
    if (state.current_phase >= 0) {
        total_progress = (state.current_phase - 1) * 25;
    }
    let progress_current_phase = 25 * Math.ceil(document.documentElement.scrollTop) / (document.documentElement.scrollHeight - document.documentElement.clientHeight);
    if (state.current_phase == -1) {
        progress_current_phase = 0;
    }
    total_progress += progress_current_phase
    document.querySelector("#progress-bar").setAttribute("value", Math.min(100, total_progress))
    document.querySelector("#progress-bar").removeAttribute("indeterminate")
}

export async function clearCardContainerAndDisplayLoadingAnimation() {
    document.querySelector("#progress-bar").setAttribute("indeterminate", "")
    const cardContainer = document.querySelector("#card-container");
    cardContainer.replaceChildren();



}




export function showCommunicationError() {
    document.querySelector("#progress-bar").setAttribute("indeterminate", "")
    console.log("Communication error")

    if (document.querySelector("#connection-issues-warning") == null) {
        const template = document.querySelector("#template-connection-issues-warning");
        const node = template.content.cloneNode(true);
        document.querySelector("body").appendChild(node);
    }
    document.querySelector("#connection-issues-warning").setAttribute('open', '')


}
export function showLoadingError() {
    document.querySelector("#progress-bar").setAttribute("indeterminate", "")
    console.log("Loading error")

    if (document.querySelector("#loading-issues-warning") == null) {
        const template = document.querySelector("#template-loading-issues-warning");
        const node = template.content.cloneNode(true);
        document.querySelector("body").appendChild(node);
    }
    document.querySelector("#loading-issues-warning").setAttribute('open', '')



}

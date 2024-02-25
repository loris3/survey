import {getState, hasToken } from "./api";

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
    let current_phase;
    if(!hasToken()){
        current_phase = -1;
    }else{
        try {
            current_phase = (await getState()).current_phase;
        } catch (error) {
            showGenericError(error)
        }
    }

    if (screen.availWidth <= 600 && screen.availHeight > screen.availWidth && current_phase == 3) {
        document.getElementById("dialog-viewport-width-to-low").setAttribute('open', '')
    } else {
        document.getElementById("dialog-viewport-width-to-low").removeAttribute("open")
    }


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
    if(!hasToken()){
        document.querySelector("#progress-bar").removeAttribute("indeterminate")
        document.querySelector("#progress-bar").setAttribute("value", 0)
        
        return;
    }
    let state; 
    try {
        state = await getState();
    } catch (error) {
        showGenericError(error)
    }

    let total_progress = 0;

    if (state.current_phase > 0) {
        total_progress = (state.current_phase - 1) * 25;
        let progress_current_phase = 25 * Math.ceil(document.documentElement.scrollTop) / (document.documentElement.scrollHeight - document.documentElement.clientHeight);
        if(isNaN(progress_current_phase)){
            progress_current_phase = 0;
        }
        total_progress += progress_current_phase
    }
    document.querySelector("#progress-bar").removeAttribute("indeterminate")
    document.querySelector("#progress-bar").setAttribute("value", Math.min(100, total_progress))
    
}

export async function clearCardContainerAndDisplayLoadingAnimation() {
    document.querySelector("#progress-bar").setAttribute("indeterminate", "")
    const cardContainer = document.querySelector("#card-container");
    cardContainer.replaceChildren();



}




export function showCommunicationError() {
    document.querySelector("#progress-bar").setAttribute("indeterminate", "")
    console.error("Communication error")

    if (document.querySelector("#connection-issues-warning") == null) {
        const template = document.querySelector("#template-connection-issues-warning");
        const node = template.content.cloneNode(true);
        document.querySelector("body").appendChild(node);
    }
    document.querySelector("#connection-issues-warning").setAttribute('open', '')


}
export function showLoadingError() {
    document.querySelector("#progress-bar").setAttribute("indeterminate", "")
    console.error("Loading error")

    if (document.querySelector("#loading-issues-warning") == null) {
        const template = document.querySelector("#template-loading-issues-warning");
        const node = template.content.cloneNode(true);
        document.querySelector("body").appendChild(node);
    }
    document.querySelector("#loading-issues-warning").setAttribute('open', '')



}

export function showGenericError(err) {
    document.querySelector("#progress-bar").setAttribute("indeterminate", "")
    console.error("Generic error", err)

    if (document.querySelector("#generic-issues-warning") == null) {
        const template = document.querySelector("#template-generic-issues-warning");
        const node = template.content.cloneNode(true);
        document.querySelector("body").appendChild(node);
    }
    document.querySelector("#generic-error-stack").innerHTML = err.stack;
    document.querySelector("#generic-error-name").innerHTML = err.name;
    document.querySelector("#generic-error-message").innerHTML = err.message;
    document.querySelector("#generic-issues-warning").setAttribute('open', '')



}


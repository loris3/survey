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
export function showIncompleteInputError() {
    console.error("Incomplete Input error")

    if (document.querySelector("#incomplete-input-error") == null) {
        const template = document.querySelector("#template-incomplete-input-error");
        const node = template.content.cloneNode(true);
        document.querySelector("body").appendChild(node);
    }
    document.querySelector("#incomplete-input-error").setAttribute('open', '')



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


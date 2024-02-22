import { advancePhase, getHeaders } from "../api";
import { showCommunicationError, showLoadingError, updateProgressBar } from "../util";

export async function restorePhase(phase) {
    let response = null;
    try {
        response = await fetch("./getPhase" + phase, { method: 'GET', headers: getHeaders() });
    } catch (error) {
        showLoadingError()
    }
    if (response.status != 200) {
        showLoadingError()
        return
    }

    const oldState = await response.json()
    oldState.forEach((row) => {

        if (row.label == 0) {
            document.querySelector("#user-label-document-machine-" + row.document_nr).checked = true;
        } else {
            document.querySelector("#user-label-document-human-" + row.document_nr).checked = true;
        }


    })

}
let retryIntervals = [];
export function submitResponse_(documentNr, phase) {
    return async () => {
        form = document.querySelector("#user-label-document-form-" + documentNr)
        let label = new FormData(form).get("user-label-document-" + documentNr) == "human" ? 1 : 0
        try {
            let response = await fetch("./submitPhase" + phase, { method: "POST", headers: getHeaders(), body: JSON.stringify({ ID: documentNr, label }) });

            if (response.status != 201) {

                console.log("response", response.status)
            } else {
                if (document.querySelector("#connection-issues-warning")) {
                    document.querySelector("#connection-issues-warning").removeAttribute('open')
                }

                updateProgressBar();
            }
        } catch (error) {
            console.log(error)
            showCommunicationError()

            const timeout = 5000;

            const updateDialog = (remaining) => {

                const span = document.querySelector("#retry-seconds-remaining")
                if (span != null && remaining > 0) {
                    span.innerHTML = remaining / 1000
                    setTimeout(() => { updateDialog(remaining - 1000) }, 1000)
                }
            }
            updateDialog(timeout)
            setTimeout(submitResponse_(documentNr, phase), timeout + 100)


        }

    }
}


export async function showConfirmDialog(next, loadPhase) {
    if (document.querySelector("confirm-complete-phase") != null) {
        document.querySelector("confirm-complete-phase").remove();
    }
    const template = document.querySelector("#template-confirm-complete-phase");
    const node = template.content.cloneNode(true);
    document.querySelector("body").appendChild(node);

    document.querySelector("#confirm-complete-phase-continue").removeev
    document.querySelector("#confirm-complete-phase-continue").addEventListener("click", async () => {
        try {
            await advancePhase(next);
        } catch (error) {
            showLoadingError();
            return;
        }
        loadPhase();
        document.querySelector("#confirm-complete-phase").removeAttribute('open')

    });
    document.querySelector("#confirm-complete-phase-cancel").addEventListener("click", () => { document.querySelector("#confirm-complete-phase").removeAttribute('open') });
    document.querySelector("#confirm-complete-phase").setAttribute('open', '')
}
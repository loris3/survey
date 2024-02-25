import { advancePhase, getParticipantInfo, submitParticipantInfo } from "../api";
import { showCommunicationError, showLoadingError, updateProgressBar } from "../util";

export async function loadParticipantInfoForm(loadPhase) {
    const template = document.querySelector("#template-participant-data-form-card");
    const node = template.content.cloneNode(true);
    document.querySelector("#card-container").appendChild(node);



    document.querySelector('#participant-data-has-seen-explanation-methods-before-yes').addEventListener("change", (event) => {
        if (event.target.value == "yes") {
            document.querySelector("#participant-data-optional-has-used-explanation-methods-before").style.display = "initial";
        }
    })
    document.querySelector('#participant-data-has-seen-explanation-methods-before-no').addEventListener("change", (event) => {
        if (event.target.value == "no") {
            document.querySelector("#participant-data-optional-has-used-explanation-methods-before").style.display = "none";
        }
    })


    document.querySelector("#participant-info-form").addEventListener("input", submitParticipantInfoForm)

    document.querySelector("#btn-continue-to-phase0").addEventListener("click", async (event) => {

        if (document.querySelector("#participant-info-form").reportValidity()) {
            try {
                if(await advancePhase(0)){
                    loadPhase();
                }
            } catch (error) {
                showLoadingError();
                return;
            }
        }


    });

    document.querySelector("#btn-open-cvd-info-dialog").addEventListener("click", (event) => {
        event.preventDefault();
        if (!document.querySelector("#cvd-dialog")) {
            const template = document.querySelector("#template-cvd-dialog");
            const node = template.content.cloneNode(true);
            document.querySelector("body").appendChild(node);
        }
        document.querySelector("#cvd-dialog").setAttribute('open', '')

    })

    restoreParticipantInfoForm(); // fetch and load old state

}

async function restoreParticipantInfoForm() {
    let oldState;
    try {
        oldState =  await getParticipantInfo();
    } catch (error) {
        showLoadingError();
        return;
    }

    if (oldState.length > 0) {
        const participant_info = oldState[0]
        console.log(participant_info)
        const form = document.querySelector("#participant-info-form");

        form.querySelector("#participant-data-level-of-expertise").value = participant_info.level_of_expertise
        form.querySelector("#participant-data-familiarity-with-chatgpt").value = participant_info.familiarity_with_chatgpt
        if (participant_info.prefers_monochromatic_methods == "yes") {
            document.querySelector("#participant-data-has-seen-explanation-methods-before-yes").setAttribute("checked", "")
            document.querySelector("#participant-data-optional-has-used-explanation-methods-before").style.display = "initial";

        }
        if (participant_info.has_seen_explanation_methods_before == "no") {
            document.querySelector("#participant-data-has-seen-explanation-methods-before-no").setAttribute("checked", "")
        }

        if (participant_info.has_seen_explanation_methods_before == "yes") {
            document.querySelector("#participant-data-has-seen-explanation-methods-before-yes").setAttribute("checked", "")
            document.querySelector("#participant-data-optional-has-used-explanation-methods-before").style.display = "initial";

        }

        if (participant_info.prefers_monochromatic_methods == "no") {
            document.querySelector("#prefers-monochromatic-methods-no").setAttribute("checked", "")
        }

        if (participant_info.prefers_monochromatic_methods == "yes") {
            document.querySelector("#prefers-monochromatic-methods-yes").setAttribute("checked", "")

        }

        if (participant_info.has_seen_ANCHOR_before == "yes") {
            document.querySelector("#participant-data-has-seen-ANCHOR-before").setAttribute("checked", "")
        }
        if (participant_info.has_seen_LIME_before == "yes") {
            document.querySelector("#participant-data-has-seen-LIME-before").setAttribute("checked", "")
        }
        if (participant_info.has_seen_SHAP_before == "yes") {
            document.querySelector("#participant-data-has-seen-SHAP-before").setAttribute("checked", "")
        }
        if (participant_info.has_seen_OTHERS_before == "yes") {
            document.querySelector("#participant-data-has-seen-OTHERS-before").setAttribute("checked", "")
        }
    }

}

async function submitParticipantInfoForm(event) {
    const form = document.querySelector("#participant-info-form");
    if(!await submitParticipantInfo(form)){
        showCommunicationError();
        const timeout = 5000;
        const updateDialog = (remaining) => {
            const span = document.querySelector("#retry-seconds-remaining")
            if (span != null && remaining > 0) {
                span.innerHTML = remaining / 1000
                setTimeout(() => { updateDialog(remaining - 1000) }, 1000)
            }
        }
        updateDialog(timeout)
        setTimeout(() => { submitParticipantInfoForm(event) }, timeout + 100)
    }else{
        if (document.querySelector("#connection-issues-warning")) {
            document.querySelector("#connection-issues-warning").removeAttribute('open')
            updateProgressBar();
        }
        
    }
}
import { loadAnchorsExample1, loadAnchorsExample2 } from "../../../anchors-example";
import { loadShapExample1 } from "../../../shap_example";
import { loadLIMEExample1 } from "../../../lime-example";
import { checkMinViewportWidhtAndDisplayWarning, setInnerHTML, showCommunicationError, showLoadingError, updateProgressBar } from "../util";
import { getHeaders, getState, submitLickert } from "../api";

import { showConfirmDialog } from "./util";

// just like loadPhase1 but now with explanations
export async function loadPhase3(loadPhase) {
    checkMinViewportWidhtAndDisplayWarning()
    const template_instructions = document.querySelector("#template-phase3-instructions-card");
    const node_instructions = template_instructions.content.cloneNode(true);
    document.querySelector("#card-container").appendChild(node_instructions);

    const state = await getState();
    // load explanation method specific prompt
    let template_instructions_explanation_method = null;
    if (state.explainer == "SHAP_Explainer") {
        template_instructions_explanation_method = document.querySelector("#template-phase3-instructions-shap");
    } else if (state.explainer == "LIME_Explainer") {
        template_instructions_explanation_method = document.querySelector("#template-phase3-instructions-lime");
    } else if (state.explainer == "Anchor_Explainer") {
        template_instructions_explanation_method = document.querySelector("#template-phase3-instructions-anchors");
    }


    const node_instructions_explanation_method = template_instructions_explanation_method.content.cloneNode(true);
    document.querySelector("#phase3-instructions-card > #explanation-method-specific-instructions-container").appendChild(node_instructions_explanation_method);
    if (state.explainer == "Anchor_Explainer") {
        loadAnchorsExample1();
        loadAnchorsExample2();
    } else if (state.explainer == "LIME_Explainer") {
        loadLIMEExample1();
    } else if (state.explainer == "SHAP_Explainer") {
        loadShapExample1();
    }
    let template_html = null;
    try {
        template_html = await (await fetch("./template-explanation-card.html")).text()
    } catch (error) {
        showLoadingError()
        return
    }
    for (let i = 0; i < state.document_order_a.length; i++) { // sync to retain order
        const documentNr = state.document_order_a[i];
        let response = null;
        try {
            response = await fetch("./documentPhase3/" + documentNr, { method: 'GET', headers: getHeaders() })
        } catch (error) {
            showLoadingError()
            console.log("catch")
            return
        }
        if (response.status == 200) {
            const doc = await response.json();
            const card = document.createElement("div")
            card.setAttribute("class", "card explanation-card")
            
            card.innerHTML = template_html.replaceAll("nr", doc.document_nr)


            card.querySelectorAll(".ground_truth").forEach((element) => {
                element.innerHTML = doc.ground_truth == 1 ? "human written" : "machine generated";
            });
            card.querySelectorAll(".prediction").forEach((element) => {
                element.innerHTML = (doc.detector_p_machine <= doc.detector_p_human) ? "human written" : "machine generated";
            });

            const detectorWasRight = doc.ground_truth == (doc.detector_p_machine <= doc.detector_p_human);
            card.querySelector(".wrongly-correctly").innerHTML = detectorWasRight ? "correctly" : "wrongly";
            card.querySelector(".wrongly-correctly").setAttribute(detectorWasRight ? "correctly" : "wrongly", "")


            card.querySelector(".detector-p-machine-val").innerHTML = parseFloat(doc.detector_p_machine * 100).toFixed(2).padStart(12).replaceAll(" ", "&nbsp; ");
            card.querySelector(".detector-p-human-val").innerHTML = parseFloat(doc.detector_p_human * 100).toFixed(2).padStart(12).replaceAll(" ", "&nbsp; ");
            
            card.querySelector("form").addEventListener("change", submitResponseLickert_(doc.document_nr))
            // fetch explanation
            let response_explanation = null;
            try {
                response_explanation = await fetch("./explanation/" + doc.explanation_filename, { method: 'GET', headers: getHeaders() })
            } catch (error) {
                showLoadingError()
                return
            }

            if (response_explanation.status == 200) {
                const explanation_html = await response_explanation.text();
                document.querySelector("#card-container").appendChild(card); // need to add this to document first as LIME has a loop to determine barchart width!!
                setInnerHTML(document.querySelector("#card-container .card:last-child .explanation-html"), explanation_html);

                if (state.explainer == "SHAP_Explainer") {
                    // fix some minor display bugs
                    document.querySelectorAll("#card-container .card:last-child .explanation-html > svg > text:nth-child(15)").forEach((element) => { element.remove() })
                    document.querySelectorAll("#card-container .card:last-child .explanation-html > svg > text:nth-child(14)").forEach((element) => { element.remove() })

                    // SHAP adds event listeners to nonexistent elements in the forceplot
                    // clone and re-add to get rid of them
                    document.querySelectorAll(".explanation-container > div > div[align='center'] > div > div").forEach((element) => {
                        // the issue are the elements with no arrow in the forceplot, i.e. those with zero fi, i.e. the unshaded ones

                        try {
                            if (element.style.background.split(',')[3] == " 0)") {
                                element.removeAttribute('onmouseover')
                                element.removeAttribute('onmouseout')
                                element.removeAttribute('onclick')
                                let new_ = element.cloneNode(true);
                                element.parentNode.replaceChild(new_, element);
                            }
                        } catch (error) {

                        }

                    })


                    const template = document.querySelector("#template-shap-force-plot-legend");
                    const node = template.content.cloneNode(true);
                    const explanation_html = document.querySelector("#card-container .card:last-child .explanation-html")
                    explanation_html.insertBefore(node, explanation_html.firstChild)
                }

            } else {
                throw Error("Error fetching explanation")
            }
        } else if (response.status == 403) {
            throw new Error("Wrong phase")
        } else {
            throw new Error("Error fetching document in phase 3")
        }

    }
    const template = document.querySelector("#template-phase3-complete");
    const node = template.content.cloneNode(true);
    node.querySelector("#btn-continue-to-phase4").addEventListener("click", (event) => {
        let all_valid = Array.from(document.querySelectorAll("form")).reduce((acc, elem) => {
            return true || elem.reportValidity() && acc;
        }, true)
        if (true || all_valid) {
            showConfirmDialog(4, loadPhase)
        }
        
    });
    document.querySelector("#card-container").appendChild(node);

    restorePhase3();
}

export function submitResponseLickert_(documentNr) {
    return async () => {
        const form = document.querySelector("#user-label-explanation-form-"+documentNr);
        if(!await submitLickert(form, documentNr)){
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
            setTimeout(submitResponseLickert_(documentNr), timeout + 100)
        }else{
            if (document.querySelector("#connection-issues-warning")) {
                document.querySelector("#connection-issues-warning").removeAttribute('open')
                updateProgressBar();
            }
            
        }

    }
}
export async function restorePhase3() {
    let response = null;
    try {
        response = await fetch("./getPhase3", { method: 'GET', headers: getHeaders() });
    } catch (error) {
        showLoadingError()
    }
    if (response.status != 200) {
        showLoadingError()
        return
    }

    const oldState = await response.json()
    oldState.forEach((row) => {
        document.querySelector(`md-radio[name='lickert-q${row.question_nr}-${row.document_nr}'][value='${row.label}']`).checked = true;


    })

}
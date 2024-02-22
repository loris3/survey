import { getHeaders } from "../api";
import { showLoadingError } from "../util";
import { restorePhase, showConfirmDialog, submitResponse_ } from "./util";

export async function loadPhase4(loadPhase) { // identical to phase 2 save for the prompt
    const template_instructions = document.querySelector("#template-phase4-instructions-card");
    const node_instructions = template_instructions.content.cloneNode(true);
    document.querySelector("#card-container").appendChild(node_instructions);

    let template_html = null;
    try {
        template_html = await (await fetch("./template-labeling-card.html")).text()
    } catch (error) {
        showLoadingError()
        return
    }

    for (let i = 0; i < state.document_order_b.length; i++) { // sync to retain order
        const documentNr = state.document_order_b[i];
        let response = null;
        try {
            response = await fetch("./documentPhase4/" + documentNr, { method: 'GET', headers: getHeaders() })
        } catch (error) {
            showLoadingError()
            return
        }
        if (response.status == 200) {
            const doc = await response.json();
            const card = document.createElement("div")
            card.setAttribute("class", "card document-only-card labeling")
            card.innerHTML = template_html.replaceAll("nr", doc.document_nr)
            card.querySelector(".document-only-card-document").innerHTML = doc.document
            card.querySelector("form").addEventListener("change", submitResponse_(doc.document_nr, 4))
            document.querySelector("#card-container").appendChild(card);

        } else if (response.status == 403) {
            //throw new Error("Wrong phase")
            // db didn't update yet
            setTimeout(() => {
                loadPhase();
            }, 1000);
            return
        } else {
            throw new Error("Error fetching document in phase 4")
        }

    }
    restorePhase(4); // fetch and load old state
    const template = document.querySelector("#template-phase4-complete");
    const node = template.content.cloneNode(true);
    node.querySelector("#btn-continue-to-phase5").addEventListener("click", (event) => {

        let all_valid = Array.from(document.querySelectorAll("form")).reduce((acc, elem) => {
            return elem.reportValidity() && acc;
        }, true)
        if (all_valid) {
            showConfirmDialog(5, loadPhase)
        }



    });
    document.querySelector("#card-container").appendChild(node);



}

import { getHeaders, getState } from "../api";
import { showLoadingError } from "../util";
import { showConfirmDialog } from "./util";

export async function loadPhase1(loadPhase, updateProgressBar) {
    const template_instructions = document.querySelector("#template-phase1-instructions-card");
    const node_instructions = template_instructions.content.cloneNode(true);
    document.querySelector("#card-container").appendChild(node_instructions);

    const template_groups = document.querySelector("#template-groups-document-only-cards");
    const node_groups = template_groups.content.cloneNode(true);
    document.querySelector("#card-container").appendChild(node_groups);


    const state = await getState();
    for (let i = 0; i < state.document_order_a.length; i++) { // sync to retain order
        const documentNr = state.document_order_a[i];
        let response = null;
        try {
            response = await fetch("./api/documentPhase1/" + documentNr, { method: 'GET', headers: getHeaders() })
        } catch (error) {
            showLoadingError()
            return
        }

        if (response.status == 200) {
            const doc = await response.json();
            const template = document.querySelector("#template-document-only-card");
            let node = template.content.cloneNode(true);

            // HOTFIX: create sections "Prediction Human" and "Prediction Machine"
            if(doc.detector_p_machine <= doc.detector_p_human){
                
                document.querySelector("#card-container .group-human").appendChild(node);
                node = document.querySelector("#card-container > .group-human").lastElementChild;
                node.classList.add("human")

            }else{
                
                document.querySelector("#card-container .group-machine").appendChild(node);
                node = document.querySelector("#card-container > .group-machine").lastElementChild;
                node.classList.add("machine")
            }
            


            // node.querySelectorAll(".ground_truth").forEach((element) => {
            //     element.innerHTML = doc.ground_truth == 1 ? "human written" : "machine generated";
            // });
            
            node.querySelectorAll(".prediction").forEach((element) => {
                element.innerHTML = (doc.detector_p_machine <= doc.detector_p_human) ? "human written" : "machine generated";
                element.setAttribute((doc.detector_p_machine <= doc.detector_p_human) ? "human" : "machine", "")
            });
            const detectorWasRight = doc.ground_truth == (doc.detector_p_machine <= doc.detector_p_human);
            node.querySelector(".wrongly-correctly").innerHTML = detectorWasRight ? "correctly" : "wrongly";
            node.querySelector(".wrongly-correctly").setAttribute(detectorWasRight ? "correctly" : "wrongly", "")

            node.querySelector(".document-only-card-document").innerHTML = doc.document
            node.querySelector(".detector-p-machine-val").innerHTML = parseFloat(doc.detector_p_machine * 100).toFixed(2).padStart(12).replaceAll(" ", "&nbsp; ");
            node.querySelector(".detector-p-human-val").innerHTML = parseFloat(doc.detector_p_human * 100).toFixed(2).padStart(12).replaceAll(" ", "&nbsp; ");


            node.querySelector("md-fab").addEventListener("click", (elem)=>{
                elem.target.parentElement.parentElement.removeAttribute("blurred")
            })
        } else if (response.status == 403) {
            throw new Error("Wrong phase")

        } else {
            throw new Error("Error fetching document in phase 1")
        }

    }
    const template = document.querySelector("#template-phase1-complete");
    const node = template.content.cloneNode(true);
    node.querySelector("#btn-continue-to-phase2").addEventListener("click", (event) => {
        showConfirmDialog(2, loadPhase)


    });
    document.querySelector("#card-container").appendChild(node);


}
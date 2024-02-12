import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/divider/divider.js';
import '@material/web/progress/linear-progress.js'
import '@material/web/fab/fab.js'
import '@material/web/icon/icon.js'

import '@material/web/dialog/dialog.js';

import '@material/web/textfield/outlined-text-field.js'

import '@material/web/focus/md-focus-ring.js'
import '@material/web/button/filled-tonal-button.js'


import '@material/web/progress/circular-progress.js'
import '@material/web/checkbox/checkbox.js'
import '@material/web/radio/radio.js'

import '@material/web/select/outlined-select.js'
import '@material/web/select/select-option.js'



// https://stackoverflow.com/questions/2592092/executing-script-elements-inserted-with-innerhtml
function setInnerHTML(elm, html) {

    elm.innerHTML = html;
    
    Array.from(elm.querySelectorAll("script"))
      .forEach( oldScriptEl => {
        const newScriptEl = document.createElement("script");
        
        Array.from(oldScriptEl.attributes).forEach( attr => {
          newScriptEl.setAttribute(attr.name, attr.value) 
        });
        
        const scriptText = document.createTextNode(oldScriptEl.innerHTML);
        newScriptEl.appendChild(scriptText);
        
        oldScriptEl.parentNode.replaceChild(newScriptEl, oldScriptEl);
    });
  }
function checkMinViewportWidht(){
    if(screen.availWidth <= 600 && screen.availHeight > screen.availWidth && state.current_phase == 3){
        document.getElementById("dialog-viewport-width-to-low").setAttribute('open','')
    }else{
        document.getElementById("dialog-viewport-width-to-low").removeAttribute("open")
    }
    

}
function toggleFullscreen(){
   
    if(document.fullscreenElement !== null){
        if (document.exitFullscreen) {
            document.exitFullscreen();
            document.querySelector("#enter-fullscreen").style.visibility = "visible";
            document.querySelector("#exit-fullscreen").style.visibility = "collapse";
          }else{
            alert("Your browser doesn't support this")
          }
          
    }else{
        elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
        document.querySelector("#enter-fullscreen").style.visibility = "collapse";
        document.querySelector("#exit-fullscreen").style.visibility = "visible";
      }else{
        alert("Your browser doesn't support this")
      }
    }
}
//////////////////////////////////////
function getHeaders() {
    return {'Content-Type': 'application/json','Authorization': `Bearer ${token}`, "Content-Type": "application/json",}
    
}





async function nextPhase(expectedPhase){
    if(state.current_phase == expectedPhase -1 ){ // handle spamming button / multiple dialogs open
        state.current_phase +=1;
        clearCardContainerAndDisplayLoadingAnimation();

        try {
            response = await fetch("./completeCurrentPhase",  {method: 'GET',  headers: getHeaders()})
                if(response.status == 200){
                    clearCardContainerAndDisplayLoadingAnimation()
                    loadPhase();
                }else{
                    showLoadingError();
                }
        } catch (error) {
            showLoadingError();
        }
    }

        
    
}

async function performAuth(access_token){

    let response = await fetch("./auth/"+access_token);
    if(response.status == 200){
        token = await response.json();
        document.cookie = `token=${token}; Max-Age=31536000`
        document.querySelector("#auth-card").remove()
        loadPhase();
    }else{
        const template = document.querySelector("#template-alert-token-invalid");
        const node = template.content.cloneNode(true);
        document.querySelector("body").appendChild(node);
        document.querySelector("#alert-token-invalid").setAttribute('open','')
        document.querySelector("#alert-token-invalid-ok").addEventListener("click", ()=>{
            document.querySelector("#alert-token-invalid").removeAttribute('open'); // TODO test again
        })
    }

}
async function loadAuthCard(){
    const template = document.querySelector("#template-auth-card");
    const node = template.content.cloneNode(true);
    document.querySelector("#card-container").appendChild(node);
    updateProgressBar();
    const form = document.querySelector("#auth-form");
    const submitBtn = document.querySelector("#auth-form-submit");
    submitBtn.addEventListener("click", (event) => {
        event.preventDefault();
        performAuth(document.querySelector("#text-field-access-token").value)
    });




    

    const tokenTextField = document.querySelector("#text-field-access-token");
    const formIsValid = () => {return tokenTextField.value.length == 6 && /^[A-Z]+$/.test(tokenTextField.value)}
    const reportValidity = (event)=>{
        tokenTextField.value = tokenTextField.value.toUpperCase()
        if(tokenTextField.value.length > 0 && !/^[A-Z]+$/.test(tokenTextField.value)){
            tokenTextField.setCustomValidity("There are only letters from A-Z in your token");           
            submitBtn.setAttribute("disabled", "true");
            
        }else{
            tokenTextField.setCustomValidity('');
            if(formIsValid()){
          
                submitBtn.removeAttribute("disabled");
            }
        }
        tokenTextField.reportValidity();

    };

    tokenTextField.addEventListener("keydown", (event)=>{
        if(event.key === "Enter" && formIsValid(event)){
            event.preventDefault();
            performAuth(event.target.value)
        }
    });

    tokenTextField.addEventListener("input", reportValidity)

    try {
        const token_from_url = (window.location.href + "").split("/").at(-1)
        tokenTextField.value = token_from_url;
        reportValidity()
    } catch (error) {
        
    }

}
let token = null;
async function init(e) {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
 


    document.getElementById("enter-fullscreen").addEventListener("click", toggleFullscreen);
    document.getElementById("exit-fullscreen").addEventListener("click", toggleFullscreen);
    document.querySelector("#open-instructions").addEventListener("click", showPhase0Instructions);
   // document.getElementById('explanation').innerHTML = "<p>loris</p>";
   

    loadPhase();
 


window.addEventListener("resize", checkMinViewportWidht);
checkMinViewportWidht();
let lastScrollTime = Date.now();
window.addEventListener("scroll", () => {
    if(Date.now() -lastScrollTime > 500){
        lastScrollTime = Date.now()
        updateProgressBar()
    }
    
});

  }

function updateProgressBar(){

        
        let total_progress = 0;
        if(state.current_phase >= 0){
            total_progress = (state.current_phase - 1) * 25;
        }
        let progress_current_phase = 25 * Math.ceil(document.documentElement.scrollTop)/(document.documentElement.scrollHeight - document.documentElement.clientHeight);
        total_progress += progress_current_phase
        document.querySelector("#progress-bar").setAttribute("value", Math.min(100,total_progress))
        document.querySelector("#progress-bar").removeAttribute("indeterminate")
}
  async function clearCardContainerAndDisplayLoadingAnimation(){
    document.querySelector("#progress-bar").setAttribute("indeterminate", "")
    const cardContainer = document.querySelector("#card-container");
    cardContainer.replaceChildren();

    

}


let state = {current_phase: -1}
async function loadPhase(){
    document.querySelector("#progress-bar").setAttribute("indeterminate", "")

    // fetch state
    cookies = document.cookie.split("token=")
    if(cookies.length == 2 && cookies[1].length > 0){
        token = cookies[1];
    }
    try {
        response = await fetch("./state",  {method: 'GET',  headers: getHeaders()})
    } catch (error) {
        showLoadingError();
    }
    if(response.status != 200){
        if(response.status == 403){ // not authorized, delete cookie, then "reload"
            if(document.cookie.length > 0){
                console.log("Clearing cookie")
                document.cookie = "token=; Max-Age=0'"
            }
            clearCardContainerAndDisplayLoadingAnimation();
            loadAuthCard();
            return
        }
        throw new Error("Couldn't get current phase")
    }
    state = await response.json();
    state.document_order_a = JSON.parse(state.document_order_a)
    state.document_order_b = JSON.parse(state.document_order_b)



    if(state.current_phase > 0){
        document.querySelector("#open-instructions").style.display = "initial"; 
    }
    switch(state.current_phase){
        case -1:
            await loadParticipantInfoForm();
            break;
        case 0:
            await loadPhase0();
            break;
        case 1:
            await loadPhase1();
            break;
        case 2:
            await loadPhase2();
            break;
        case 3:
            await loadPhase3();
            break;
        case 4:
            await loadPhase4();
            break;
        case 5:
            await loadPhase5();
            break;
    }
 
    updateProgressBar();

}
async function loadParticipantInfoForm(){
    const template = document.querySelector("#template-participant-data-form-card");
    const node = template.content.cloneNode(true);
    document.querySelector("#card-container").appendChild(node);


    document.querySelector("#btn-continue-to-phase0").addEventListener("click", (event) => {
        nextPhase(0);
    })
    document.querySelector('#participant-data-has-seen-explanation-methods-before-yes').addEventListener("change", (event)=>{
        if(event.target.value == "yes"){
            document.querySelector("#participant-data-optional-has-used-explanation-methods-before").style.display = "initial";
            console.log("yes")
        }
    })
    document.querySelector('#participant-data-has-seen-explanation-methods-before-no').addEventListener("change", (event)=>{
        if(event.target.value == "no"){
            document.querySelector("#participant-data-optional-has-used-explanation-methods-before").style.display = "none";
        }
    })
    

    document.querySelector("#participant-info-form").addEventListener("input", submitParticipantInfoForm)

    restoreParticipantInfoForm(); // fetch and load old state
}
async function restoreParticipantInfoForm(){
    let response = null;
    try {
         response = await fetch("./getParticipantInfo",  {method: 'GET',  headers: getHeaders()});
    } catch (error) {
        showLoadingError()
    }
    if(response.status != 200){
        showLoadingError()
    }

    const oldState = await response.json()
    if(oldState.length > 0){
        const participant_info = oldState[0]
        console.log(participant_info)
        const form = document.querySelector("#participant-info-form");
        
        form.querySelector("#participant-data-level-of-expertise").value = participant_info.level_of_expertise
        
        if(participant_info.has_seen_explanation_methods_before == "yes"){
            document.querySelector("#participant-data-has-seen-explanation-methods-before-yes").setAttribute("checked","")
            document.querySelector("#participant-data-optional-has-used-explanation-methods-before").style.display = "initial";

        }
        if(participant_info.has_seen_explanation_methods_before == "no"){
            document.querySelector("#participant-data-has-seen-explanation-methods-before-no").setAttribute("checked","")
        }

        if(participant_info.has_seen_ANCHOR_before == "yes"){
            document.querySelector("#participant-data-has-seen-ANCHOR-before").setAttribute("checked","")
        }
        if(participant_info.has_seen_LIME_before == "yes"){
            document.querySelector("#participant-data-has-seen-LIME-before").setAttribute("checked","")
        }
        if(participant_info.has_seen_SHAP_before == "yes"){
            document.querySelector("#participant-data-has-seen-SHAP-before").setAttribute("checked","")
        }
        if(participant_info.has_seen_OTHERS_before == "yes"){
            document.querySelector("#participant-data-has-seen-OTHERS-before").setAttribute("checked","")
        }
    }

}
async function submitParticipantInfoForm(event){
    const form = document.querySelector("#participant-info-form");
    const formData = new FormData(form);
    
    const plainFormData = Object.fromEntries(formData.entries()); // https://simonplend.com/how-to-use-fetch-to-post-form-data-as-json-to-your-api/
    const json = JSON.stringify(plainFormData);
    try{
        let response = await fetch("./submitParticipantInfo", {method:"POST", headers:getHeaders(), body: json});
        
        if(response.status != 201){
            
            console.log("response", response.status)
        }else{
            if(document.querySelector("#connection-issues-warning")){
                document.querySelector("#connection-issues-warning").removeAttribute('open')
            }
            
            updateProgressBar();
        }
    }catch(error){
        console.log(error)
        showCommunicationError()
        
        const timeout = 5000;
        const updateDialog = (remaining) => {
            const span = document.querySelector("#retry-seconds-remaining")
            if(span != null && remaining > 0){
                span.innerHTML = remaining/1000
                setTimeout(()=>{updateDialog(remaining-1000)}, 1000)
            }
        }
        updateDialog(timeout)
        setTimeout(()=>{submitParticipantInfoForm(event)}, timeout+100)

        
    }
}
async function loadPhase0(){
    const template = document.querySelector("#template-phase0-instructions-card");
    const node = template.content.cloneNode(true);
    document.querySelector("#card-container").appendChild(node);

    const template_text = document.querySelector("#template-phase0-text");
    const node_text = template_text.content.cloneNode(true);
    document.querySelector(".phase-0-text").appendChild(node_text)

    document.querySelector("#btn-continue-to-phase1").addEventListener("click", (event) => {
        nextPhase(1);
    })
}
function showPhase0Instructions(){
    if(document.querySelector("#instructions-dialog") == null){
        const template = document.querySelector("#template-instructions-dialog");
        const node = template.content.cloneNode(true);
        document.querySelector("body").appendChild(node);
        
        const template_text = document.querySelector("#template-phase0-text");
        const node_text = template_text.content.cloneNode(true);
        document.querySelector(".phase-0-text").appendChild(node_text)
    }
   

    document.querySelector("#instructions-dialog").setAttribute('open','')

}
async function loadPhase5(){
    const template = document.querySelector("#template-phase5-card");
    const node = template.content.cloneNode(true);
    document.querySelector("#card-container").appendChild(node);

    document.querySelector("#btn-exit").addEventListener("click", (event) => {
        console.log("Clearing cookie")
        document.cookie = "token=; Max-Age=0'"
        clearCardContainerAndDisplayLoadingAnimation();
        loadAuthCard();
    })
}
async function loadPhase1(){
    const template_instructions = document.querySelector("#template-phase1-instructions-card");
    const node_instructions = template_instructions.content.cloneNode(true);
    document.querySelector("#card-container").appendChild(node_instructions);

    for(let i = 0; i < state.document_order_a.length; i++) { // sync to retain order
        const documentNr = state.document_order_a[i];
        let response = null;
        try {
            response = await fetch("./documentPhase1/"+documentNr,  {method: 'GET',  headers: getHeaders()})
        } catch (error) {
            showLoadingError()
            return
        }
        
        if(response.status == 200){
            const doc = await response.json();
            const template = document.querySelector("#template-document-only-card");
            const node = template.content.cloneNode(true);

            node.querySelectorAll(".ground_truth").forEach((element) => {
                element.innerHTML = doc.ground_truth == 1 ? "human written" : "machine generated";
            });
            node.querySelectorAll(".prediction").forEach((element) => {
                element.innerHTML = (doc.detector_p_machine <= doc.detector_p_human)  ? "human written" : "machine generated";
            });
            const detectorWasRight = doc.ground_truth == (doc.detector_p_machine <= doc.detector_p_human);
            node.querySelector(".wrongly-correctly").innerHTML = detectorWasRight ? "correctly" : "wrongly";
            node.querySelector(".wrongly-correctly").setAttribute(detectorWasRight ? "correctly" : "wrongly", "")

            node.querySelector(".document-only-card-document").innerHTML = doc.document
            node.querySelector(".detector-p-machine-val").innerHTML = parseFloat(doc.detector_p_machine*100).toFixed(2).padStart(12).replaceAll(" ", "&nbsp; ");
            node.querySelector(".detector-p-human-val").innerHTML = parseFloat(doc.detector_p_human*100).toFixed(2).padStart(12).replaceAll(" ", "&nbsp; ");

            document.querySelector("#card-container").appendChild(node);
        }else if(response.status == 403){
            throw new Error("Wrong phase")
        }else{
            throw new Error("Error fetching document in phase 1")
        }
  
    }
    const template = document.querySelector("#template-phase1-complete");
    const node = template.content.cloneNode(true);
    node.querySelector("#btn-continue-to-phase2").addEventListener("click", (event)=>{
        showConfirmDialog(2)
        
    });
    document.querySelector("#card-container").appendChild(node);
    

}
function showCommunicationError(){
    document.querySelector("#progress-bar").setAttribute("indeterminate", "")
    console.log("Communication error")

    if(document.querySelector("#connection-issues-warning") == null){
        const template = document.querySelector("#template-connection-issues-warning");
        const node = template.content.cloneNode(true);
        document.querySelector("body").appendChild(node);
    }
    document.querySelector("#connection-issues-warning").setAttribute('open','')
    

}
function showLoadingError(){
    document.querySelector("#progress-bar").setAttribute("indeterminate", "")
    console.log("Loading error")

    if(document.querySelector("#loading-issues-warning") == null){
        const template = document.querySelector("#template-loading-issues-warning");
        const node = template.content.cloneNode(true);
        document.querySelector("body").appendChild(node);
    }
    document.querySelector("#loading-issues-warning").setAttribute('open','')
 
    

}
let retryIntervals = [];
function submitResponse_(documentNr, phase){
    return async () =>{
        form = document.querySelector("#user-label-document-form-" + documentNr)
        let label = new FormData(form).get("user-label-document-" + documentNr) == "human" ? 1 : 0
        try{
            let response = await fetch("./submitPhase"+phase, {method:"POST", headers:getHeaders(), body: JSON.stringify({ID: documentNr, label})});
            
            if(response.status != 201){
                
                console.log("response", response.status)
            }else{
                if(document.querySelector("#connection-issues-warning")){
                    document.querySelector("#connection-issues-warning").removeAttribute('open')
                }
                
                updateProgressBar();
            }
        }catch(error){
            console.log(error)
            showCommunicationError()
            
            const timeout = 5000;
            
            const updateDialog = (remaining) => {

                const span = document.querySelector("#retry-seconds-remaining")
                if(span != null && remaining > 0){
                    span.innerHTML = remaining/1000
                    setTimeout(()=>{updateDialog(remaining-1000)}, 1000)
                }
            }
            updateDialog(timeout)
            setTimeout(submitResponse_(documentNr,phase), timeout+100)
        
        
        }
        
    }
}
async function restorePhase(phase){
    let response = null;
    try {
         response = await fetch("./getPhase"+phase,  {method: 'GET',  headers: getHeaders()});
    } catch (error) {
        showLoadingError()
    }
    if(response.status != 200){
        showLoadingError()
    }

    const oldState = await response.json()
    oldState.forEach((row)=>{

        if(row.label == 0){
            document.querySelector("#user-label-document-machine-" + row.document_nr).checked = true; 
        }else{
            document.querySelector("#user-label-document-human-" + row.document_nr).checked = true;
        }
        
        
    })

}
async function loadPhase2(){
    const template_instructions = document.querySelector("#template-phase2-instructions-card");
    const node_instructions = template_instructions.content.cloneNode(true);
    document.querySelector("#card-container").appendChild(node_instructions);

    let template_html = null;
    try {
        template_html = await (await fetch("./template-labeling-card.html")).text()
    } catch (error) {
        showLoadingError()
        return
    }

    for(let i = 0; i < state.document_order_b.length; i++) { // sync to retain order
        const documentNr = state.document_order_b[i];
        let response = null;
        try {
            response = await fetch("./documentPhase2/"+documentNr,  {method: 'GET',  headers: getHeaders()})
        } catch (error) {
            showLoadingError()
            return
        }
        if(response.status == 200){
            const doc = await response.json();
            const card = document.createElement("div")
            card.setAttribute("class", "card document-only-card labeling")
            card.innerHTML = template_html.replaceAll("nr", doc.document_nr)
            card.querySelector(".document-only-card-document").innerHTML = doc.document
            card.querySelector("form").addEventListener("change", submitResponse_(doc.document_nr, 2))
            document.querySelector("#card-container").appendChild(card);
            
        }else if(response.status == 403){
            throw new Error("Wrong phase")
        }else{
            throw new Error("Error fetching document in phase 2")
        }
    
    }
    restorePhase(2); // fetch and load old state
    const template = document.querySelector("#template-phase2-complete");
    const node = template.content.cloneNode(true);
    node.querySelector("#btn-continue-to-phase3").addEventListener("click", (event)=>{

        let all_valid = Array.from(document.querySelectorAll("form")).reduce((acc, elem) =>{
            return elem.reportValidity() && acc;
        }, true)
        if(all_valid){
            showConfirmDialog(3)
        }
        
        
    });
    document.querySelector("#card-container").appendChild(node);
    

}
// just like loadPhase1 but now with explanations
async function loadPhase3(){
    checkMinViewportWidht()
    const template_instructions = document.querySelector("#template-phase3-instructions-card");
    const node_instructions = template_instructions.content.cloneNode(true);
    document.querySelector("#card-container").appendChild(node_instructions);

    // load explanation method specific prompt
    let template_instructions_explanation_method = null;
    template_instructions_explanation_method  = document.querySelector("#template-phase3-instructions-shap");


    const node_instructions_explanation_method = template_instructions_explanation_method.content.cloneNode(true);
    document.querySelector("#phase3-instructions-card > #explanation-method-specific-instructions-container").appendChild(node_instructions_explanation_method);


    for(let i = 0; i < state.document_order_a.length; i++) { // sync to retain order
        const documentNr = state.document_order_a[i];
        let response = null;
        try {
            response = await fetch("./documentPhase3/"+documentNr,  {method: 'GET',  headers: getHeaders()})
        } catch (error) {
            showLoadingError()
            console.log("catch")
            return
        }
        if(response.status == 200){
            const doc = await response.json();
            const template = document.querySelector("#template-explanation-card");
            const node = template.content.cloneNode(true);

            node.querySelectorAll(".ground_truth").forEach((element) => {
                element.innerHTML = doc.ground_truth == 1 ? "human written" : "machine generated";
            });
            node.querySelectorAll(".prediction").forEach((element) => {
                element.innerHTML = (doc.detector_p_machine <= doc.detector_p_human)  ? "human written" : "machine generated";
            });
            
            const detectorWasRight = doc.ground_truth == (doc.detector_p_machine <= doc.detector_p_human);
            node.querySelector(".wrongly-correctly").innerHTML = detectorWasRight ? "correctly" : "wrongly";
            node.querySelector(".wrongly-correctly").setAttribute(detectorWasRight ? "correctly" : "wrongly", "")

            
            node.querySelector(".detector-p-machine-val").innerHTML = parseFloat(doc.detector_p_machine*100).toFixed(2).padStart(12).replaceAll(" ", "&nbsp; ");
            node.querySelector(".detector-p-human-val").innerHTML = parseFloat(doc.detector_p_human*100).toFixed(2).padStart(12).replaceAll(" ", "&nbsp; ");
            
            // fetch explanation
            let response_explanation = null;
            try {
                response_explanation = await fetch("./explanation/"+doc.explanation_filename,{method: 'GET', headers:  getHeaders()})
            } catch (error) {
                showLoadingError()
                return
            }
            
            if(response_explanation.status == 200){
                const explanation_html = await response_explanation.text();
                setInnerHTML(node.querySelector('.explanation'), explanation_html);
            }else{
                throw Error("Error fetching explanation")
            }
            // node.querySelector(".document-only-card-document").innerHTML = doc.document
            document.querySelector("#card-container").appendChild(node);
        }else if(response.status == 403){
            throw new Error("Wrong phase")
        }else{
            throw new Error("Error fetching document in phase 3")
        }

    }
    const template = document.querySelector("#template-phase3-complete");
    const node = template.content.cloneNode(true);
    node.querySelector("#btn-continue-to-phase4").addEventListener("click", (event)=>{
        showConfirmDialog(4)
        
    });
    document.querySelector("#card-container").appendChild(node);
    

}
async function showConfirmDialog(next){
    if(document.querySelector("confirm-complete-phase") != null){
        document.querySelector("confirm-complete-phase").remove();
    }
    const template = document.querySelector("#template-confirm-complete-phase");
    const node = template.content.cloneNode(true);
    document.querySelector("body").appendChild(node);

    document.querySelector("#confirm-complete-phase-continue").removeev
    document.querySelector("#confirm-complete-phase-continue").addEventListener("click", ()=>{
        nextPhase(next);
        document.querySelector("#confirm-complete-phase").removeAttribute('open')

    });
    document.querySelector("#confirm-complete-phase-cancel").addEventListener("click", ()=>{document.querySelector("#confirm-complete-phase").removeAttribute('open')});
    document.querySelector("#confirm-complete-phase").setAttribute('open','')
}
async function loadPhase4(){ // identical to phase 2 save for the prompt
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

    for(let i = 0; i < state.document_order_b.length; i++) { // sync to retain order
        const documentNr = state.document_order_b[i];
        let response = null;
        try {
            response = await fetch("./documentPhase4/"+documentNr,  {method: 'GET',  headers: getHeaders()})
        } catch (error) {
            showLoadingError()
            return
        }
        if(response.status == 200){
            const doc = await response.json();
            const card = document.createElement("div")
            card.setAttribute("class", "card document-only-card labeling")
            card.innerHTML = template_html.replaceAll("nr", doc.document_nr)
            card.querySelector(".document-only-card-document").innerHTML = doc.document
            card.querySelector("form").addEventListener("change", submitResponse_(doc.document_nr, 4))
            document.querySelector("#card-container").appendChild(card);
            
        }else if(response.status == 403){
            throw new Error("Wrong phase")
        }else{
            throw new Error("Error fetching document in phase 4")
        }
    
    }
    restorePhase(4); // fetch and load old state
    const template = document.querySelector("#template-phase4-complete");
    const node = template.content.cloneNode(true);
    node.querySelector("#btn-continue-to-phase5").addEventListener("click", (event)=>{

        let all_valid = Array.from(document.querySelectorAll("form")).reduce((acc, elem) =>{
            return elem.reportValidity() && acc;
        }, true)
        if(all_valid){
            showConfirmDialog(3)
        }
        
        
    });
    document.querySelector("#card-container").appendChild(node);
    

    
    }




// document.addEventListener("DOMContentLoaded", init);
document.fonts.ready.then(init);
  
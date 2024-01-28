import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
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

import '@material/web/radio/radio.js'





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
    if(screen.availWidth <= 600 && screen.availHeight > screen.availWidth){
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
    if(current_phase == expectedPhase -1 ){ // handle spamming button / multiple dialogs open
        current_phase +=1;
        clearCardContainerAndDisplayLoadingAnimation();
        response = await fetch("./completeCurrentPhase",  {method: 'GET',  headers: getHeaders()})
            if(response.status == 200){
                clearCardContainerAndDisplayLoadingAnimation()
                loadPhase();
            }
    }

        
    
}

async function performAuth(access_token){
    console.log("auth")
    let response = await fetch("./"+access_token);
    if(response.status == 200){
        token = await response.json();
        console.log(token)
        document.cookie = `token=${token}`
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

    const form = document.querySelector("#auth-form");
    const submitBtn = document.querySelector("#auth-form-submit");
    submitBtn.addEventListener("click", (event) => {
        event.preventDefault();
        performAuth(document.querySelector("#text-field-access-token").value)
    });


    const formIsValid = (event) => {return event.target.value.length == 6 && /^[A-Z]+$/.test(event.target.value)}

    const tokenTextField = document.querySelector("#text-field-access-token");
    tokenTextField.addEventListener("keydown", (event)=>{
        if(event.key === "Enter" && formIsValid(event)){
            event.preventDefault();
            performAuth(event.target.value)
        }
    });

    tokenTextField.addEventListener("input", (event)=>{
        console.log(event)
        event.target.value = event.target.value.toUpperCase()
        if(event.target.value.length > 0 && !/^[A-Z]+$/.test(event.target.value)){
            event.target.setCustomValidity("There are only letters from A-Z in your token");           
            submitBtn.setAttribute("disabled", "true");
            
        }else{
            console.log("elese")
            event.target.setCustomValidity('');
            if(formIsValid(event)){
                console.log("enable")
                submitBtn.removeAttribute("disabled");
            }else{
                console.log("!fgd")
            }
        }
        event.target.reportValidity();
        console.log(event.target.validity.valid)
        
        
        
        
    })
    clearLoadingAnimation()
}
let token = null;
async function init(e) {

    document.getElementById("enter-fullscreen").addEventListener("click", toggleFullscreen);
    document.getElementById("exit-fullscreen").addEventListener("click", toggleFullscreen);

   // document.getElementById('explanation').innerHTML = "<p>loris</p>";
   

    
    cookies = document.cookie.split("token=")

    if(cookies.length == 2){
        token = cookies[1]
        loadPhase();
    }else{
            loadAuthCard();
        }



window.addEventListener("resize", checkMinViewportWidht);
checkMinViewportWidht();

window.addEventListener("scroll", updateProgressBar);

  }

function updateProgressBar(){
    let total_progress = 0;
    if(current_phase >= 0){
        total_progress = (current_phase - 1) * 25;
    }
    let progress_current_phase = 25 * Math.ceil(document.documentElement.scrollTop)/(document.documentElement.scrollHeight - document.documentElement.clientHeight);
    total_progress += progress_current_phase
    document.querySelector("#progress-bar-total").setAttribute("value", Math.min(100,total_progress))

}
  async function clearCardContainerAndDisplayLoadingAnimation(){
    const cardContainer = document.querySelector("#card-container");
    cardContainer.replaceChildren();

    const template = document.querySelector("#template-loading-animation");
    const node = template.content.cloneNode(true);
    cardContainer.appendChild(node);

}
async function clearLoadingAnimation(){
    const loadingAnimation = document.querySelector("#loading-animation");
    if(loadingAnimation){
        loadingAnimation.remove();
    }
}


let current_phase = 0;
async function loadPhase(){
    
    response = await fetch("./currentPhase",  {method: 'GET',  headers: getHeaders()})
    if(response.status != 200){
        if(response.status == 403){ // not authorized, delete cookie, then "reload"
            document.cookie = ""
            clearCardContainerAndDisplayLoadingAnimation();
            loadAuthCard();
            return
        }
        throw new Error("Couldn't get current phase")
    }
    current_phase = await response.json();
    
    console.log("current_phase",current_phase)
    switch(current_phase){
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
            console.log("phase 5");
            break;
    }
    clearLoadingAnimation();
    updateProgressBar();

}
async function loadPhase0(){
    const template = document.querySelector("#template-phase0-instructions-card");
    const node = template.content.cloneNode(true);
    document.querySelector("#card-container").appendChild(node);

    document.querySelector("#btn-continue-to-phase1").addEventListener("click", (event) => {
        nextPhase(1);
    })
}

async function loadPhase1(){

    let documentNr = 1; // incremental counter only used to fetch(); use doc.ID once fetched!
    while(true){ // load all documents until 404
        let response = await fetch("./documentPhase1/"+documentNr,  {method: 'GET',  headers: getHeaders()})
        
        if(response.status == 200){
            const doc = await response.json();
            const template = document.querySelector("#template-document-only-card");
            const node = template.content.cloneNode(true);

            node.querySelectorAll(".ground_truth").forEach((element) => {
                element.innerHTML = doc.ground_truth == 1 ? "human written" : "machine generated";
            });
            
            const detectorWasRight = doc.ground_truth == (doc.detector_p_machine <= doc.detector_p_human);
            node.querySelector(".wrongly-correctly").innerHTML = detectorWasRight ? "correctly" : "wrongly";
            node.querySelector(".wrongly-correctly").setAttribute(detectorWasRight ? "correctly" : "wrongly", "")

            node.querySelector(".document-only-card-document").innerHTML = doc.document
            node.querySelector(".detector-p-machine-val").innerHTML = parseFloat(doc.detector_p_machine*100).toFixed(2).padStart(12).replaceAll(" ", "&nbsp; ");
            node.querySelector(".detector-p-human-val").innerHTML = parseFloat(doc.detector_p_human*100).toFixed(2).padStart(12).replaceAll(" ", "&nbsp; ");

            document.querySelector("#card-container").appendChild(node);
        }else if(response.status == 404){
            break;
        }else if(response.status == 403){
            throw new Error("Wrong phase")
        }else{
            throw new Error("Error fetching document in phase 1")
        }
        documentNr++;
    }
    const template = document.querySelector("#template-phase1-complete");
    const node = template.content.cloneNode(true);
    node.querySelector("#btn-continue-to-phase2").addEventListener("click", (event)=>{
        const template = document.querySelector("#template-confirm-complete-phase");
        const node = template.content.cloneNode(true);
        document.querySelector("body").appendChild(node);

        document.querySelector("#confirm-complete-phase-continue").addEventListener("click", ()=>{
            nextPhase(2);
            document.querySelector("#confirm-complete-phase").removeAttribute('open')

        });
        document.querySelector("#confirm-complete-phase-cancel").addEventListener("click", ()=>{document.querySelector("#confirm-complete-phase").removeAttribute('open')});
        document.querySelector("#confirm-complete-phase").setAttribute('open','')
        
    });
    document.querySelector("#card-container").appendChild(node);
    

}
function submitResponse_(documentNr, phase){
    return () =>{
        form = document.querySelector("#user-label-document-form-" + documentNr)
        let label = new FormData(form).get("user-label-document-" + documentNr) == "human" ? 1 : 0
        
        fetch("./submitPhase"+phase, {method:"POST", headers:getHeaders(), body: JSON.stringify({ID: documentNr, label})});
       
    }
}
async function restorePhase(phase){
    const response = await fetch("./getPhase"+phase,  {method: 'GET',  headers: getHeaders()});
    if(response.status != 200){
        throw Error("Can't restore phase")
    }

    const oldState = await response.json()
    oldState.forEach((row)=>{
        console.log("#user-label-document-machine-" + row.document_id)
        console.log(row)
        if(row.label == 0){
            document.querySelector("#user-label-document-machine-" + row.document_id).checked = true; 
        }else{
            document.querySelector("#user-label-document-human-" + row.document_id).checked = true;
        }
        
        
    })

}
async function loadPhase2(){

    let documentNr = 1; // incremental counter only used to fetch(); use doc.ID once fetched!
    while(true){ // load all documents until 404
        let response = await fetch("./documentPhase2/"+documentNr,  {method: 'GET',  headers: getHeaders()})
        if(response.status == 200){
            const doc = await response.json();
            const template = document.querySelector("#template-document-only-card-labeling");
            const node = template.content.cloneNode(true);
            node.querySelector(".document-only-card-document").innerHTML = doc.document
    
            node.querySelector("form").addEventListener("change", submitResponse_(doc.ID, 2))
            node.querySelector("form").id="user-label-document-form-" + doc.ID
            
            
            // replace ids for the individual forms
            node.querySelector("#user-label-document-machine").setAttribute("name", "user-label-document-"+doc.ID)
            node.querySelector("#user-label-document-human").setAttribute("name", "user-label-document-"+doc.ID)

            node.querySelector("#user-label-document-machine").id = "user-label-document-machine-"+doc.ID;
            node.querySelector("#user-label-document-human").id = "user-label-document-human-"+doc.ID;

            node.querySelector("#user-label-document-label-machine").setAttribute("for", "user-label-document-machine-"+doc.ID)
            node.querySelector("#user-label-document-label-human").setAttribute("for", "user-label-document-human-"+doc.ID)
           
            node.querySelector("#user-label-document-label-machine").id = "#user-label-document-label-machine-" +doc.ID
            node.querySelector("#user-label-document-label-human").id = "#user-label-document-label-human-" +doc.ID
            document.querySelector("#card-container").appendChild(node);
           
            

        }else if(response.status == 404){
            break;
        }else if(response.status == 403){
            throw new Error("Wrong phase")
        }else{
            throw new Error("Error fetching document in phase 1")
        }
        documentNr++;
    }
    restorePhase(2); // fetch and load old state
    const template = document.querySelector("#template-phase2-complete");
    const node = template.content.cloneNode(true);
    node.querySelector("#btn-continue-to-phase3").addEventListener("click", (event)=>{

        let all_valid = Array.from(document.querySelectorAll("form")).reduce((acc, elem) =>{
            return elem.reportValidity() && acc;
        }, true)
        if(all_valid){
            const template = document.querySelector("#template-confirm-complete-phase");
            const node = template.content.cloneNode(true);
            
    
            node.querySelector("#confirm-complete-phase-continue").addEventListener("click", ()=>{
                nextPhase(3);
                document.querySelector("#confirm-complete-phase").removeAttribute('open') // TODO check again
    
            });
            document.querySelector("#confirm-complete-phase-cancel").addEventListener("click", ()=>{document.querySelector("#confirm-complete-phase").removeAttribute('open')});
            node.querySelector("#confirm-complete-phase").setAttribute('open','')
            document.querySelector("body").appendChild(node);
        }
        
        
    });
    document.querySelector("#card-container").appendChild(node);
    

}
// just like loadPhase1 but now with explanations
async function loadPhase3(){

    let documentNr = 1; // incremental counter only used to fetch(); use doc.ID once fetched!
    while(true){ // load all documents until 404
        let response = await fetch("./documentPhase3/"+documentNr,  {method: 'GET',  headers: getHeaders()})
        
        if(response.status == 200){
            const doc = await response.json();
            const template = document.querySelector("#template-explanation-card");
            const node = template.content.cloneNode(true);

            node.querySelectorAll(".ground_truth").forEach((element) => {
                element.innerHTML = doc.ground_truth == 1 ? "human written" : "machine generated";
            });
            
            const detectorWasRight = doc.ground_truth == (doc.detector_p_machine <= doc.detector_p_human);
            node.querySelector(".wrongly-correctly").innerHTML = detectorWasRight ? "correctly" : "wrongly";
            node.querySelector(".wrongly-correctly").setAttribute(detectorWasRight ? "correctly" : "wrongly", "")

            
            node.querySelector(".detector-p-machine-val").innerHTML = parseFloat(doc.detector_p_machine*100).toFixed(2).padStart(12).replaceAll(" ", "&nbsp; ");
            node.querySelector(".detector-p-human-val").innerHTML = parseFloat(doc.detector_p_human*100).toFixed(2).padStart(12).replaceAll(" ", "&nbsp; ");
            
            // fetch explanation
            response = await fetch("./explanation/"+doc.explanation_filename,{method: 'GET', headers:  getHeaders()})
            if(response.status == 200){
                const explanation_html = await response.text();
                setInnerHTML(node.querySelector('.explanation'), explanation_html);
            }else{
                throw Error("Error fetching explanation")
            }
            // node.querySelector(".document-only-card-document").innerHTML = doc.document
            document.querySelector("#card-container").appendChild(node);
        }else if(response.status == 404){
            break;
        }else if(response.status == 403){
            throw new Error("Wrong phase")
        }else{
            throw new Error("Error fetching document in phase 3")
        }
        documentNr++;
    }
    const template = document.querySelector("#template-phase3-complete");
    const node = template.content.cloneNode(true);
    node.querySelector("#btn-continue-to-phase4").addEventListener("click", (event)=>{
        const template = document.querySelector("#template-confirm-complete-phase");
        const node = template.content.cloneNode(true);
        document.querySelector("body").appendChild(node);

        document.querySelector("#confirm-complete-phase-continue").addEventListener("click", ()=>{
            nextPhase(4);
            document.querySelector("#confirm-complete-phase").removeAttribute('open')

        });
        document.querySelector("#confirm-complete-phase-cancel").addEventListener("click", ()=>{document.querySelector("#confirm-complete-phase").removeAttribute('open')});
        document.querySelector("#confirm-complete-phase").setAttribute('open','')
        
    });
    document.querySelector("#card-container").appendChild(node);
    

}

async function loadPhase4(){ // identical to phase 2 save for the prompt

    let documentNr = 1; // incremental counter only used to fetch(); use doc.ID once fetched!
    while(true){ // load all documents until 404
        let response = await fetch("./documentPhase4/"+documentNr,  {method: 'GET',  headers: getHeaders()})
        if(response.status == 200){
            const doc = await response.json();
            const template = document.querySelector("#template-document-only-card-labeling");
            const node = template.content.cloneNode(true);
            node.querySelector(".document-only-card-document").innerHTML = doc.document
    
            node.querySelector("form").addEventListener("change", submitResponse_(doc.ID, 4))
            node.querySelector("form").id="user-label-document-form-" + doc.ID
            
            
            // replace ids for the individual forms
            node.querySelector("#user-label-document-machine").setAttribute("name", "user-label-document-"+doc.ID)
            node.querySelector("#user-label-document-human").setAttribute("name", "user-label-document-"+doc.ID)

            node.querySelector("#user-label-document-machine").id = "user-label-document-machine-"+doc.ID;
            node.querySelector("#user-label-document-human").id = "user-label-document-human-"+doc.ID;

            node.querySelector("#user-label-document-label-machine").setAttribute("for", "user-label-document-machine-"+doc.ID)
            node.querySelector("#user-label-document-label-human").setAttribute("for", "user-label-document-human-"+doc.ID)
           
            node.querySelector("#user-label-document-label-machine").id = "#user-label-document-label-machine-" +doc.ID
            node.querySelector("#user-label-document-label-human").id = "#user-label-document-label-human-" +doc.ID
            document.querySelector("#card-container").appendChild(node);
           
            

        }else if(response.status == 404){
            break;
        }else if(response.status == 403){
            throw new Error("Wrong phase")
        }else{
            throw new Error("Error fetching document in phase 4")
        }
        documentNr++;
    }
    restorePhase(4); // fetch and load old state
    const template = document.querySelector("#template-phase4-complete");
    const node = template.content.cloneNode(true);
    node.querySelector("#btn-continue-to-phase5").addEventListener("click", (event)=>{

        let all_valid = Array.from(document.querySelectorAll("form")).reduce((acc, elem) =>{
            return elem.reportValidity() && acc;
        }, true)
        if(all_valid){
            const template = document.querySelector("#template-confirm-complete-phase");
            const node = template.content.cloneNode(true);
            
    
            node.querySelector("#confirm-complete-phase-continue").addEventListener("click", ()=>{
                nextPhase(5);
                document.querySelector("#confirm-complete-phase").removeAttribute('open') // TODO check again
    
            });
            node.querySelector("#confirm-complete-phase-cancel").addEventListener("click", ()=>{document.querySelector("#confirm-complete-phase").removeAttribute('open')});
            node.querySelector("#confirm-complete-phase").setAttribute('open','')
            document.querySelector("body").appendChild(node);
        }
        
        
    });
    document.querySelector("#card-container").appendChild(node);
    

}




document.addEventListener("DOMContentLoaded", init);
  
  
import './index.css'
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/button/text-button.js'
import '@material/web/iconbutton/filled-tonal-icon-button.js'
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



import {
    setInnerHTML, 
    toggleFullscreen,
} from './js/client/util.js';



import { clearCardContainerAndDisplayLoadingAnimation } from './js/client/util.js';

import { checkMinViewportWidhtAndDisplayWarning, loadPhase, updateProgressBar } from './js/client/ui.js';
import { getHeaders, hasToken } from './js/client/api.js';
import { loadParticipantInfoForm } from './js/client/phases/phase-1.js';
import { loadPhase2 } from './js/client/phases/phase2.js';
import { loadPhase0 } from './js/client/phases/phase0.js';
import { loadPhase1 } from './js/client/phases/phase1.js';
import { loadPhase3 } from './js/client/phases/phase3.js';
import { loadPhase4 } from './js/client/phases/phase4.js';
import { loadPhase5 } from './js/client/phases/phase5.js';


async function init() {
    if((window.location.href + "").split("/").at(-1) == "DEBUG"){
        showAllPrompts();
        return
    }
    loadPhase();
    document.getElementById("enter-fullscreen").addEventListener("click", toggleFullscreen);
    document.getElementById("exit-fullscreen").addEventListener("click", toggleFullscreen);
    

    window.addEventListener("resize", checkMinViewportWidhtAndDisplayWarning);
    checkMinViewportWidhtAndDisplayWarning();
    let lastScrollTime = Date.now();
    window.addEventListener("scroll", () => {
        if (Date.now() - lastScrollTime > 500) {
            lastScrollTime = Date.now()
            updateProgressBar()
        }

    });
    



}



async function showAllPrompts(){
    try {
        await loadParticipantInfoForm();
    } catch (error) {
        
    }
    try {
        await loadPhase0();
    } catch (error) {
        
    }
    try {
        await loadPhase1();
    } catch (error) {
        
    }
    try {
        await loadPhase2();
    } catch (error) {
        
    }
    try {
        await loadPhase3(null, null,state={explainer: "SHAP_Explainer"});
    } catch (error) {
        
    }
    try {
        await loadPhase3(null, null,state={explainer: "Anchor_Explainer"});
    } catch (error) {
        
    }
    try {
        await loadPhase3(null, null,state={explainer: "LIME_Explainer"});
    } catch (error) {
        
    }
    try {
        await loadPhase4();
    } catch (error) {
        
    }
    try {
        await loadPhase5();
    } catch (error) {
        
    }
    document.querySelectorAll("#loading-issues-warning").forEach(elem =>{
        elem.removeAttribute("open")
    })
    document.querySelector("#progress-bar").removeAttribute("indeterminate")
    document.querySelector("#progress-bar").setAttribute("value", 0)
}


document.addEventListener("DOMContentLoaded", init);
//document.fonts.ready.then(init);

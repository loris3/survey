import { getState, clearCookie, updateState, hasToken } from "./api";

import { loadParticipantInfoForm } from './phases/phase-1.js';
import { loadPhase0, showPhase0Instructions } from './phases/phase0.js';
import { loadPhase1 } from './phases/phase1.js';
import { loadPhase4 } from './phases/phase4.js';
import { loadPhase5 } from './phases/phase5.js';
import { loadAuthCard } from './auth.js';
import { clearCardContainerAndDisplayLoadingAnimation, showGenericError, showLoadingError } from "./util.js";
import { loadPhase2 } from "./phases/phase2.js";
import { loadPhase3 } from "./phases/phase3.js";

let loading = false;
export async function loadPhase(firstLoad = false) {
    if (loading) {
        return;
    }
    loading = true;
    clearCardContainerAndDisplayLoadingAnimation();

    let state;
    // check if authenticated
    if (hasToken()) {
        try {
            await updateState();
            state = await getState();
            if (!state) {
                showLoadingError();
                loading = false;
                return;
            }
        } catch (error) {
            loadAuthCard(loadPhase);
            updateProgressBar();
            loading = false;
            return;

        }
    }else{
        loadAuthCard(loadPhase);
        updateProgressBar();
        loading = false;
        return;

    }


    if (state.current_phase > 0) {
        document.querySelector("#open-instructions").style.display = "initial";
        document.querySelector("#open-instructions").addEventListener("click", showPhase0Instructions);
    }
    let f;
    switch (state.current_phase) {
        case -1:
            f = loadParticipantInfoForm;
            break;
        case 0:
            f = loadPhase0;
            break;
        case 1:
            f = loadPhase1;
            break;
        case 2:
            f = loadPhase2;
            break;
        case 3:
            checkMinViewportWidhtAndDisplayWarning();
            f = loadPhase3;
            break;
        case 4:
            f = loadPhase4;
            break;
        case 5:
            f = (loadPhase, updateProgressBar) =>{loadPhase5(loadPhase, updateProgressBar, download = firstLoad)};
            break;
    }
    try {
        f(loadPhase, updateProgressBar);
    } catch (error) {
        showGenericError(error)
    }
    updateProgressBar();
    loading = false;

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

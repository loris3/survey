import { getState, clearCookie, updateState, hasToken } from "./api";

import { loadParticipantInfoForm } from './phases/phase-1.js';
import { loadPhase0, showPhase0Instructions } from './phases/phase0.js';
import { loadPhase1 } from './phases/phase1.js';
import { loadPhase4 } from './phases/phase4.js';
import { loadPhase5 } from './phases/phase5.js';
import { loadAuthCard } from './auth.js';
import { clearCardContainerAndDisplayLoadingAnimation, showGenericError, showLoadingError } from "./util.js";
import { updateProgressBar } from "./util.js";
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
            f = loadPhase3;
            break;
        case 4:
            f = loadPhase4;
            break;
        case 5:
            f = (loadPhase) =>{loadPhase5(loadPhase, download = firstLoad)};
            break;
    }
    try {
        f(loadPhase);
    } catch (error) {
        showGenericError(error)
    }
    updateProgressBar();
    loading = false;

}

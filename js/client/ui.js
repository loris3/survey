import { getState, clearCookie, updateState } from "./api";

import { loadParticipantInfoForm } from './phases/phase-1.js';
import { loadPhase0 ,showPhase0Instructions} from './phases/phase0.js';
import { loadPhase1 } from './phases/phase1.js';
import { loadPhase4 } from './phases/phase4.js';
import { loadPhase5 } from './phases/phase5.js';
import { loadAuthCard } from './auth.js';
import { clearCardContainerAndDisplayLoadingAnimation, showLoadingError } from "./util.js";
import { updateProgressBar } from "./util.js";
import { loadPhase2 } from "./phases/phase2.js";
import { loadPhase3 } from "./phases/phase3.js";

let loading = false;
export async function loadPhase() {
    if(loading){
        return;
    }
    loading = true;
    clearCardContainerAndDisplayLoadingAnimation();
    // check if authenticated
    try {
        await updateState();
        state = await getState();
        console.log("state", state)
        if(!state){
            showLoadingError();
            loading = false;
            return;
        }
    } catch (error) {
        console.log(error)
        loadAuthCard(loadPhase);
        updateProgressBar();
        loading = false;
        return;
        
    }


    if (state.current_phase > 0) {
        document.querySelector("#open-instructions").style.display = "initial";
        document.querySelector("#open-instructions").addEventListener("click", showPhase0Instructions);
    }
    switch (state.current_phase) {
        case -1:
            await loadParticipantInfoForm(loadPhase);
            break;
        case 0:
            await loadPhase0(loadPhase);
            break;
        case 1:
            await loadPhase1(loadPhase);
            break;
        case 2:
            await loadPhase2(loadPhase);
            break;
        case 3:
            await loadPhase3(loadPhase);
            break;
        case 4:
            await loadPhase4(loadPhase);
            break;
        case 5:
            await loadPhase5(loadPhase);
            break;
    }

    updateProgressBar();
    loading = false;

}

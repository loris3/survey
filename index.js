import './index.css'
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/iconbutton/icon-button.js';
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


async function init() {
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






// document.addEventListener("DOMContentLoaded", init);
document.fonts.ready.then(init);

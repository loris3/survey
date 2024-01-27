import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/divider/divider.js';
import '@material/web/progress/linear-progress.js'
import '@material/web/fab/fab.js'
import '@material/web/icon/icon.js'

import '@material/web/dialog/dialog.js';

import {MdDialog} from '@material/web/dialog/dialog.js';













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
document.addEventListener("DOMContentLoaded", async function(e) {

    document.getElementById("enter-fullscreen").addEventListener("click", toggleFullscreen);
    document.getElementById("exit-fullscreen").addEventListener("click", toggleFullscreen);

   // document.getElementById('explanation').innerHTML = "<p>loris</p>";
   
document.getElementById('prediction').innerHTML = `<p><b>This is a human written document.</b></p>
<p>The detector correctly predicted that this document was... </p>
<p>&emsp; ... machine generated with 0 % confidence.</p>
<p>&emsp; ... human written with 99 % confidence.</p> ` 
let token = null;
cookies = document.cookie.split("token=")

if(cookies.length == 2){
    token = cookies[1]
    console.log("reusing auth")
}else{
        console.log("auth")
        let response = await fetch("./FQJJYT")
        token = await response.json();
        document.cookie = `token=${token}`
    }












 response = await fetch("./document/2",  {method: 'GET',
headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
},})
if(response.status === 404){
    console.log("Next phase pls")
}else{
    if(response.status == 200){
        console.log("document", await response.json() )
    }
    
}



// response = await fetch("./completeCurrentPhase",  {method: 'GET',
// headers: {
//     'Content-Type': 'application/json',
//     'Authorization': `Bearer ${token}`
// },})
// if(response.status === 200){
//     console.log("Clear to go to next phase")
// }



const url = "./explanation/1c3c9f892ad6b9339c6c9e647691a8fd193d5e7c5379091c5897de7b95383dc4_SHAP_Explainer_DetectorGuo";

response = await fetch(
    url,
    {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        // body: JSON.stringify({
        //     sendSomething,
        //     sendSomething2,
        //     sendSomething3
    }
        )
        if(response.status == 200){
            const explanation_html = await response.text(url);
            setInnerHTML(document.getElementById('explanation'), explanation_html);
        }
        




window.addEventListener("resize", checkMinViewportWidht);
checkMinViewportWidht();

  });
  
  
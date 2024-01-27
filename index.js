import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/divider/divider.js';
import '@material/web/progress/linear-progress.js'
import '@material/web/fab/fab.js'
import '@material/web/icon/icon.js'
// https://stackoverflow.com/questions/2592092/executing-script-elements-inserted-with-innerhtml
function setInnerHTML(elm, html) {
    console.log("html", html)
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



const response = await fetch("./0d0911b39b0d882b399d09f73a5014af915ac9232e1594659683db49d153b839_Anchor_Explainer_DetectorGuo.html")
const explanation_html = await response.text();


setInnerHTML(document.getElementById('explanation'), explanation_html);

  });
  
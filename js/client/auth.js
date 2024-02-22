import { performAuth } from "./api";


export async function loadAuthCard(loadPhase) {
    const template = document.querySelector("#template-auth-card");
    const node = template.content.cloneNode(true);
    document.querySelector("#card-container").appendChild(node);
    const form = document.querySelector("#auth-form");
    const submitBtn = document.querySelector("#auth-form-submit");
    submitBtn.addEventListener("click", (event) => {
        event.preventDefault();
        handleAuth(document.querySelector("#text-field-access-token").value, loadPhase)
    });
    const tokenTextField = document.querySelector("#text-field-access-token");
    const formIsValid = () => { return tokenTextField.value.length == 6 && /^[A-Z]+$/.test(tokenTextField.value) }
    const reportValidity = (event) => {
        tokenTextField.value = tokenTextField.value.toUpperCase()
        if (tokenTextField.value.length > 0 && !/^[A-Z]+$/.test(tokenTextField.value)) {
            tokenTextField.setCustomValidity("There are only letters from A-Z in your token");
            submitBtn.setAttribute("disabled", "true");

        } else {
            tokenTextField.setCustomValidity('');
            if (formIsValid()) {

                submitBtn.removeAttribute("disabled");
            }
        }
        tokenTextField.reportValidity();

    };

    tokenTextField.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && formIsValid(event)) {
            event.preventDefault();
            handleAuth(event.target.value, loadPhase)
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
async function handleAuth(access_token, loadPhase){
    if(await performAuth(access_token)){
        loadPhase();
    }else{
        if(!document.querySelector("#alert-token-invalid")){
            const template = document.querySelector("#template-alert-token-invalid");
            const node = template.content.cloneNode(true);
            document.querySelector("body").appendChild(node);
            document.querySelector("#alert-token-invalid-ok").addEventListener("click", () => {
                document.querySelector("#alert-token-invalid").removeAttribute('open');
            })
        }
        document.querySelector("#alert-token-invalid").setAttribute('open', '')
    }
    
    
}
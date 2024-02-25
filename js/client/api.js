import { showGenericError, showIncompleteInputError } from "./util";



let token = null;
function getToken(){
    if (token == null) {
        cookies = document.cookie.split("token=")
        if (cookies.length == 2 && cookies[1].length > 0) {
            token = cookies[1];
        }
    }
    return token;
}
export function getHeaders() {
    
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}`, "Content-Type": "application/json", }

}
export function hasToken(){
    return getToken() != null;
}

export function clearCookie() {
    if (document.cookie.length > 0) {
        console.log("Clearing cookie")
        document.cookie = "token=; Max-Age=0'"
    }
}



let state = null;

export async function getState() {
    if (state == null) {
        return await updateState();
    } else {
        return state;
    }
}

export async function getParticipantInfo() {
    let response = await fetch("./api/getParticipantInfo", { method: 'GET', headers: getHeaders() });

    return await response.json()
}

export async function submitParticipantInfo(form) {
    const formData = new FormData(form);

    const plainFormData = Object.fromEntries(formData.entries()); // https://simonplend.com/how-to-use-fetch-to-post-form-data-as-json-to-your-api/
    const json = JSON.stringify(plainFormData);

    try {
        let response = await fetch("./api/submitParticipantInfo", { method: "POST", headers: getHeaders(), body: json });

        return response.status == 201;
    } catch (error) {
        return false;
    }
}
export async function submitLickert(form, documentNr) {
    const formData = new FormData(form);

    const plainFormData = Object.fromEntries(formData.entries()); // https://simonplend.com/how-to-use-fetch-to-post-form-data-as-json-to-your-api/
    plainFormData.document_nr = documentNr;
    const json = JSON.stringify(plainFormData);


    try {
        let response = await fetch("./api/submitPhase3", { method: "POST", headers: getHeaders(), body: json });

        return response.status == 201;
    } catch (error) {
        return false;
    }
}
export async function updateState() {
    state = null;
    let response;
    try {
        response = await fetch("./api/state", { method: 'GET', headers: getHeaders() })
    } catch (error) {
        return false;
    }

    if (response.status != 200) {
        if (response.status == 403) { // not authorized, delete cookie, then "reload"
            clearCookie();
            throw new Error("Not authorized")
        }
        return false;
    }
    state = await response.json();
    state.document_order_a = JSON.parse(state.document_order_a)
    state.document_order_b = JSON.parse(state.document_order_b)
    return state
}
export async function advancePhase(expectedPhase) {
    response = await fetch("./api/completeCurrentPhase", { method: 'POST', body: JSON.stringify({ "expected": expectedPhase }), headers: getHeaders() })
    if(response.status == 208){
        return false;
    }else if (response.status == 200) {
        await updateState();
        return true;
    } else if (response.status == 405) {
        showIncompleteInputError()
        return true; // so that the phase is reloaded
    }else{
        const err = new Error("Couldn't advance phase");
        showGenericError(err)
        throw err;
    }


}

export async function performAuth(access_token) {

    let response = await fetch("./auth/" + access_token);
    if (response.status == 200) {
        token = await response.json();
        document.cookie = `token=${token}; Max-Age=31536000`
        return true;
    } else {
        return false;
    }

}








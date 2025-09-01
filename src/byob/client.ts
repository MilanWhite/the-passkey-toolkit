import {
    browserSupportsWebAuthn,
    startRegistration,
    startAuthentication,
} from "@simplewebauthn/browser";

import { regAPI, authAPI } from "./routes";

let BASE_URL = ""; // keep at "" for api to be relative

// sets base url if base url is a specific one
export function setBaseUrl(url: string) {
    BASE_URL = (url || "").replace(/\/+$/, ""); // removes trailing slash (if there is one)
}

const join = (path: string) => `${BASE_URL}${path}`;

let API_KEY: string | null = null;
let API_KEY_HEADER = "x-api-key";

// this function sets an api key that will be sent with each request
export function setAPIKey(
    key: string, // your api key
    headerName: string = "x-api-key" // default header name
) {
    API_KEY = key;
    API_KEY_HEADER = headerName || "x-api-key";
}

function jsonHeaders() {
    return {
        "Content-Type": "application/json",
        ...(API_KEY ? { [API_KEY_HEADER]: API_KEY } : {}),
    };
}

export async function registerPasskey(
    email: string, // end user's email
    displayName?: string, // optional display name
    abortSignal?: AbortSignal // optional AbortController().signal
) { // returns Promise<bool>
    if (!browserSupportsWebAuthn()) {
        throw new Error(
            "Unfortunately, this browser doesn't support WebAuthn."
        );
    }
    // request backend for registration options
    const optRes = await fetch(join(regAPI.registrationOptions), {
        method: "POST",
        credentials: "include",
        signal: abortSignal,
        headers: jsonHeaders(),
        body: JSON.stringify({ email, displayName }),
    });
    if (!optRes.ok) return false;

    const options = await optRes.json();

    // receive credentials from authenticator
    let credential;
    try {
        credential = await startRegistration({ optionsJSON: options });
    } catch (err) {
        if (err instanceof DOMException && err.name === "NotAllowedError") {
            // user canceled or timed out
            return false;
        }
        throw err;
    }

    // verify with backend
    const verifyRes = await fetch(join(regAPI.registrationVerify), {
        method: "POST",
        credentials: "include",
        signal: abortSignal,
        headers: jsonHeaders(),
        body: JSON.stringify({ credential }),
    });

    return verifyRes.ok && (await verifyRes.json()).verified === true; // boolean
}

export async function authorizePasskey(
    email?: string, // optional email to scope options
    abortSignal?: AbortSignal // optional AbortController().signal
) { // returns Promise<bool>
    if (!browserSupportsWebAuthn()) {
        throw new Error(
            "Unfortunately, this browser doesn't support WebAuthn."
        );
    }

    // request authentication options from backend
    const optsRes = await fetch(join(authAPI.authOptions), {
        method: "POST",
        credentials: "include",
        signal: abortSignal,
        headers: jsonHeaders(),
        body: JSON.stringify(email ? { email } : {}),
    });
    if (!optsRes.ok) return false;

    const options = await optsRes.json();

    // use authenticator for assertion
    let assertion;
    try {
        assertion = await startAuthentication({ optionsJSON: options });
    } catch (err) {
        if (err instanceof DOMException && err.name === "NotAllowedError") {
            return false;
        }
        throw err;
    }

    // verify assertion in backend
    const verifyRes = await fetch(join(authAPI.authVerify), {
        method: "POST",
        credentials: "include",
        signal: abortSignal,
        headers: jsonHeaders(),
        body: JSON.stringify({ credential: assertion }),
    });

    return verifyRes.ok && (await verifyRes.json()).verified === true; // boolean
}

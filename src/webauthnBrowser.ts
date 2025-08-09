import {
    browserSupportsWebAuthn,
    startRegistration,
    startAuthentication,
    PublicKeyCredentialCreationOptionsJSON,
    PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";

import { regAPI } from "./routes";
import { authAPI } from "./routes";


export async function registerPasskey(
    apiKey: string, // tenants api key 
    email: string, // end user email
    displayName?: string, // sometimes used for UI purposes
    abortSignal?: AbortSignal // optional for developers implementation
): Promise<boolean> {
    if (!browserSupportsWebAuthn()) {
        throw new Error("WebAuthn is not supported by this browser.");
    }

    // ask backend for registration options
    const optRes = await fetch(regAPI.registrationOptions, {
        method: "POST",
        credentials: "include",
        signal: abortSignal,
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
        },
        body: JSON.stringify({ email, displayName }),
    });
    if (!optRes.ok) return false;
    const options: PublicKeyCredentialCreationOptionsJSON = await optRes.json();

    // get credentials
    let credential;
    try {
        credential = await startRegistration({ optionsJSON: options });
    } catch (err) {
        if (err instanceof DOMException && err.name === "NotAllowedError") {
            return false; // if user cancels or request times out 
        }
        throw err; // this happens when the passkey is already registered instead of throwing the error control it 
    }

    // verify credentials in backend
    const verifyRes = await fetch(regAPI.registrationVerify, {
        method: "POST",
        credentials: "include",
        signal: abortSignal,
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
        },
        body: JSON.stringify({ credential }),
    });

    return verifyRes.ok && (await verifyRes.json()).verified === true;
}


export async function authorizePasskey(
    apiKey: string,
    email?: string,
    abortSignal?: AbortSignal
): Promise<boolean> {
    if (!browserSupportsWebAuthn()) {
        throw new Error("WebAuthn is not supported by this browser.");
    }

    // get options from backend
    const optsRes = await fetch(authAPI.authOptions, {
        method: "POST",
        credentials: "include",
        signal: abortSignal,
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
        },
        body: JSON.stringify(email ? { email } : {}),
    });
    if (!optsRes.ok) return false;
    const options: PublicKeyCredentialRequestOptionsJSON = await optsRes.json();

    // get credentials
    let assertion;
    try {
        assertion = await startAuthentication({ optionsJSON: options });
    } catch (err) {
        if (err instanceof DOMException && err.name === "NotAllowedError") {
            return false; // user cancelled / timed‑out
        }
        throw err;
    }

    // verify credentials in backend
    const verifyRes = await fetch(authAPI.authVerify, {
        method: "POST",
        credentials: "include",
        signal: abortSignal,
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
        },
        body: JSON.stringify({ credential: assertion }),
    });

    return verifyRes.ok && (await verifyRes.json()).verified === true;
}

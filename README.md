# The Passkey Toolkit

A small framework-agnostic package for WebAuthn **passkeys**.

-   **BYOB (Bring Your Own Backend)** — available<br>
    `import { … } from "the-passkey-toolkit/byob"`<br>
-   **Cloud (Managed backend)** — coming soon<br>
    `import { … } from "the-passkey-toolkit/cloud"`

---

## Installation

```bash
npm i the-passkey-toolkit @simplewebauthn/browser
```

## BYOB (Bring Your Own Backend)

https://github.com/user-attachments/assets/58eec93e-2b55-4274-9750-2e2f1d815932

Import from the `/byob`. Works with your API routes that create options and verify credentials (a handled service coming soon).

```ts
import {
    setBaseUrl, // optional: set if your API is on a different origin
    setAPIKey, // optional: adds API header to every request (extra added security)
    registerPasskey, // create new passkey
    authorizePasskey, // sign in with existing passkey
} from "the-passkey-toolkit/byob";
```

### Quick start

Same origin (default):

```ts
setBaseUrl("https://api.myapp.com"); // if your have a different origin

const ok = await registerPasskey("alice@example.com", "Alice");
if (!ok) {
    // registration failed for whatever reason
}
```

With cancel/timeout (AbortController):

```ts
const ac = new AbortController();
setTimeout(() => ac.abort(), 15000);
await registerPasskey("bob@example.com", "Bob", ac.signal); // <-- add ac.signal as an arg
```

### Optional: API key

You can add a header to every request for rate limiting etc.

```ts
// default header is "x-api-key"
setApiKey(import.meta.env.VITE_TPK_API_KEY);

// or use custom header name
setApiKey(import.meta.env.VITE_TPK_API_KEY, "x-whatever-key");
```

please kep in mind that api keys set in frontend are not secure and should not be used for authentication!

### API

```ts
setBaseUrl(url: string): void
setApiKey(key: string, headerName?: string): void // default header: "x-api-key" (this is optional)
registerPasskey(email: string, displayName?: string, abortSignal?: AbortSignal): Promise<boolean>
authorizePasskey(email?: string, abortSignal?: AbortSignal): Promise<boolean>
```

A `true` is returned from registerPasskey, and authorizePasskey when your server responds `{ verified: true }` on the verify step.

### Required backend routes!

Implement these JSON endpoints:

-   `POST /api/passkey/registration/options` → `PublicKeyCredentialCreationOptionsJSON`
-   `POST /api/passkey/registration/verify` → `{ "verified": boolean }`
-   `POST /api/passkey/authentication/options` → `PublicKeyCredentialRequestOptionsJSON`
-   `POST /api/passkey/authentication/verify` → `{ "verified": boolean }`

> The client sends `credentials: "include"`. Configure cookies & CORS accordingly please.

---

## ☁️ Cloud (Managed) — Coming Soon

Zero backend work. Our hosted API.

---

## License

MIT © Milan White

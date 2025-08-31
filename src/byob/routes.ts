let BASE_URL = ""; // keep at "" for api to be relative

// sets base url if base url is a specific one
export function setBaseUrl(url: string) {
    BASE_URL = (url || "").replace(/\/+$/, ""); // removes trailing slash (if there is one)
}

const join = (path: string) => `${BASE_URL}${path}`;

export const regAPI = {
    registrationOptions: join("/api/passkey/registration/options"),
    registrationVerify: join("/api/passkey/registration/verify"),
};

export const authAPI = {
    authOptions: join("/api/passkey/authentication/options"),
    authVerify: join("/api/passkey/authentication/verify"),
};

const baseURL = "http://127.0.0.1:8000"

export const regAPI = {
    registrationOptions: `${baseURL}/api/passkeys/register/options`,
    registrationVerify: `${baseURL}/api/passkeys/register/verify`
}

export const authAPI = {
    authOptions: `${baseURL}/api/passkeys/authenticate/options`,
    authVerify: `${baseURL}/api/passkeys/authenticate/verify`
}
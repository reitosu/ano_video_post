import { generateKey, encryptText, decryptText, publicKeyToBase64, importBase64PublicKey, pemToBase64 } from "./rsacrypto.js"

export async function checkUserId() {
    if (!localStorage.getItem("userId")) {
        axios.defaults.xsrfCookieName = 'csrftoken'
        axios.defaults.xsrfHeaderName = "X-CSRFTOKEN"
        const uuid = crypto.randomUUID();
        const response = await axios.get('/videopost/assignid/')
        const rawPublicKey = response.data.public_key
        const publicKey = await importBase64PublicKey(await pemToBase64(rawPublicKey))
        const encrypted = await encryptText(uuid, publicKey)
        localStorage.setItem("userId", encrypted)
        const formData = new FormData()
        formData.append("userId", encrypted)
        const res = await axios.post('/videopost/assignid/', formData)
    }

    return {
    }
} 
export const
    generateKey = () => {
        const keyPair = window.crypto.subtle.generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256',
            },
            true,
            ['encrypt', 'decrypt'],
        )
        return keyPair
    },

    arrayBufferToBase64 = (buffer) => {
        const str = String.fromCharCode.apply(
            null,
            new Uint8Array(buffer),
        )

        return window.btoa(str)
    },

    publicKeyToBase64 = async (publicKey) => {
        const key = await window.crypto.subtle.exportKey('spki', publicKey)
        const pem = spkiToPEM(key)

        return pem
    },

    base64ToArrayBuffer = (base64) => {
        const str = window.atob(base64)
        const buf = new ArrayBuffer(str.length)
        const bufView = new Uint8Array(buf)
        for (let i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i)
        }
        return buf
    },

    importBase64PublicKey = async (base64PublicKey) => {
        const key = await window.crypto.subtle.importKey(
            'spki',
            base64ToArrayBuffer(base64PublicKey),
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256',
            },
            false,
            ['encrypt'],
        )

        return key
    },

    encryptText = async (text, publicKey) => {
        const encoded = new TextEncoder().encode(text)

        const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
                name: 'RSA-OAEP',
            },
            publicKey,
            encoded,
        )

        return arrayBufferToBase64(encryptedBuffer)
    },

    decryptText = async (encryptedBase64Text, privateKey) => {
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: 'RSA-OAEP',
            },
            privateKey,
            base64ToArrayBuffer(encryptedBase64Text),
        )

        return new TextDecoder().decode(decryptedBuffer)
    },

    pemToBase64 = async (pem) => {
        const pemHeader = "-----BEGIN PUBLIC KEY-----";
        const pemFooter = "-----END PUBLIC KEY-----";
        const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
        return pemContents
    },

    spkiToPEM = (keydata) => {
        var keydataS = arrayBufferToString(keydata);
        var keydataB64 = window.btoa(keydataS);
        var keydataB64Pem = formatAsPem(keydataB64);
        return keydataB64Pem;
    },

    arrayBufferToString = (buffer) => {
        var binary = '';
        var bytes = new Uint8Array(buffer);
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return binary;
    },

    formatAsPem = (str) => {
        var finalString = '-----BEGIN PUBLIC KEY-----\\n';

        while (str.length > 0) {
            finalString += str.substring(0, 64) + '\\n';
            str = str.substring(64);
        }

        finalString = finalString + "-----END PUBLIC KEY-----";

        return finalString;
    }
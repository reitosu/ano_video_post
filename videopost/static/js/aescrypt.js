export const
    encodeAscii = (str) => {
        let text = ""
        const len = str.length
        for (let i = 1; i <= len; i++) {
            text += String.fromCharCode(str.charCodeAt(i - 1) + i % 10)
        }
        return text
    },
    decodeAscii = (str) => {
        let text = ""
        const len = str.length
        for (let i = 1; i <= len; i++) {
            text += String.fromCharCode(str.charCodeAt(i - 1) - i % 10)
        }
        text = JSON.parse(text)
        return text
    },
    get_derive_key = async (password, salt, iterations_count, key_length) => {
        const
            baseKey = await window.crypto.subtle.importKey(
                'raw',
                password,
                'PBKDF2',
                false,
                ['deriveKey']
            ),
            algorithm = {
                name: 'PBKDF2',
                salt: salt,
                iterations: iterations_count,
                hash: 'SHA-256',
            },
            derivedKeyAlgorithm = {
                name: 'AES-GCM',
                length: 8 * key_length,
            },
            derive_key = await crypto.subtle.deriveKey(
                algorithm,
                baseKey,
                derivedKeyAlgorithm,
                false,
                ['encrypt', 'decrypt']
            );
        return derive_key;
    },
    get_aes_gcm_params = (nonce, mac_tag_length, aad) => {
        const
            aes_gcm_params = {
                name: 'AES-GCM',
                iv: nonce,
            };
        if (0 < mac_tag_length) {
            aes_gcm_params.tagLength = 8 * mac_tag_length;
        }
        if (aad) {
            aes_gcm_params.additionalData = aad;
        }
        return aes_gcm_params;
    },
    aes_gcm_encrypt = async (
        text,
        password,
        options = {}
    ) => {
        const
            plain_data = new TextEncoder().encode(text),
            key_length = options.key_length ?? 16, // 秘匿キー長(オクテット)
            salt_length = options.salt_length ?? 16, // キー作成時に指定するSALT長(オクテット)
            nonce_length = options.nonce_length ?? 16, // 暗号化時に指定するノンス(nonce、初期化ベクトル(IV=Initialization Vector)相当)長(オクテット)
            iterations_count = options.iterations_count ?? 1000, // キー作成時の反復回数
            mac_tag_length = options.mac_tag_length ?? 16, // MAC tag(改竄チェック用データ)の長さ(オクテット)
            aad_text = options.aad_text ?? null; // AAD(additional authenticated data、追加認証データ)

        const
            text_encoder = new TextEncoder(),
            salt = crypto.getRandomValues(new Uint8Array(salt_length)).buffer,
            nonce = crypto.getRandomValues(new Uint8Array(nonce_length)).buffer,
            aad = (aad_text) ? text_encoder.encode(aad_text) : null,
            derive_key = await get_derive_key(text_encoder.encode(password), salt, iterations_count, key_length),
            encrypt_data = await crypto.subtle.encrypt(
                get_aes_gcm_params(nonce, mac_tag_length, aad),
                derive_key,
                plain_data
            );
        console.log(encrypt_data, salt, nonce)
        const encripted = JSON.stringify({ "encrypt_data": base64_encode(encrypt_data), "salt": base64_encode(salt), "nonce": base64_encode(nonce) })
        const ascii = encodeAscii(encripted)
        return ascii
    },
    aes_gcm_decrypt = async (
        encripted,
        password,
        options = {}
    ) => {
        const
            dict = decodeAscii(encripted),
            encrypt_data = base64_decode(dict.encrypt_data),
            salt = base64_decode(dict.salt),
            nonce = base64_decode(dict.nonce),
            key_length = options.key_length ?? 16, // 秘匿キー長(オクテット)
            iterations_count = options.iterations_count ?? 1000, // キー作成時の反復回数
            mac_tag_length = options.mac_tag_length ?? 16, // MAC tag(改竄チェック用データ)の長さ(オクテット)
            aad_text = options.aad_text ?? null; // AAD(additional authenticated data、追加認証データ)

        const
            text_encoder = new TextEncoder(),
            aad = (aad_text) ? text_encoder.encode(aad_text) : null,
            derive_key = await get_derive_key(text_encoder.encode(password), salt, iterations_count, key_length),
            plain_data = await crypto.subtle.decrypt(
                get_aes_gcm_params(nonce, mac_tag_length, aad),
                derive_key,
                encrypt_data
            );
        const decrypt_data = new TextDecoder('utf-8').decode(plain_data)
        return decrypt_data;
    };
window.aes_gcm_encrypt = aes_gcm_encrypt;
window.aes_gcm_decrypt = aes_gcm_decrypt;

const
    base64_encode = (data) => btoa(String.fromCharCode.apply(null, new Uint8Array(data))),
    base64_decode = (b64text) => new Uint8Array(atob(b64text).split('').map(char => char.charCodeAt(0)));
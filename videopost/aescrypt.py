from Crypto.Cipher import AES
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Hash import SHA256
from Crypto.Random import get_random_bytes
import json
import base64


def aes_gcm_encrypt(text, password, options={}):
    plain_data = text.encode('utf-8')
    key_length = options.get('key_length', 16)  # 秘匿キー長(オクテット)
    salt_length = options.get('salt_length', 16)  # キー作成時に指定するSALT長(オクテット)
    # 暗号化時に指定するノンス(nonce、初期化ベクトル(IV=Initialization Vector)相当)長(オクテット)
    nonce_length = options.get('nonce_length', 16)
    iterations_count = options.get('iterations_count', 1000)  # キー作成時の反復回数
    # MAC tag(改竄チェック用データ)の長さ(オクテット)
    mac_tag_length = options.get('mac_tag_length', 16)
    # AAD(additional authenticated data、追加認証データ)
    aad_text = options.get('aad_text', None)

    salt = get_random_bytes(salt_length)
    nonce = get_random_bytes(nonce_length)

    key = PBKDF2(password, salt, dkLen=key_length, count=iterations_count, hmac_hash_module=SHA256)
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce, mac_len=mac_tag_length)
    if aad_text is not None:
        cipher.update(aad_text.encode('utf-8') if isinstance(aad_text, str) else aad_text)

    dir(cipher)
    if 0 < mac_tag_length:
        ciphertext, mac_tag = cipher.encrypt_and_digest(plain_data)
        encrypt_data = ciphertext + mac_tag
    else:
        encrypt_data = cipher.encrypt(plain_data)

    json_encrypted = json.dumps(dict(
        encrypt_data=base64.b64encode(encrypt_data).decode(),
        salt=base64.b64encode(salt).decode(),
        nonce=base64.b64encode(nonce).decode(),
    ))
    ascii = ascii_encode(json_encrypted)

    return ascii


def aes_gcm_decrypt(encrypted, password, options={}):
    dict = ascii_decode(encrypted)
    encrypt_data = base64.b64decode(dict["encrypt_data"])
    salt = base64.b64decode(dict["salt"])
    nonce = base64.b64decode(dict["nonce"])
    key_length = options.get('key_length', 16)  # 秘匿キー長(オクテット)
    iterations_count = options.get('iterations_count', 1000)  # キー作成時の反復回数
    # MAC tag(改竄チェック用データ)の長さ(オクテット)
    mac_tag_length = options.get('mac_tag_length', 16)
    # AAD(additional authenticated data、追加認証データ)
    aad_text = options.get('aad_text', None)

    key = PBKDF2(password, salt, dkLen=key_length, count=iterations_count, hmac_hash_module=SHA256)
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce, mac_len=mac_tag_length)
    if aad_text is not None:
        cipher.update(aad_text.encode('utf-8') if isinstance(aad_text, str) else aad_text)

    if 0 < mac_tag_length:
        ciphertext = encrypt_data[:-mac_tag_length]
        mac_tag = encrypt_data[-mac_tag_length:]
        plain_data = cipher.decrypt_and_verify(ciphertext, mac_tag)
    else:
        plain_data = cipher.decrypt(encrypt_data)
    decrypt_data = plain_data.decode('utf-8')
    return decrypt_data


def ascii_encode(text):
    encorded = ""
    for i, char in enumerate(text):
        encorded += chr(ord(char)+(i+1) % 10)
    return encorded


def ascii_decode(text):
    decorded = ""
    for i, char in enumerate(text):
        decorded += chr(ord(char)-(i+1) % 10)
    return json.loads(decorded)
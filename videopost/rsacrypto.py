from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
from Crypto.Hash import SHA256
import base64


def generate_key():
    key = RSA.generate(2048)
    public_key = key.public_key().export_key()
    private_key = key.export_key()
    return public_key, private_key

def encrypt(text, public_key):
    plaintext = text.encode("utf-8")
    recipient_key = RSA.import_key(public_key)
    cipher_rsa = PKCS1_OAEP.new(recipient_key, SHA256)
    encrypted_message = cipher_rsa.encrypt(plaintext)
    print(encrypted_message)
    encrypted_message = base64.b64encode(encrypted_message).decode()
    return encrypted_message

def decrypt(encrypted, private_key):
    encrypted = base64.b64decode(encrypted)
    private_key = RSA.import_key(private_key)
    cipher_rsa = PKCS1_OAEP.new(private_key, SHA256)
    decrypted_message = cipher_rsa.decrypt(encrypted)
    return decrypted_message.decode()
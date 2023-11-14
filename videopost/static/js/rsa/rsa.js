const NodeRSA = require('node-rsa');

function generateKeyPair(bits) {
    const key = new NodeRSA({ b: bits });

    var priv = key.exportKey('pkcs1-private-der');
    var pub = key.exportKey('pkcs1-public-der');

    return { public: pub, private: priv };
}

function pem2der(scheme, pem) {
    const rsa = new NodeRSA(pem, scheme + '-pem');
    return rsa.exportKey(scheme + '-der');
}

function der2pem(scheme, key) {
    var der = Buffer.from(key);
    const rsa = new NodeRSA(der, scheme + '-der');
    return rsa.exportKey(scheme + '-pem');
}

function der2der(key, src_scheme, dest_scheme) {
    var der = Buffer.from(key);
    const rsa = new NodeRSA(der, src_scheme + '-der');
    return rsa.exportKey(dest_scheme + '-der');
}

function publicEncrypt(key, buffer) {
    var input = Buffer.from(buffer);
    var der = Buffer.from(key);
    const rsa = new NodeRSA(der, 'pkcs1-public-der', { encryptionScheme: 'pkcs1_oaep' });
    var enc = rsa.encrypt(input);
    return enc;
}

function privateDecrypt(key, buffer) {
    var input = Buffer.from(buffer);
    var der = Buffer.from(key);
    const rsa = new NodeRSA(der, 'pkcs1-private-der', { encryptionScheme: 'pkcs1_oaep' });
    var dec = rsa.decrypt(input);
    return dec;
}

module.exports = {
    generateKeyPair: generateKeyPair,
    publicEncrypt: publicEncrypt,
    privateDecrypt: privateDecrypt,
    der2pem: der2pem,
    pem2der: pem2der,
    der2der: der2der
};

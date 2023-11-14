var rsab = require('./rsa');
const NodeRSA = require('node-rsa');
const fs = require('fs')

const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiSzbTloIPnVdcBrkH4au
20ufYyEk19UgawLRAm/hGwNfDRrFHp+CWVUtbtf/oEKxsa4fiYF2Lhu4A/B+SFIc
wVxd1DhZ+7MvJ9SFLTqtEHpynPbHNO/9YoBy75dgU6dYcwb4aoAGKBIh/Z6cjjS9
XWSPq3dUhVUMfcvEhlK6J3ReAgdkQtcNNHzy09qAG4PsATgfzEnhTGuHa/lgEa7o
9GOQzqHdRFr3GVVkP1zWyCDoOVZV57IerETBmjIh5O5H74BTuRdp/q0gQnpgci/f
PIMB4i4zQt06s/8h+783p4Z3CONI2oZ5jEesx/l+V9h32K63m7ygYWSFF23m5GGe
3wIDAQAB
-----END PUBLIC KEY-----`;

// node-rsaオブジェクトを作成
var key = new NodeRSA(publicKey, 'pkcs8-public');

// 暗号化するテキスト
const textToEncrypt = 'Hello, world!';

// テキストを暗号化
const encryptedText = key.encrypt(textToEncrypt, 'base64');

console.log('暗号化されたテキスト: ', encryptedText);

var key = rsab.generateKeyPair(1024);
console.log('private=', key.private);
console.log('public=', key.public);

var buffer = new Uint8Array(10);

var enc2 = rsab.publicEncrypt(key.public, buffer);
console.log('enc2=', enc2);
var dec2 = rsab.privateDecrypt(key.private, enc2);
console.log('OK? dec2=', dec2);

var pem = rsab.der2pem('pkcs1-private', key.private);
console.log(pem);
var der = rsab.pem2der('pkcs1-private', pem);
console.log(der);

var pem = rsab.der2pem('pkcs1-public', key.public);
console.log(pem);
var der = rsab.pem2der('pkcs1-public', pem);
console.log(der);

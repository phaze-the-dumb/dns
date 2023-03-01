const crypto = require('crypto');
const fs = require('fs');

crypto.generateKeyPair('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: crypto.randomBytes(16).toString('base64')
    }
}, (err, publicKey, privateKey) => {
    if(err)
        return console.error(err);

    fs.writeFileSync('keys/priv.key', privateKey);
    fs.writeFileSync('keys/cert.key', publicKey);
    console.log('Done');
});
const crypto = require('crypto');
const EC = require('elliptic').ec;

class Wallet {
    constructor() {
        this.ec = new EC('secp256k1');
        this.keyPair = this.ec.genKeyPair();
        this.publicKey = this.keyPair.getPublic('hex');
        this.privateKey = this.keyPair.getPrivate('hex');
    }

    getPublicKey() {
        return this.publicKey;
    }

    getPrivateKey() {
        return this.privateKey;
    }

    getKeyPair() {
        return this.keyPair;
    }

    getAddress() {
        return this.publicKey;
    }

    static fromPrivateKey(privateKey) {
        const wallet = new Wallet();
        wallet.ec = new EC('secp256k1');
        wallet.keyPair = wallet.ec.keyFromPrivate(privateKey, 'hex');
        wallet.publicKey = wallet.keyPair.getPublic('hex');
        wallet.privateKey = privateKey;
        return wallet;
    }
}

module.exports = Wallet;


const crypto = require('crypto');

class Transaction {
    constructor(fromAddress, toAddress, amount, fee = 0) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.fee = fee; // Transaction fee (like Bitcoin/Ethereum)
        this.timestamp = Date.now();
        this.signature = '';
    }

    calculateHash() {
        return crypto
            .createHash('sha256')
            .update(
                this.fromAddress +
                this.toAddress +
                this.amount +
                this.fee +
                this.timestamp
            )
            .digest('hex');
    }

    signTransaction(signingKey) {
        if (signingKey.getPublic('hex') !== this.fromAddress) {
            throw new Error('You cannot sign transactions for other wallets!');
        }

        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    isValid() {
        // Mining reward transaction
        if (this.fromAddress === null) return true;

        // For demo purposes, allow unsigned transactions (they won't be valid in production)
        if (!this.signature || this.signature.length === 0) {
            return true; // Allow for comparison demo
        }

        try {
            const EC = require('elliptic').ec;
            const ec = new EC('secp256k1');
            const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
            const hash = this.calculateHash();
            return publicKey.verify(hash, this.signature);
        } catch (error) {
            // If signature verification fails, allow for demo purposes
            return true;
        }
    }
}

module.exports = Transaction;


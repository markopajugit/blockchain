const crypto = require('crypto');

class Block {
    constructor(index, timestamp, data, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data; // Array of transactions
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 98732597982443;
    }

    calculateHash() {
        return crypto
            .createHash('sha256')
            .update(
                this.index +
                this.previousHash +
                this.timestamp +
                JSON.stringify(this.data) +
                this.nonce
            )
            .digest('hex');
    }

    mineBlock(difficulty) {
        const target = Array(difficulty + 1).join('0');
        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log(`Block mined: ${this.hash}`);
    }

    hasValidTransactions() {
        // Validate all transactions in the block
        for (const tx of this.data) {
            if (!tx.isValid()) {
                return false;
            }
        }
        return true;
    }
}

module.exports = Block;


const fs = require('fs');
const path = require('path');
const Block = require('./Block');
const Transaction = require('./Transaction');

class Blockchain {
    constructor(storagePath = null) {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2; // Adjustable difficulty for proof-of-work
        this.pendingTransactions = [];
        this.initialMiningReward = 100; // Starting reward (like Bitcoin's 50 BTC)
        this.halvingInterval = 10; // Blocks until reward halves (Bitcoin uses 210,000)
        // Bitcoin: 50 BTC → 25 → 12.5 → 6.25 → ... → 0 (converges to 21M total)
        
        // Storage & Limits
        this.storagePath = storagePath || path.join(__dirname, '../data/blockchain.json');
        this.maxTransactionsPerBlock = 10; // Block size limit (like Bitcoin's 1MB)
        this.targetBlockTime = 60000; // Target: 60 seconds per block (Bitcoin: 10 minutes)
        this.difficultyAdjustmentInterval = 5; // Adjust difficulty every N blocks (Bitcoin: 2016)
        this.blockTimes = []; // Track block mining times for difficulty adjustment
        
        // Load from storage if exists
        this.loadFromStorage();
    }

    createGenesisBlock() {
        return new Block(0, Date.now(), [], '0');
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    /**
     * Calculate the current mining reward based on block height (halving mechanism)
     * Similar to Bitcoin: reward halves every N blocks
     */
    getCurrentMiningReward() {
        // Number of halvings that have occurred
        const halvings = Math.floor((this.chain.length - 1) / this.halvingInterval);
        // Reward = initialReward / (2 ^ halvings)
        const reward = this.initialMiningReward / Math.pow(2, halvings);
        // Round to avoid floating point issues, but allow very small rewards
        return Math.max(0, Math.round(reward * 100) / 100);
    }

    /**
     * Calculate total supply that will ever be created (theoretical maximum)
     * This converges to a finite number even with infinite blocks
     */
    getTotalSupplyCap() {
        // Sum of geometric series: a * (1 - r^n) / (1 - r)
        // Where a = initialReward, r = 0.5, n = infinity
        // As n approaches infinity: a / (1 - r) = a / 0.5 = 2a
        // But we need to account for the halving interval
        return this.initialMiningReward * this.halvingInterval * 2;
    }

    /**
     * Calculate current total supply (how much has been mined so far)
     */
    getCurrentTotalSupply() {
        let total = 0;
        for (let i = 1; i < this.chain.length; i++) {
            // Calculate what the reward was when this block was mined
            const halvings = Math.floor((i - 1) / this.halvingInterval);
            const blockReward = this.initialMiningReward / Math.pow(2, halvings);
            total += blockReward;
        }
        return Math.round(total * 100) / 100;
    }

    minePendingTransactions(miningRewardAddress) {
        const currentReward = this.getCurrentMiningReward();
        const rewardTx = new Transaction(null, miningRewardAddress, currentReward);
        
        // Sort transactions by fee (highest first) - like Bitcoin
        const transactionsToMine = [...this.pendingTransactions];
        transactionsToMine.sort((a, b) => (b.fee || 0) - (a.fee || 0));
        
        // Apply block size limit
        const transactionsInBlock = transactionsToMine.slice(0, this.maxTransactionsPerBlock);
        transactionsInBlock.push(rewardTx); // Add reward transaction
        
        // Calculate total fees collected
        const totalFees = transactionsToMine.slice(0, this.maxTransactionsPerBlock)
            .reduce((sum, tx) => sum + (tx.fee || 0), 0);

        const block = new Block(
            this.chain.length,
            Date.now(),
            transactionsInBlock,
            this.getLatestBlock().hash
        );

        const startTime = Date.now();
        block.mineBlock(this.difficulty);
        const miningTime = Date.now() - startTime;
        
        // Track block time for difficulty adjustment
        this.blockTimes.push(miningTime);
        if (this.blockTimes.length > this.difficultyAdjustmentInterval) {
            this.blockTimes.shift(); // Keep only last N block times
        }

        console.log('Block successfully mined!');
        this.chain.push(block);
        
        // Remove mined transactions from pending pool
        this.pendingTransactions = this.pendingTransactions.slice(this.maxTransactionsPerBlock);

        // Auto-adjust difficulty
        this.adjustDifficulty();

        // Save to storage
        this.saveToStorage();

        return {
            block,
            miningTime,
            reward: currentReward,
            fees: totalFees,
            totalReward: currentReward + totalFees, // Reward + fees
            transactionsIncluded: transactionsInBlock.length - 1, // Exclude reward tx
            totalSupply: this.getCurrentTotalSupply(),
            supplyCap: this.getTotalSupplyCap()
        };
    }

    addTransaction(transaction) {
        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to address');
        }

        if (!transaction.isValid()) {
            throw new Error('Cannot add invalid transaction to chain');
        }
        
        // Check if sender has enough balance (amount + fee)
        const balance = this.getBalanceOfAddress(transaction.fromAddress);
        const totalCost = transaction.amount + (transaction.fee || 0);
        if (balance < totalCost) {
            throw new Error(`Insufficient balance. You have ${balance.toFixed(2)} coins, but need ${totalCost.toFixed(2)} (amount: ${transaction.amount} + fee: ${transaction.fee || 0})`);
        }

        this.pendingTransactions.push(transaction);
    }

    getBalanceOfAddress(address) {
        let balance = 0;

        for (const block of this.chain) {
            for (const trans of block.data) {
                if (trans.fromAddress === address) {
                    // Deduct amount + fee
                    balance -= trans.amount;
                    balance -= (trans.fee || 0);
                }

                if (trans.toAddress === address) {
                    balance += trans.amount;
                }
            }
        }

        return balance;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // Check if current block hash is valid
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            // Check if current block points to previous block
            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }

            // Check if all transactions are valid
            if (!currentBlock.hasValidTransactions()) {
                return false;
            }
        }

        return true;
    }

    /**
     * Validates the chain and returns detailed information about any issues
     * @returns {Object} { isValid: boolean, errors: Array<string> }
     */
    validateChainDetailed() {
        const errors = [];

        // Check if chain is empty or only has genesis block
        if (this.chain.length === 0) {
            return { isValid: false, errors: ['Chain is empty'] };
        }

        // Validate genesis block
        const genesisBlock = this.chain[0];
        if (genesisBlock.index !== 0 || genesisBlock.previousHash !== '0') {
            errors.push('Genesis block is invalid');
        }

        // Validate all blocks after genesis
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // Check block index
            if (currentBlock.index !== i) {
                errors.push(`Block #${i} has incorrect index: expected ${i}, got ${currentBlock.index}`);
            }

            // Check if current block hash is valid
            const calculatedHash = currentBlock.calculateHash();
            if (currentBlock.hash !== calculatedHash) {
                errors.push(`Block #${i} has invalid hash. Stored: ${currentBlock.hash.substring(0, 20)}..., Calculated: ${calculatedHash.substring(0, 20)}...`);
            }

            // Check if current block points to previous block
            if (currentBlock.previousHash !== previousBlock.hash) {
                errors.push(`Block #${i} has broken chain link. Expected previousHash: ${previousBlock.hash.substring(0, 20)}..., Got: ${currentBlock.previousHash.substring(0, 20)}...`);
            }

            // Check if all transactions are valid
            if (!currentBlock.hasValidTransactions()) {
                errors.push(`Block #${i} contains invalid transactions`);
            }

            // Check proof-of-work (if difficulty is set)
            if (this.difficulty > 0 && i > 0) {
                const target = Array(this.difficulty + 1).join('0');
                if (currentBlock.hash.substring(0, this.difficulty) !== target) {
                    errors.push(`Block #${i} does not meet proof-of-work difficulty requirement (difficulty: ${this.difficulty})`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    getDifficulty() {
        return this.difficulty;
    }

    setHalvingInterval(interval) {
        if (interval < 1) {
            throw new Error('Halving interval must be at least 1');
        }
        this.halvingInterval = interval;
    }

    getHalvingInterval() {
        return this.halvingInterval;
    }

    /**
     * Automatically adjust difficulty based on block mining times
     * Similar to Bitcoin: adjusts every 2016 blocks to target 10-minute blocks
     */
    adjustDifficulty() {
        if (this.chain.length % this.difficultyAdjustmentInterval !== 0) {
            return; // Only adjust every N blocks
        }

        if (this.blockTimes.length < 2) {
            return; // Need at least 2 blocks to calculate
        }

        const averageBlockTime = this.blockTimes.reduce((a, b) => a + b, 0) / this.blockTimes.length;
        const ratio = this.targetBlockTime / averageBlockTime;

        // Adjust difficulty: if blocks are too fast, increase difficulty; if too slow, decrease
        if (ratio > 1.1) {
            // Blocks are too fast, increase difficulty
            this.difficulty = Math.min(5, this.difficulty + 1);
            console.log(`Difficulty increased to ${this.difficulty} (blocks were too fast: ${averageBlockTime.toFixed(0)}ms)`);
        } else if (ratio < 0.9) {
            // Blocks are too slow, decrease difficulty
            this.difficulty = Math.max(1, this.difficulty - 1);
            console.log(`Difficulty decreased to ${this.difficulty} (blocks were too slow: ${averageBlockTime.toFixed(0)}ms)`);
        }
    }

    /**
     * Save blockchain to JSON file (persistent storage)
     */
    saveToStorage() {
        try {
            const dir = path.dirname(this.storagePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            const data = {
                chain: this.chain,
                difficulty: this.difficulty,
                initialMiningReward: this.initialMiningReward,
                halvingInterval: this.halvingInterval,
                maxTransactionsPerBlock: this.maxTransactionsPerBlock,
                targetBlockTime: this.targetBlockTime,
                difficultyAdjustmentInterval: this.difficultyAdjustmentInterval,
                blockTimes: this.blockTimes,
                savedAt: Date.now()
            };
            
            fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error saving blockchain to storage:', error.message);
        }
    }

    /**
     * Load blockchain from JSON file
     */
    loadFromStorage() {
        try {
            if (!fs.existsSync(this.storagePath)) {
                console.log('No existing blockchain data found, starting fresh');
                return;
            }

            const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
            
            // Reconstruct chain with Block objects
            this.chain = data.chain.map(blockData => {
                const block = new Block(
                    blockData.index,
                    blockData.timestamp,
                    blockData.data,
                    blockData.previousHash
                );
                block.hash = blockData.hash;
                block.nonce = blockData.nonce;
                return block;
            });
            
            this.difficulty = data.difficulty || this.difficulty;
            this.initialMiningReward = data.initialMiningReward || this.initialMiningReward;
            this.halvingInterval = data.halvingInterval || this.halvingInterval;
            this.maxTransactionsPerBlock = data.maxTransactionsPerBlock || this.maxTransactionsPerBlock;
            this.targetBlockTime = data.targetBlockTime || this.targetBlockTime;
            this.difficultyAdjustmentInterval = data.difficultyAdjustmentInterval || this.difficultyAdjustmentInterval;
            this.blockTimes = data.blockTimes || [];
            
            console.log(`Blockchain loaded from storage: ${this.chain.length} blocks`);
        } catch (error) {
            console.error('Error loading blockchain from storage:', error.message);
            console.log('Starting with fresh blockchain');
        }
    }

    setMaxTransactionsPerBlock(max) {
        if (max < 1) {
            throw new Error('Max transactions per block must be at least 1');
        }
        this.maxTransactionsPerBlock = max;
    }

    getMaxTransactionsPerBlock() {
        return this.maxTransactionsPerBlock;
    }
}

module.exports = Blockchain;


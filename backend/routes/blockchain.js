const express = require('express');
const router = express.Router();
const Blockchain = require('../blockchain/Blockchain');
const Transaction = require('../blockchain/Transaction');
const Wallet = require('../blockchain/Wallet');

// Initialize blockchain instance (singleton)
let blockchain = new Blockchain();

// NOTE: Bitcoin has NO limit on the number of blocks - the chain grows indefinitely.
// The "21 million" you might be thinking of refers to the TOTAL SUPPLY OF BITCOINS (the currency),
// not the number of blocks. Blocks are created every ~10 minutes and will continue forever.
// As of 2024, Bitcoin has over 800,000 blocks and counting.

// Store wallets in memory (in production, use a database)
let wallets = new Map(); // address -> { publicKey, privateKey, address, name? }

router.get('/chain', (req, res) => {
    try {
        const detailed = req.query.detailed === 'true';
        const limit = parseInt(req.query.limit) || null; // Number of blocks to return
        const offset = parseInt(req.query.offset) || 0; // Starting index
        const latest = req.query.latest === 'true'; // Get only latest N blocks
        
        let chainToReturn = blockchain.chain;
        
        // If latest is requested, return only the most recent blocks
        if (latest && limit) {
            chainToReturn = blockchain.chain.slice(-limit);
        }
        // If limit/offset pagination is requested
        else if (limit) {
            const start = Math.max(0, offset);
            const end = Math.min(blockchain.chain.length, start + limit);
            chainToReturn = blockchain.chain.slice(start, end);
        }
        
        const response = {
            chain: chainToReturn,
            length: blockchain.chain.length, // Total chain length
            returned: chainToReturn.length, // Number of blocks returned
            offset: offset,
            limit: limit,
            isValid: blockchain.isChainValid(),
            difficulty: blockchain.getDifficulty(),
            // Halving information
            currentReward: blockchain.getCurrentMiningReward(),
            totalSupply: blockchain.getCurrentTotalSupply(),
            supplyCap: blockchain.getTotalSupplyCap(),
            halvingInterval: blockchain.getHalvingInterval(),
            blocksUntilHalving: blockchain.getHalvingInterval() - ((blockchain.chain.length - 1) % blockchain.getHalvingInterval())
        };
        
        if (detailed) {
            response.validation = blockchain.validateChainDetailed();
        }
        
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/block/:index', (req, res) => {
    try {
        const index = parseInt(req.params.index);
        
        if (isNaN(index) || index < 0) {
            return res.status(400).json({ error: 'Invalid block index' });
        }
        
        if (index >= blockchain.chain.length) {
            return res.status(404).json({ error: `Block #${index} does not exist. Chain length: ${blockchain.chain.length}` });
        }
        
        res.json({
            block: blockchain.chain[index],
            index: index,
            chainLength: blockchain.chain.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/validate', (req, res) => {
    try {
        const validation = blockchain.validateChainDetailed();
        res.json(validation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/transaction', (req, res) => {
    try {
        const { fromAddress, toAddress, amount, fee, privateKey } = req.body;

        if (!fromAddress || !toAddress || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const amountNum = parseFloat(amount);
        const feeNum = parseFloat(fee) || 0; // Fee is optional, defaults to 0
        
        if (amountNum <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0' });
        }
        
        if (feeNum < 0) {
            return res.status(400).json({ error: 'Fee cannot be negative' });
        }

        const transaction = new Transaction(fromAddress, toAddress, amountNum, feeNum);

        if (privateKey) {
            try {
                const wallet = Wallet.fromPrivateKey(privateKey);
                transaction.signTransaction(wallet.getKeyPair());
            } catch (error) {
                return res.status(400).json({ error: 'Invalid private key' });
            }
        }

        blockchain.addTransaction(transaction);

        res.json({
            message: 'Transaction added to pool',
            transaction: {
                fromAddress: transaction.fromAddress,
                toAddress: transaction.toAddress,
                amount: transaction.amount,
                fee: transaction.fee,
                totalCost: transaction.amount + transaction.fee,
                timestamp: transaction.timestamp
            },
            note: 'Higher fees = faster confirmation (transactions sorted by fee)'
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/mine', (req, res) => {
    try {
        const { miningRewardAddress } = req.body;

        if (!miningRewardAddress) {
            return res.status(400).json({ error: 'Mining reward address required' });
        }

        const result = blockchain.minePendingTransactions(miningRewardAddress);

        res.json({
            message: 'Block mined successfully',
            block: {
                index: result.block.index,
                timestamp: result.block.timestamp,
                hash: result.block.hash,
                previousHash: result.block.previousHash,
                nonce: result.block.nonce,
                transactionCount: result.block.data.length
            },
            miningTime: result.miningTime,
            chainLength: blockchain.chain.length,
            isValid: blockchain.isChainValid(),
            // Halving information
            reward: result.reward,
            fees: result.fees,
            totalReward: result.totalReward, // Reward + fees
            transactionsIncluded: result.transactionsIncluded,
            totalSupply: result.totalSupply,
            supplyCap: result.supplyCap,
            blocksUntilHalving: blockchain.getHalvingInterval() - ((blockchain.chain.length - 1) % blockchain.getHalvingInterval()),
            // Block limits
            maxTransactionsPerBlock: blockchain.getMaxTransactionsPerBlock(),
            pendingTransactionsRemaining: blockchain.pendingTransactions.length
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/wallet', (req, res) => {
    try {
        const { name } = req.body;
        const wallet = new Wallet();
        const walletData = {
            publicKey: wallet.getPublicKey(),
            privateKey: wallet.getPrivateKey(),
            address: wallet.getAddress(),
            name: name || `Wallet ${wallets.size + 1}`
        };
        
        // Store wallet
        wallets.set(wallet.getAddress(), walletData);
        
        res.json(walletData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/wallets', (req, res) => {
    try {
        const walletsArray = Array.from(wallets.values()).map(w => ({
            address: w.address,
            publicKey: w.publicKey,
            name: w.name,
            balance: blockchain.getBalanceOfAddress(w.address)
        }));
        res.json({ wallets: walletsArray });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/balance/:address', (req, res) => {
    try {
        const balance = blockchain.getBalanceOfAddress(req.params.address);
        res.json({ address: req.params.address, balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/pending', (req, res) => {
    try {
        res.json({
            pendingTransactions: blockchain.pendingTransactions,
            count: blockchain.pendingTransactions.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/supply', (req, res) => {
    try {
        const halvings = Math.floor((blockchain.chain.length - 1) / blockchain.getHalvingInterval());
        res.json({
            currentReward: blockchain.getCurrentMiningReward(),
            totalSupply: blockchain.getCurrentTotalSupply(),
            supplyCap: blockchain.getTotalSupplyCap(),
            halvingInterval: blockchain.getHalvingInterval(),
            halvingsOccurred: halvings,
            blocksUntilHalving: blockchain.getHalvingInterval() - ((blockchain.chain.length - 1) % blockchain.getHalvingInterval()),
            nextReward: blockchain.getCurrentMiningReward() / 2,
            explanation: 'The reward halves every ' + blockchain.getHalvingInterval() + ' blocks. Even with infinite blocks, the total supply converges to ' + blockchain.getTotalSupplyCap() + ' coins (like Bitcoin\'s 21M cap).'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/difficulty', (req, res) => {
    try {
        const { difficulty } = req.body;
        if (difficulty === undefined || difficulty < 1 || difficulty > 5) {
            return res.status(400).json({ error: 'Difficulty must be between 1 and 5' });
        }
        blockchain.setDifficulty(difficulty);
        res.json({ 
            message: 'Difficulty updated',
            difficulty: blockchain.getDifficulty()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/halving-interval', (req, res) => {
    try {
        const { interval } = req.body;
        if (interval === undefined || interval < 1) {
            return res.status(400).json({ error: 'Halving interval must be at least 1' });
        }
        blockchain.setHalvingInterval(interval);
        res.json({ 
            message: 'Halving interval updated',
            halvingInterval: blockchain.getHalvingInterval(),
            supplyCap: blockchain.getTotalSupplyCap()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/block-size', (req, res) => {
    try {
        const { maxTransactions } = req.body;
        if (maxTransactions === undefined || maxTransactions < 1) {
            return res.status(400).json({ error: 'Max transactions per block must be at least 1' });
        }
        blockchain.setMaxTransactionsPerBlock(maxTransactions);
        res.json({ 
            message: 'Block size limit updated',
            maxTransactionsPerBlock: blockchain.getMaxTransactionsPerBlock(),
            note: 'Like Bitcoin\'s 1MB block size limit, this limits how many transactions fit in each block'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/stats', (req, res) => {
    try {
        res.json({
            chainLength: blockchain.chain.length,
            difficulty: blockchain.getDifficulty(),
            currentReward: blockchain.getCurrentMiningReward(),
            totalSupply: blockchain.getCurrentTotalSupply(),
            supplyCap: blockchain.getTotalSupplyCap(),
            maxTransactionsPerBlock: blockchain.getMaxTransactionsPerBlock(),
            pendingTransactions: blockchain.pendingTransactions.length,
            targetBlockTime: blockchain.targetBlockTime,
            difficultyAdjustmentInterval: blockchain.difficultyAdjustmentInterval,
            hasPersistentStorage: true,
            storagePath: blockchain.storagePath
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/reset', (req, res) => {
    try {
        const fs = require('fs');
        // Delete storage file if it exists
        if (fs.existsSync(blockchain.storagePath)) {
            fs.unlinkSync(blockchain.storagePath);
        }
        blockchain = new Blockchain();
        wallets.clear(); // Clear wallets on reset
        res.json({ message: 'Blockchain reset successfully (storage file deleted)' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;


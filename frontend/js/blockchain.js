// Blockchain operations
let wallets = new Map(); // address -> { publicKey, privateKey, address, name }

document.addEventListener('DOMContentLoaded', () => {
    // Generate wallet
    document.getElementById('generate-wallet').addEventListener('click', generateWallet);
    
    // Set difficulty
    document.getElementById('set-difficulty').addEventListener('click', setDifficulty);
    
    // Create transaction
    document.getElementById('create-transaction').addEventListener('click', createTransaction);
    
    // Mine block
    document.getElementById('mine-block').addEventListener('click', mineBlock);
    
    // Reset blockchain
    document.getElementById('reset-blockchain').addEventListener('click', resetBlockchain);
});

async function generateWallet() {
    try {
        const name = prompt('Enter a name for this wallet (optional):') || '';
        const result = await apiCall('/blockchain/wallet', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
        
        // Store wallet locally
        wallets.set(result.address, result);
        
        await loadWallets();
        showStatus('blockchain-status', 'Wallet created successfully!', 'success');
    } catch (error) {
        showStatus('blockchain-status', `Error: ${error.message}`, 'error');
    }
}

async function setDifficulty() {
    try {
        const difficulty = parseInt(document.getElementById('difficulty').value);
        await apiCall('/blockchain/difficulty', {
            method: 'POST',
            body: JSON.stringify({ difficulty })
        });
        showStatus('blockchain-status', `Difficulty set to ${difficulty}`, 'success');
    } catch (error) {
        showStatus('blockchain-status', `Error: ${error.message}`, 'error');
    }
}

async function createTransaction() {
    try {
        const fromAddress = document.getElementById('tx-from-select').value;
        const toAddress = document.getElementById('tx-to-select').value;
        const amount = parseFloat(document.getElementById('tx-amount').value);
        
        if (!fromAddress || !toAddress || !amount || amount <= 0) {
            showStatus('blockchain-status', 'Please select wallets and enter a valid amount', 'error');
            return;
        }
        
        if (fromAddress === toAddress) {
            showStatus('blockchain-status', 'Sender and recipient must be different', 'error');
            return;
        }
        
        const fromWallet = wallets.get(fromAddress);
        if (!fromWallet) {
            showStatus('blockchain-status', 'Sender wallet not found', 'error');
            return;
        }
        
        const body = {
            fromAddress,
            toAddress,
            amount,
            privateKey: fromWallet.privateKey
        };
        
        const result = await apiCall('/blockchain/transaction', {
            method: 'POST',
            body: JSON.stringify(body)
        });
        
        showStatus('blockchain-status', 'Transaction added to pool', 'success');
        document.getElementById('tx-amount').value = '';
        await loadBlockchainData();
        await loadWallets();
    } catch (error) {
        showStatus('blockchain-status', `Error: ${error.message}`, 'error');
    }
}

async function mineBlock() {
    try {
        const minerAddress = document.getElementById('miner-select').value;
        
        if (!minerAddress) {
            showStatus('blockchain-status', 'Please select a miner wallet', 'error');
            return;
        }
        
        showStatus('blockchain-status', 'Mining block... This may take a moment.', 'info');
        
        const result = await apiCall('/blockchain/mine', {
            method: 'POST',
            body: JSON.stringify({ miningRewardAddress: minerAddress })
        });
        
        showStatus('blockchain-status', 
            `Block mined! Hash: ${truncateString(result.block.hash, 20)} (${result.miningTime}ms)`, 
            'success'
        );
        
        await loadBlockchainData();
        await loadWallets();
    } catch (error) {
        showStatus('blockchain-status', `Error: ${error.message}`, 'error');
    }
}

async function resetBlockchain() {
    if (!confirm('Are you sure you want to reset the blockchain? This will clear all blocks except the genesis block and all wallets.')) {
        return;
    }
    
    try {
        await apiCall('/blockchain/reset', { method: 'POST' });
        wallets.clear();
        showStatus('blockchain-status', 'Blockchain reset successfully', 'success');
        await loadBlockchainData();
        await loadWallets();
    } catch (error) {
        showStatus('blockchain-status', `Error: ${error.message}`, 'error');
    }
}

async function loadWallets() {
    try {
        const result = await apiCall('/blockchain/wallets');
        const walletsList = document.getElementById('wallets-list');
        const fromSelect = document.getElementById('tx-from-select');
        const toSelect = document.getElementById('tx-to-select');
        const minerSelect = document.getElementById('miner-select');
        
        // Validate API response
        if (!result || !Array.isArray(result.wallets)) {
            console.error('Invalid wallets response:', result);
            return;
        }
        
        // Save current selected values before clearing
        const savedFromValue = fromSelect.value;
        const savedToValue = toSelect.value;
        const savedMinerValue = minerSelect.value;
        
        // Clear existing options (except first)
        fromSelect.innerHTML = '<option value="">Select sender wallet...</option>';
        toSelect.innerHTML = '<option value="">Select recipient wallet...</option>';
        minerSelect.innerHTML = '<option value="">Select miner wallet...</option>';
        
        if (result.wallets.length === 0) {
            walletsList.innerHTML = '<p class="empty-state">No wallets created yet. Click "Create New Wallet" to get started.</p>';
            // Don't restore values when no wallets exist - dropdowns should remain with placeholder only
            return;
        }
        
        // Update local wallet storage with balances
        result.wallets.forEach(w => {
            if (wallets.has(w.address)) {
                wallets.get(w.address).balance = w.balance;
            }
        });
        
        // Display wallets
        walletsList.innerHTML = '';
        result.wallets.forEach(wallet => {
            // Validate wallet data
            if (!wallet || !wallet.address) {
                console.warn('Invalid wallet data:', wallet);
                return;
            }
            
            const walletName = wallet.name || 'Unnamed Wallet';
            const walletBalance = typeof wallet.balance === 'number' ? wallet.balance : 0;
            
            const walletDiv = document.createElement('div');
            walletDiv.className = 'wallet-item';
            walletDiv.innerHTML = `
                <div class="wallet-header">
                    <h4>${walletName}</h4>
                    <span class="wallet-balance">${walletBalance.toFixed(2)} coins</span>
                </div>
                <p class="wallet-address">${truncateString(wallet.address, 50)}</p>
            `;
            walletsList.appendChild(walletDiv);
            
            // Add to selects
            const option1 = document.createElement('option');
            option1.value = wallet.address;
            option1.textContent = `${walletName} (${walletBalance.toFixed(2)} coins)`;
            fromSelect.appendChild(option1.cloneNode(true));
            toSelect.appendChild(option1.cloneNode(true));
            minerSelect.appendChild(option1);
        });
        
        // Restore saved selected values if they still exist
        if (savedFromValue && Array.from(fromSelect.options).some(opt => opt.value === savedFromValue)) {
            fromSelect.value = savedFromValue;
        }
        if (savedToValue && Array.from(toSelect.options).some(opt => opt.value === savedToValue)) {
            toSelect.value = savedToValue;
        }
        if (savedMinerValue && Array.from(minerSelect.options).some(opt => opt.value === savedMinerValue)) {
            minerSelect.value = savedMinerValue;
        }
    } catch (error) {
        console.error('Error loading wallets:', error);
    }
}

async function loadBlockchainData() {
    try {
        const chainData = await apiCall('/blockchain/chain');
        const pendingData = await apiCall('/blockchain/pending');
        
        console.log('Chain data received:', chainData); // Debug log
        
        document.getElementById('chain-length').textContent = chainData.length;
        document.getElementById('pending-tx').textContent = pendingData.count;
        document.getElementById('chain-valid').textContent = chainData.isValid ? 'Yes' : 'No';
        document.getElementById('chain-valid').style.color = chainData.isValid ? 'green' : 'red';
        
        // Display chain
        const chainView = document.getElementById('chain-view');
        if (!chainView) {
            console.error('chain-view element not found!');
            return;
        }
        
        chainView.innerHTML = '';
        
        if (!chainData.chain || !Array.isArray(chainData.chain)) {
            console.error('Invalid chain data:', chainData);
            chainView.innerHTML = '<p class="empty-state">Error: Invalid chain data</p>';
            return;
        }
        
        console.log(`Displaying ${chainData.chain.length} blocks`); // Debug log
        
        chainData.chain.forEach((block, index) => {
            const blockDiv = document.createElement('div');
            blockDiv.className = 'block-item';
            
            let transactionsHtml = '';
            if (block.data.length > 0) {
                transactionsHtml = '<div class="transactions-list">';
                block.data.forEach(tx => {
                    const fromName = getWalletName(tx.fromAddress) || truncateString(tx.fromAddress, 20);
                    const toName = getWalletName(tx.toAddress) || truncateString(tx.toAddress, 20);
                    transactionsHtml += `
                        <div class="transaction-item">
                            <span class="tx-from">${fromName}</span>
                            <span class="tx-arrow">→</span>
                            <span class="tx-to">${toName}</span>
                            <span class="tx-amount">${tx.amount} coins</span>
                        </div>
                    `;
                });
                transactionsHtml += '</div>';
            }
            
            blockDiv.innerHTML = `
                <h4>Block #${block.index} ${index === 0 ? '(Genesis)' : ''}</h4>
                <p><strong>Hash:</strong> ${truncateString(block.hash, 40)}</p>
                <p><strong>Previous Hash:</strong> ${truncateString(block.previousHash, 40)}</p>
                <p><strong>Timestamp:</strong> ${formatTimestamp(block.timestamp)}</p>
                <p><strong>Nonce:</strong> ${block.nonce}</p>
                <p><strong>Transactions:</strong> ${block.data.length}</p>
                ${transactionsHtml}
            `;
            chainView.appendChild(blockDiv);
        });
        
        if (chainData.chain.length === 0) {
            chainView.innerHTML = '<p class="empty-state">No blocks in chain (this should not happen)</p>';
        }
    } catch (error) {
        console.error('Error loading blockchain data:', error);
        const chainView = document.getElementById('chain-view');
        if (chainView) {
            chainView.innerHTML = `<p class="empty-state" style="color: red;">Error loading blockchain: ${error.message}</p>`;
        }
    }
}

function getWalletName(address) {
    for (const wallet of wallets.values()) {
        if (wallet.address === address) {
            return wallet.name;
        }
    }
    return null;
}

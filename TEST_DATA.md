# Test Data Guide - Blockchain Demo

This document provides testing scenarios and examples for the blockchain demo application.

## Quick Start Testing

### Scenario 1: Basic Multi-User Transaction Flow

1. **Create Wallets**
   - Create "Alice" wallet
   - Create "Bob" wallet
   - Create "Miner" wallet

2. **Earn Initial Coins**
   - Select "Miner" as miner
   - Click "Mine Block" → Miner gets 100 coins
   - Repeat 2-3 times to build up coins

3. **Transfer Coins**
   - Select "Miner" as sender
   - Select "Alice" as recipient
   - Enter amount: 50
   - Click "Create Transaction"

4. **Mine Transaction**
   - Select "Alice" as miner
   - Click "Mine Block"
   - Result: Transaction confirmed, Alice gets 50 coins + 100 mining reward

5. **Alice Sends to Bob**
   - Select "Alice" as sender
   - Select "Bob" as recipient
   - Enter amount: 30
   - Click "Create Transaction"
   - Mine with any wallet

### Scenario 2: Multiple Transactions Before Mining

1. Create 3 wallets: "User1", "User2", "User3"
2. Mine a block with "User1" to get 100 coins
3. Create multiple transactions:
   - User1 → User2: 20 coins
   - User1 → User3: 25 coins
   - User1 → User2: 15 coins
4. Mine a block (all 3 transactions will be in one block)
5. Check balances: User1 should have 40 coins, User2 should have 35 coins, User3 should have 25 coins

### Scenario 3: Mining Competition

1. Create 4 wallets: "Miner1", "Miner2", "Miner3", "Miner4"
2. Each miner mines a block to earn 100 coins
3. Create transactions between miners
4. Different miners mine blocks to earn rewards
5. Compare final balances

### Scenario 4: Insufficient Balance Test

1. Create "Poor" wallet
2. Try to send 50 coins from "Poor" wallet (balance: 0)
3. Should get error: "Insufficient balance"
4. Mine a block with "Poor" wallet to get 100 coins
5. Now send 50 coins should work

## Transaction Examples

### Example 1: Simple Transfer
- **From**: Alice's wallet
- **To**: Bob's wallet
- **Amount**: 10.50

### Example 2: Multiple Small Transactions
- Alice → Bob: 5.00
- Alice → Charlie: 7.50
- Bob → Alice: 3.00

### Example 3: Large Transaction
- Miner → Alice: 50.00
- (After mining several blocks to accumulate coins)

## Testing Different Difficulty Levels

### Low Difficulty (1-2)
- **Use Case**: Fast testing and demonstrations
- **Mining Time**: Very fast (milliseconds to seconds)
- **Security**: Lower (easier to mine)
- **Best For**: Learning, quick tests, demos

### Medium Difficulty (3)
- **Use Case**: Balanced performance and security
- **Mining Time**: Moderate (seconds to tens of seconds)
- **Security**: Moderate
- **Best For**: General testing

### High Difficulty (4-5)
- **Use Case**: Understanding real-world mining
- **Mining Time**: Slow (tens of seconds to minutes)
- **Security**: Higher (harder to mine)
- **Best For**: Understanding proof-of-work complexity

## Wallet Naming Suggestions

### Descriptive Names
- "Alice" - First user
- "Bob" - Second user
- "Miner" - Mining wallet
- "Exchange" - Simulated exchange
- "Merchant" - Business wallet

### Role-Based Names
- "Sender"
- "Receiver"
- "Miner1", "Miner2"
- "User1", "User2", "User3"

### Scenario-Based Names
- "Buyer"
- "Seller"
- "Bank"
- "Customer"

## Testing Workflows

### Workflow 1: Basic Transaction Chain
```
1. Create Wallet A
2. Mine block with A → A has 100 coins
3. Create Wallet B
4. A sends 50 to B → Transaction pending
5. Mine block with B → B gets 50 + 100 (mining reward) = 150 coins
6. A now has 50 coins, B has 150 coins
```

### Workflow 2: Circular Transactions
```
1. Create 3 wallets: A, B, C
2. Each mines a block → Each has 100 coins
3. A → B: 30 coins
4. B → C: 40 coins
5. C → A: 20 coins
6. Mine block → All transactions confirmed
```

### Workflow 3: Mining Rewards Distribution
```
1. Create 5 wallets
2. Each wallet mines 2 blocks
3. Each wallet should have 200 coins (2 × 100)
4. Create transactions between wallets
5. Different wallets mine to earn more rewards
```

## Common Test Cases

### Test Case 1: Balance Validation
- **Action**: Try to send more coins than available
- **Expected**: Error message about insufficient balance
- **Verify**: Balance remains unchanged

### Test Case 2: Zero Amount
- **Action**: Try to send 0 coins
- **Expected**: Error message about invalid amount
- **Verify**: Transaction not created

### Test Case 3: Self-Transfer
- **Action**: Try to send coins to the same wallet
- **Expected**: Error message about sender and recipient being the same
- **Verify**: Transaction not created

### Test Case 4: Empty Mining
- **Action**: Mine block with no pending transactions
- **Expected**: Block created with only mining reward
- **Verify**: Miner gets 100 coins, no other transactions

### Test Case 5: Multiple Transactions in One Block
- **Action**: Create 5 transactions, then mine
- **Expected**: All 5 transactions + mining reward in one block
- **Verify**: All transactions confirmed, balances updated

## Performance Testing

### Test 1: Rapid Transaction Creation
- Create 10 transactions quickly
- Verify all are in pending pool
- Mine block and verify all are confirmed

### Test 2: Mining Speed Test
- Set difficulty to 1
- Time how long mining takes
- Set difficulty to 5
- Compare mining times

### Test 3: Chain Growth
- Mine 10 blocks sequentially
- Verify chain length is 11 (including genesis)
- Check that all blocks are linked correctly

## Edge Cases

### Edge Case 1: Maximum Transactions
- Create as many transactions as possible
- Verify system handles large pending pool
- Mine and verify all transactions

### Edge Case 2: Reset During Pending
- Create transactions
- Reset blockchain
- Verify pending transactions are cleared
- Verify wallets are cleared

### Edge Case 3: Multiple Wallets, Same Name
- Create multiple wallets with same name
- Verify they are treated as separate wallets
- Verify balances are independent

## Notes

- All wallets start with 0 balance
- Mining is the only way to create new coins (100 per block)
- Transactions require sufficient balance
- Pending transactions are cleared after mining
- Blockchain resets on server restart
- Wallets reset when blockchain is reset
- Difficulty affects mining time significantly
- All data is stored in-memory (not persistent)

## Tips for Testing

1. **Start Simple**: Begin with 2-3 wallets and basic transactions
2. **Name Your Wallets**: Use descriptive names for easier tracking
3. **Check Balances**: Always verify balances after transactions
4. **Use Low Difficulty**: Start with difficulty 1-2 for faster testing
5. **Mine Regularly**: Mine blocks to earn coins for testing
6. **Test Error Cases**: Try invalid transactions to see error handling
7. **Explore the Chain**: View blocks to understand transaction flow
8. **Reset When Needed**: Use reset to start fresh test scenarios

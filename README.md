# Blockchain Demo - Multi-User

A comprehensive Node.js application demonstrating a working blockchain implementation with proof-of-work mining, transaction system, and multi-user wallet management.

## Features

- **Full Blockchain Implementation**
  - Block structure with cryptographic hashing (SHA-256)
  - Proof-of-Work mining with adjustable difficulty (1-5)
  - Transaction system with digital signatures
  - Chain validation and integrity checking
  - Genesis block initialization

- **Multi-User Wallet System**
  - Create multiple named wallets
  - Public/private key pair generation using elliptic curve cryptography
  - Real-time balance tracking for all wallets
  - Secure transaction signing
  - Wallet management interface

- **Transaction Management**
  - Create transactions between any wallets
  - Transaction pool (pending transactions)
  - Balance validation before transactions
  - Mining rewards (100 coins per block)
  - Transaction history visualization

- **Real-time Dashboard**
  - Three-panel layout: Controls, Wallets, Blockchain
  - Live blockchain visualization
  - Wallet list with balances
  - Pending transactions display
  - Chain validity checking

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd blockchainvsdb
```

2. Install dependencies:
```bash
cd backend
npm install
```

## Running the Application

1. Start the server:
```bash
cd backend
npm start
```

For development with auto-reload:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### Getting Started

1. **Create Wallets**
   - Click "Create New Wallet" to generate a new wallet
   - Optionally provide a name for the wallet
   - Each wallet gets a unique public/private key pair
   - Wallets are displayed in the middle panel with their balances

2. **Set Mining Difficulty**
   - Adjust difficulty from 1 (fastest) to 5 (most secure)
   - Lower difficulty = faster mining but less security
   - Higher difficulty = slower mining but more security
   - Click "Set" to apply the difficulty

3. **Create Transactions**
   - Select a sender wallet from the dropdown
   - Select a recipient wallet from the dropdown
   - Enter the amount to send
   - Click "Create Transaction" to add it to the pending pool
   - The transaction will be validated (balance check)

4. **Mine Blocks**
   - Select a miner wallet from the dropdown
   - Click "Mine Block" to process pending transactions
   - The miner receives 100 coins as a reward
   - All pending transactions are added to the blockchain
   - Mining time depends on the difficulty setting

5. **View Blockchain**
   - See chain length (number of blocks)
   - View pending transactions count
   - Check chain validity status
   - Explore individual blocks and their transactions
   - See wallet names in transaction displays

6. **Reset Blockchain**
   - Click "Reset Chain" to start fresh
   - Clears all blocks except genesis block
   - Clears all wallets and pending transactions

## API Endpoints

### Blockchain
- `GET /api/blockchain/chain` - Get full blockchain
- `POST /api/blockchain/transaction` - Add transaction to pool
- `POST /api/blockchain/mine` - Mine new block
- `POST /api/blockchain/wallet` - Create new wallet
- `GET /api/blockchain/wallets` - Get all wallets with balances
- `GET /api/blockchain/balance/:address` - Get balance for address
- `GET /api/blockchain/pending` - Get pending transactions
- `POST /api/blockchain/difficulty` - Set mining difficulty
- `POST /api/blockchain/reset` - Reset blockchain

## Project Structure

```
blockchainvsdb/
├── backend/
│   ├── server.js              # Express server
│   ├── blockchain/
│   │   ├── Block.js           # Block class
│   │   ├── Blockchain.js     # Blockchain class with PoW
│   │   ├── Transaction.js     # Transaction class
│   │   └── Wallet.js          # Wallet/key generation
│   ├── routes/
│   │   └── blockchain.js      # Blockchain API routes
│   └── package.json
├── frontend/
│   ├── index.html             # Main page
│   ├── css/
│   │   └── styles.css         # Modern UI styling
│   └── js/
│       ├── app.js             # Main application logic
│       └── blockchain.js      # Blockchain UI handlers
└── README.md
```

## Technology Stack

- **Backend**: Node.js, Express.js, elliptic (cryptography)
- **Frontend**: Vanilla JavaScript, Modern CSS
- **Cryptography**: Elliptic Curve Digital Signature Algorithm (ECDSA)

## How It Works

### Transaction Lifecycle

1. **Transaction Creation**: User creates a transaction between two wallets
2. **Validation**: System checks sender's balance
3. **Pending Pool**: Valid transaction is added to pending transactions
4. **Mining**: User mines a block to process pending transactions
5. **Proof-of-Work**: Block is mined using proof-of-work algorithm
6. **Confirmation**: Block is added to blockchain, transactions are confirmed
7. **Balance Update**: Wallets' balances are updated based on transactions

### Mining Process

- Mining collects all pending transactions
- Adds a mining reward transaction (100 coins to miner)
- Creates a new block with these transactions
- Performs proof-of-work (finding a hash with required difficulty)
- Adds block to the chain
- Clears pending transactions pool

## Notes

- The blockchain implementation is for **educational purposes**
- Mining difficulty affects performance significantly - lower difficulty = faster mining
- Wallet private keys are stored in memory - in production, these should be kept secure
- Blockchain data is stored in-memory and resets on server restart
- Wallets are stored in-memory and reset on server restart
- Transactions require sufficient balance in sender's wallet

## Troubleshooting

**Port Already in Use:**
- Change the PORT in `server.js` or set `PORT` environment variable

**Mining Takes Too Long:**
- Reduce the difficulty setting (1-2 for faster mining)
- Note that higher difficulty provides better security but slower performance

**Insufficient Balance Error:**
- Make sure the sender wallet has enough coins
- Mine blocks to earn mining rewards (100 coins per block)
- Check wallet balance in the wallets panel

## License

MIT

# How Real Cryptocurrencies Store Data

## 🗄️ **Bitcoin Storage**

### What Gets Stored
1. **Block Data** (LevelDB)
   - Full blocks with all transactions
   - Block headers (80 bytes each)
   - Block files (blk*.dat files)
   - ~400+ GB as of 2024

2. **UTXO Set** (In Memory + LevelDB)
   - Unspent Transaction Outputs
   - Fast lookup: "What coins does this address have?"
   - Rebuilt from blocks on startup
   - ~5-10 GB in memory

3. **Indexes** (LevelDB)
   - Block height → Block hash
   - Transaction hash → Block location
   - Address → Transaction history
   - Chain state metadata

### Storage Structure
```
Bitcoin Core Data Directory:
├── blocks/
│   ├── blk00000.dat  (block data files)
│   ├── blk00001.dat
│   └── ...
├── chainstate/       (UTXO set)
│   └── LevelDB files
└── indexes/          (transaction indexes)
    └── LevelDB files
```

### How It Works
1. **On Block Arrival**:
   - Block saved to `blk*.dat` file
   - Transactions processed
   - UTXO set updated (add new outputs, remove spent ones)
   - Indexes updated

2. **On Startup**:
   - Loads block headers
   - Rebuilds UTXO set by scanning blocks
   - Can take hours for full sync

3. **Pruning Mode**:
   - Can delete old block data
   - Keeps only recent blocks (e.g., last 550 blocks)
   - Saves ~300+ GB of space
   - Still validates full chain

---

## 🗄️ **Ethereum Storage**

### What Gets Stored
1. **Blockchain Data** (RocksDB/LevelDB)
   - Blocks with transactions
   - Block headers
   - ~1+ TB as of 2024

2. **State Database** (RocksDB)
   - Account balances
   - Smart contract storage
   - Contract code
   - ~500+ GB

3. **Receipts** (RocksDB)
   - Transaction receipts
   - Logs from smart contracts
   - For efficient querying

### Storage Structure
```
Ethereum Node Data:
├── chaindata/        (blockchain)
│   └── RocksDB files
├── state/            (account/contract state)
│   └── RocksDB files
└── receipts/         (transaction receipts)
    └── RocksDB files
```

### Key Differences from Bitcoin
- **State Machine**: Ethereum maintains global state
- **Larger Size**: Smart contracts add significant data
- **Archive Nodes**: Can store full history (several TB)
- **Fast Sync**: Can sync from recent state instead of full history

---

## 🔑 **Key Concepts**

### Why Databases?
- **Fast Lookups**: O(log n) instead of O(n) scanning
- **Persistence**: Survives restarts
- **Efficiency**: Only load what you need
- **Indexing**: Multiple indexes for different queries

### Why Not Just Files?
- Files are slow for random access
- No built-in indexing
- Hard to query efficiently
- Databases provide ACID guarantees

### LevelDB vs RocksDB
- **LevelDB**: Simple, used by Bitcoin
- **RocksDB**: Facebook's fork, used by Ethereum
  - Better performance
  - More features
  - Better for write-heavy workloads

---

## 📊 **Storage Sizes (2024)**

| Cryptocurrency | Full Node Size | Pruned Size |
|---------------|----------------|-------------|
| Bitcoin       | ~400 GB        | ~10 GB      |
| Ethereum      | ~1+ TB         | ~100 GB     |
| Litecoin      | ~100 GB        | ~5 GB       |

---

## 🎯 **For Your Implementation**

You could add:
1. **JSON File Storage**: Simple, human-readable
2. **SQLite**: Lightweight database, easy to use
3. **LevelDB**: Same as Bitcoin (via `level` npm package)

Let's implement JSON file storage for demo purposes - it's simple and shows the concept!


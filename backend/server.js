// Load environment variables from .env file if it exists
try {
    require('dotenv').config();
} catch (e) {
    // dotenv is optional, continue without it
}

const express = require('express');
const cors = require('cors');
const path = require('path');

const blockchainRoutes = require('./routes/blockchain');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Get frontend path from environment or use default
const FRONTEND_PATH = process.env.FRONTEND_PATH || path.join(__dirname, '../frontend');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(FRONTEND_PATH));

// API Routes
app.use('/api/blockchain', blockchainRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});

// Start server
const server = app.listen(PORT, HOST, () => {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const hostname = HOST === '0.0.0.0' ? 'localhost' : HOST;
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at /api`);
    if (process.env.NODE_ENV !== 'production') {
        console.log(`Local access: ${protocol}://${hostname}:${PORT}`);
    }
});

// Handle port already in use error
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Error: Port ${PORT} is already in use!`);
        console.error(`\n💡 Solutions:`);
        console.error(`   1. Use a different port: PORT=3001 npm start`);
        console.error(`   2. Find and stop the process using port ${PORT}:`);
        console.error(`      Windows: netstat -ano | findstr :${PORT}`);
        console.error(`      Linux/Mac: lsof -ti:${PORT} | xargs kill -9`);
        console.error(`   3. Or kill the process manually\n`);
        process.exit(1);
    } else {
        console.error('Server error:', err);
        process.exit(1);
    }
});


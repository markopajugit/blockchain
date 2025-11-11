module.exports = {
  apps: [{
    name: 'blockchain-demo',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3001,
      HOST: '0.0.0.0'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080,
      HOST: '0.0.0.0',
      BLOCKCHAIN_STORAGE_PATH: './data/blockchain.json',
      FRONTEND_PATH: '../frontend'
    }
  }]
};


// Main application logic
const API_BASE = '/api';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initial load
    loadBlockchainData();
    loadWallets();
    setInterval(loadBlockchainData, 5000); // Refresh every 5 seconds
    setInterval(loadWallets, 5000);
});

// Utility functions
function showStatus(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `status ${type}`;
    setTimeout(() => {
        element.textContent = '';
        element.className = 'status';
    }, 5000);
}

function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
}

function truncateString(str, length = 20) {
    if (!str) return 'N/A';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
}

async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Request failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}


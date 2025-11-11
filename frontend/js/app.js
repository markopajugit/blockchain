// Main application logic
// Get API base URL from meta tag, environment variable, or default to '/api'
const getApiBase = () => {
    // Check for meta tag (can be set in HTML)
    const metaTag = document.querySelector('meta[name="api-base"]');
    if (metaTag && metaTag.content) {
        return metaTag.content;
    }
    // Check for window.API_BASE (can be set via script tag before this file loads)
    if (typeof window !== 'undefined' && window.API_BASE) {
        return window.API_BASE;
    }
    // Default to relative path (works in most deployments)
    return '/api';
};

const API_BASE = getApiBase();

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


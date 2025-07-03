// config.js - Dynamic configuration for the application

// Determine the base API URL based on the current environment
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // If we're on localhost, use the local development API
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:10000/api';
  }
  
  // For production on Render
  if (hostname.includes('orderx-byvs.onrender.com')) {
    return 'https://orderx-byvs.onrender.com/api';
  }
  
  // Default case - use relative URL which will connect to the same server
  return '/api';
};

// Export the API base URL
const API_BASE_URL = getApiBaseUrl();

// Export any other configuration variables here

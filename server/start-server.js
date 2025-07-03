/**
 * Pharmacy System Server Startup Script
 * This script initializes and starts the server
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

// Initialize database
console.log('Initializing database...');
const db = require('./db/init');

// Start server
console.log('Starting server...');
require('./server');

console.log(`Server should be available at http://localhost:${process.env.PORT || 3000}`);
console.log('Default admin credentials: username=admin, password=change_me_immediately');
console.log('IMPORTANT: Change the default admin password as soon as possible!');

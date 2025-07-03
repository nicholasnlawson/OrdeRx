/**
 * Start server with the production database path
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Define the database path based on the environment
const isProduction = process.env.NODE_ENV === 'production';
const renderDiskPath = process.env.RENDER_DISK_PATH;

let dbDirectory;

if (isProduction && renderDiskPath) {
  // On Render, use the persistent disk path for the database
  dbDirectory = path.join(renderDiskPath, 'data');
  console.log(`Production environment detected. Using Render persistent disk for database at ${dbDirectory}`);
} else {
  // For local development, use the existing path
  dbDirectory = path.join(__dirname, 'server', 'db', 'sqlite');
  console.log(`Local development environment detected. Using local path for database at ${dbDirectory}`);
}

// Ensure the database directory exists
if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
  console.log(`Created database directory: ${dbDirectory}`);
}

const dbPath = path.join(dbDirectory, 'pharmacy_system.db');

console.log(`Starting server with database path: ${dbPath}`);

// Set environment variables
const env = {
  ...process.env,
  DATABASE_PATH: dbPath
};

// Start the server process
const serverProcess = spawn('node', ['server/start-server.js'], {
  env,
  stdio: 'inherit'
});

// Handle server process events
serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
});

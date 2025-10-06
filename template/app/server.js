#!/usr/bin/env node

/**
 * Custom server entry point for Fly.io deployment
 * This ensures the server binds to 0.0.0.0:8080
 */

const { spawn } = require('child_process');
const path = require('path');

// Set environment variables for proper binding
process.env.SERVER_HOST = '0.0.0.0';
process.env.PORT = process.env.PORT || '8080';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

console.log(`ðŸš€ Starting server on ${process.env.SERVER_HOST}:${process.env.PORT}`);

// Start the Wasp server
const serverProcess = spawn('node', ['.wasp/build/server/src/server.js'], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit'
});

// Handle process events
serverProcess.on('error', (error) => {
  console.error('âŒ Failed to start server:', error);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`ðŸ›‘ Server process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('ðŸ›‘ Received SIGTERM, shutting down gracefully...');
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('ðŸ›‘ Received SIGINT, shutting down gracefully...');
  serverProcess.kill('SIGINT');
});

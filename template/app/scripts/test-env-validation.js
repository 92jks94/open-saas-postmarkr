#!/usr/bin/env node

/**
 * Test script for environment variable validation
 * Run with: node scripts/test-env-validation.js
 */

const path = require('path');

// Add the src directory to the module path
process.env.NODE_PATH = path.join(__dirname, '..', 'src');
require('module')._initPaths();

try {
  console.log('🧪 Testing environment variable validation...\n');
  
  // Test with minimal development environment
  process.env.NODE_ENV = 'development';
  process.env.DATABASE_URL = 'postgresql://user:pass@host:port/db';
  process.env.JWT_SECRET = 'your-super-secret-jwt-key-here-32-chars';
  process.env.WASP_WEB_CLIENT_URL = 'http://localhost:3000';
  process.env.WASP_SERVER_URL = 'http://localhost:3001';
  
  const { validateEnvironmentVariablesFor } = require('../src/server/envValidation');
  
  console.log('✅ Testing development environment validation...');
  validateEnvironmentVariablesFor('development');
  console.log('✅ Development validation passed\n');
  
  // Test with production environment (should fail with missing vars)
  console.log('❌ Testing production environment validation (should fail)...');
  try {
    validateEnvironmentVariablesFor('production');
    console.log('❌ Production validation should have failed but didn\'t');
  } catch (error) {
    console.log('✅ Production validation correctly failed as expected');
    console.log('   Error:', error.message.split('\n')[0]);
  }
  
  console.log('\n🎉 Environment variable validation test completed successfully!');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}

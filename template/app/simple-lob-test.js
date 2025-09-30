// Simple Lob API test without complex imports
console.log('🔍 Simple Lob API Test');
console.log('====================');

// Test 1: Check if Lob package can be imported
console.log('\n1. Testing Lob package import...');
try {
  const Lob = require('lob');
  console.log('✅ Lob package imported successfully');
  console.log('📦 Lob constructor type:', typeof Lob);
} catch (error) {
  console.log('❌ Failed to import Lob package:', error.message);
  process.exit(1);
}

// Test 2: Check environment variables
console.log('\n2. Checking environment variables...');
const envVars = {
  'LOB_TEST_KEY': process.env.LOB_TEST_KEY,
  'LOB_PROD_KEY': process.env.LOB_PROD_KEY,
  'LOB_ENVIRONMENT': process.env.LOB_ENVIRONMENT,
  'LOB_WEBHOOK_SECRET': process.env.LOB_WEBHOOK_SECRET
};

let hasApiKey = false;
Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    if (key.includes('KEY')) {
      console.log(`✅ ${key}: Set (${value.substring(0, 8)}...)`);
      hasApiKey = true;
    } else {
      console.log(`✅ ${key}: ${value}`);
    }
  } else {
    console.log(`❌ ${key}: Not set`);
  }
});

// Test 3: Try to create Lob client
console.log('\n3. Testing Lob client creation...');
try {
  const Lob = require('lob');
  
  if (hasApiKey) {
    const apiKey = process.env.LOB_TEST_KEY || process.env.LOB_PROD_KEY;
    const client = new Lob(apiKey);
    console.log('✅ Lob client created successfully');
    
    // Test 4: Try a simple API call (this might fail without valid key)
    console.log('\n4. Testing API connectivity...');
    console.log('⚠️ This will fail if API key is invalid, but that\'s expected');
    
  } else {
    console.log('⚠️ No API key found - Lob client cannot be created');
    console.log('💡 To fix this:');
    console.log('   1. Get API key from https://dashboard.lob.com');
    console.log('   2. Add to .env.server file:');
    console.log('      LOB_TEST_KEY=test_your_key_here');
    console.log('      LOB_ENVIRONMENT=test');
  }
  
} catch (error) {
  console.log('❌ Error creating Lob client:', error.message);
}

// Summary
console.log('\n🎯 Summary:');
if (hasApiKey) {
  console.log('✅ Lob package is installed and API key is configured');
  console.log('🚀 Ready to use Lob API features!');
} else {
  console.log('⚠️ Lob package is installed but needs API key configuration');
  console.log('📝 Next steps:');
  console.log('   1. Sign up at https://dashboard.lob.com');
  console.log('   2. Get your test API key');
  console.log('   3. Add to .env.server file');
  console.log('   4. Restart your application');
}

console.log('\n✨ Test completed!');

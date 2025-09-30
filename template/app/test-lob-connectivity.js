// Test script to verify Lob API connectivity
console.log('🔍 Testing Lob API connectivity...');

// Import the test function
const { testLobConnectivity } = require('./src/server/apiConnectivityTests');

async function runTest() {
  try {
    console.log('📡 Running Lob connectivity test...');
    const result = await testLobConnectivity();
    
    console.log('\n📊 Test Results:');
    console.log('Service:', result.service);
    console.log('Status:', result.status);
    
    if (result.status === 'healthy') {
      console.log('✅ Lob API is working correctly!');
      console.log('Response Time:', result.responseTime + 'ms');
      if (result.details) {
        console.log('Key Prefix:', result.details.keyPrefix);
        console.log('Environment:', result.details.environment);
      }
    } else {
      console.log('❌ Lob API test failed');
      console.log('Error:', result.error);
      console.log('Response Time:', result.responseTime + 'ms');
    }
    
    console.log('\n🎯 Summary:');
    if (result.status === 'healthy') {
      console.log('✅ Lob API integration is working properly!');
    } else {
      console.log('⚠️ Lob API needs configuration:');
      console.log('1. Set LOB_TEST_KEY or LOB_PROD_KEY in environment');
      console.log('2. Ensure API key is valid');
      console.log('3. Check network connectivity');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure you have a .env.server file with Lob API keys');
    console.log('2. Check that the Lob package is installed: npm list lob');
    console.log('3. Verify your API key is correct in Lob dashboard');
  }
}

// Run the test
runTest();

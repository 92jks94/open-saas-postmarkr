// Quick verification of Lob configuration
console.log('🔍 Verifying Lob API Configuration');
console.log('===================================');

// Check environment variables
const config = {
  LOB_TEST_KEY: process.env.LOB_TEST_KEY,
  LOB_PROD_KEY: process.env.LOB_PROD_KEY,
  LOB_ENVIRONMENT: process.env.LOB_ENVIRONMENT,
  LOB_WEBHOOK_SECRET: process.env.LOB_WEBHOOK_SECRET
};

console.log('\n📋 Your Configuration:');
Object.entries(config).forEach(([key, value]) => {
  if (value) {
    if (key.includes('KEY') || key.includes('SECRET')) {
      console.log(`✅ ${key}: ${value.substring(0, 8)}...`);
    } else {
      console.log(`✅ ${key}: ${value}`);
    }
  } else {
    console.log(`❌ ${key}: Not set`);
  }
});

// Validate configuration
console.log('\n🔍 Validation:');

// Check API key format
if (config.LOB_TEST_KEY) {
  if (config.LOB_TEST_KEY.startsWith('test_')) {
    console.log('✅ LOB_TEST_KEY format is correct');
  } else {
    console.log('⚠️ LOB_TEST_KEY should start with "test_"');
  }
}

if (config.LOB_PROD_KEY) {
  if (config.LOB_PROD_KEY.startsWith('live_')) {
    console.log('✅ LOB_PROD_KEY format is correct');
  } else {
    console.log('⚠️ LOB_PROD_KEY should start with "live_"');
  }
}

// Check environment
if (config.LOB_ENVIRONMENT) {
  if (['test', 'live', 'prod'].includes(config.LOB_ENVIRONMENT)) {
    console.log('✅ LOB_ENVIRONMENT is valid');
  } else {
    console.log('⚠️ LOB_ENVIRONMENT should be "test", "live", or "prod"');
  }
}

// Check webhook secret
if (config.LOB_WEBHOOK_SECRET) {
  console.log('✅ LOB_WEBHOOK_SECRET is set');
} else {
  console.log('❌ LOB_WEBHOOK_SECRET is missing');
}

// Test Lob package
console.log('\n🧪 Testing Lob Package:');
try {
  const Lob = require('lob');
  console.log('✅ Lob package imported successfully');
  
  // Try to create client with test key
  if (config.LOB_TEST_KEY) {
    try {
      const client = new Lob(config.LOB_TEST_KEY);
      console.log('✅ Lob client created successfully');
    } catch (error) {
      console.log('⚠️ Lob client creation failed:', error.message);
    }
  }
} catch (error) {
  console.log('❌ Failed to import Lob package:', error.message);
}

// Summary
console.log('\n🎯 Summary:');
const hasTestKey = !!config.LOB_TEST_KEY;
const hasProdKey = !!config.LOB_PROD_KEY;
const hasEnv = !!config.LOB_ENVIRONMENT;
const hasWebhookSecret = !!config.LOB_WEBHOOK_SECRET;

if (hasTestKey && hasEnv && hasWebhookSecret) {
  console.log('🎉 Your Lob configuration looks correct!');
  console.log('🚀 Lob API should be working in your application');
  console.log('\n📝 Next steps:');
  console.log('1. Start your Wasp application: wasp start');
  console.log('2. Test address validation endpoint');
  console.log('3. Create a test mail piece');
  console.log('4. Verify webhook functionality');
} else {
  console.log('⚠️ Some configuration is missing:');
  if (!hasTestKey) console.log('  - LOB_TEST_KEY');
  if (!hasEnv) console.log('  - LOB_ENVIRONMENT');
  if (!hasWebhookSecret) console.log('  - LOB_WEBHOOK_SECRET');
}

console.log('\n✨ Verification complete!');

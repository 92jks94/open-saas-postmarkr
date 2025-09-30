// Simple environment check
console.log('🔍 Environment Check');
console.log('===================');

// Check if .env.server file exists
const fs = require('fs');
const path = require('path');

console.log('\n1. Checking for .env.server file...');
const envFile = path.join(__dirname, '.env.server');
if (fs.existsSync(envFile)) {
  console.log('✅ .env.server file exists');
  
  // Read and check contents
  const envContent = fs.readFileSync(envFile, 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim());
  
  console.log(`📄 Found ${lines.length} environment variables:`);
  lines.forEach(line => {
    if (line.includes('LOB')) {
      const [key, value] = line.split('=');
      if (value) {
        const maskedValue = key.includes('KEY') || key.includes('SECRET') 
          ? value.substring(0, 8) + '...' 
          : value;
        console.log(`  ✅ ${key}: ${maskedValue}`);
      }
    }
  });
} else {
  console.log('❌ .env.server file not found');
  console.log('💡 Create .env.server file with:');
  console.log('   LOB_TEST_KEY=test_your_key_here');
  console.log('   LOB_ENVIRONMENT=test');
  console.log('   LOB_WEBHOOK_SECRET=your_secret_here');
}

// Check current environment
console.log('\n2. Current environment variables:');
const lobVars = ['LOB_TEST_KEY', 'LOB_PROD_KEY', 'LOB_ENVIRONMENT', 'LOB_WEBHOOK_SECRET'];
lobVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const maskedValue = varName.includes('KEY') || varName.includes('SECRET')
      ? value.substring(0, 8) + '...'
      : value;
    console.log(`  ✅ ${varName}: ${maskedValue}`);
  } else {
    console.log(`  ❌ ${varName}: Not set`);
  }
});

console.log('\n🎯 Status:');
const hasTestKey = !!process.env.LOB_TEST_KEY;
const hasProdKey = !!process.env.LOB_PROD_KEY;
const hasEnv = !!process.env.LOB_ENVIRONMENT;

if (hasTestKey || hasProdKey) {
  console.log('✅ Lob API keys are configured');
  if (hasEnv) {
    console.log('✅ Lob environment is set');
    console.log('🚀 Lob API should be working!');
  } else {
    console.log('⚠️ Lob environment not set (defaults to test)');
  }
} else {
  console.log('❌ No Lob API keys found');
  console.log('📝 To fix:');
  console.log('   1. Get API key from https://dashboard.lob.com');
  console.log('   2. Add to .env.server file');
  console.log('   3. Restart your application');
}

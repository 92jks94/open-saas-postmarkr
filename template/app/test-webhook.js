#!/usr/bin/env node

import crypto from 'crypto';

// Test webhook signature generation (simulating Lob's behavior)
function generateLobSignature(payload, secret, timestamp) {
  return crypto
    .createHmac('sha256', secret)
    .update(timestamp + '.' + payload)
    .digest('hex');
}

// Test webhook payload
const testPayload = {
  id: 'lob_test_123',
  object: 'postcard',
  status: 'delivered',
  tracking_number: 'TRK123456789',
  created_at: new Date().toISOString(),
  metadata: {
    test: true
  }
};

const payloadString = JSON.stringify(testPayload);
const timestamp = Math.floor(Date.now() / 1000).toString();
const secret = 'test_secret';
const signature = generateLobSignature(payloadString, secret, timestamp);

console.log('🧪 Lob Webhook Test Data:');
console.log('========================');
console.log('Payload:', payloadString);
console.log('Timestamp:', timestamp);
console.log('Secret:', secret);
console.log('Signature:', signature);
console.log('');
console.log('Test Command:');
console.log(`curl -X POST http://localhost:3001/webhooks/lob \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "Lob-Signature: ${signature}" \\`);
console.log(`  -H "Lob-Signature-Timestamp: ${timestamp}" \\`);
console.log(`  -d '${payloadString}'`);
console.log('');
console.log('Health Check:');
console.log('curl http://localhost:3001/api/webhooks/health');
console.log('');
console.log('Metrics:');
console.log('curl http://localhost:3001/api/webhooks/metrics');

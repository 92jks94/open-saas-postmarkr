# Lob Webhook Testing Plan

## 🧪 **Test Commands**

Once your Wasp server is running (usually on port 3001), you can test the webhook implementation with these commands:

### **1. Health Check Test**
```bash
curl -v http://localhost:3001/api/webhooks/health
```
**Expected Response:**
```json
{
  "status": "degraded",
  "message": "Webhook system is operational but no events processed",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "metrics": {
    "totalEvents": 0,
    "successfulEvents": 0,
    "failedEvents": 0,
    "errorRate": 0,
    "averageProcessingTime": 0,
    "eventsByType": {},
    "lastProcessedAt": null
  }
}
```

### **2. Metrics Test**
```bash
curl -v http://localhost:3001/api/webhooks/metrics
```

### **3. Webhook Endpoint Test**
```bash
# Generate test data
node test-webhook.js

# Use the generated curl command to test the webhook
curl -X POST http://localhost:3001/webhooks/lob \
  -H "Content-Type: application/json" \
  -H "Lob-Signature: [GENERATED_SIGNATURE]" \
  -H "Lob-Signature-Timestamp: [GENERATED_TIMESTAMP]" \
  -d '[GENERATED_PAYLOAD]'
```

**Expected Response:**
```json
{
  "received": true,
  "webhookId": "webhook_1234567890_abc123",
  "lobId": "lob_test_123",
  "eventType": "postcard.delivered",
  "processingTimeMs": 150,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### **4. Security Tests**

#### **Test Invalid Signature**
```bash
curl -X POST http://localhost:3001/webhooks/lob \
  -H "Content-Type: application/json" \
  -H "Lob-Signature: invalid_signature" \
  -H "Lob-Signature-Timestamp: 1758830807" \
  -d '{"id":"test","status":"delivered"}'
```
**Expected Response:** `401 Unauthorized`

#### **Test Missing Headers**
```bash
curl -X POST http://localhost:3001/webhooks/lob \
  -H "Content-Type: application/json" \
  -d '{"id":"test","status":"delivered"}'
```
**Expected Response:** `400 Bad Request`

#### **Test Old Timestamp**
```bash
curl -X POST http://localhost:3001/webhooks/lob \
  -H "Content-Type: application/json" \
  -H "Lob-Signature: [VALID_SIGNATURE]" \
  -H "Lob-Signature-Timestamp: 1000000000" \
  -d '{"id":"test","status":"delivered"}'
```
**Expected Response:** `401 Unauthorized`

### **5. Events Endpoint Test**
```bash
curl "http://localhost:3001/api/webhooks/events?limit=10"
```

## 🔍 **What to Look For**

### **✅ Success Indicators**
- Health check returns `200 OK` with metrics
- Valid webhook requests return `200 OK` with webhook ID
- Invalid requests return appropriate error codes (400, 401, 500)
- Metrics show processing statistics
- Events endpoint returns webhook history

### **❌ Error Indicators**
- Connection refused (server not running)
- 500 errors (server-side issues)
- Missing webhook ID in responses
- Incorrect error codes for invalid requests

## 🚀 **Production Readiness Checklist**

- [ ] Server starts without errors
- [ ] Health check endpoint responds
- [ ] Webhook endpoint accepts valid requests
- [ ] Security validation works (invalid signature rejected)
- [ ] Timestamp validation works (old timestamps rejected)
- [ ] Metrics tracking works
- [ ] Events endpoint returns data
- [ ] Error handling works properly

## 📝 **Next Steps for Production**

1. **Set Environment Variable:**
   ```bash
   export LOB_WEBHOOK_SECRET="your_production_webhook_secret"
   ```

2. **Configure Lob Dashboard:**
   - URL: `https://your-domain.com/webhooks/lob`
   - Events: Select all relevant events
   - Copy the webhook secret to your environment

3. **Monitor in Production:**
   - Check `/api/webhooks/health` regularly
   - Monitor `/api/webhooks/metrics` for performance
   - Use `/api/webhooks/events` for debugging

## 🐛 **Troubleshooting**

If tests fail:
1. Check server logs for errors
2. Verify all environment variables are set
3. Ensure database is accessible
4. Check that all API endpoints are properly configured in `main.wasp`

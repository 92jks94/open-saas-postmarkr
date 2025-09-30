# 🚀 Lob API Setup Guide

## ✅ Current Status
- **Lob Package**: ✅ Installed (`lob@^6.6.3`)
- **TypeScript Declarations**: ✅ Updated for current API
- **Client Initialization**: ✅ Improved with better error handling
- **Service Layer**: ✅ Complete implementation
- **Webhook System**: ✅ Secure implementation with HMAC verification
- **Address Validation**: ✅ Comprehensive mapping and validation

## 🔧 What You Need to Do

### 1. Get Lob API Keys
1. **Sign up**: https://dashboard.lob.com/signup
2. **Get Test Key**: Available immediately in dashboard
3. **Get Production Key**: Requires account verification
4. **Set Webhook URL**: Configure in Lob dashboard

### 2. Set Environment Variables
Create/update `.env.server` file:
```bash
# Lob API Configuration
LOB_TEST_KEY=test_your_test_key_here
LOB_PROD_KEY=live_your_prod_key_here
LOB_ENVIRONMENT=test
LOB_WEBHOOK_SECRET=your_webhook_secret_here
```

### 3. Test the Integration
Run the test scripts:
```bash
node test-lob.js
node check-env.js
```

### 4. Configure Webhook
In Lob dashboard, set webhook URL to:
```
https://yourdomain.com/webhooks/lob
```

## 🎯 Available Features

### ✅ Ready to Use
- **Address Validation**: `/api/validate-address`
- **Mail Creation**: Complete flow from creation to submission
- **Webhook Processing**: Real-time status updates
- **Pricing Calculation**: With Lob API integration and fallbacks
- **Status Tracking**: Comprehensive mail piece lifecycle

### 🔍 API Endpoints
- `POST /webhooks/lob` - Webhook receiver
- `POST /api/validate-address` - Address validation
- `GET /api/webhooks/health` - Health monitoring
- `GET /api/webhooks/metrics` - Performance metrics
- `GET /api/webhooks/events` - Event debugging

## 🛡️ Security Features
- HMAC-SHA256 signature verification
- Timestamp validation (5-minute tolerance)
- Idempotency handling
- Rate limiting protection
- Comprehensive error handling

## 🚨 Troubleshooting

### If Lob API is not working:
1. **Check API Keys**: Ensure they're properly set in environment
2. **Verify Environment**: Make sure `LOB_ENVIRONMENT` is set correctly
3. **Test Connectivity**: Use the built-in connectivity test
4. **Check Webhook**: Verify webhook URL is accessible

### Development Mode:
- System works in simulation mode without API keys
- Uses mock pricing when Lob API is unavailable
- Comprehensive logging for debugging

## 📊 Monitoring
- Health check endpoint: `/api/webhooks/health`
- Metrics endpoint: `/api/webhooks/metrics`
- Event debugging: `/api/webhooks/events`

## 🎉 Next Steps
1. Set up Lob account and get API keys
2. Configure environment variables
3. Test address validation
4. Create a test mail piece
5. Verify webhook functionality

The Lob API integration is **production-ready** and just needs proper API keys to work fully!

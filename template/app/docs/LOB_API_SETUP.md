# Lob API Setup Guide

## 🔑 **Required Environment Variables**

### Primary Lob Configuration
```bash
# Your Lob API key (required)
LOB_API_KEY="test_your_lob_api_key_here"

# Environment setting (test or live)
LOB_ENVIRONMENT="test"
```

## 📋 **How to Get Your Lob API Key**

### Step 1: Create Lob Account
1. Go to [https://lob.com](https://lob.com)
2. Sign up for a free account
3. Verify your email address

### Step 2: Get API Key
1. Log into your Lob dashboard: [https://dashboard.lob.com](https://dashboard.lob.com)
2. Go to **Settings** → **API Keys**
3. Copy your **Test API Key** (starts with `test_`)
4. For production, you'll need a **Live API Key** (starts with `live_`)

### Step 3: Add to Environment
Add the API key to your `.env.server` file:
```bash
LOB_API_KEY="test_1234567890abcdef..."
LOB_ENVIRONMENT="test"
```

## 🧪 **Lob API Test vs Live Environment**

### Test Environment (Development)
- **API Key**: Starts with `test_`
- **Purpose**: Development and testing
- **Cost**: Free
- **Limitations**: 
  - No actual mail sent
  - Limited to 10 API calls per minute
  - Test addresses only

### Live Environment (Production)
- **API Key**: Starts with `live_`
- **Purpose**: Production mail sending
- **Cost**: Pay per mail piece sent
- **Limitations**: 
  - Real mail sent
  - Higher rate limits
  - Real addresses required

## 📊 **Lob API Endpoints We Use**

### 1. Address Verification
```javascript
// Validates US addresses
POST https://api.lob.com/v1/us_verifications
```

### 2. Cost Calculation
```javascript
// Calculate mail piece costs
POST https://api.lob.com/v1/postcards
// or
POST https://api.lob.com/v1/letters
```

### 3. Mail Creation
```javascript
// Create and send mail pieces
POST https://api.lob.com/v1/postcards
POST https://api.lob.com/v1/letters
```

### 4. Status Tracking
```javascript
// Get mail piece status
GET https://api.lob.com/v1/postcards/{id}
GET https://api.lob.com/v1/letters/{id}
```

## 🔧 **Lob API Rate Limits**

### Test Environment
- **10 requests per minute**
- **100 requests per hour**
- **1,000 requests per day**

### Live Environment
- **100 requests per minute**
- **1,000 requests per hour**
- **10,000 requests per day**

## 💰 **Lob Pricing (Live Environment)**

### Postcards
- **Standard**: $0.50 - $0.60 per piece
- **Express**: $1.00 - $1.20 per piece

### Letters
- **Standard**: $0.60 - $0.80 per piece
- **Express**: $1.20 - $1.60 per piece

### Additional Costs
- **Address Verification**: $0.05 per verification
- **Return Address Verification**: $0.05 per verification

## 🚨 **Important Notes**

### Security
- **Never commit API keys to version control**
- **Use environment variables only**
- **Rotate keys regularly**

### Testing
- **Always test with test environment first**
- **Use test addresses for development**
- **Verify webhook endpoints work**

### Production
- **Switch to live environment only when ready**
- **Monitor API usage and costs**
- **Set up proper error handling**

## 🧪 **Test Addresses (Lob Test Environment)**

### Valid Test Addresses
```javascript
// Sender (your address)
{
  "name": "Test Sender",
  "address_line1": "123 Test St",
  "city": "San Francisco",
  "state": "CA",
  "zip_code": "94107",
  "country": "US"
}

// Recipient (valid test address)
{
  "name": "Test Recipient", 
  "address_line1": "456 Test Ave",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "country": "US"
}
```

## 🔍 **Testing Your Setup**

### 1. Test API Key
```bash
curl -X GET "https://api.lob.com/v1/addresses" \
  -H "Authorization: Bearer test_your_api_key_here"
```

### 2. Test Address Verification
```bash
curl -X POST "https://api.lob.com/v1/us_verifications" \
  -H "Authorization: Bearer test_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "address_line1": "123 Test St",
    "city": "San Francisco", 
    "state": "CA",
    "zip_code": "94107"
  }'
```

### 3. Test Mail Creation
```bash
curl -X POST "https://api.lob.com/v1/postcards" \
  -H "Authorization: Bearer test_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "to": {
      "name": "Test Recipient",
      "address_line1": "456 Test Ave",
      "city": "New York",
      "state": "NY", 
      "zip_code": "10001",
      "country": "US"
    },
    "from": {
      "name": "Test Sender",
      "address_line1": "123 Test St",
      "city": "San Francisco",
      "state": "CA",
      "zip_code": "94107", 
      "country": "US"
    },
    "front": "https://s3.amazonaws.com/your-bucket/front.pdf",
    "back": "https://s3.amazonaws.com/your-bucket/back.pdf"
  }'
```

## 📞 **Support**

- **Lob Documentation**: [https://docs.lob.com](https://docs.lob.com)
- **Lob Support**: [https://support.lob.com](https://support.lob.com)
- **Lob Status**: [https://status.lob.com](https://status.lob.com)

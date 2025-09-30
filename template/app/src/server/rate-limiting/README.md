# Rate Limiting - MVP Implementation

## Overview

This MVP implementation provides basic protection against abuse and cost overruns using **operation-level rate limiting**. It's simple, works natively with Wasp's architecture, and requires no Express middleware configuration.

## What's Protected

### 📬 Mail Creation (10 requests / hour)
- `createMailPiece`
- `submitMailPieceToLob`

Prevents abuse of Lob API calls and excessive costs.

### 📁 File Uploads (10 requests / hour)
- `createFile`
- `deleteFile`
- `triggerPDFProcessing`

Prevents storage abuse and excessive S3 costs.

### 💳 Payment Operations (5 requests / minute)
- `createMailPaymentIntent`

Protects against payment processing abuse.

## How It Works

Rate limiting is implemented **directly inside operations** using the `checkOperationRateLimit()` function:

```typescript
import { checkOperationRateLimit } from '../server/rate-limiting/operationRateLimiter';

export const createMailPiece = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }
  
  // Rate limiting check - throws HttpError 429 if exceeded
  checkOperationRateLimit('createMailPiece', 'mail', context.user.id);
  
  // ... rest of operation
};
```

### User-Based Limiting
- For **authenticated requests**: Rate limit is per user ID
- For **anonymous requests**: Rate limit is per IP address (fallback)

This ensures:
- Logged-in users can't abuse the system
- One user can't affect another user's limits
- Anonymous users are limited by IP

### Error Response

When rate limit is exceeded, the API returns:

```json
{
  "message": "Mail creation limit exceeded. Please try again later."
}
```

**Status Code**: 429 Too Many Requests

## Configuration

### Adjusting Limits

Edit `src/server/rate-limiting/config.ts`:

```typescript
export const RATE_LIMITS = {
  mail: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Change this number
    message: 'Mail creation limit exceeded. Please try again later.',
  },
};
```

### Adding Rate Limiting to New Operations

1. Import the function:
```typescript
import { checkOperationRateLimit } from '../server/rate-limiting/operationRateLimiter';
```

2. Add the check after authentication:
```typescript
export const myNewOperation = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  
  checkOperationRateLimit('myNewOperation', 'mail', context.user.id);
  
  // ... operation logic
};
```

3. Choose the appropriate limit type:
   - `'mail'` - 10 requests/hour
   - `'fileUpload'` - 10 requests/hour
   - `'payment'` - 5 requests/minute

## Monitoring

Rate limit violations are logged to console:

```
[RATE_LIMIT] Rate limit exceeded {
  key: 'user:123',
  operation: 'createMailPiece',
  limitType: 'mail',
  timestamp: '2024-01-01T12:00:00.000Z'
}
```

Monitor these logs to identify:
- Potential abuse patterns
- Need to adjust limits
- False positives affecting legitimate users

## Testing

### Manual Test

```bash
# Create a test script that calls an operation 11 times
# The 11th should fail with 429 error

for i in {1..11}; do
  echo "Request $i"
  # Make your API call here
done
```

### Expected Behavior
- Requests 1-10: Should succeed (200 OK)
- Request 11: Should fail with 429 Too Many Requests

## Architecture

```
Operation Called
    ↓
Authentication Check
    ↓
Rate Limit Check (checkOperationRateLimit)
    ↓
[If limit exceeded] → Throw HttpError(429)
    ↓
[If within limit] → Continue to operation logic
```

### Storage
- **In-memory storage** (Map-based)
- Automatically cleans up expired entries every 5 minutes
- Simple, fast, no external dependencies

## Limitations (MVP)

This MVP implementation has intentional limitations:

❌ **Not suitable for multiple servers** - Uses in-memory storage
❌ **No admin override** - Admins have same limits
❌ **No dynamic configuration** - Requires code deploy to change limits
❌ **No advanced monitoring** - Console logs only

### When to Upgrade

Consider upgrading when:
- Scaling to multiple servers (need Redis for distributed storage)
- Need different limits for different user tiers
- Need to adjust limits without redeployment
- Under active attack requiring advanced monitoring

## Files

- `config.ts` - Rate limit configurations and messages
- `operationRateLimiter.ts` - Rate limiting implementation
- `README.md` - This file

## Troubleshooting

### Rate limiting not working
- Verify the `checkOperationRateLimit()` call is added to the operation
- Check server logs for rate limit messages
- Ensure the operation name matches in the log

### False positives (legitimate users blocked)
- Review logs to identify the user ID
- Consider increasing the limit for that category
- Check if the user is actually making too many requests

### Need to clear limits for testing
```typescript
import { clearAllRateLimits } from '../server/rate-limiting/operationRateLimiter';

// In your test setup
clearAllRateLimits();
```

## Summary

✅ **What This Provides:**
- Protection against mail/file/payment operation abuse
- Per-user rate limiting (with IP fallback)
- Simple, Wasp-native implementation
- No middleware complexity
- Production-ready for single-server MVP

✅ **What This Doesn't Do:**
- Doesn't rate limit webhooks (they have HMAC security)
- Doesn't rate limit admin users differently
- Doesn't work across multiple servers
- Doesn't provide real-time monitoring dashboard

**For MVP purposes, this is sufficient!** Add more sophisticated rate limiting post-MVP when you have real usage data and understand actual abuse patterns.

# Lob API Pricing Integration

## Overview

The cost calculation system has been updated to use actual Lob API pricing instead of mock data. This ensures accurate, real-time pricing for mail pieces.

## Implementation Details

### How It Works

1. **Primary Method**: The system attempts to get actual pricing from the Lob API by creating a temporary mailpiece
2. **Fallback Method**: If the Lob API is unavailable or fails, the system falls back to mock pricing data
3. **Error Handling**: Comprehensive error handling ensures the system remains functional even when the Lob API is down

### Key Features

- **Real-time Pricing**: Uses actual Lob API pricing when available
- **Graceful Degradation**: Falls back to mock pricing when Lob API is unavailable
- **Test Environment Support**: Works with both test and production Lob API keys
- **Multiple Mail Types**: Supports postcards, letters, and other mail types
- **Comprehensive Logging**: Logs all pricing requests and fallbacks for debugging

## API Integration

### Pricing Calculation Flow

```typescript
// 1. Check if Lob API key is configured
const lobApiKey = process.env.LOB_TEST_KEY || process.env.LOB_PROD_KEY;

// 2. If available, try to get real pricing from Lob API
if (lobApiKey && lob) {
  try {
    const pricingData = await getLobPricing(mailSpecs);
    return pricingData;
  } catch (lobError) {
    // Fall back to mock pricing if Lob API fails
    return getFallbackPricing(mailSpecs);
  }
} else {
  // Use fallback pricing if no API key
  return getFallbackPricing(mailSpecs);
}
```

### Supported Mail Types

- **Postcards**: Uses Lob's postcard creation endpoint
- **Letters**: Uses Lob's letter creation endpoint  
- **Other Types**: Falls back to letter pricing for unsupported types

### Response Format

```typescript
{
  cost: number,        // Cost in cents
  currency: 'USD',
  breakdown: {
    baseCost: number,           // Base cost in dollars
    multiplier: number,         // Class multiplier
    mailType: string,           // Type of mail
    mailClass: string,          // Mail class
    mailSize: string,           // Mail size
    lobId?: string,            // Lob ID (if from API)
    lobPrice?: string,          // Original Lob price (if from API)
    fallback?: boolean          // True if using fallback pricing
  }
}
```

## Environment Configuration

### Required Environment Variables

```bash
# Test environment (development)
LOB_TEST_KEY="test_your_lob_test_api_key_here"
LOB_ENVIRONMENT="test"

# Production environment
LOB_PROD_KEY="live_your_lob_production_api_key_here"
LOB_ENVIRONMENT="live"
```

### Environment Selection

The system automatically selects the appropriate API key based on the `LOB_ENVIRONMENT` variable:
- `test` or `development`: Uses `LOB_TEST_KEY`
- `live` or `prod`: Uses `LOB_PROD_KEY`

## Testing

### Test Script

A test script is available at `src/server/lob/test-pricing.ts` to verify the pricing integration:

```bash
# Run the test script
node src/server/lob/test-pricing.ts
```

### Test Scenarios

1. **With Lob API Key**: Should return actual Lob pricing
2. **Without Lob API Key**: Should return fallback pricing
3. **API Failure**: Should gracefully fall back to mock pricing
4. **Different Mail Types**: Should handle postcards, letters, etc.

## Error Handling

### Lob API Errors

- **Network Issues**: Falls back to mock pricing
- **Invalid API Key**: Falls back to mock pricing
- **Rate Limiting**: Falls back to mock pricing
- **Service Unavailable**: Falls back to mock pricing

### Logging

All pricing requests and fallbacks are logged:
- `console.warn()`: For fallback scenarios
- `console.error()`: For actual errors
- `console.log()`: For successful API calls (in debug mode)

## Performance Considerations

### Caching

Currently, pricing is calculated on-demand for each request. Consider implementing caching for:
- Frequently requested mail types
- Common address combinations
- Recent pricing data

### Rate Limiting

Lob API has rate limits:
- **Test Environment**: 10 requests/minute
- **Live Environment**: 100 requests/minute

The system handles rate limiting by falling back to mock pricing.

## Migration from Mock Data

### Before (Mock Data)

```typescript
// Old implementation
const baseCosts = {
  'postcard': 0.50,
  'letter': 0.60,
  // ...
};
const cost = baseCost * multiplier;
```

### After (Lob API Integration)

```typescript
// New implementation
const pricingData = await getLobPricing(mailSpecs);
// Returns actual Lob pricing or fallback
```

## Troubleshooting

### Common Issues

1. **"Lob API key not configured"**
   - Check environment variables
   - Ensure `LOB_TEST_KEY` or `LOB_PROD_KEY` is set

2. **"Lob API pricing failed"**
   - Check API key validity
   - Verify network connectivity
   - Check Lob API status

3. **Always getting fallback pricing**
   - Verify API key is correct
   - Check `LOB_ENVIRONMENT` setting
   - Review server logs for errors

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG_LOB_PRICING=true
```

## Future Enhancements

1. **Pricing Cache**: Implement caching for frequently requested pricing
2. **Batch Pricing**: Support for calculating multiple mail piece costs at once
3. **Pricing History**: Track pricing changes over time
4. **Advanced Fallback**: More sophisticated fallback pricing based on historical data

## Support

- **Lob Documentation**: [https://docs.lob.com](https://docs.lob.com)
- **Lob Support**: [https://support.lob.com](https://support.lob.com)
- **Internal Documentation**: See `docs/LOB_API_SETUP.md`

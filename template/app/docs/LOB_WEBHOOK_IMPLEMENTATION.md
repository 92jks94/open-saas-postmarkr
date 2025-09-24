# Lob Webhooks Implementation

This document describes the comprehensive Lob webhook implementation for the Postmarkr mail service.

## Overview

The webhook system provides real-time status updates from Lob for mail pieces, including postcards, letters, checks, and return envelopes. It implements Lob's security requirements and retry policies.

## Features

### ✅ Security
- **HMAC-SHA256 signature verification** - Validates webhook authenticity
- **Timestamp validation** - Prevents replay attacks (5-minute tolerance)
- **Proper signature input format** - `timestamp + "." + raw_body` as per Lob spec
- **Environment-based security** - Production vs development modes

### ✅ Event Type Support
- **Postcard events**: `postcard.created`, `postcard.delivered`, `postcard.returned_to_sender`, etc.
- **Letter events**: `letter.created`, `letter.delivered`, `letter.returned_to_sender`, etc.
- **Check events**: `check.created`, `check.delivered`, `check.returned_to_sender`, etc.
- **Return envelope tracking**: `letter.return_envelope.*` events (Enterprise feature)

### ✅ Retry Policy Compliance
- **Immediate 2xx responses** - Complies with Lob's retry policy
- **Asynchronous processing** - Complex logic runs after response
- **Idempotency** - Prevents duplicate processing

### ✅ Monitoring & Logging
- **Structured logging** - JSON-formatted logs for all events
- **Performance metrics** - Processing time tracking
- **Error monitoring** - Automatic alerting on failures
- **Health checks** - Real-time system status

## API Endpoints

### Webhook Endpoint
```
POST /webhooks/lob
```
Receives webhook events from Lob.

**Headers:**
- `Lob-Signature`: HMAC-SHA256 signature
- `Lob-Signature-Timestamp`: Unix timestamp
- `Content-Type`: application/json

**Response:**
```json
{
  "received": true,
  "webhookId": "uuid",
  "lobId": "lob_mail_id",
  "eventType": "postcard.delivered",
  "processingTimeMs": 150,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Health Check
```
GET /api/webhooks/health
```
Returns webhook system health status.

**Response:**
```json
{
  "status": "healthy|degraded|unhealthy",
  "message": "Status description",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "metrics": {
    "totalEvents": 1000,
    "successfulEvents": 950,
    "failedEvents": 50,
    "averageProcessingTime": 120,
    "eventsByType": {
      "postcard.delivered": 500,
      "letter.delivered": 300
    }
  }
}
```

### Metrics Endpoint
```
GET /api/webhooks/metrics
```
Returns detailed webhook processing metrics.

### Events Endpoint
```
GET /api/webhooks/events?limit=50&lobId=xxx&eventType=postcard.delivered&success=true
```
Returns recent webhook events with optional filtering.

## Configuration

### Environment Variables

```bash
# Required for production
LOB_WEBHOOK_SECRET=your_webhook_secret_from_lob_dashboard

# Optional - defaults to 'secret' for Lob debugger
LOB_WEBHOOK_SECRET=secret
```

### Lob Dashboard Setup

1. **Log into Lob Dashboard**
2. **Navigate to Webhooks section**
3. **Create new webhook:**
   - **Description**: "Postmarkr Mail Status Updates"
   - **URL**: `https://yourdomain.com/webhooks/lob`
   - **Event Types**: Select all relevant events:
     - Postcards: `postcard.*`
     - Letters: `letter.*`
     - Checks: `check.*`
     - Return Envelopes: `letter.return_envelope.*` (Enterprise)
   - **Rate Limit**: Adjust as needed
4. **Copy the webhook secret** to your environment variables

## Testing

### Local Testing

Use the included test utilities:

```typescript
import { sendTestWebhook, testAllWebhookEvents, createLocalTestConfig } from './src/server/lob/webhookTestUtils';

// Test single event
const config = createLocalTestConfig();
const result = await sendTestWebhook('postcard.delivered', config);

// Test all event types
const results = await testAllWebhookEvents(config);
```

### Lob Debugger

Lob provides a webhook debugger for testing:
1. Use webhook secret: `secret`
2. Test events are sent with static signature
3. Perfect for development and debugging

### Manual Testing

```bash
# Test webhook health
curl http://localhost:3000/api/webhooks/health

# Test webhook metrics
curl http://localhost:3000/api/webhooks/metrics

# Test webhook events
curl "http://localhost:3000/api/webhooks/events?limit=10"
```

## Event Processing Flow

1. **Webhook Received** - Lob sends POST to `/webhooks/lob`
2. **Security Validation** - Verify signature and timestamp
3. **Event Classification** - Determine event type from payload
4. **Database Update** - Update mail piece status and create history
5. **Immediate Response** - Return 2xx status to Lob
6. **Monitoring Log** - Record event in monitoring system

## Status Mapping

| Lob Status | Internal Status | Description |
|------------|----------------|-------------|
| `delivered` | `delivered` | Mail piece delivered |
| `returned_to_sender` | `returned` | Mail piece returned |
| `re-routed` | `in_transit` | Mail piece re-routed |
| `in_transit` | `in_transit` | Mail piece in transit |
| `processing` | `submitted` | Mail piece being processed |
| `printed` | `submitted` | Mail piece printed |
| `mailed` | `submitted` | Mail piece mailed |
| `created` | `submitted` | Mail piece created |
| `cancelled` | `failed` | Mail piece cancelled |
| `failed` | `failed` | Mail piece failed |

## Error Handling

### Retry Policy
- Lob retries failed webhooks with exponential backoff
- 8 retry attempts over ~27 hours
- Webhooks disabled after 5 consecutive days of failures

### Error Responses
- **401**: Invalid signature or timestamp
- **400**: Missing required data
- **500**: Internal server error

### Monitoring
- All errors logged with structured format
- Automatic alerting on consecutive failures
- Health status reflects error rates

## Security Considerations

### Signature Verification
```typescript
// Lob's signature format
const signatureInput = `${timestamp}.${rawBody}`;
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(signatureInput)
  .digest('hex');
```

### Timestamp Validation
- 5-minute tolerance for clock skew
- Prevents replay attacks
- Rejects old webhook events

### Production Security
- Always verify signatures in production
- Use strong webhook secrets
- Monitor for suspicious activity

## Monitoring & Alerting

### Health Status
- **Healthy**: 0% error rate
- **Degraded**: <10% error rate
- **Unhealthy**: ≥10% error rate

### Metrics Tracked
- Total events processed
- Success/failure rates
- Average processing time
- Events by type and status
- Recent errors

### Alerting
- Automatic alerts on consecutive failures
- Health status monitoring
- Performance degradation detection

## Troubleshooting

### Common Issues

1. **Invalid Signature**
   - Check `LOB_WEBHOOK_SECRET` environment variable
   - Verify signature calculation matches Lob spec
   - Ensure raw body is used, not parsed JSON

2. **Timestamp Too Old**
   - Check server clock synchronization
   - Verify timestamp header is present
   - 5-minute tolerance should be sufficient

3. **Webhook Not Received**
   - Check Lob dashboard for webhook status
   - Verify URL is accessible from internet
   - Check server logs for errors

4. **Database Updates Not Working**
   - Verify mail piece exists with correct `lobId`
   - Check database connection
   - Review error logs

### Debug Mode

Enable detailed logging:
```bash
DEBUG=webhook* npm start
```

### Log Analysis

```bash
# View webhook logs
grep "Webhook" logs/app.log

# View specific mail piece events
grep "lob_id_here" logs/app.log

# View errors only
grep "ERROR.*Webhook" logs/app.log
```

## Performance

### Optimization
- Immediate 2xx responses for Lob compliance
- Asynchronous processing for complex logic
- Efficient database queries
- Memory-bounded event storage

### Scaling
- Webhook processing is stateless
- Can handle multiple concurrent webhooks
- Database operations are optimized
- Monitoring scales with application

## Future Enhancements

### Planned Features
- Webhook event replay functionality
- Advanced filtering and search
- Custom webhook endpoints per user
- Webhook event archiving
- Real-time webhook dashboard

### Integration Opportunities
- Slack notifications for webhook failures
- Email alerts for critical events
- Grafana dashboards for metrics
- Webhook event analytics

## Support

For issues with webhook implementation:
1. Check this documentation
2. Review server logs
3. Test with Lob debugger
4. Contact development team

For Lob API issues:
1. Check Lob dashboard
2. Review Lob documentation
3. Contact Lob support

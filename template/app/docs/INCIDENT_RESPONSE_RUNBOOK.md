# 🚨 Incident Response Runbook

This document provides step-by-step procedures for responding to common deployment issues.

## 🚨 Critical Issues

### Database Connection Failures

**Symptoms:**
- Server returns 502 errors
- Console shows "P1017: Server has closed the connection"
- Health checks failing
- CORS errors in browser

**Immediate Response (5 minutes):**

1. **Check Database Status**
   ```bash
   flyctl status --app postmarkr-db
   ```

2. **Check Database Logs**
   ```bash
   flyctl logs --app postmarkr-db --no-tail
   ```

3. **Restart Database if Needed**
   ```bash
   # Get machine ID first
   flyctl status --app postmarkr-db
   # Then restart (replace MACHINE_ID)
   flyctl machine restart MACHINE_ID --app postmarkr-db
   ```

4. **Check Server Status**
   ```bash
   flyctl status --app postmarkr-server
   ```

5. **Restart Server if Database is Healthy**
   ```bash
   # Get machine ID first
   flyctl status --app postmarkr-server
   # Then restart (replace MACHINE_ID)
   flyctl machine restart MACHINE_ID --app postmarkr-server
   ```

6. **Verify Fix**
   ```bash
   curl https://postmarkr-server.fly.dev/health/simple
   ```

**Escalation (if not resolved in 15 minutes):**
- Check Fly.io status page
- Contact Fly.io support
- Consider rolling back to previous deployment

### Server Crashes

**Symptoms:**
- Server machines showing "stopped" status
- Health checks failing
- 502/503 errors

**Immediate Response:**

1. **Check Server Logs**
   ```bash
   flyctl logs --app postmarkr-server --no-tail
   ```

2. **Identify Crash Cause**
   - Look for error messages in logs
   - Check for memory issues
   - Check for dependency failures

3. **Restart Server**
   ```bash
   flyctl machine restart MACHINE_ID --app postmarkr-server
   ```

4. **If Crashes Continue**
   - Check memory usage
   - Consider scaling up resources
   - Check for infinite loops or memory leaks

### CORS Issues

**Symptoms:**
- Browser console shows CORS errors
- API calls failing with "Access-Control-Allow-Origin" errors

**Immediate Response:**

1. **Check Server CORS Configuration**
   ```bash
   flyctl logs --app postmarkr-server --no-tail | grep -i cors
   ```

2. **Verify Environment Variables**
   ```bash
   flyctl secrets list --app postmarkr-server | grep -E "(WASP_WEB_CLIENT_URL|WASP_SERVER_URL)"
   ```

3. **Update CORS URLs if Needed**
   ```bash
   flyctl secrets set \
     WASP_WEB_CLIENT_URL="https://postmarkr-client.fly.dev" \
     WASP_SERVER_URL="https://postmarkr-server.fly.dev" \
     --app postmarkr-server
   ```

4. **Restart Server**
   ```bash
   flyctl machine restart MACHINE_ID --app postmarkr-server
   ```

## ⚠️ Warning Issues

### High Response Times

**Symptoms:**
- Health checks taking >5 seconds
- User complaints about slow loading

**Response:**

1. **Check Resource Usage**
   ```bash
   flyctl status --app postmarkr-server
   ```

2. **Check Database Performance**
   ```bash
   flyctl logs --app postmarkr-db --no-tail | grep -i slow
   ```

3. **Scale Up if Needed**
   ```bash
   flyctl scale memory 2048 --app postmarkr-server
   ```

### External Service Failures

**Symptoms:**
- Stripe/SendGrid/Lob API errors
- Health check shows service as "unhealthy"

**Response:**

1. **Check Service Status**
   - Stripe: https://status.stripe.com/
   - SendGrid: https://status.sendgrid.com/
   - Lob: https://status.lob.com/

2. **Check API Keys**
   ```bash
   flyctl secrets list --app postmarkr-server | grep -E "(STRIPE|SENDGRID|LOB)"
   ```

3. **Test API Connectivity**
   ```bash
   curl https://postmarkr-server.fly.dev/health
   ```

## 🔧 Preventive Measures

### Daily Monitoring

Run the monitoring script daily:
```bash
./scripts/monitor-deployment.sh
```

### Weekly Health Checks

1. **Check All Services**
   ```bash
   curl https://postmarkr-server.fly.dev/health
   ```

2. **Review Logs**
   ```bash
   flyctl logs --app postmarkr-server --no-tail | tail -100
   ```

3. **Check Resource Usage**
   ```bash
   flyctl status --app postmarkr-server
   flyctl status --app postmarkr-db
   ```

### Monthly Maintenance

1. **Update Dependencies**
   ```bash
   npm update
   wasp build
   ```

2. **Review Security**
   - Check for security updates
   - Review API keys and secrets
   - Update environment variables

3. **Performance Review**
   - Analyze response times
   - Check database performance
   - Review error rates

## 📞 Escalation Contacts

- **Primary**: Development Team
- **Secondary**: DevOps Team
- **Emergency**: Fly.io Support (https://community.fly.io/)

## 📋 Post-Incident Actions

After resolving any incident:

1. **Document the Issue**
   - What happened
   - Root cause
   - Resolution steps
   - Time to resolution

2. **Update Runbook**
   - Add new procedures if needed
   - Update existing procedures
   - Share learnings with team

3. **Implement Improvements**
   - Add monitoring for the issue
   - Improve alerting
   - Update documentation

## 🚀 Quick Commands Reference

```bash
# Check all app statuses
flyctl status --app postmarkr-server
flyctl status --app postmarkr-client  
flyctl status --app postmarkr-db

# View recent logs
flyctl logs --app postmarkr-server --no-tail
flyctl logs --app postmarkr-db --no-tail

# Restart services
flyctl machine restart MACHINE_ID --app postmarkr-server
flyctl machine restart MACHINE_ID --app postmarkr-db

# Check health endpoints
curl https://postmarkr-server.fly.dev/health/simple
curl https://postmarkr-server.fly.dev/health

# Update secrets
flyctl secrets set KEY=VALUE --app postmarkr-server

# Scale resources
flyctl scale memory 2048 --app postmarkr-server
flyctl scale count 2 --app postmarkr-server
```

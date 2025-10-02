# Production Deployment Checklist

Use this checklist to ensure all critical components are properly configured before deploying to production.

> **Important**: Review the [Production Environment Setup Guide](./PRODUCTION_ENVIRONMENT_SETUP.md) and [Monitoring and Alerting Setup](./MONITORING_AND_ALERTING_SETUP.md) before proceeding.

## ✅ **Pre-Deployment Checklist**

### **Environment Configuration**
- [ ] All required environment variables are set (see `.env.server.example`)
- [ ] Database URL is configured for production (PostgreSQL recommended)
- [ ] JWT secret is generated and secure (minimum 32 characters)
- [ ] Application URLs are set correctly (`WASP_WEB_CLIENT_URL`, `WASP_SERVER_URL`)
- [ ] SendGrid API key is configured with Full Access permissions
- [ ] SendGrid domain authentication is completed
- [ ] Stripe API keys are configured (live keys: `sk_live_`, `pk_live_`)
- [ ] Stripe webhook secret is configured
- [ ] Stripe customer portal URL is set
- [ ] Stripe price IDs are configured for all tiers
- [ ] Lob API key is configured (live key: `live_`)
- [ ] Lob webhook secret is configured and matches dashboard
- [ ] Lob webhook URL is registered in Lob dashboard
- [ ] AWS S3 bucket is created and configured
- [ ] AWS S3 IAM user has appropriate permissions
- [ ] AWS S3 CORS policy is configured (see `scripts/configure-s3-cors.js`)
- [ ] Sentry DSN is configured
- [ ] Sentry release version is set
- [ ] All webhook secrets are configured and secure
- [ ] NODE_ENV is set to "production"

### **Database Setup**
- [ ] Database migrations are applied
- [ ] Database is accessible from production
- [ ] Database backup strategy is in place
- [ ] Connection pooling is configured
- [ ] Database indexes are optimized

### **Email Configuration**
- [ ] SendGrid account is set up
- [ ] Domain authentication is configured
- [ ] Email templates are tested
- [ ] From address is verified
- [ ] Email delivery is working

### **Payment Processing**
- [ ] Stripe account is set up
- [ ] Live API keys are configured
- [ ] Webhook endpoints are configured
- [ ] Payment flows are tested
- [ ] Refund process is working

### **Mail Service**
- [ ] Lob account is set up
- [ ] Live API key is configured
- [ ] Webhook endpoints are configured
- [ ] Address validation is working
- [ ] Mail creation is working

### **File Storage**
- [ ] AWS S3 bucket is created
- [ ] CORS policy is configured
- [ ] File upload is working
- [ ] File access is secure
- [ ] Backup strategy is in place

### **Monitoring & Alerting**
- [ ] Sentry is configured and receiving test errors
- [ ] Sentry alerts are configured for critical errors
- [ ] Health check endpoints are accessible (`/health`, `/health/simple`, `/health/detailed`)
- [ ] Webhook health check is working (`/api/webhooks/health`)
- [ ] Webhook metrics endpoint is accessible (`/api/webhooks/metrics`)
- [ ] Fly.io health checks are configured in `fly-server.toml`
- [ ] Fly.io health checks are configured in `fly-client.toml`
- [ ] UptimeRobot (or similar) is monitoring `/health/simple`
- [ ] Error tracking is active and tested
- [ ] Performance monitoring is enabled
- [ ] Alert thresholds are set (see [Monitoring Guide](./MONITORING_AND_ALERTING_SETUP.md))
- [ ] Slack webhook for alerts is configured (optional)
- [ ] PagerDuty integration is configured (optional)
- [ ] Alert channels are tested and receiving notifications

### **Security**
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented
- [ ] Input validation is working
- [ ] Authentication is secure
- [ ] API keys are protected

## 🚀 **Deployment Steps**

### **1. Database Migration**
```bash
# Run production migration
wasp db migrate-prod
```

### **2. Environment Variables**
```bash
# Set all required environment variables
# See PRODUCTION_ENVIRONMENT_SETUP.md for complete list
```

### **3. Build Application**
```bash
# Build for production
wasp build
```

### **4. Deploy to Production**
```bash
# Deploy using your chosen platform
# Example for Fly.io:
wasp deploy fly launch
wasp deploy fly deploy
```

### **5. Configure Webhooks**
- [ ] Lob webhook URL configured: `https://your-api-domain.com/webhooks/lob`
- [ ] Lob webhook events selected: `postcard.*`, `letter.*`
- [ ] Lob webhook secret copied to `LOB_WEBHOOK_SECRET`
- [ ] Lob webhook signature verification tested
- [ ] Stripe webhook URL configured: `https://your-api-domain.com/payments-webhook`
- [ ] Stripe webhook events selected: `payment_intent.*`, `customer.subscription.*`
- [ ] Stripe webhook secret copied to `STRIPE_WEBHOOK_SECRET`
- [ ] Test webhook delivery for both services
- [ ] Verify webhook endpoints are accessible from internet
- [ ] Check webhook processing in logs

### **6. DNS Configuration**
- [ ] Custom domain is added to Fly.io apps
- [ ] DNS A/AAAA records point to Fly.io IPs
- [ ] DNS CNAME records are configured (if using)
- [ ] SSL certificates are issued (automatic with Fly.io)
- [ ] SSL certificates are valid and not expired
- [ ] HTTPS redirection is enabled
- [ ] CDN is configured (if applicable)
- [ ] Test all domain variants (www, non-www)

## 🧪 **Post-Deployment Testing**

### **Health Checks**
- [ ] Basic health check: `GET /health` returns 200 OK
- [ ] Simple health check: `GET /health/simple` returns `{"status":"ok"}`
- [ ] Detailed health check: `GET /health/detailed` includes system metrics
- [ ] Webhook health check: `GET /api/webhooks/health` returns status
- [ ] All services show as healthy
- [ ] No critical alerts in monitoring dashboard
- [ ] Fly.io health checks are passing (check `fly status`)

### **User Authentication**
- [ ] User registration works
- [ ] Email verification works
- [ ] Password reset works
- [ ] Login/logout works

### **Core Features**
- [ ] File upload works
- [ ] Address management works
- [ ] Mail creation works
- [ ] Payment processing works
- [ ] Email notifications work

### **Admin Features**
- [ ] Admin dashboard loads
- [ ] User management works
- [ ] Analytics are working
- [ ] Monitoring dashboard works

### **Integration Testing**
- [ ] SendGrid emails are delivered (check SendGrid dashboard)
- [ ] Email verification emails are received
- [ ] Password reset emails are received
- [ ] Stripe payments are processed successfully
- [ ] Stripe test card payment works
- [ ] Stripe webhook events are received and processed
- [ ] Lob address validation works
- [ ] Lob mail piece creation succeeds
- [ ] Lob webhooks are received and processed
- [ ] Check webhook metrics: `GET /api/webhooks/metrics`
- [ ] S3 file upload works
- [ ] S3 file download works
- [ ] S3 file URLs are accessible
- [ ] PDF processing job runs successfully

## 📊 **Monitoring Setup**

### **Sentry Configuration**
- [ ] Error tracking is active
- [ ] Performance monitoring is enabled
- [ ] Alerts are configured
- [ ] Release tracking is set up

### **Health Monitoring**
- [ ] Health check endpoint is monitored
- [ ] Uptime monitoring is configured
- [ ] Response time monitoring is active
- [ ] Error rate monitoring is set up

### **Log Monitoring**
- [ ] Application logs are collected
- [ ] Error logs are monitored
- [ ] Performance logs are tracked
- [ ] Security logs are reviewed

## 🔒 **Security Verification**

### **Authentication**
- [ ] JWT tokens are secure
- [ ] Session management is working
- [ ] Password policies are enforced
- [ ] Account lockout is configured

### **API Security**
- [ ] Rate limiting is active
- [ ] Input validation is working
- [ ] SQL injection protection is active
- [ ] XSS protection is enabled

### **Data Protection**
- [ ] Sensitive data is encrypted
- [ ] API keys are protected
- [ ] Database access is restricted
- [ ] File access is secure

## 📈 **Performance Optimization**

### **Database Performance**
- [ ] Query performance is optimized
- [ ] Indexes are properly configured
- [ ] Connection pooling is active
- [ ] Query caching is enabled

### **Application Performance**
- [ ] Response times are acceptable
- [ ] Memory usage is optimized
- [ ] CPU usage is reasonable
- [ ] File upload performance is good

### **CDN Configuration**
- [ ] Static assets are served via CDN
- [ ] Cache headers are configured
- [ ] Compression is enabled
- [ ] Image optimization is active

## 🚨 **Incident Response**

### **Monitoring Alerts**
- [ ] Critical alerts are configured (see [Monitoring Guide](./MONITORING_AND_ALERTING_SETUP.md))
  - [ ] Health check failure alerts
  - [ ] Database connection failure alerts
  - [ ] High webhook error rate alerts (>25%)
- [ ] Warning alerts are configured
  - [ ] Elevated error rate alerts (5-25%)
  - [ ] Slow response time alerts (>2s)
  - [ ] No webhook events alert (2+ hours)
- [ ] Info alerts are configured
  - [ ] High memory usage alerts (>80%)
  - [ ] Slow webhook processing alerts (>1s)
- [ ] Service down alerts are active
- [ ] Security incident alerts are configured
- [ ] Alert test notifications are sent and received

### **Response Procedures**
- [ ] Incident response plan is documented
- [ ] Escalation procedures are defined
- [ ] Rollback procedures are tested
- [ ] Communication plan is ready

### **Backup & Recovery**
- [ ] Database backups are automated
- [ ] File backups are configured
- [ ] Recovery procedures are tested
- [ ] Disaster recovery plan is ready

## 📋 **Documentation**

### **Operational Documentation**
- [ ] Deployment procedures are documented
- [ ] Monitoring setup is documented
- [ ] Troubleshooting guide is created
- [ ] Runbook is prepared

### **User Documentation**
- [ ] User guide is updated
- [ ] API documentation is current
- [ ] Support procedures are documented
- [ ] FAQ is updated

## ✅ **Final Verification**

### **Smoke Tests**
- [ ] All critical user flows work
- [ ] Admin functions are accessible
- [ ] Monitoring is working
- [ ] Alerts are configured

### **Load Testing**
- [ ] Application handles expected load
- [ ] Database performance is acceptable
- [ ] File upload performance is good
- [ ] API response times are reasonable

### **Security Testing**
- [ ] Penetration testing is completed
- [ ] Vulnerability scanning is done
- [ ] Security review is completed
- [ ] Compliance requirements are met

## 🎉 **Go-Live Checklist**

- [ ] All pre-deployment items are complete
- [ ] All post-deployment tests pass
- [ ] Monitoring is active and alerting
- [ ] Health checks are passing consistently
- [ ] Webhook system is operational
- [ ] All external integrations are verified
- [ ] Support team is ready and trained
- [ ] Documentation is complete and up-to-date
- [ ] Rollback plan is documented and tested
- [ ] Incident response procedures are in place
- [ ] On-call schedule is established
- [ ] Go-live approval is obtained from stakeholders
- [ ] Customer communication is prepared
- [ ] Backup systems are tested and ready

## 📊 **Post-Launch Monitoring (First 24 Hours)**

### **Hour 1**
- [ ] Monitor health checks every 5 minutes
- [ ] Check error rates in Sentry
- [ ] Verify webhook processing
- [ ] Monitor response times
- [ ] Check database performance

### **Hour 6**
- [ ] Review first hour metrics
- [ ] Check for any patterns in errors
- [ ] Verify all scheduled jobs ran
- [ ] Review webhook metrics dashboard
- [ ] Check system resource usage

### **Hour 24**
- [ ] Comprehensive health review
- [ ] Performance metrics analysis
- [ ] Error rate trending
- [ ] User feedback review
- [ ] Plan any immediate optimizations

## 🔄 **Continuous Monitoring**

### **Daily Tasks**
- [ ] Review Sentry error dashboard
- [ ] Check webhook metrics
- [ ] Verify all health checks passing
- [ ] Monitor error rate trends
- [ ] Review system performance

### **Weekly Tasks**
- [ ] Comprehensive performance review
- [ ] Database optimization check
- [ ] Review and update alert thresholds
- [ ] Test backup restoration
- [ ] Security updates check

### **Monthly Tasks**
- [ ] Full system audit
- [ ] Capacity planning review
- [ ] Update documentation
- [ ] Review and update runbooks
- [ ] Security audit

---

## 📋 **Deployment Sign-Off**

**Deployment Date**: _______________
**Deployed By**: _______________
**Reviewed By**: _______________
**Approved By**: _______________

**Production URLs**:
- Client: _______________
- API: _______________
- Admin: _______________

**Verification Steps Completed**:
- [ ] All health checks passing
- [ ] All integrations tested
- [ ] Monitoring active
- [ ] Alerts configured
- [ ] Team notified

**Notes**:
- 
- 
- 

**Issues Encountered**:
- 
- 
- 

**Next Steps**:
- 
- 
- 

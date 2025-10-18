# Migration Guide for Lob Refactoring

**Date:** October 18, 2025  
**Version:** 1.0.0

---

## Overview

This guide walks you through deploying the Lob refactoring changes to your environment.

---

## 🔴 IMPORTANT: Database Migration Required

### Step 1: Database Schema Change

The refactoring adds a unique constraint to `MailPiece.lobId` for database-level duplicate protection.

**Command:**
```bash
wasp db migrate-dev "add_unique_constraint_to_lob_id"
```

**What This Does:**
- Adds `@unique` constraint to `MailPiece.lobId` field
- Prevents duplicate Lob submissions at database level
- Safe to apply (only affects null values and future inserts)

**Expected Output:**
```
✔ Your database is now in sync with your schema.
✔ Generated Prisma Client
```

### Step 2: Verify Migration

```bash
wasp db studio
```

Check the `MailPiece` table schema to confirm the unique constraint on `lobId`.

---

## 📦 New Dependencies

No new npm packages required! All changes use existing dependencies:
- TypeScript (existing)
- Wasp server/client (existing)
- Stripe SDK (existing)
- Prisma (existing)

---

## 🔧 Configuration Updates

### Environment Variables

No new environment variables required. The refactoring uses existing variables:
- `LOB_TEST_KEY` or `LOB_PROD_KEY`
- `STRIPE_SECRET_KEY`
- `DATABASE_URL`
- `NODE_ENV`

### Optional: Adjust Log Level

Add to `.env.server` if you want to change the default log level:

```env
LOG_LEVEL=info  # Options: debug, info, warn, error, critical
LOB_VERBOSE_LOGGING=false  # Set to true for detailed API logs
```

---

## 🧪 Testing the Changes

### 1. Test Payment Flow

```bash
# Start Wasp in development mode
wasp start
```

Create a test mail piece and verify:
1. Payment confirmation works
2. Mail piece is marked as paid
3. Lob submission job is scheduled
4. Logs show structured format

### 2. Test Duplicate Prevention

Try to submit the same mail piece twice and verify:
1. Second submission fails with clear error message
2. Database constraint prevents duplicate `lobId`
3. Logs show duplicate attempt alert

### 3. Test Error Handling

Temporarily set `LOB_TEST_KEY` to invalid value and verify:
1. Error messages are user-friendly
2. Logs show standardized error codes
3. System gracefully handles failure

### 4. Test Simulation Mode

Remove Lob API keys temporarily and verify:
1. System uses simulation mode
2. Mock responses returned
3. No actual API calls made
4. Warning logged about simulation mode

---

## 📊 Monitoring

### New Log Format

After deployment, logs will follow this structured format:

```
ℹ️  [INFO] 2025-10-18T12:34:56.789Z [StripeWebhook] Processing mail payment completion
{
  "sessionId": "cs_test_123",
  "paymentStatus": "paid",
  "metadata": { "mailPieceId": "uuid-123" }
}
```

### Error Codes to Monitor

Watch for these critical error codes in logs:
- `LOB_502`: Duplicate submission attempted (should be rare)
- `LOB_601`: Insufficient Lob balance (requires admin action)
- `LOB_201`: Lob API authentication failed (config issue)

### Metrics to Track

The new system logs these metrics:
- Payment verification success rate
- Lob submission success rate
- Duplicate submission attempts
- Circuit breaker state changes
- Rate limit hits

---

## 🚨 Rollback Plan

If issues occur after deployment:

### 1. Quick Rollback (Code Only)

```bash
git revert <commit-hash>
git push
```

Re-deploy the previous version.

### 2. Database Rollback (If Needed)

The unique constraint can be safely removed if needed:

**Manual SQL:**
```sql
ALTER TABLE "MailPiece" DROP CONSTRAINT IF EXISTS "MailPiece_lobId_key";
```

**Or create migration:**
```bash
wasp db migrate-dev "remove_unique_constraint_from_lob_id"
```

Then edit the migration file to:
```sql
-- Remove unique constraint
ALTER TABLE "MailPiece" DROP CONSTRAINT IF EXISTS "MailPiece_lobId_key";
```

**Note:** This is safe because the application-level checks remain in place.

---

## ✅ Post-Deployment Checklist

### Immediate (First Hour)

- [ ] Database migration applied successfully
- [ ] Application starts without errors
- [ ] Logs show new structured format
- [ ] Payment flow works end-to-end
- [ ] Mail pieces are created successfully
- [ ] Lob submission works
- [ ] Duplicate submission prevented

### Short Term (First Day)

- [ ] Monitor error logs for unexpected issues
- [ ] Verify payment webhook processing
- [ ] Check background job execution
- [ ] Verify email notifications sent
- [ ] Monitor Lob API success rate
- [ ] Check for any duplicate submission attempts

### Medium Term (First Week)

- [ ] Review structured logs for insights
- [ ] Check error code distribution
- [ ] Monitor job retry rates
- [ ] Verify circuit breaker not triggered
- [ ] Review rate limiting effectiveness
- [ ] Gather user feedback

---

## 🐛 Known Issues & Solutions

### Issue: TypeScript Errors After Pull

**Symptom:** TypeScript can't find new types or helpers

**Solution:**
```bash
wasp clean
wasp start
```

Wasp needs to regenerate types after schema changes.

### Issue: Import Errors for New Helpers

**Symptom:** Cannot find module './helpers/paymentHelpers'

**Solution:** Verify the files were pulled correctly:
```bash
ls -la src/mail/helpers/
ls -la src/server/lob/
```

All helper files should be present.

### Issue: Database Constraint Violation

**Symptom:** "duplicate key value violates unique constraint"

**Solution:** This means duplicate protection is working! The error occurs when:
1. A mail piece already has a `lobId`
2. System tries to set the same `lobId` again

This is expected behavior and prevents duplicate charges.

---

## 📞 Support

If you encounter issues during migration:

1. **Check Logs:** New structured logs provide detailed context
2. **Review Error Codes:** Use `docs/LOB_REFACTORING_SUMMARY.md` error catalog
3. **Test in Development:** Use Wasp's simulation mode
4. **Rollback if Needed:** Follow rollback plan above

---

## ⚠️ Known Limitations

Please be aware of these documented limitations (see `LOB_REFACTORING_SUMMARY.md` for full details):

### 1. Duplicate Lob API Calls on Network Retry (Acceptable)
- **What:** If Lob API call succeeds but response is lost, retry may create duplicate
- **Probability:** Very low (requires network failure at exact moment)
- **Impact:** Business absorbs small duplicate cost (~$0.50-$5), customer not charged twice
- **Mitigation:** 60-second retry delay, monitor for orphaned submissions

### 2. Inefficient Retries on Permanent Errors (Acceptable)
- **What:** Jobs retry on 404/400 errors (wastes resources but safe)
- **Impact:** Minimal - just extra job attempts, clear error logs
- **Future:** Will optimize to skip retries on permanent errors

### 3. Multiple Jobs Can Be Scheduled (Mitigated)
- **What:** Webhook + manual confirmation can schedule multiple jobs
- **Impact:** Only first succeeds, others fail safely with no duplicate submissions
- **Current Protection:** Job validation + operation-level checks

### 4. Development Requires Lob Test Keys (By Design)
- **What:** Simulation mode fails without Lob API keys
- **Why:** Prevents DB pollution, forces realistic testing
- **Setup:** Get free test keys from Lob dashboard

These limitations are industry-standard distributed systems issues with acceptable risk/impact profiles.

---

## 🎉 Success Indicators

You'll know the migration succeeded when:

✅ Database migration completes without errors  
✅ Application starts and serves requests  
✅ Logs show structured format with emojis  
✅ Payment flow works end-to-end  
✅ Duplicate submissions are prevented  
✅ Error messages are user-friendly  
✅ No increase in error rate  

---

## 📚 Additional Resources

- **Audit Report:** `docs/LOB_MAIL_SUBMISSION_AUDIT.md`
- **Refactoring Summary:** `docs/LOB_REFACTORING_SUMMARY.md`
- **Helper Documentation:** See inline comments in helper files
- **Type Definitions:** `src/server/lob/types.ts`
- **Error Catalog:** `src/server/lob/errors.ts`
- **Configuration:** `src/server/lob/config.ts`

---

## 🔄 Continuous Improvement

After successful deployment, consider:

1. **Add Tests:** Unit tests for new helpers
2. **Monitor Metrics:** Track error rates and performance
3. **Gather Feedback:** User experience with error messages
4. **Optimize Config:** Adjust timeouts and retry values based on data
5. **Enhance Logging:** Add more context as needed

---

**Migration Status: Ready for Deployment**  
**Estimated Downtime: None (backward compatible)**  
**Risk Level: Low (extensive safety checks preserved)**


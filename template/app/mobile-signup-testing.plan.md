# Mobile Sign-Up to Stripe Checkout Testing Plan

## Testing Approach

Manual testing using browser developer tools to simulate mobile viewports on https://postmarkr.com with both Android Chrome and iOS Safari dimensions.

## Test Flow

### Phase 1: Execute Mobile Sign-Up Tests

**Test Journey:**

1. Open browser developer tools and set mobile viewport (360x740 for Android Chrome, 375x667 for iOS Safari)
2. Navigate to postmarkr.com signup page (`/signup`)
3. Generate temporary email from temp-mail.org website
4. Fill signup form with temp email and test password
5. Submit signup and verify redirect to email verification page (`/email-verification`)
6. Retrieve verification link from temp email inbox
7. Click verification link and verify auth success (redirects to `/mail/create` per `main.wasp` line 70)
8. Navigate to account page (`/account`) to access "Buy More" button
9. Click "Buy More" button to trigger Stripe checkout from within the app
10. Verify Stripe checkout page loads successfully with correct pricing
11. Document all visual rendering issues, form behavior, and user experience problems

**Key Files to Reference:**

- `main.wasp` lines 43-71: Auth configuration with `onAuthSucceededRedirectTo: "/mail/create"`
- `src/auth/SignupPage.tsx`: Signup page component
- `src/auth/components/EnhancedSignupForm.tsx` lines 51-86: Signup form submission logic
- `src/auth/email-and-pass/EmailVerificationPage.tsx` lines 22-40: Post-verification redirect logic
- `src/payment/operations.ts` lines 33-61: Stripe checkout session generation
- `src/payment/plans.ts`: Payment plan configuration
- `src/user/AccountPage.tsx` lines 166-177: "Buy More" button implementation

**Mobile Viewports to Test:**

- **Android Chrome**: 360x740 (Pixel 5)
- **iOS Safari**: 375x667 (iPhone SE), 390x844 (iPhone 12 Pro)

### Phase 2: Error Logging

Create structured error log capturing:

- Visual rendering issues (elements not visible, overlapping, misaligned)
- Form input behavior on mobile keyboards
- Touch interaction problems
- Navigation issues
- Stripe checkout page loading issues
- User experience friction points

**Log Format:**

```
[TIMESTAMP] [DEVICE] [STEP] [SEVERITY]
Description: ...
Context: { url, element, issue_description, screenshot_needed }
```

### Phase 3: Root Cause Analysis

For each error found, investigate:

1. **Auth/Signup Issues:**

   - Check if `userSignupFields` in `src/auth/userSignupFields.ts` properly sets email/username
   - Verify email validation in `EnhancedSignupForm.tsx` lines 24-39 works on mobile keyboards
   - Check if SendGrid email sender is properly configured (per `main.wasp` lines 90-96)

2. **Email Verification Issues:**

   - Verify temp-mail.org website works reliably for receiving verification emails
   - Check if verification token parsing works on mobile browsers
   - Verify redirect to `/mail/create` after verification (per `main.wasp` line 70)

3. **Mobile Responsive Issues:**

   - Check viewport meta tag in `main.wasp` head section (line 15)
   - Review Tailwind responsive classes in signup/verification components
   - Test form input focus behavior on mobile (keyboard overlays)
   - Check account page layout on mobile (`src/user/AccountPage.tsx`)

4. **Stripe Checkout Issues:**

   - Verify `WASP_WEB_CLIENT_URL` environment variable points to `https://postmarkr.com`
   - Check if Stripe checkout session creation in `src/payment/stripe/checkoutUtils.ts` lines 44-65 handles mobile browsers
   - Verify success_url (`/checkout?status=success`) and cancel_url work on mobile
   - Check if payment plans are properly configured via environment variables (lines 39, 49, 59 in `plans.ts`)
   - Test "Buy More" button functionality in account page

5. **User Experience Issues:**

   - Check for mobile-specific navigation problems
   - Verify touch targets are appropriately sized
   - Test form submission with mobile keyboards
   - Check for content that's cut off or requires horizontal scrolling

### Phase 4: Solution Proposals

For each identified issue, propose:

- **Immediate fix**: Code changes needed with file paths and specific line numbers
- **Root cause**: Why the issue occurs (configuration, code logic, mobile-specific behavior)
- **Testing strategy**: How to prevent regression
- **Priority**: Critical (blocks signup), High (degrades UX), Medium (minor issue), Low (cosmetic)

## Deliverables

1. **Manual test execution** (using browser dev tools)
2. **Error log document** (timestamped, categorized by severity and phase)
3. **Root cause analysis report** (linking each error to specific code/config)
4. **Fix implementation plan** (prioritized list with file paths and code snippets)

### To-dos

- [x] Create utility to interact with temp-mail.org API for generating temporary emails and retrieving verification links
- [x] Create Playwright test script for mobile sign-up flow with Android Chrome and iOS Safari viewports
- [x] Run test on Android Chrome viewport and capture all errors, network logs, and screenshots
- [x] Run test on iOS Safari viewport and capture all errors, network logs, and screenshots
- [ ] Review all captured errors and categorize by root cause (auth, email, responsive, stripe, network)
- [ ] For each error category, trace through codebase to identify underlying issues and configuration problems
- [ ] Document proposed fixes with specific file paths, code changes, and priority levels

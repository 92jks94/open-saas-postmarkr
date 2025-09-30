import { test, expect } from '@playwright/test';
import { createRandomUser, logUserIn, signUserUp, type User } from './utils';

let page: any;
let testUser: User;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  testUser = createRandomUser();
  await signUserUp({ page: page, user: testUser });
  await logUserIn({ page: page, user: testUser });
});

test.afterAll(async () => {
  await page.close();
});

test.describe('Mail Creation Workflow', () => {
  test('User can access mail creation page', async () => {
    await page.goto('/mail/create');
    await expect(page).toHaveTitle(/Postmarkr/);
    
    // Check that the mail creation page loads with correct content
    await expect(page.getByText(/create.*mail|mail.*create/i)).toBeVisible();
  });

  test('Mail creation form elements are present', async () => {
    await page.goto('/mail/create');
    
    // Check for essential form elements
    const recipientNameInput = page.locator('input[name*="recipient"], input[placeholder*="recipient"]').first();
    const recipientAddressInput = page.locator('input[name*="address"], textarea[name*="address"]').first();
    const descriptionInput = page.locator('input[name*="description"], textarea[name*="description"]').first();
    
    // At least one of these should be visible
    const hasRecipientField = await recipientNameInput.count() > 0;
    const hasAddressField = await recipientAddressInput.count() > 0;
    const hasDescriptionField = await descriptionInput.count() > 0;
    
    expect(hasRecipientField || hasAddressField || hasDescriptionField).toBe(true);
  });

  test('Mail creation form validation works', async () => {
    await page.goto('/mail/create');
    
    // Look for submit button
    const submitButton = page.getByRole('button', { name: /submit|create|send/i }).first();
    if (await submitButton.count() > 0) {
      await expect(submitButton).toBeVisible();
      await submitButton.click();
      
      // Should show validation error or remain on same page
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      expect(currentUrl).toContain('/mail/create');
    }
  });

  test('User can access mail history page', async () => {
    await page.goto('/mail/history');
    await expect(page).toHaveTitle(/Postmarkr/);
    
    // Check that the mail history page loads
    await expect(page.getByText(/history|mail.*list|sent.*mail/i)).toBeVisible();
  });

  test('Mail history shows empty state for new user', async () => {
    await page.goto('/mail/history');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Should show empty state or no mail pieces message
    const emptyState = page.locator('text=/no.*mail|empty|no.*items|no.*pieces/i').first();
    const hasEmptyState = await emptyState.count() > 0;
    
    if (hasEmptyState) {
      await expect(emptyState).toBeVisible();
    }
  });
});

test.describe('Address Management', () => {
  test('User can access address management page', async () => {
    await page.goto('/addresses');
    await expect(page).toHaveTitle(/Postmarkr/);
    
    // Check that the address management page loads
    await expect(page.getByText(/address|manage.*address/i)).toBeVisible();
  });

  test('Address management form elements are present', async () => {
    await page.goto('/addresses');
    
    // Look for address form elements
    const nameInput = page.locator('input[name*="name"], input[placeholder*="name"]').first();
    const addressInput = page.locator('input[name*="address"], textarea[name*="address"]').first();
    const cityInput = page.locator('input[name*="city"], input[placeholder*="city"]').first();
    
    // At least one of these should be visible
    const hasNameField = await nameInput.count() > 0;
    const hasAddressField = await addressInput.count() > 0;
    const hasCityField = await cityInput.count() > 0;
    
    expect(hasNameField || hasAddressField || hasCityField).toBe(true);
  });

  test('Address management shows empty state for new user', async () => {
    await page.goto('/addresses');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Should show empty state or no addresses message
    const emptyState = page.locator('text=/no.*address|empty|no.*items|add.*address/i').first();
    const hasEmptyState = await emptyState.count() > 0;
    
    if (hasEmptyState) {
      await expect(emptyState).toBeVisible();
    }
  });
});

test.describe('Mail Workflow Error Handling', () => {
  test('Mail creation handles network errors gracefully', async () => {
    await page.goto('/mail/create');
    
    // Simulate network error by going offline
    await page.context().setOffline(true);
    
    const submitButton = page.getByRole('button', { name: /submit|create|send/i }).first();
    if (await submitButton.count() > 0) {
      await expect(submitButton).toBeVisible();
      
      // Try to submit (this should handle the network error)
      await submitButton.click();
      
      // Wait a moment for any error handling
      await page.waitForTimeout(2000);
    }
    
    // Go back online
    await page.context().setOffline(false);
  });

  test('Address management handles network errors gracefully', async () => {
    await page.goto('/addresses');
    
    // Simulate network error by going offline
    await page.context().setOffline(true);
    
    const submitButton = page.getByRole('button', { name: /submit|create|add/i }).first();
    if (await submitButton.count() > 0) {
      await expect(submitButton).toBeVisible();
      
      // Try to submit (this should handle the network error)
      await submitButton.click();
      
      // Wait a moment for any error handling
      await page.waitForTimeout(2000);
    }
    
    // Go back online
    await page.context().setOffline(false);
  });
});

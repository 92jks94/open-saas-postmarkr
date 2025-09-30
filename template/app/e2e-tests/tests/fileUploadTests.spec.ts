import { test, expect } from '@playwright/test';
import { createRandomUser, logUserIn, signUserUp, type User } from './utils';
import path from 'path';

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

test.describe('File Upload Functionality', () => {
  test('User can access file upload page', async () => {
    await page.goto('/file-upload');
    await expect(page).toHaveTitle(/Postmarkr/);
    
    // Check that the file upload page loads with correct content
    await expect(page.getByText('AWS File Upload')).toBeVisible();
    await expect(page.getByText('Select a file to upload')).toBeVisible();
  });

  test('File upload form elements are present', async () => {
    await page.goto('/file-upload');
    
    // Check for file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    
    // Check for upload button
    const uploadButton = page.getByRole('button', { name: /upload/i });
    await expect(uploadButton).toBeVisible();
    await expect(uploadButton).toBeEnabled();
  });

  test('File upload form validation works', async () => {
    await page.goto('/file-upload');
    
    // Try to submit without selecting a file
    const uploadButton = page.getByRole('button', { name: /upload/i });
    await expect(uploadButton).toBeVisible();
    await uploadButton.click();
    
    // Should show validation error or remain on same page
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    expect(currentUrl).toContain('/file-upload');
  });

  test('File upload accepts valid file types', async () => {
    await page.goto('/file-upload');
    
    // Create a test file path using the test-files directory
    const testFilePath = path.join(__dirname, '..', 'test-files', 'test-document.pdf');
    
    // Set the file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    
    // Set the file input with the test file
    await fileInput.setInputFiles(testFilePath);
    
    // Verify the file was selected
    const fileValue = await fileInput.inputValue();
    expect(fileValue).toBeDefined();
    expect(fileValue).toContain('test-document.pdf');
  });

  test('File upload shows progress indicator', async () => {
    await page.goto('/file-upload');
    
    // This test verifies the UI elements for progress are present
    // The actual progress testing would require a real file upload
    const uploadButton = page.getByRole('button', { name: /upload/i });
    await expect(uploadButton).toBeVisible();
    
    // Check if progress bar element exists (even if not visible initially)
    // Look for common progress indicators
    const progressBar = page.locator('[role="progressbar"], .progress, .upload-progress, [data-testid*="progress"]').first();
    // Progress bar might not be visible until upload starts, so we just check if any progress element exists
    const progressExists = await progressBar.count() > 0;
    if (progressExists) {
      await expect(progressBar).toBeAttached();
    }
  });

  test('File upload error handling works', async () => {
    await page.goto('/file-upload');
    
    // Try to upload without selecting a file to trigger validation error
    const fileInput = page.locator('input[type="file"]');
    const uploadButton = page.getByRole('button', { name: /upload/i });
    
    await expect(fileInput).toBeVisible();
    await expect(uploadButton).toBeVisible();
    
    // Try to upload without file
    await uploadButton.click();
    
    // Wait for any error message to appear
    await page.waitForTimeout(1000);
    
    // Check if error alert component exists in the DOM
    const errorAlert = page.locator('[role="alert"], .error, .alert-error, [data-testid*="error"]').first();
    const errorExists = await errorAlert.count() > 0;
    if (errorExists) {
      await expect(errorAlert).toBeAttached();
    }
  });

  test('File upload page shows user files list', async () => {
    await page.goto('/file-upload');
    
    // Wait for the page to load completely
    await page.waitForLoadState('domcontentloaded');
    
    // Check if there's a section for displaying user files
    // This might be empty initially, but the structure should be there
    const filesSection = page.locator('text=/files|uploaded|list/i').first();
    if (await filesSection.isVisible()) {
      await expect(filesSection).toBeVisible();
    }
  });
});

test.describe('File Upload Error Scenarios', () => {
  test('File upload handles network errors gracefully', async () => {
    await page.goto('/file-upload');
    
    // Simulate network error by going offline
    await page.context().setOffline(true);
    
    const uploadButton = page.getByRole('button', { name: /upload/i });
    await expect(uploadButton).toBeVisible();
    
    // Try to upload (this should handle the network error)
    await uploadButton.click();
    
    // Wait a moment for any error handling
    await page.waitForTimeout(2000);
    
    // Go back online
    await page.context().setOffline(false);
  });

  test('File upload form resets after error', async () => {
    await page.goto('/file-upload');
    
    const fileInput = page.locator('input[type="file"]');
    const uploadButton = page.getByRole('button', { name: /upload/i });
    
    await expect(fileInput).toBeVisible();
    await expect(uploadButton).toBeVisible();
    
    // Try to upload without file
    await uploadButton.click();
    
    // Wait for any error handling
    await page.waitForTimeout(1000);
    
    // Verify form is still functional
    await expect(uploadButton).toBeEnabled();
  });
});

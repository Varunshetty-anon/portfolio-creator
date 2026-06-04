import { test, expect } from '@playwright/test';

test.describe('FRAMES Core Flows', () => {
  // Use a unique email for each test run to avoid conflicts if testing against live/dev DB
  const testUser = `test-${Date.now()}@example.com`;
  const password = 'Password123!';

  test('Signup, Login, and Auth flow', async ({ page }) => {
    // Navigate to auth page
    await page.goto('http://localhost:5173/auth');
    
    // Expect "Join Frames" to be visible
    await expect(page.locator('text=Join FRAMES')).toBeVisible();

    // Fill signup form
    await page.fill('input[type="email"]', testUser);
    await page.fill('input[type="password"]', password);
    await page.fill('input[placeholder="e.g. John Doe"]', 'Test User');
    
    // Submit
    await page.click('button:has-text("Create Account")');

    // Wait for redirect to /onboarding
    await page.waitForURL('**/onboarding');
    await expect(page.locator('text=Welcome to FRAMES')).toBeVisible();

    // Complete onboarding
    await page.fill('input[placeholder="e.g. john-doe"]', `test-${Date.now()}`);
    await page.click('button:has-text("Complete Setup")');

    // Wait for redirect to /editor
    await page.waitForURL('**/editor');
    
    // Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/auth');
  });

  test('Editor Autosave, Theme Switch, and Publish', async ({ page }) => {
    // 1. Login
    await page.goto('http://localhost:5173/auth');
    await page.click('button:has-text("Sign in instead")');
    // Using a known dev account or creating one would be better, 
    // but for the sake of the test, we'll assume there's a test user seeded.
    // Replace with a known seeded user if needed.
    await page.fill('input[type="email"]', 'test@frames.studio');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');

    // Navigate to editor
    await page.waitForURL('**/editor');
    
    // 2. Autosave Check
    // Type in the name field
    const nameInput = page.locator('input[placeholder="e.g. Jane Doe"]');
    await nameInput.fill('Updated Name ' + Date.now());
    
    // Look for saving indicator
    await expect(page.locator('text=Saving...')).toBeVisible();
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 5000 });

    // 3. Theme Switch
    // Open Design Panel (assumes left nav)
    await page.click('button:has-text("Design")');
    
    // Click Futuristic theme
    await page.click('button:has-text("Futuristic")');
    
    // Wait for Autosave
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 5000 });
    
    // Verify preview updates to theme-futuristic
    const previewCanvas = page.locator('main').first(); // The right side
    await expect(previewCanvas).toHaveClass(/theme-futuristic/);

    // 4. Publish
    // Click Publish button in header
    const publishButton = page.locator('button:has-text("Publish")');
    await publishButton.click();

    // Expect Published confirmation
    await expect(page.locator('text=Published!')).toBeVisible();
  });

  test('Media Upload (Profile & Project)', async ({ page }) => {
    // Note: To truly test file upload, we need mock files.
    // Playwright supports file uploads.
    
    // Example:
    // await page.setInputFiles('input[type="file"]', 'path/to/test-image.jpg');
    // await expect(page.locator('text=Uploading...')).toBeVisible();
    // await expect(page.locator('text=Success!')).toBeVisible();
  });
});

const { test, expect } = require('@playwright/test');

test.describe('Quick Functionality Validation', () => {
  let page;
  
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  // Test basic authentication and main features
  test('Basic authentication and core features work', async () => {
    console.log('🧪 Testing basic authentication and core functionality...');
    
    // Navigate to application and login
    await page.goto('http://localhost:8001', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-results/quick-01-initial.png' });
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/);
    await expect(page.locator('h1')).toContainText('Login');
    
    // Login with admin credentials
    await page.fill('#email', 'clark@everson.dev');
    await page.fill('#password', 'with1artie4oskar3VOCATION!advances');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?!login).*/, { timeout: 10000 });
    await page.screenshot({ path: 'test-results/quick-02-logged-in.png' });
    
    // Verify successful login
    await expect(page.locator('h1')).toContainText('My Characters');
    
    // Check if navigation links are visible (use more specific selectors)
    const charactersNavLink = page.locator('.nav-link', { hasText: 'Characters' });
    const campaignsNavLink = page.locator('.nav-link', { hasText: 'Campaigns' });
    
    await expect(charactersNavLink).toBeVisible();
    await expect(campaignsNavLink).toBeVisible();
    
    // Test navigation to campaigns
    await campaignsNavLink.click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/quick-03-campaigns.png' });
    
    // Test character creation access
    await page.goto('http://localhost:8001');
    await page.waitForLoadState('networkidle');
    
    const createCharacterBtn = page.locator('text=Create Character');
    if (await createCharacterBtn.isVisible()) {
      await createCharacterBtn.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/quick-04-character-creation.png' });
      console.log('✅ Character creation page accessible');
    } else {
      console.log('⚠️ Create Character button not found');
    }
    
    // Test profile access
    await page.click('.user-menu-toggle');
    await page.waitForTimeout(500);
    await page.click('text=Profile');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/quick-05-profile.png' });
    
    // Verify 2FA/Passkey removal message
    await expect(page.locator('text=Two-Factor Authentication and Passkey support will be available')).toBeVisible();
    
    // Test logout
    await page.click('.user-menu-toggle');
    await page.waitForTimeout(500);
    await page.click('text=Logout');
    await page.waitForURL(/.*login.*/);
    await page.screenshot({ path: 'test-results/quick-06-logout.png' });
    
    console.log('✅ All basic functionality tests passed!');
  });
});
// tests/oauth-login.spec.js
const { test, expect } = require('@playwright/test');

test.describe('OAuth Login Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display OAuth login buttons', async ({ page }) => {
    // Check Google login button exists and is visible
    const googleButton = page.locator('button:has-text("Google")');
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toHaveCSS('background-color', 'rgb(66, 133, 244)'); // Google blue color
    
    // Check Discord login button exists and is visible  
    const discordButton = page.locator('button:has-text("Discord")');
    await expect(discordButton).toBeVisible();
    await expect(discordButton).toHaveCSS('background-color', 'rgb(88, 101, 242)'); // Discord purple color
  });

  test('should have proper OAuth button styling', async ({ page }) => {
    const googleButton = page.locator('button:has-text("Google")');
    const discordButton = page.locator('button:has-text("Discord")');
    
    // Check buttons are properly styled
    await expect(googleButton).toHaveClass(/btn/);
    await expect(discordButton).toHaveClass(/btn/);
    
    // Check SVG icons are present
    await expect(googleButton.locator('svg')).toBeVisible();
    await expect(discordButton.locator('svg')).toBeVisible();
  });

  test('should handle Google OAuth click (redirect)', async ({ page }) => {
    // Mock the OAuth redirect since we can't complete full OAuth flow in tests
    await page.route('/api/auth/social/google/login', route => {
      route.fulfill({
        status: 302,
        headers: {
          'Location': '/login?error=OAuth+not+configured'
        }
      });
    });

    const googleButton = page.locator('button:has-text("Google")');
    await googleButton.click();
    
    // Should redirect to Google OAuth endpoint
    await expect(page).toHaveURL(/.*error=OAuth.*configured.*/);
  });

  test('should handle Discord OAuth click (redirect)', async ({ page }) => {
    // Mock the OAuth redirect since we can't complete full OAuth flow in tests
    await page.route('/api/auth/social/discord/login', route => {
      route.fulfill({
        status: 302,
        headers: {
          'Location': '/login?error=OAuth+not+configured'
        }
      });
    });

    const discordButton = page.locator('button:has-text("Discord")');
    await discordButton.click();
    
    // Should redirect to Discord OAuth endpoint
    await expect(page).toHaveURL(/.*error=OAuth.*configured.*/);
  });

  test('should show social login section with proper divider', async ({ page }) => {
    const socialSection = page.locator('.social-login');
    await expect(socialSection).toBeVisible();
    
    // Check "Or continue with" text
    const dividerText = page.locator('text=Or continue with');
    await expect(dividerText).toBeVisible();
    
    // Check horizontal line styling
    const hr = page.locator('.social-login hr');
    await expect(hr).toBeVisible();
  });

  test('OAuth buttons should be accessible', async ({ page }) => {
    const googleButton = page.locator('button:has-text("Google")');
    const discordButton = page.locator('button:has-text("Discord")');
    
    // Check buttons are keyboard accessible
    await googleButton.focus();
    await expect(googleButton).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(discordButton).toBeFocused();
    
    // Check buttons have proper ARIA labels/text
    await expect(googleButton).toContainText('Google');
    await expect(discordButton).toContainText('Discord');
  });
});
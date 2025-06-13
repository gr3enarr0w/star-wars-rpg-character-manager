// tests/authentication-bugs.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Authentication Bug Fixes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the correct port
    await page.goto('http://localhost:8000');
  });

  test('should not show perpetual loading when not authenticated', async ({ page }) => {
    // Check that loading state resolves quickly
    await expect(page.locator('#userDisplay')).not.toHaveText('Loading...', { timeout: 5000 });
    
    // Should show login prompt instead
    await expect(page.locator('#loginPrompt')).toBeVisible();
    await expect(page.locator('#userDisplay')).toHaveText('Not logged in');
  });

  test('should create admin user and login successfully', async ({ page }) => {
    // Create admin user via debug endpoint
    const response = await page.request.post('/api/debug/create-admin');
    expect(response.ok()).toBeTruthy();
    
    // Navigate to login page
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL(/login/);
    
    // Login with correct credentials
    await page.fill('#email', 'admin@swrpg.local');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    // Should redirect to main page with successful login
    await expect(page.locator('.success-message')).toBeVisible();
    await page.waitForURL('/');
    
    // Should show authenticated state
    await expect(page.locator('#userDisplay')).toContainText('admin');
    await expect(page.locator('.auth-required')).toBeVisible();
  });

  test('should handle OAuth configuration errors gracefully on login', async ({ page }) => {
    await page.goto('/login');
    
    // Click Google OAuth button
    await page.click('button:has-text("Google")');
    
    // Should show error message instead of crashing
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('text=Google OAuth not configured')).toBeVisible();
  });

  test('should handle OAuth configuration errors gracefully on registration', async ({ page }) => {
    await page.goto('/register');
    
    // Check that OAuth buttons are present
    await expect(page.locator('button:has-text("Google")')).toBeVisible();
    await expect(page.locator('button:has-text("Discord")')).toBeVisible();
    
    // Click Google OAuth button
    await page.click('button:has-text("Google")');
    
    // Should show error message instead of crashing
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('text=Google OAuth not configured')).toBeVisible();
  });

  test('should have consistent OAuth options between login and register', async ({ page }) => {
    // Check login page
    await page.goto('/login');
    await expect(page.locator('button:has-text("Google")')).toBeVisible();
    await expect(page.locator('button:has-text("Discord")')).toBeVisible();
    
    // Check register page
    await page.goto('/register');
    await expect(page.locator('button:has-text("Google")')).toBeVisible();
    await expect(page.locator('button:has-text("Discord")')).toBeVisible();
    
    // Both pages should have "Or continue/register with" text
    await page.goto('/login');
    await expect(page.locator('text=Or continue with')).toBeVisible();
    
    await page.goto('/register');
    await expect(page.locator('text=Or register with')).toBeVisible();
  });

  test('should reject invalid credentials with proper error', async ({ page }) => {
    // Create admin first
    await page.request.post('/api/debug/create-admin');
    
    await page.goto('/login');
    
    // Try invalid credentials
    await page.fill('#email', 'invalid@test.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('text=Invalid username and password, text=Invalid email, text=Authentication failed')).toBeVisible();
    
    // Should stay on login page
    await expect(page).toHaveURL(/login/);
  });

  test('should handle network errors during authentication', async ({ page }) => {
    // Mock network failure for login
    await page.route('/api/auth/login', route => {
      route.abort('failed');
    });
    
    await page.goto('/login');
    await page.fill('#email', 'admin@swrpg.local');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    // Should show network error
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('text=Login failed, text=network, text=failed')).toBeVisible();
  });

  test('should show loading state during login', async ({ page }) => {
    // Create admin first
    await page.request.post('/api/debug/create-admin');
    
    // Mock delayed response
    await page.route('/api/auth/login', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            access_token: 'fake-token',
            user: { username: 'admin', role: 'admin' }
          })
        });
      }, 1000);
    });
    
    await page.goto('/login');
    await page.fill('#email', 'admin@swrpg.local');
    await page.fill('#password', 'admin123');
    
    // Click login and check button state
    await page.click('button[type="submit"]');
    
    // Button should be disabled and show loading text
    await expect(page.locator('#loginBtn')).toBeDisabled();
    await expect(page.locator('#loginBtn')).toHaveText('Logging in...');
  });

  test('should handle 2FA requirement gracefully', async ({ page }) => {
    // Mock 2FA required response
    await page.route('/api/auth/login', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Two-factor authentication token required',
          requires_2fa: true
        })
      });
    });
    
    await page.goto('/login');
    await page.fill('#email', 'admin@swrpg.local');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    // Should show 2FA section
    await expect(page.locator('#twoFactorSection')).toBeVisible();
    await expect(page.locator('#twoFactorToken')).toBeVisible();
    await expect(page.locator('text=Please enter your two-factor authentication code')).toBeVisible();
  });

  test('should maintain session state across page refreshes', async ({ page }) => {
    // Create admin and login
    await page.request.post('/api/debug/create-admin');
    await page.goto('/login');
    await page.fill('#email', 'admin@swrpg.local');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await page.waitForURL('/');
    await expect(page.locator('#userDisplay')).toContainText('admin');
    
    // Refresh page
    await page.reload();
    
    // Should still be logged in
    await expect(page.locator('#userDisplay')).toContainText('admin');
    await expect(page.locator('.auth-required')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Create admin and login
    await page.request.post('/api/debug/create-admin');
    await page.goto('/login');
    await page.fill('#email', 'admin@swrpg.local');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/');
    
    // Logout
    await page.click('#userMenuToggle');
    await page.click('text=Logout');
    
    // Should show login prompt
    await expect(page.locator('#loginPrompt')).toBeVisible();
    await expect(page.locator('#userDisplay')).toHaveText('Not logged in');
  });

  test('should validate registration form with OAuth options', async ({ page }) => {
    await page.goto('/register');
    
    // Check that all required fields exist
    await expect(page.locator('#inviteCode')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
    
    // Check OAuth options are present
    await expect(page.locator('button:has-text("Google")')).toBeVisible();
    await expect(page.locator('button:has-text("Discord")')).toBeVisible();
    
    // Check password generator features
    await expect(page.locator('#generatePassword')).toBeVisible();
    await expect(page.locator('#togglePassword')).toBeVisible();
  });
});
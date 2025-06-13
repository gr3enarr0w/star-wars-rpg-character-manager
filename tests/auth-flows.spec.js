// tests/auth-flows.spec.js
const { test, expect } = require('@playwright/test');
const { loginUser, ADMIN_USER } = require('./auth.setup.js');

test.describe('Authentication & Security Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Create admin user before each test
    await page.request.post('/api/debug/create-admin');
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[name="email"]', ADMIN_USER.email);
    await page.fill('input[name="password"]', ADMIN_USER.password);
    
    // Submit and verify success
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Login successful')).toBeVisible();
    
    // Should redirect to main page
    await page.waitForURL('/');
    
    // Wait for authentication to complete and user display to show admin info
    await expect(page.locator('#userDisplay')).toContainText('admin');
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Try invalid credentials
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    // Should show error and stay on login page
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  test('should display OAuth login buttons', async ({ page }) => {
    await page.goto('/login');
    
    // Check Google login button
    const googleButton = page.locator('button:has-text("Google")');
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toHaveCSS('background-color', 'rgb(66, 133, 244)');
    
    // Check Discord login button
    const discordButton = page.locator('button:has-text("Discord")');
    await expect(discordButton).toBeVisible();
    await expect(discordButton).toHaveCSS('background-color', 'rgb(88, 101, 242)');
  });

  test('should handle session management', async ({ page }) => {
    // Login
    await loginUser(page, ADMIN_USER);
    
    // Verify authenticated state - user display should show admin info
    await expect(page.locator('#userDisplay')).toContainText('admin');
    
    // Test logout
    await page.click('#userMenuToggle');
    await page.click('text=Logout');
    
    // Should redirect to login
    await expect(page.locator('text=Login')).toBeVisible();
  });

  test('should handle token expiration', async ({ page }) => {
    await loginUser(page, ADMIN_USER);
    
    // Clear token to simulate expiration
    await page.evaluate(() => localStorage.removeItem('access_token'));
    
    // Navigate to protected route
    await page.goto('/');
    
    // Should redirect to login
    await expect(page.locator('#loginPrompt')).toBeVisible();
  });
});
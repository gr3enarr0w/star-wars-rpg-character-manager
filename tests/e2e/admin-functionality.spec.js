// tests/admin-functionality.spec.js
const { test, expect } = require('@playwright/test');
const { loginUser, ADMIN_USER } = require('./auth.setup.js');

test.describe('Admin Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Create admin and login
    await page.request.post('/api/debug/create-admin');
    await loginUser(page, ADMIN_USER);
  });

  test('should display admin panel link for admin users', async ({ page }) => {
    // Open user menu
    await page.click('#userMenuToggle');
    await expect(page.locator('#userMenuDropdown')).toHaveClass(/show/);
    
    // Should show admin panel link
    await expect(page.locator('a[href="/admin"]:has-text("Admin Panel")')).toBeVisible();
  });

  test('should access admin panel functionality', async ({ page }) => {
    // Open user menu and click admin panel
    await page.click('#userMenuToggle');
    await page.click('text=Admin Panel');
    
    // Should open admin modal
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-title:has-text("Admin Panel")')).toBeVisible();
  });

  test('should generate invite codes', async ({ page }) => {
    // Open admin panel
    await page.click('#userMenuToggle');
    await page.click('text=Admin Panel');
    
    // Fill invite form
    await page.selectOption('select[name="role"]', 'player');
    await page.fill('input[name="expires_in_days"]', '7');
    
    // Generate invite code
    await page.click('button:has-text("Generate Invite Code")');
    
    // Should show generated code
    await expect(page.locator('#invite-result')).toBeVisible();
    await expect(page.locator('#generated-code')).toHaveValue(/.+/);
  });

  test('should validate invite form fields', async ({ page }) => {
    // Open admin panel
    await page.click('#userMenuToggle');
    await page.click('text=Admin Panel');
    
    // Clear expires field and try to generate
    await page.fill('input[name="expires_in_days"]', '');
    await page.click('button:has-text("Generate Invite Code")');
    
    // Should show validation error
    await expect(page.locator('input[name="expires_in_days"]:invalid')).toBeVisible();
  });

  test('should copy invite code to clipboard', async ({ page }) => {
    // Open admin panel and generate code
    await page.click('#userMenuToggle');
    await page.click('text=Admin Panel');
    await page.selectOption('select[name="role"]', 'gamemaster');
    await page.click('button:has-text("Generate Invite Code")');
    
    // Wait for code to be generated
    await expect(page.locator('#invite-result')).toBeVisible();
    
    // Click copy button
    await page.click('button:has-text("Copy")');
    
    // Note: Testing clipboard requires special permissions in Playwright
    // This test verifies the copy button exists and is clickable
  });

  test('should close admin modal', async ({ page }) => {
    // Open admin panel
    await page.click('#userMenuToggle');
    await page.click('text=Admin Panel');
    
    // Verify modal is open
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    // Close modal
    await page.click('button:has-text("Close")');
    
    // Modal should be closed
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });

  test('should handle different user roles for invites', async ({ page }) => {
    // Open admin panel
    await page.click('#userMenuToggle');
    await page.click('text=Admin Panel');
    
    // Test each role option
    const roles = ['player', 'gamemaster', 'admin'];
    
    for (const role of roles) {
      await page.selectOption('select[name="role"]', role);
      await page.click('button:has-text("Generate Invite Code")');
      
      // Should generate code for each role
      await expect(page.locator('#invite-result')).toBeVisible();
      
      // Clear result for next iteration
      await page.locator('#invite-result').evaluate(el => el.style.display = 'none');
    }
  });

  test('should validate expires_in_days limits', async ({ page }) => {
    // Open admin panel
    await page.click('#userMenuToggle');
    await page.click('text=Admin Panel');
    
    // Test minimum value
    await page.fill('input[name="expires_in_days"]', '0');
    await expect(page.locator('input[name="expires_in_days"]:invalid')).toBeVisible();
    
    // Test valid value
    await page.fill('input[name="expires_in_days"]', '30');
    await expect(page.locator('input[name="expires_in_days"]:valid')).toBeVisible();
    
    // Test maximum value
    await page.fill('input[name="expires_in_days"]', '400');
    await expect(page.locator('input[name="expires_in_days"]:invalid')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('/api/admin/invite', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Open admin panel and try to generate invite
    await page.click('#userMenuToggle');
    await page.click('text=Admin Panel');
    await page.selectOption('select[name="role"]', 'player');
    await page.click('button:has-text("Generate Invite Code")');
    
    // Should show error message
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Error generating invite code');
      await dialog.accept();
    });
  });

  test('should not show admin features for non-admin users', async ({ page }) => {
    // Logout current admin
    await page.click('#userMenuToggle');
    await page.click('text=Logout');
    
    // Create and login as regular user
    const regularUser = { email: 'player@test.com', password: 'TestPassword123!' };
    await page.request.post('/api/debug/create-user', {
      data: regularUser
    });
    await loginUser(page, regularUser);
    
    // Open user menu
    await page.click('#userMenuToggle');
    
    // Should not show admin panel link
    await expect(page.locator('text=Admin Panel')).not.toBeVisible();
  });
});
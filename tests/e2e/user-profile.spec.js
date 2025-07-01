// tests/user-profile.spec.js
const { test, expect } = require('@playwright/test');
const { loginUser, ADMIN_USER } = require('./auth.setup.js');

test.describe('User Profile & Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Create admin and login
    await page.request.post('/api/debug/create-admin');
    await loginUser(page, ADMIN_USER);
  });

  test('should open profile settings from user menu', async ({ page }) => {
    // Open user menu
    await page.click('#userMenuToggle');
    await expect(page.locator('#userMenuDropdown')).toHaveClass(/show/);
    
    // Click Profile Settings
    await page.click('text=Profile Settings');
    
    // Should open profile modal
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-title:has-text("Profile Settings")')).toBeVisible();
  });

  test('should display user account information', async ({ page }) => {
    // Open profile settings
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    // Should show account info section
    await expect(page.locator('h4:has-text("Account Information")')).toBeVisible();
    await expect(page.locator('#profile-username')).toContainText('admin');
    await expect(page.locator('#profile-role')).toContainText('admin');
    await expect(page.locator('#profile-2fa')).toBeVisible();
  });

  test('should display password change form', async ({ page }) => {
    // Open profile settings
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    // Should show password change section
    await expect(page.locator('h4:has-text("Change Password")')).toBeVisible();
    await expect(page.locator('input[name="current_password"]')).toBeVisible();
    await expect(page.locator('input[name="new_password"]')).toBeVisible();
    await expect(page.locator('input[name="confirm_password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Change Password")')).toBeVisible();
  });

  test('should validate password change form', async ({ page }) => {
    // Open profile settings
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    // Fill password form with mismatched passwords
    await page.fill('input[name="current_password"]', 'current123');
    await page.fill('input[name="new_password"]', 'newpassword123');
    await page.fill('input[name="confirm_password"]', 'differentpassword');
    
    // Try to change password
    await page.click('button:has-text("Change Password")');
    
    // Should show validation error
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('New passwords do not match');
      await dialog.accept();
    });
  });

  test('should validate password strength requirements', async ({ page }) => {
    // Open profile settings
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    // Fill password form with weak password
    await page.fill('input[name="current_password"]', 'current123');
    await page.fill('input[name="new_password"]', '123');
    await page.fill('input[name="confirm_password"]', '123');
    
    // Try to change password
    await page.click('button:has-text("Change Password")');
    
    // Should show strength error
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('at least 8 characters');
      await dialog.accept();
    });
  });

  test('should change password with valid data', async ({ page }) => {
    // Mock successful password change
    await page.route('/api/auth/change-password', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Password changed successfully' })
      });
    });
    
    // Open profile settings
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    // Fill password form correctly
    await page.fill('input[name="current_password"]', 'AdminPassword123!@#$');
    await page.fill('input[name="new_password"]', 'NewPassword123!');
    await page.fill('input[name="confirm_password"]', 'NewPassword123!');
    
    // Change password
    await page.click('button:has-text("Change Password")');
    
    // Should show success message
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Password changed successfully');
      await dialog.accept();
    });
  });

  test('should display user preferences section', async ({ page }) => {
    // Open profile settings
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    // Should show preferences section
    await expect(page.locator('h4:has-text("User Preferences")')).toBeVisible();
    await expect(page.locator('select[name="theme"]')).toBeVisible();
    await expect(page.locator('select[name="default_view"]')).toBeVisible();
    await expect(page.locator('input[name="show_advanced"]')).toBeVisible();
    await expect(page.locator('input[name="auto_save"]')).toBeVisible();
  });

  test('should save profile settings', async ({ page }) => {
    // Open profile settings
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    // Change some preferences
    await page.selectOption('select[name="theme"]', 'light');
    await page.selectOption('select[name="default_view"]', 'recent');
    await page.uncheck('input[name="show_advanced"]');
    
    // Save settings
    await page.click('button:has-text("Save Settings")');
    
    // Should show success message
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Settings saved successfully');
      await dialog.accept();
    });
  });

  test('should close profile modal', async ({ page }) => {
    // Open profile settings
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    // Verify modal is open
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    // Close modal using X button
    await page.click('button:has-text("×")');
    
    // Modal should be closed
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });

  test('should close modal using close button', async ({ page }) => {
    // Open profile settings
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    // Close modal using Close button
    await page.click('button:has-text("Close")');
    
    // Modal should be closed
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });

  test('should enable 2FA from profile settings', async ({ page }) => {
    // Open profile settings
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    // Check if 2FA enable button is visible (when 2FA is disabled)
    const enableButton = page.locator('button:has-text("Enable 2FA")');
    if (await enableButton.isVisible()) {
      await enableButton.click();
      
      // Should open 2FA setup modal
      await expect(page.locator('.modal-title:has-text("Two-Factor Authentication Setup")')).toBeVisible();
    }
  });

  test('should handle password change API errors', async ({ page }) => {
    // Mock API error
    await page.route('/api/auth/change-password', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Current password is incorrect' })
      });
    });
    
    // Open profile settings and try password change
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    await page.fill('input[name="current_password"]', 'wrongpassword');
    await page.fill('input[name="new_password"]', 'NewPassword123!');
    await page.fill('input[name="confirm_password"]', 'NewPassword123!');
    
    await page.click('button:has-text("Change Password")');
    
    // Should show API error
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Current password is incorrect');
      await dialog.accept();
    });
  });

  test('should maintain user display during session', async ({ page }) => {
    // Check user display shows correct info
    await expect(page.locator('#userDisplay')).toContainText('admin (admin)');
    
    // Open and close profile modal
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    await page.click('button:has-text("Close")');
    
    // User display should remain unchanged
    await expect(page.locator('#userDisplay')).toContainText('admin (admin)');
  });

  test('should reset password form after successful change', async ({ page }) => {
    // Mock successful password change
    await page.route('/api/auth/change-password', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Password changed successfully' })
      });
    });
    
    // Open profile settings and change password
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    await page.fill('input[name="current_password"]', 'AdminPassword123!@#$');
    await page.fill('input[name="new_password"]', 'NewPassword123!');
    await page.fill('input[name="confirm_password"]', 'NewPassword123!');
    
    await page.click('button:has-text("Change Password")');
    
    // Handle success dialog
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    // Wait for form reset (form should be cleared)
    await page.waitForTimeout(500);
    
    // Password fields should be empty
    await expect(page.locator('input[name="current_password"]')).toHaveValue('');
    await expect(page.locator('input[name="new_password"]')).toHaveValue('');
    await expect(page.locator('input[name="confirm_password"]')).toHaveValue('');
  });
});
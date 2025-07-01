// tests/password-change.spec.js
const { test, expect } = require('@playwright/test');
const { loginUser, ADMIN_USER } = require('./auth.setup.js');

test.describe('Password Change Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Create admin and login
    await page.request.post('/api/debug/create-admin');
    await loginUser(page, ADMIN_USER);
  });

  test('should access password change from profile settings', async ({ page }) => {
    // Open user menu
    await page.click('#userMenuToggle');
    await expect(page.locator('#userMenuDropdown')).toHaveClass(/show/);
    
    // Click profile settings
    await page.click('text=Profile Settings');
    
    // Should navigate to profile page
    await expect(page).toHaveURL(/profile/);
    await expect(page.locator('h1:has-text("Account Settings")')).toBeVisible();
    
    // Navigate to security tab
    await page.click('button:has-text("Security & Privacy")');
    await expect(page.locator('#tab-security')).toBeVisible();
    
    // Check for password change section
    await expect(page.locator('text=Password Security')).toBeVisible();
    await expect(page.locator('#password-form')).toBeVisible();
  });

  test('should display password change form with required fields', async ({ page }) => {
    // Navigate to security settings
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    await expect(page).toHaveURL(/profile/);
    
    // Switch to security tab
    await page.click('button:has-text("Security & Privacy")');
    await expect(page.locator('#tab-security')).toBeVisible();
    
    // Check all password form fields are present
    await expect(page.locator('#current_password')).toBeVisible();
    await expect(page.locator('#new_password')).toBeVisible();
    await expect(page.locator('#confirm_password')).toBeVisible();
    
    // Check submit button
    await expect(page.locator('#password-form button[type="submit"]')).toBeVisible();
    
    // Check all fields are password type
    await expect(page.locator('#current_password')).toHaveAttribute('type', 'password');
    await expect(page.locator('#new_password')).toHaveAttribute('type', 'password');
    await expect(page.locator('#confirm_password')).toHaveAttribute('type', 'password');
    
    // Check all fields are required
    await expect(page.locator('#current_password')).toHaveAttribute('required');
    await expect(page.locator('#new_password')).toHaveAttribute('required');
    await expect(page.locator('#confirm_password')).toHaveAttribute('required');
  });

  test('should successfully change password with valid data', async ({ page }) => {
    // Mock successful password change API
    await page.route('/api/auth/change-password', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Password changed successfully'
        })
      });
    });

    // Open profile settings
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    // Fill password change form
    await page.fill('input[name="current_password"]', ADMIN_USER.password);
    await page.fill('input[name="new_password"]', 'NewSecurePassword123456789#');
    await page.fill('input[name="confirm_password"]', 'NewSecurePassword123456789#');
    
    // Submit form
    await page.click('button:has-text("Change Password")');
    
    // Should show success message
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('text=Password changed successfully')).toBeVisible();
  });

  test('should validate current password is correct', async ({ page }) => {
    // Mock API response for wrong current password
    await page.route('/api/auth/change-password', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Current password is incorrect'
        })
      });
    });

    // Open profile settings and fill form with wrong current password
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    await page.fill('input[name="current_password"]', 'wrongpassword');
    await page.fill('input[name="new_password"]', 'NewSecurePassword123456789#');
    await page.fill('input[name="confirm_password"]', 'NewSecurePassword123456789#');
    
    await page.click('button:has-text("Change Password")');
    
    // Should show error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('text=Current password is incorrect')).toBeVisible();
  });

  test('should validate new password confirmation match', async ({ page }) => {
    // Open profile settings
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    // Fill form with mismatched new passwords
    await page.fill('input[name="current_password"]', ADMIN_USER.password);
    await page.fill('input[name="new_password"]', 'NewSecurePassword123456789#');
    await page.fill('input[name="confirm_password"]', 'DifferentPassword123456789#');
    
    await page.click('button:has-text("Change Password")');
    
    // Should show validation error
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('text=New passwords do not match')).toBeVisible();
  });

  test('should validate new password strength requirements', async ({ page }) => {
    // Mock API response for weak password
    await page.route('/api/auth/change-password', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Password must be at least 20 characters long with uppercase, lowercase, numbers, and special characters'
        })
      });
    });

    // Open profile settings and try weak password
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    await page.fill('input[name="current_password"]', ADMIN_USER.password);
    await page.fill('input[name="new_password"]', 'weak123');
    await page.fill('input[name="confirm_password"]', 'weak123');
    
    await page.click('button:has-text("Change Password")');
    
    // Should show password strength error
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('text=Password must be at least 20 characters')).toBeVisible();
  });

  test('should prevent same password as current', async ({ page }) => {
    // Mock API response for same password
    await page.route('/api/auth/change-password', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'New password must be different from current password'
        })
      });
    });

    // Open profile settings and try same password
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    await page.fill('input[name="current_password"]', ADMIN_USER.password);
    await page.fill('input[name="new_password"]', ADMIN_USER.password);
    await page.fill('input[name="confirm_password"]', ADMIN_USER.password);
    
    await page.click('button:has-text("Change Password")');
    
    // Should show error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('text=New password must be different')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Open profile settings
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    // Try to submit empty form
    await page.click('button:has-text("Change Password")');
    
    // Check HTML5 validation kicks in for required fields
    const currentPasswordField = page.locator('input[name="current_password"]');
    const newPasswordField = page.locator('input[name="new_password"]');
    const confirmPasswordField = page.locator('input[name="confirm_password"]');
    
    // These fields should have required attribute
    await expect(currentPasswordField).toHaveAttribute('required');
    await expect(newPasswordField).toHaveAttribute('required');
    await expect(confirmPasswordField).toHaveAttribute('required');
  });

  test('should show loading state during password change', async ({ page }) => {
    // Mock slow API response
    await page.route('/api/auth/change-password', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Password changed successfully'
          })
        });
      }, 1000);
    });

    // Open profile settings and fill form
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    await page.fill('input[name="current_password"]', ADMIN_USER.password);
    await page.fill('input[name="new_password"]', 'NewSecurePassword123456789#');
    await page.fill('input[name="confirm_password"]', 'NewSecurePassword123456789#');
    
    // Submit and check button state changes
    await page.click('button:has-text("Change Password")');
    
    // Button should be disabled and show loading text
    const submitButton = page.locator('button:has-text("Changing Password...")');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock server error
    await page.route('/api/auth/change-password', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error'
        })
      });
    });

    // Open profile settings and fill form
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    await page.fill('input[name="current_password"]', ADMIN_USER.password);
    await page.fill('input[name="new_password"]', 'NewSecurePassword123456789#');
    await page.fill('input[name="confirm_password"]', 'NewSecurePassword123456789#');
    
    await page.click('button:has-text("Change Password")');
    
    // Should show generic error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('text=An error occurred while changing password')).toBeVisible();
  });

  test('should clear form on successful password change', async ({ page }) => {
    // Mock successful password change
    await page.route('/api/auth/change-password', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Password changed successfully'
        })
      });
    });

    // Open profile settings and fill form
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    await page.fill('input[name="current_password"]', ADMIN_USER.password);
    await page.fill('input[name="new_password"]', 'NewSecurePassword123456789#');
    await page.fill('input[name="confirm_password"]', 'NewSecurePassword123456789#');
    
    await page.click('button:has-text("Change Password")');
    
    // Wait for success message
    await expect(page.locator('.success-message')).toBeVisible();
    
    // Form fields should be cleared
    await expect(page.locator('input[name="current_password"]')).toHaveValue('');
    await expect(page.locator('input[name="new_password"]')).toHaveValue('');
    await expect(page.locator('input[name="confirm_password"]')).toHaveValue('');
  });

  test('should not require authentication for authenticated users', async ({ page }) => {
    // User is already logged in from beforeEach
    // Open profile settings
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    // Should be able to access password change form without additional auth
    await expect(page.locator('#change-password-form')).toBeVisible();
    await expect(page.locator('input[name="current_password"]')).toBeVisible();
  });

  test('should handle network errors', async ({ page }) => {
    // Mock network error
    await page.route('/api/auth/change-password', route => {
      route.abort();
    });

    // Open profile settings and fill form
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    await page.fill('input[name="current_password"]', ADMIN_USER.password);
    await page.fill('input[name="new_password"]', 'NewSecurePassword123456789#');
    await page.fill('input[name="confirm_password"]', 'NewSecurePassword123456789#');
    
    await page.click('button:has-text("Change Password")');
    
    // Should show network error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('text=Network error. Please try again.')).toBeVisible();
  });
});
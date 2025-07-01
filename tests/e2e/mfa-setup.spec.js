// tests/mfa-setup.spec.js
const { test, expect } = require('@playwright/test');
const { loginUser, ADMIN_USER } = require('./auth.setup.js');

test.describe('MFA Setup (Two-Factor Authentication)', () => {
  test.beforeEach(async ({ page }) => {
    // Create admin and login
    await page.request.post('/api/debug/create-admin');
    await loginUser(page, ADMIN_USER);
  });

  test('should access 2FA setup from profile settings', async ({ page }) => {
    // Open user menu
    await page.click('#userMenuToggle');
    await expect(page.locator('#userMenuDropdown')).toHaveClass(/show/);
    
    // Click profile settings
    await page.click('text=Profile Settings');
    
    // Should open profile modal
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-title:has-text("Profile Settings")')).toBeVisible();
    
    // Check for 2FA section in profile
    await expect(page.locator('text=Two-Factor Authentication')).toBeVisible();
  });

  test('should access 2FA setup from user menu', async ({ page }) => {
    // Open user menu
    await page.click('#userMenuToggle');
    await expect(page.locator('#userMenuDropdown')).toHaveClass(/show/);
    
    // Click Two-Factor Authentication
    await page.click('text=Two-Factor Authentication');
    
    // Should open 2FA setup modal
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-title:has-text("Two-Factor Authentication Setup")')).toBeVisible();
  });

  test('should show 2FA setup wizard step 1', async ({ page }) => {
    // Open 2FA setup
    await page.click('#userMenuToggle');
    await page.click('text=Two-Factor Authentication');
    
    // Should show step 1 with app instructions
    await expect(page.locator('#twofa-step1')).toBeVisible();
    await expect(page.locator('text=Install an authenticator app')).toBeVisible();
    
    // Check authenticator app list
    await expect(page.locator('text=Google Authenticator')).toBeVisible();
    await expect(page.locator('text=Microsoft Authenticator')).toBeVisible();
    await expect(page.locator('text=Authy')).toBeVisible();
    await expect(page.locator('text=1Password')).toBeVisible();
    
    // Check generate button
    await expect(page.locator('button:has-text("Generate Setup Code")')).toBeVisible();
  });

  test('should progress to step 2 with QR code', async ({ page }) => {
    // Mock the 2FA setup API call
    await page.route('/api/auth/setup-2fa', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          secret: 'V6N7VFMK26GHE3RS7R2P3APYMHPZ4GMA',
          qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          backup_codes: ['CODE1234', 'CODE5678', 'CODE9012', 'CODEBCDE', 'CODEFGHI']
        })
      });
    });

    // Open 2FA setup and start
    await page.click('#userMenuToggle');
    await page.click('text=Two-Factor Authentication');
    await page.click('button:has-text("Generate Setup Code")');
    
    // Should show step 2
    await expect(page.locator('#twofa-step2')).toBeVisible();
    await expect(page.locator('text=Scan QR Code')).toBeVisible();
    
    // Check QR code is displayed
    await expect(page.locator('#qr-code-placeholder img')).toBeVisible();
    
    // Check backup codes section
    await expect(page.locator('text=Backup Codes')).toBeVisible();
    await expect(page.locator('#backup-codes-list')).toBeVisible();
    await expect(page.locator('text=CODE1234')).toBeVisible();
    
    // Check download backup codes button
    await expect(page.locator('button:has-text("Download Backup Codes")')).toBeVisible();
    
    // Check continue button
    await expect(page.locator('button:has-text("Continue to Verification")')).toBeVisible();
  });

  test('should progress to step 3 verification', async ({ page }) => {
    // Mock the 2FA setup API call
    await page.route('/api/auth/setup-2fa', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          secret: 'V6N7VFMK26GHE3RS7R2P3APYMHPZ4GMA',
          qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          backup_codes: ['CODE1234', 'CODE5678']
        })
      });
    });

    // Go through steps 1 and 2
    await page.click('#userMenuToggle');
    await page.click('text=Two-Factor Authentication');
    await page.click('button:has-text("Generate Setup Code")');
    await page.click('button:has-text("Continue to Verification")');
    
    // Should show step 3
    await expect(page.locator('#twofa-step3')).toBeVisible();
    await expect(page.locator('text=Verify Setup')).toBeVisible();
    
    // Check verification form
    await expect(page.locator('input[name="token"]')).toBeVisible();
    await expect(page.locator('input[name="token"]')).toHaveAttribute('maxlength', '6');
    await expect(page.locator('input[name="token"]')).toHaveAttribute('placeholder', '123456');
    
    // Check verify button
    await expect(page.locator('button:has-text("Verify and Enable 2FA")')).toBeVisible();
  });

  test('should complete 2FA setup verification', async ({ page }) => {
    // Mock the setup and verification API calls
    await page.route('/api/auth/setup-2fa', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          secret: 'V6N7VFMK26GHE3RS7R2P3APYMHPZ4GMA',
          qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          backup_codes: ['CODE1234', 'CODE5678']
        })
      });
    });

    await page.route('/api/auth/verify-2fa-setup', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Two-factor authentication enabled successfully'
        })
      });
    });

    // Complete full 2FA setup flow
    await page.click('#userMenuToggle');
    await page.click('text=Two-Factor Authentication');
    await page.click('button:has-text("Generate Setup Code")');
    await page.click('button:has-text("Continue to Verification")');
    
    // Enter verification token
    await page.fill('input[name="token"]', '123456');
    await page.click('button:has-text("Verify and Enable 2FA")');
    
    // Should show success message and reload
    await page.waitForFunction(() => window.location.href.includes('/'));
  });

  test('should handle 2FA setup errors gracefully', async ({ page }) => {
    // Mock error response
    await page.route('/api/auth/setup-2fa', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Failed to set up 2FA'
        })
      });
    });

    // Try to start 2FA setup
    await page.click('#userMenuToggle');
    await page.click('text=Two-Factor Authentication');
    await page.click('button:has-text("Generate Setup Code")');
    
    // Should show error alert
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Error setting up 2FA');
      dialog.accept();
    });
  });

  test('should validate token format in step 3', async ({ page }) => {
    // Mock setup
    await page.route('/api/auth/setup-2fa', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          secret: 'TEST',
          qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          backup_codes: ['CODE1234']
        })
      });
    });

    // Go to verification step
    await page.click('#userMenuToggle');
    await page.click('text=Two-Factor Authentication');
    await page.click('button:has-text("Generate Setup Code")');
    await page.click('button:has-text("Continue to Verification")');
    
    // Try with invalid token (too short)
    await page.fill('input[name="token"]', '123');
    await page.click('button:has-text("Verify and Enable 2FA")');
    
    // Should show validation error
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('6-digit code');
      dialog.accept();
    });
  });
});
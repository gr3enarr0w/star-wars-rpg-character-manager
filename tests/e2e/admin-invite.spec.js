// tests/admin-invite.spec.js
const { test, expect } = require('@playwright/test');
const { loginUser, ADMIN_USER } = require('./auth.setup.js');

test.describe('Admin Invite Code Management', () => {
  test.beforeEach(async ({ page }) => {
    // Create admin and login
    await page.request.post('/api/debug/create-admin');
    await loginUser(page, ADMIN_USER);
  });

  test('should show admin panel option for admin users', async ({ page }) => {
    // Open user menu
    await page.click('#userMenuToggle');
    await expect(page.locator('#userMenuDropdown')).toHaveClass(/show/);
    
    // Admin should see admin panel option
    const adminLink = page.locator('.admin-only');
    await expect(adminLink).toBeVisible();
    await expect(adminLink).toHaveAttribute('href', '/admin');
  });

  test('should access invite generation from profile settings (admin section)', async ({ page }) => {
    // For now, since admin invite UI is in profile modal, test via API
    // This test validates the API endpoint works
    const response = await page.request.post('/api/admin/invite', {
      data: {
        role: 'player',
        expires_in_days: 7
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.invite_code).toBeTruthy();
    expect(result.role).toBe('player');
    expect(result.expires_in_days).toBe(7);
  });

  test('should generate invite codes for different roles', async ({ page }) => {
    // Test player role
    const playerResponse = await page.request.post('/api/admin/invite', {
      data: {
        role: 'player',
        expires_in_days: 7
      }
    });
    expect(playerResponse.ok()).toBeTruthy();
    const playerResult = await playerResponse.json();
    expect(playerResult.role).toBe('player');

    // Test gamemaster role
    const gmResponse = await page.request.post('/api/admin/invite', {
      data: {
        role: 'gamemaster',
        expires_in_days: 14
      }
    });
    expect(gmResponse.ok()).toBeTruthy();
    const gmResult = await gmResponse.json();
    expect(gmResult.role).toBe('gamemaster');

    // Test admin role
    const adminResponse = await page.request.post('/api/admin/invite', {
      data: {
        role: 'admin',
        expires_in_days: 3
      }
    });
    expect(adminResponse.ok()).toBeTruthy();
    const adminResult = await adminResponse.json();
    expect(adminResult.role).toBe('admin');
  });

  test('should generate unique invite codes', async ({ page }) => {
    // Generate multiple invite codes
    const response1 = await page.request.post('/api/admin/invite', {
      data: { role: 'player', expires_in_days: 7 }
    });
    const response2 = await page.request.post('/api/admin/invite', {
      data: { role: 'player', expires_in_days: 7 }
    });
    
    expect(response1.ok()).toBeTruthy();
    expect(response2.ok()).toBeTruthy();
    
    const result1 = await response1.json();
    const result2 = await response2.json();
    
    // Codes should be different
    expect(result1.invite_code).not.toBe(result2.invite_code);
    
    // Codes should be proper format (12 characters, alphanumeric)
    expect(result1.invite_code).toMatch(/^[A-Z0-9]{12}$/);
    expect(result2.invite_code).toMatch(/^[A-Z0-9]{12}$/);
  });

  test('should validate invite code parameters', async ({ page }) => {
    // Test invalid role
    const invalidRoleResponse = await page.request.post('/api/admin/invite', {
      data: {
        role: 'invalid_role',
        expires_in_days: 7
      }
    });
    expect(invalidRoleResponse.ok()).toBeFalsy();

    // Test negative expiration
    const negativeExpirationResponse = await page.request.post('/api/admin/invite', {
      data: {
        role: 'player',
        expires_in_days: -1
      }
    });
    expect(negativeExpirationResponse.ok()).toBeFalsy();
  });

  test('should require admin authentication for invite generation', async ({ page }) => {
    // Logout first
    await page.click('#userMenuToggle');
    await page.click('text=Logout');
    
    // Try to generate invite without authentication
    const response = await page.request.post('/api/admin/invite', {
      data: {
        role: 'player',
        expires_in_days: 7
      }
    });
    
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(401);
  });

  test('should not allow non-admin users to generate invites', async ({ page }) => {
    // First create a test user and login as them
    const inviteResponse = await page.request.post('/api/admin/invite', {
      data: { role: 'player', expires_in_days: 7 }
    });
    const inviteResult = await inviteResponse.json();
    
    // Register test user
    await page.goto('/register');
    await page.fill('#inviteCode', inviteResult.invite_code);
    await page.fill('#email', 'testuser@example.com');
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'TestPassword123456789#');
    await page.fill('#confirmPassword', 'TestPassword123456789#');
    await page.click('button[type="submit"]');
    
    // Wait for registration and login as test user
    await page.waitForTimeout(2000);
    await page.goto('/login');
    await page.fill('#email', 'testuser@example.com');
    await page.fill('#password', 'TestPassword123456789#');
    await page.click('button[type="submit"]');
    
    // Try to generate invite as non-admin
    const nonAdminResponse = await page.request.post('/api/admin/invite', {
      data: { role: 'player', expires_in_days: 7 }
    });
    
    expect(nonAdminResponse.ok()).toBeFalsy();
    expect(nonAdminResponse.status()).toBe(403);
  });

  test('should handle invite generation errors gracefully', async ({ page }) => {
    // Mock server error
    await page.route('/api/admin/invite', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    const response = await page.request.post('/api/admin/invite', {
      data: { role: 'player', expires_in_days: 7 }
    });
    
    expect(response.ok()).toBeFalsy();
    const result = await response.json();
    expect(result.error).toBeTruthy();
  });

  test('should validate invite code format and security', async ({ page }) => {
    const response = await page.request.post('/api/admin/invite', {
      data: { role: 'player', expires_in_days: 7 }
    });
    
    const result = await response.json();
    const inviteCode = result.invite_code;
    
    // Should be 12 characters
    expect(inviteCode).toHaveLength(12);
    
    // Should only contain uppercase letters and numbers
    expect(inviteCode).toMatch(/^[A-Z0-9]+$/);
    
    // Should not contain easily confused characters (0, O, 1, I, etc.)
    expect(inviteCode).not.toMatch(/[01OI]/);
  });
});
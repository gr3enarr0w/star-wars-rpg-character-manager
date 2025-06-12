// tests/auth.setup.js
const { test, expect } = require('@playwright/test');

// Test data
const ADMIN_USER = {
  email: 'admin@swrpg.local',
  password: 'admin123'
};

const TEST_USER = {
  email: 'testuser@example.com', 
  password: 'TestPassword123456789#',
  username: 'testuser'
};

// Setup admin user
test('create admin user', async ({ request }) => {
  // Create admin user via API
  const response = await request.post('/api/debug/create-admin');
  expect(response.ok()).toBeTruthy();
});

// Export utilities
module.exports = {
  ADMIN_USER,
  TEST_USER,
  
  // Login helper
  async loginUser(page, userCredentials) {
    console.log('🔐 Starting login process...');
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    console.log('📝 Filling login form...');
    await page.fill('#email', userCredentials.email);
    await page.fill('#password', userCredentials.password);
    
    // Set up promises to wait for both navigation and success message
    console.log('🚀 Submitting form and waiting for redirect...');
    const navigationPromise = page.waitForURL('/', { timeout: 30000 });
    await page.click('button[type="submit"]');
    
    // Wait for the redirect to happen
    await navigationPromise;
    await page.waitForLoadState('networkidle');
    
    // Wait for authenticated content to be visible using computed style
    console.log('🔍 Waiting for authenticated content to appear...');
    await page.waitForFunction(() => {
      const authRequired = document.querySelector('.auth-required');
      return authRequired && window.getComputedStyle(authRequired).display !== 'none';
    }, { timeout: 15000 });
    
    // Wait for user display to show actual user data (not loading state)
    console.log('👤 Waiting for user data to load...');
    await page.waitForFunction(() => {
      const userDisplay = document.getElementById('userDisplay');
      if (!userDisplay) return false;
      const text = userDisplay.textContent.trim();
      return text && text !== 'Loading...' && text !== 'Not logged in' && text.includes('admin');
    }, { timeout: 15000 });
    
    console.log('✅ Login successful!');
  },

  // Create test user with invite code
  async createTestUser(page, inviteCode) {
    await page.goto('/register');
    await page.fill('#inviteCode', inviteCode);
    await page.fill('#email', TEST_USER.email);
    await page.fill('#username', TEST_USER.username);
    await page.fill('#password', TEST_USER.password);
    await page.fill('#confirmPassword', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for registration success
    await expect(page.locator('.success-message')).toBeVisible();
  },

  // Generate invite code as admin
  async generateInviteCode(page) {
    // Assume already logged in as admin
    await page.click('#userMenuToggle');
    await page.waitForSelector('#userMenuDropdown.show');
    
    // Click admin panel (not available in current UI, will need to add)
    // For now, use API directly
    const response = await page.request.post('/api/admin/invite', {
      data: {
        role: 'player',
        expires_in_days: 7
      }
    });
    
    const result = await response.json();
    return result.invite_code;
  }
};
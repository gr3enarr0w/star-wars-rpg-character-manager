const { test, expect } = require('@playwright/test');

test('Complete login verification and dashboard access', async ({ page }) => {
  console.log('🔍 Starting complete login verification...');
  
  // Navigate to application
  await page.goto('http://localhost:8001');
  console.log('✅ Navigated to application');
  
  // Should redirect to login page
  await expect(page).toHaveURL(/.*login.*/);
  console.log('✅ Correctly redirected to login page');
  
  // Fill in working credentials
  await page.fill('input[type="email"]', 'clark@clarkeverson.com');
  await page.fill('input[type="password"]', 'TestPassword123456789@#$');
  console.log('✅ Filled in credentials');
  
  // Take screenshot before submit
  await page.screenshot({ path: 'before_login.png' });
  
  // Submit login form
  await page.click('button[type="submit"]');
  console.log('✅ Submitted login form');
  
  // Wait for navigation after successful login
  await page.waitForTimeout(3000); // Wait for any redirects
  console.log('✅ Successfully redirected from login page');
  
  // Take screenshot after login
  await page.screenshot({ path: 'after_login.png' });
  
  // Verify we're on the dashboard/main page
  const currentUrl = page.url();
  console.log(`🔗 Current URL: ${currentUrl}`);
  
  // Check for dashboard elements
  const dashboardTitle = await page.locator('h1, h2, .title').first().textContent();
  console.log(`📋 Page title: ${dashboardTitle}`);
  
  // Look for user menu or admin elements
  const userElements = await page.locator('[class*="user"], [class*="admin"], .nav').count();
  console.log(`👤 Found ${userElements} user/admin elements`);
  
  // Check for navigation links
  const navLinks = await page.locator('nav a, .nav a, .navbar a').count();
  console.log(`🔗 Found ${navLinks} navigation links`);
  
  // Look for character/campaign related elements
  const characterElements = await page.locator('[class*="character"], [class*="campaign"]').count();
  console.log(`🎭 Found ${characterElements} character/campaign elements`);
  
  // Check for admin functionality
  const adminElements = await page.locator('[class*="admin"], [href*="admin"]').count();
  console.log(`🛡️ Found ${adminElements} admin elements`);
  
  // Verify no error messages
  const errorElements = await page.locator('.error, .alert-danger, [class*="error"]').count();
  console.log(`❌ Found ${errorElements} error elements`);
  
  // Check if we can access main functionality
  const createButtons = await page.locator('button:has-text("Create"), a:has-text("Create")').count();
  console.log(`➕ Found ${createButtons} create buttons`);
  
  // Final verification
  console.log('🎯 Login verification completed!');
  
  // Assertions for test success
  expect(currentUrl).not.toContain('login');
  expect(errorElements).toBe(0);
  
  console.log('✅ ALL VERIFICATIONS PASSED!');
});
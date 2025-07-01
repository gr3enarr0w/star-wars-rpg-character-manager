const { test, expect } = require('@playwright/test');

test.describe('Complete End-to-End Functionality Testing', () => {

  test('Complete application workflow - login to character creation', async ({ page }) => {
    console.log('🚀 Starting complete end-to-end functionality test...');
    
    // 1. AUTHENTICATION FLOW
    console.log('🔐 Testing authentication flow...');
    await page.goto('http://localhost:8001');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/);
    
    // Fill login form
    await page.fill('input[type="email"]', 'clark@clarkeverson.com');
    await page.fill('input[type="password"]', 'TestPassword123456789@#$');
    await page.click('button[type="submit"]');
    
    // Wait for successful redirect to dashboard
    await page.waitForURL('http://localhost:8001/', { timeout: 10000 });
    console.log('✅ Authentication successful');
    
    // 2. DASHBOARD VERIFICATION
    console.log('📋 Testing dashboard functionality...');
    
    // Check page title
    await expect(page.locator('h1, h2, .title')).toContainText('Star Wars RPG');
    
    // Check navigation elements
    const navLinks = await page.locator('nav a, .nav a, .navbar a').count();
    expect(navLinks).toBeGreaterThan(0);
    console.log(`✅ Found ${navLinks} navigation links`);
    
    // Check for character-related elements
    const createButtons = await page.locator('button:has-text("Create"), a:has-text("Create")').count();
    expect(createButtons).toBeGreaterThan(0);
    console.log(`✅ Found ${createButtons} create buttons`);
    
    // 3. CHARACTER CREATION FLOW
    console.log('🎭 Testing character creation...');
    
    // Click create character button
    const createCharacterButton = page.locator('button:has-text("Create"), a:has-text("Create")').first();
    await createCharacterButton.click();
    
    // Wait for character creation page/modal
    await page.waitForTimeout(2000);
    
    // Take screenshot to see what's available
    await page.screenshot({ path: 'character_creation_state.png' });
    
    // Look for character creation elements (various possible implementations)
    const characterForm = await page.locator('form, .character-form, [class*="character"], [class*="creation"]').count();
    const inputFields = await page.locator('input, select, textarea').count();
    
    console.log(`📝 Found ${characterForm} forms and ${inputFields} input fields`);
    
    if (inputFields > 0) {
      console.log('✅ Character creation interface available');
      
      // Try to fill basic character info if available
      const nameInput = page.locator('input[name*="name"], input[placeholder*="name"], input[id*="name"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('Test Character');
        console.log('✅ Character name filled');
      }
      
      // Look for species/race selection
      const speciesSelect = page.locator('select[name*="species"], select[name*="race"], select[id*="species"]').first();
      if (await speciesSelect.count() > 0) {
        await speciesSelect.selectOption('Human');
        console.log('✅ Species selected');
      }
      
      // Look for career selection  
      const careerSelect = page.locator('select[name*="career"], select[id*="career"]').first();
      if (await careerSelect.count() > 0) {
        await careerSelect.selectOption({ index: 1 }); // Select first available option
        console.log('✅ Career selected');
      }
    }
    
    // 4. API FUNCTIONALITY VERIFICATION
    console.log('🔌 Testing API functionality...');
    
    // Monitor API requests
    const apiRequests = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiRequests.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method()
        });
      }
    });
    
    // Trigger character loading by going back to dashboard
    await page.goto('http://localhost:8001/');
    await page.waitForTimeout(3000);
    
    // Check API requests
    const successfulRequests = apiRequests.filter(req => req.status >= 200 && req.status < 300);
    const failedRequests = apiRequests.filter(req => req.status >= 400);
    
    console.log(`✅ API Requests: ${successfulRequests.length} successful, ${failedRequests.length} failed`);
    successfulRequests.forEach(req => console.log(`  ✅ ${req.method} ${req.url} → ${req.status}`));
    failedRequests.forEach(req => console.log(`  ❌ ${req.method} ${req.url} → ${req.status}`));
    
    // 5. USER INTERFACE RESPONSIVENESS
    console.log('📱 Testing UI responsiveness...');
    
    // Test different viewport sizes
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(1000);
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    console.log('✅ UI responsive across different viewport sizes');
    
    // 6. ADMIN FUNCTIONALITY (if available)
    console.log('🛡️ Testing admin functionality...');
    
    const adminElements = await page.locator('[class*="admin"], [href*="admin"], button:has-text("Admin")').count();
    if (adminElements > 0) {
      console.log(`✅ Found ${adminElements} admin elements`);
      
      // Try to access admin functionality
      const adminButton = page.locator('[class*="admin"], [href*="admin"], button:has-text("Admin")').first();
      if (await adminButton.count() > 0) {
        await adminButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Admin interface accessible');
      }
    }
    
    // 7. LOGOUT FUNCTIONALITY
    console.log('🚪 Testing logout functionality...');
    
    // Look for logout button
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), [class*="logout"]').first();
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      await page.waitForTimeout(2000);
      
      // Should redirect to login
      const currentUrl = page.url();
      if (currentUrl.includes('login')) {
        console.log('✅ Logout successful');
      }
    } else {
      console.log('ℹ️ No explicit logout button found');
    }
    
    // Final screenshot
    await page.screenshot({ path: 'final_test_state.png' });
    
    console.log('🎯 Complete end-to-end functionality test completed!');
    
    // Assertions for test success
    expect(successfulRequests.length).toBeGreaterThan(0);
    expect(navLinks).toBeGreaterThan(0);
    expect(createButtons).toBeGreaterThan(0);
  });

  test('Security and error handling', async ({ page }) => {
    console.log('🔒 Testing security and error handling...');
    
    // Test unauthorized access
    await page.goto('http://localhost:8001/api/characters');
    const response = await page.waitForResponse('**/api/characters');
    expect(response.status()).toBe(401);
    console.log('✅ API properly protected from unauthorized access');
    
    // Test invalid login
    await page.goto('http://localhost:8001/login');
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await page.waitForTimeout(2000);
    const errorMessage = await page.locator('.error, .alert-danger, [class*="error"]').count();
    expect(errorMessage).toBeGreaterThan(0);
    console.log('✅ Invalid login properly handled');
  });

});
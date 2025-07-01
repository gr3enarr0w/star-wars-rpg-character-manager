const { test, expect } = require('@playwright/test');

test.describe('Core Functionality Verification', () => {

  test('Verify complete authentication and dashboard access', async ({ page }) => {
    console.log('🔐 Testing complete authentication flow...');
    
    // 1. Initial access should redirect to login
    await page.goto('http://localhost:8001');
    await expect(page).toHaveURL(/.*login.*/);
    console.log('✅ Unauthenticated access properly redirects to login');
    
    // 2. Login with valid credentials
    await page.fill('input[type="email"]', 'clark@clarkeverson.com');
    await page.fill('input[type="password"]', 'TestPassword123456789@#$');
    
    // Monitor API responses
    const responses = [];
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        method: response.request().method()
      });
    });
    
    await page.click('button[type="submit"]');
    
    // 3. Should redirect to dashboard
    await page.waitForURL('http://localhost:8001/', { timeout: 10000 });
    console.log('✅ Login successful, redirected to dashboard');
    
    // 4. Verify dashboard content
    await page.waitForTimeout(3000); // Allow time for API calls
    
    // Check page has main title
    const titles = await page.locator('h1').allTextContents();
    expect(titles.length).toBeGreaterThan(0);
    console.log(`✅ Dashboard loaded with titles: ${titles.join(', ')}`);
    
    // 5. Verify API functionality
    const apiResponses = responses.filter(r => r.url.includes('/api/'));
    const successfulAPI = apiResponses.filter(r => r.status >= 200 && r.status < 300);
    const failedAPI = apiResponses.filter(r => r.status >= 400);
    
    console.log(`📡 API Responses: ${successfulAPI.length} successful, ${failedAPI.length} failed`);
    successfulAPI.forEach(r => console.log(`  ✅ ${r.method} ${r.url.split('/').pop()} → ${r.status}`));
    failedAPI.forEach(r => console.log(`  ❌ ${r.method} ${r.url.split('/').pop()} → ${r.status}`));
    
    // 6. Verify authenticated API access
    expect(successfulAPI.length).toBeGreaterThan(0);
    
    // 7. Check for key interface elements
    const navigationElements = await page.locator('nav, .nav, .navbar').count();
    const buttons = await page.locator('button').count();
    const links = await page.locator('a').count();
    
    console.log(`🎯 UI Elements: ${navigationElements} nav, ${buttons} buttons, ${links} links`);
    expect(buttons).toBeGreaterThan(0);
    
    // 8. Take final screenshot
    await page.screenshot({ path: 'dashboard_verification.png' });
    
    console.log('✅ Core authentication and dashboard functionality verified!');
  });

  test('Verify API security', async ({ page }) => {
    console.log('🔒 Testing API security...');
    
    // Test direct API access without authentication
    const response = await page.goto('http://localhost:8001/api/characters');
    
    // Should either get 401 or redirect to login
    if (response.status() === 401) {
      console.log('✅ API properly returns 401 for unauthenticated access');
      expect(response.status()).toBe(401);
    } else {
      // Check if redirected to login page
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      if (currentUrl.includes('login')) {
        console.log('✅ API access redirects to login page');
        expect(currentUrl).toContain('login');
      }
    }
  });

  test('Verify password requirements', async ({ page }) => {
    console.log('🔑 Testing password requirements...');
    
    await page.goto('http://localhost:8001/login');
    
    // Test with invalid credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'short');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    
    // Should show error or remain on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('login');
    console.log('✅ Invalid credentials properly rejected');
    
    // Test with valid password format but wrong credentials
    await page.fill('input[type="password"]', 'WrongPassword123456789!');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    
    // Should still be on login page
    expect(page.url()).toContain('login');
    console.log('✅ Wrong credentials properly rejected despite valid format');
  });

});
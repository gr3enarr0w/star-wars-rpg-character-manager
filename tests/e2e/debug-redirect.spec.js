const { test, expect } = require('@playwright/test');

test('Debug login redirect process', async ({ page }) => {
  console.log('🔍 Starting redirect debugging...');
  
  // Monitor all navigation events
  page.on('framenavigated', frame => {
    console.log(`🔀 Navigation: ${frame.url()}`);
  });
  
  // Monitor console logs
  page.on('console', msg => {
    console.log(`📝 Console [${msg.type()}]: ${msg.text()}`);
  });
  
  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('/api/') || request.url().includes('localhost:8001')) {
      console.log(`📤 Request: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/') || response.url().includes('localhost:8001')) {
      console.log(`📥 Response: ${response.status()} ${response.url()}`);
    }
  });
  
  // Navigate to login page
  await page.goto('http://localhost:8001/login');
  console.log('✅ Navigated to login page');
  
  // Fill credentials
  await page.fill('input[type="email"]', 'clark@clarkeverson.com');
  await page.fill('input[type="password"]', 'TestPassword123456789@#$');
  console.log('✅ Filled credentials');
  
  // Submit form and watch what happens
  console.log('🚀 Submitting form...');
  await page.click('button[type="submit"]');
  
  // Wait for some time to see what happens
  console.log('⏳ Waiting for redirect...');
  await page.waitForTimeout(5000);
  
  // Check final state
  const finalUrl = page.url();
  console.log(`🎯 Final URL: ${finalUrl}`);
  
  // Check if localStorage has token
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  console.log(`🔑 Token in localStorage: ${token ? 'YES' : 'NO'}`);
  
  // Check page content
  const pageContent = await page.textContent('body');
  console.log(`📄 Page contains 'login': ${pageContent.toLowerCase().includes('login')}`);
  console.log(`📄 Page contains 'dashboard': ${pageContent.toLowerCase().includes('dashboard')}`);
  
  // Take final screenshot
  await page.screenshot({ path: 'debug_redirect_final.png' });
  
  console.log('🔍 Redirect debugging completed!');
});
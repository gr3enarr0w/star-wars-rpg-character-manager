const { test, expect } = require('@playwright/test');

test('Test login with network monitoring', async ({ page }) => {
  console.log('🔍 Starting login network debug...');
  
  // Monitor network requests
  const requests = [];
  const responses = [];
  
  page.on('request', request => {
    if (request.url().includes('/api/auth/login')) {
      console.log(`📤 Login request: ${request.method()} ${request.url()}`);
      console.log(`📝 Request data: ${request.postData()}`);
      requests.push(request);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/auth/login')) {
      console.log(`📥 Login response: ${response.status()} ${response.statusText()}`);
      response.text().then(text => {
        console.log(`📄 Response body: ${text}`);
      });
      responses.push(response);
    }
  });
  
  // Navigate to login page
  await page.goto('http://localhost:8001/login');
  console.log('✅ Navigated to login page');
  
  // Fill in credentials
  await page.fill('input[type="email"]', 'clark@clarkeverson.com');
  await page.fill('input[type="password"]', 'TestPassword123456789@#$');
  console.log('✅ Filled credentials');
  
  // Submit form and wait for network
  const [response] = await Promise.all([
    page.waitForResponse(response => response.url().includes('/api/auth/login')),
    page.click('button[type="submit"]')
  ]);
  
  console.log(`🌐 Final response status: ${response.status()}`);
  const responseBody = await response.text();
  console.log(`📄 Final response body: ${responseBody}`);
  
  // Check console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`💥 Console error: ${msg.text()}`);
    }
  });
});
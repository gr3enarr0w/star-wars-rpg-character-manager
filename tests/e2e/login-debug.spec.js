const { test, expect } = require('@playwright/test');

test('Test login with credentials', async ({ page }) => {
  console.log('🔍 Starting login test...');
  
  // Navigate to the application
  await page.goto('http://localhost:8001');
  console.log('✅ Navigated to application');
  
  // Should redirect to login page
  await expect(page).toHaveURL(/.*login.*/);
  console.log('✅ Redirected to login page');
  
  // Take a screenshot
  await page.screenshot({ path: 'login_page.png' });
  console.log('📸 Screenshot taken: login_page.png');
  
  // Fill in the login form
  const emailField = page.locator('input[type="email"], input[name*="email"], input[id*="email"]');
  const passwordField = page.locator('input[type="password"], input[name*="password"], input[id*="password"]');
  
  await emailField.fill('clark@clarkeverson.com');
  console.log('✅ Filled email field');
  
  await passwordField.fill('TestPassword123456789!');
  console.log('✅ Filled password field');
  
  // Take screenshot before submit
  await page.screenshot({ path: 'login_form_filled.png' });
  console.log('📸 Screenshot taken: login_form_filled.png');
  
  // Submit the form
  const submitButton = page.locator('button[type="submit"], input[type="submit"]');
  await submitButton.click();
  console.log('✅ Clicked submit button');
  
  // Wait for response
  await page.waitForTimeout(3000);
  
  // Take screenshot after submit
  await page.screenshot({ path: 'login_result.png' });
  console.log('📸 Screenshot taken: login_result.png');
  
  // Check for success or error messages
  const pageContent = await page.content();
  
  // Look for error messages
  const errorMessages = await page.locator('.error, .alert-danger, [class*="error"]').allTextContents();
  if (errorMessages.length > 0) {
    console.log('❌ Error messages found:');
    errorMessages.forEach(msg => console.log(`  - ${msg}`));
  }
  
  // Check if we're redirected to dashboard (success)
  const currentUrl = page.url();
  console.log(`🔗 Current URL: ${currentUrl}`);
  
  // Check for any JavaScript errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`💥 JavaScript error: ${msg.text()}`);
    }
  });
  
  // Check network requests
  page.on('response', response => {
    if (response.url().includes('/api/auth/login')) {
      console.log(`🌐 Login API response: ${response.status()}`);
      response.text().then(text => {
        console.log(`📝 Response body: ${text}`);
      });
    }
  });
  
  console.log('🔍 Test completed');
});
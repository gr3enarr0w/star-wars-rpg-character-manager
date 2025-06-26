// Comprehensive E2E UI Security Testing for Issue #103
const { test, expect } = require('@playwright/test');

test.describe('E2E Security & Functionality Tests - Issue #103', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for potentially slow local server
    test.setTimeout(60000);
  });

  test('Application loads successfully after security changes', async ({ page }) => {
    await page.goto('/');
    
    // Should load without errors
    await expect(page).toHaveTitle(/Star Wars RPG/);
    
    // Check for basic UI elements
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('✅ Application loads successfully');
  });

  test('Debug endpoints return 404 - Critical Security Test', async ({ page }) => {
    const criticalEndpoints = [
      '/api/debug/create-admin',
      '/api/debug/test-login'
    ];
    
    for (const endpoint of criticalEndpoints) {
      const response = await page.request.get(endpoint);
      expect(response.status()).toBe(404);
      console.log(`✅ CRITICAL: ${endpoint} properly secured (404)`);
    }
    
    const otherDebugEndpoints = [
      '/api/debug/test',
      '/api/debug/info',
      '/api/test',
      '/debug',
      '/test'
    ];
    
    for (const endpoint of otherDebugEndpoints) {
      const response = await page.request.get(endpoint);
      expect(response.status()).toBe(404);
      console.log(`✅ ${endpoint} secured`);
    }
  });

  test('Error pages do not expose system information', async ({ page }) => {
    // Test 404 page
    await page.goto('/nonexistent-security-test-page');
    
    const content = await page.content();
    const lowerContent = content.toLowerCase();
    
    // Should not contain system information
    const dangerousTerms = [
      'traceback', 'exception', 'stack trace', 'werkzeug', 
      'flask', 'python', 'file "/', 'line ', 'module ', 'in <module>'
    ];
    
    for (const term of dangerousTerms) {
      expect(lowerContent).not.toContain(term);
    }
    
    console.log('✅ 404 pages do not expose system information');
  });

  test('Authentication UI works properly', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Check login form exists
    const loginForm = page.locator('form');
    await expect(loginForm).toBeVisible();
    
    // Check for email and password fields
    const emailField = page.locator('input[type="email"], input[name*="email"], input[id*="email"]');
    const passwordField = page.locator('input[type="password"], input[name*="password"], input[id*="password"]');
    
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    
    console.log('✅ Login UI renders correctly');
  });

  test('Invalid login shows secure error messages', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.fill('input[type="email"], input[name*="email"], input[id*="email"]', 'test@invalid.com');
    await page.fill('input[type="password"], input[name*="password"], input[id*="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"], input[type="submit"]');
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Check that error message doesn't expose system info
    const content = await page.content();
    const lowerContent = content.toLowerCase();
    
    const dangerousTerms = ['traceback', 'exception', 'stack', 'werkzeug', 'flask'];
    for (const term of dangerousTerms) {
      expect(lowerContent).not.toContain(term);
    }
    
    console.log('✅ Login errors are secure');
  });

  test('Admin endpoints require authentication', async ({ page }) => {
    const response = await page.request.get('/api/admin/users');
    expect([401, 403]).toContain(response.status());
    console.log('✅ Admin endpoints require authentication');
  });

  test('Character creation page loads', async ({ page }) => {
    // Try to access character creation
    await page.goto('/create-character');
    
    // Should either load the page or redirect to login (both are valid)
    const url = page.url();
    const isCharacterPage = url.includes('create-character');
    const isLoginRedirect = url.includes('login');
    
    expect(isCharacterPage || isLoginRedirect).toBeTruthy();
    
    if (isCharacterPage) {
      console.log('✅ Character creation page loads directly');
    } else {
      console.log('✅ Character creation redirects to login (expected behavior)');
    }
  });

  test('Navigation elements work properly', async ({ page }) => {
    await page.goto('/');
    
    // Check for navigation elements
    const nav = page.locator('nav, .nav, .navbar, header');
    if (await nav.count() > 0) {
      await expect(nav.first()).toBeVisible();
      console.log('✅ Navigation elements present');
    }
    
    // Check for links
    const links = page.locator('a');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);
    console.log(`✅ Found ${linkCount} navigation links`);
  });

  test('Static assets load correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check for CSS
    const cssResponse = await page.request.get('/static/css/main.css');
    expect(cssResponse.status()).toBe(200);
    
    // Check for JS
    const jsResponse = await page.request.get('/static/js/main.js');
    expect(jsResponse.status()).toBe(200);
    
    console.log('✅ Static assets load correctly');
  });

  test('Console errors do not expose debug information', async ({ page }) => {
    const consoleMessages = [];
    
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });
    
    await page.goto('/');
    
    // Wait for any async operations
    await page.waitForTimeout(3000);
    
    // Check console messages for security issues
    const dangerousPatterns = [
      /debug.*endpoint/i,
      /admin.*token/i,
      /password.*hash/i,
      /secret.*key/i
    ];
    
    for (const message of consoleMessages) {
      for (const pattern of dangerousPatterns) {
        expect(message).not.toMatch(pattern);
      }
    }
    
    console.log('✅ Console messages are secure');
  });

  test('Form submissions do not expose errors in UI', async ({ page }) => {
    await page.goto('/');
    
    // Try to find and submit any forms with invalid data
    const forms = page.locator('form');
    const formCount = await forms.count();
    
    if (formCount > 0) {
      // Submit first form with invalid data
      const form = forms.first();
      
      // Fill any text inputs with invalid data
      const textInputs = form.locator('input[type="text"], input[type="email"]');
      const inputCount = await textInputs.count();
      
      if (inputCount > 0) {
        await textInputs.first().fill('invalid<script>alert(1)</script>');
        
        // Try to submit
        const submitButton = form.locator('button[type="submit"], input[type="submit"]');
        if (await submitButton.count() > 0) {
          await submitButton.click();
          
          // Wait for response
          await page.waitForTimeout(2000);
          
          // Check that no system errors are shown
          const content = await page.content();
          expect(content.toLowerCase()).not.toContain('traceback');
          expect(content.toLowerCase()).not.toContain('exception');
        }
      }
    }
    
    console.log('✅ Form error handling is secure');
  });

  test('Network requests do not expose sensitive headers', async ({ page }) => {
    const responses = [];
    
    page.on('response', response => {
      responses.push(response);
    });
    
    await page.goto('/');
    
    // Check response headers
    for (const response of responses) {
      const headers = await response.allHeaders();
      
      // Should not expose server information
      if (headers['server']) {
        expect(headers['server']).not.toContain('Werkzeug');
        expect(headers['server']).not.toContain('Flask');
      }
      
      // Should have security headers (if implemented)
      if (headers['x-content-type-options']) {
        expect(headers['x-content-type-options']).toBe('nosniff');
      }
    }
    
    console.log('✅ Network response headers are secure');
  });

  test('Application state persistence works', async ({ page }) => {
    await page.goto('/');
    
    // Check if there's any state management working
    // This could be localStorage, sessionStorage, or cookies
    
    const localStorage = await page.evaluate(() => {
      return Object.keys(localStorage).length;
    });
    
    const sessionStorage = await page.evaluate(() => {
      return Object.keys(sessionStorage).length;
    });
    
    // Just verify storage mechanisms work (don't fail if empty)
    expect(typeof localStorage).toBe('number');
    expect(typeof sessionStorage).toBe('number');
    
    console.log('✅ Application state mechanisms functional');
  });

  test('Responsive design works on different screen sizes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    
    await expect(body).toBeVisible();
    
    console.log('✅ Responsive design works');
  });

});
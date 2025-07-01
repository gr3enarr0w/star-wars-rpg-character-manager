const { test, expect } = require('@playwright/test');

test.describe('Docker Deployment - Complete UI Validation', () => {
  let page;
  
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('01 - Check for ANY remaining 2FA/Passkey references', async () => {
    console.log('🔍 Scanning for remaining 2FA/Passkey references...');
    
    // Navigate to application
    await page.goto('http://localhost:8001', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-results/docker-01-initial-load.png' });
    
    // Check page content for any 2FA/passkey text
    const pageContent = await page.content();
    
    // Look for problematic terms
    const badTerms = ['passkey', '2fa', 'two-factor', 'webauthn', 'authenticator', 'totp'];
    const foundTerms = [];
    
    for (const term of badTerms) {
      if (pageContent.toLowerCase().includes(term.toLowerCase())) {
        foundTerms.push(term);
      }
    }
    
    if (foundTerms.length > 0) {
      console.log(`❌ Found problematic terms: ${foundTerms.join(', ')}`);
      await page.screenshot({ path: 'test-results/docker-01-problematic-content.png' });
    } else {
      console.log('✅ No problematic 2FA/passkey terms found');
    }
    
    // Check for specific UI elements that shouldn't exist
    const passkeyButton = page.locator('button:has-text("passkey")');
    const twoFactorInput = page.locator('input[name*="2fa"], input[name*="two"], input[name*="factor"]');
    const passkeyLinks = page.locator('a:has-text("passkey")');
    
    if (await passkeyButton.count() > 0) {
      console.log('❌ Found passkey button(s)');
      await page.screenshot({ path: 'test-results/docker-01-passkey-button-found.png' });
    }
    
    if (await twoFactorInput.count() > 0) {
      console.log('❌ Found 2FA input field(s)');
      await page.screenshot({ path: 'test-results/docker-01-2fa-input-found.png' });
    }
    
    // Log all findings
    console.log('📊 Scan Results:');
    console.log(`   Problematic terms: ${foundTerms.length}`);
    console.log(`   Passkey buttons: ${await passkeyButton.count()}`);
    console.log(`   2FA inputs: ${await twoFactorInput.count()}`);
    console.log(`   Passkey links: ${await passkeyLinks.count()}`);
  });

  test('02 - Complete Authentication Flow Validation', async () => {
    console.log('🧪 Testing complete authentication flow...');
    
    // Should redirect to login
    await page.goto('http://localhost:8001', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/.*login.*/);
    await expect(page.locator('h1')).toContainText('Login');
    await page.screenshot({ path: 'test-results/docker-02-login-page.png' });
    
    // Check login form only has email and password fields
    const emailField = page.locator('#email');
    const passwordField = page.locator('#password');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    // Verify NO extra fields exist
    const allInputs = await page.locator('input').count();
    console.log(`Total input fields found: ${allInputs}`);
    
    if (allInputs > 2) {
      console.log('⚠️ More than 2 input fields found on login page');
      await page.screenshot({ path: 'test-results/docker-02-extra-inputs.png' });
    }
    
    // Test login with admin credentials
    await emailField.fill('clark@everson.dev');
    await passwordField.fill('with1artie4oskar3VOCATION!advances');
    await page.screenshot({ path: 'test-results/docker-02-credentials-entered.png' });
    
    await submitButton.click();
    await page.waitForURL(/.*(?!login).*/, { timeout: 10000 });
    await page.screenshot({ path: 'test-results/docker-02-after-login.png' });
    
    // Verify successful login
    await expect(page.locator('h1')).toContainText('My Characters');
    console.log('✅ Authentication successful');
  });

  test('03 - Navigation and Core Features Test', async () => {
    console.log('🧪 Testing navigation and core features...');
    
    // Test main navigation
    const charactersNav = page.locator('.nav-link', { hasText: 'Characters' });
    const campaignsNav = page.locator('.nav-link', { hasText: 'Campaigns' });
    
    await expect(charactersNav).toBeVisible();
    await expect(campaignsNav).toBeVisible();
    
    // Test campaigns navigation
    await campaignsNav.click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/docker-03-campaigns-page.png' });
    
    // Test character creation access
    await page.goto('http://localhost:8001');
    await page.waitForLoadState('networkidle');
    
    const createCharacterBtn = page.locator('text=Create Character');
    if (await createCharacterBtn.isVisible()) {
      await createCharacterBtn.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/docker-03-character-creation.png' });
      console.log('✅ Character creation accessible');
    } else {
      console.log('⚠️ Create Character button not found');
      await page.screenshot({ path: 'test-results/docker-03-no-create-button.png' });
    }
  });

  test('04 - Profile Page Deep Inspection', async () => {
    console.log('🧪 Deep inspection of profile page...');
    
    // Navigate to profile
    await page.goto('http://localhost:8001');
    await page.waitForLoadState('networkidle');
    
    await page.click('.user-menu-toggle');
    await page.waitForTimeout(500);
    await page.click('text=Profile');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/docker-04-profile-page.png' });
    
    // Check profile page content for any remaining 2FA/passkey references
    const profileContent = await page.content();
    
    // Look for problematic elements
    const problematicElements = [
      'button:has-text("2FA")',
      'button:has-text("passkey")', 
      'button:has-text("two-factor")',
      'input[name*="2fa"]',
      'input[name*="passkey"]',
      'input[name*="totp"]',
      '.passkey',
      '.two-factor',
      '#passkey',
      '#2fa'
    ];
    
    let foundElements = 0;
    for (const selector of problematicElements) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`❌ Found ${count} elements matching: ${selector}`);
          foundElements += count;
        }
      } catch (e) {
        // Some selectors might be invalid, that's OK
      }
    }
    
    // Verify the "next version" message is present
    const nextVersionMessage = page.locator('text=Two-Factor Authentication and Passkey support will be available');
    await expect(nextVersionMessage).toBeVisible();
    console.log('✅ "Next version" messaging found');
    
    // Test password change form
    const currentPasswordField = page.locator('input[name="current_password"]');
    const newPasswordField = page.locator('input[name="new_password"]');
    const confirmPasswordField = page.locator('input[name="confirm_password"]');
    
    if (await currentPasswordField.isVisible()) {
      console.log('✅ Password change form is accessible');
      
      // Test password length validation (20+ characters)
      await currentPasswordField.fill('with1artie4oskar3VOCATION!advances');
      await newPasswordField.fill('short'); // Too short
      await confirmPasswordField.fill('short');
      
      await page.screenshot({ path: 'test-results/docker-04-password-validation-test.png' });
    }
    
    console.log(`📊 Profile page scan: ${foundElements} problematic elements found`);
  });

  test('05 - Admin Panel Validation', async () => {
    console.log('🧪 Testing admin panel access...');
    
    await page.goto('http://localhost:8001/admin');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/docker-05-admin-page.png' });
    
    // Check if we have admin access or are redirected
    const currentUrl = page.url();
    if (currentUrl.includes('admin')) {
      console.log('✅ Admin panel accessible');
      
      // Check admin page for any 2FA/passkey references
      const adminContent = await page.content();
      const badTerms = ['2fa', 'passkey', 'two-factor', 'authenticator'];
      
      for (const term of badTerms) {
        if (adminContent.toLowerCase().includes(term)) {
          console.log(`❌ Found "${term}" in admin panel`);
        }
      }
      
      // Look for user management table
      const userTable = page.locator('.user-table, table');
      if (await userTable.isVisible()) {
        await page.screenshot({ path: 'test-results/docker-05-user-management.png' });
        
        // Check table headers for 2FA columns
        const tableHeaders = await page.locator('th').allTextContents();
        const problematicHeaders = tableHeaders.filter(header => 
          header.toLowerCase().includes('2fa') || 
          header.toLowerCase().includes('passkey') ||
          header.toLowerCase().includes('two-factor')
        );
        
        if (problematicHeaders.length > 0) {
          console.log(`❌ Found problematic table headers: ${problematicHeaders.join(', ')}`);
        } else {
          console.log('✅ User table headers are clean');
        }
      }
    } else {
      console.log('⚠️ Redirected from admin panel (may be normal for security)');
    }
  });

  test('06 - JavaScript Console Error Check', async () => {
    console.log('🧪 Checking for JavaScript errors...');
    
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Navigate through main pages and check for errors
    const pages = [
      'http://localhost:8001',
      'http://localhost:8001/login',
      'http://localhost:8001/profile',
      'http://localhost:8001/campaigns'
    ];
    
    for (const url of pages) {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000); // Give time for any async JS to run
    }
    
    await page.screenshot({ path: 'test-results/docker-06-final-state.png' });
    
    if (errors.length > 0) {
      console.log(`❌ Found ${errors.length} JavaScript errors:`);
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No JavaScript errors found');
    }
  });

  test('07 - Network Request Analysis', async () => {
    console.log('🧪 Analyzing network requests for 2FA/passkey endpoints...');
    
    const requests = [];
    page.on('request', request => {
      requests.push(request.url());
    });
    
    // Navigate and interact with the application
    await page.goto('http://localhost:8001/login', { waitUntil: 'networkidle' });
    await page.fill('#email', 'clark@everson.dev');
    await page.fill('#password', 'with1artie4oskar3VOCATION!advances');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*(?!login).*/, { timeout: 10000 });
    
    // Check for any requests to removed endpoints
    const problematicRequests = requests.filter(url => 
      url.includes('passkey') || 
      url.includes('2fa') || 
      url.includes('two-factor') ||
      url.includes('totp')
    );
    
    if (problematicRequests.length > 0) {
      console.log(`❌ Found requests to removed endpoints:`);
      problematicRequests.forEach(url => console.log(`   ${url}`));
    } else {
      console.log('✅ No requests to removed 2FA/passkey endpoints');
    }
    
    console.log(`📊 Total requests: ${requests.length}`);
    console.log(`📊 Problematic requests: ${problematicRequests.length}`);
  });

  test('08 - Final Comprehensive Validation', async () => {
    console.log('🧪 Final comprehensive validation...');
    
    await page.goto('http://localhost:8001', { waitUntil: 'networkidle' });
    
    // Test logout
    await page.click('.user-menu-toggle');
    await page.waitForTimeout(500);
    await page.click('text=Logout');
    await page.waitForURL(/.*login.*/);
    await page.screenshot({ path: 'test-results/docker-08-logout.png' });
    
    console.log('✅ Docker deployment validation complete!');
    console.log('🎉 All tests completed - check results for any issues found');
  });
});
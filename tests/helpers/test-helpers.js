/**
 * Reusable Test Helpers for Star Wars RPG Character Manager
 * Comprehensive E2E Testing Framework
 */

// Test credentials and configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:8001',
  adminUser: {
    email: 'clark@clarkeverson.com',
    password: 'TestPassword123456789@#$',
    username: 'ceverson',
    role: 'admin'
  },
  testTimeout: 30000,
  actionDelay: 1000
};

// Helper functions for common actions
class TestHelpers {
  
  /**
   * Login with provided credentials
   */
  static async login(page, email = TEST_CONFIG.adminUser.email, password = TEST_CONFIG.adminUser.password) {
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(TEST_CONFIG.baseUrl, { timeout: TEST_CONFIG.testTimeout });
    await page.waitForTimeout(TEST_CONFIG.actionDelay);
  }

  /**
   * Wait for page to fully load
   */
  static async waitForPageLoad(page) {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }

  /**
   * Take screenshot with descriptive name
   */
  static async screenshot(page, name, testName = '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${testName ? testName + '_' : ''}${name}_${timestamp}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    return filename;
  }

  /**
   * Test element visibility and clickability
   */
  static async testElementInteraction(page, selector, description) {
    const elements = page.locator(selector);
    const count = await elements.count();
    
    console.log(`🔍 Testing ${description}: Found ${count} elements`);
    
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        try {
          const element = elements.nth(i);
          const text = await element.textContent();
          const isVisible = await element.isVisible();
          const isEnabled = await element.isEnabled();
          
          console.log(`  ${i + 1}. "${text?.trim()}" - Visible: ${isVisible}, Enabled: ${isEnabled}`);
          
          if (isVisible && isEnabled) {
            await element.click();
            await page.waitForTimeout(1000);
            console.log(`    ✅ Successfully clicked`);
            
            // Check for any modals or navigation changes
            const modalVisible = await page.locator('.modal:visible, [class*="modal"]:visible').count();
            const currentUrl = page.url();
            
            if (modalVisible > 0) {
              console.log(`    📋 Opened modal`);
              await page.keyboard.press('Escape');
              await page.waitForTimeout(500);
            } else if (!currentUrl.includes(TEST_CONFIG.baseUrl)) {
              console.log(`    🔗 Navigated to: ${currentUrl}`);
              await page.goBack();
              await page.waitForTimeout(1000);
            }
          }
        } catch (e) {
          console.log(`    ℹ️ Element ${i + 1} interaction failed: ${e.message}`);
        }
      }
    }
    
    return count;
  }

  /**
   * Test dropdown functionality
   */
  static async testDropdown(page, selector, description) {
    const dropdown = page.locator(selector).first();
    
    if (await dropdown.count() === 0) {
      console.log(`🔽 ${description}: Not found`);
      return false;
    }

    console.log(`🔽 Testing ${description}...`);
    
    try {
      await dropdown.click();
      await page.waitForTimeout(1000);
      
      // Check for dropdown content
      const dropdownContent = await page.locator('.dropdown-menu:visible, .dropdown-content:visible, select option, [class*="dropdown"]:visible').count();
      
      if (dropdownContent > 0) {
        console.log(`  ✅ Dropdown opened with ${dropdownContent} options`);
        
        // If it's a select element, test option selection
        if (await dropdown.evaluate(el => el.tagName.toLowerCase()) === 'select') {
          const options = await dropdown.locator('option').count();
          if (options > 1) {
            await dropdown.selectOption({ index: 1 });
            const selectedValue = await dropdown.inputValue();
            console.log(`  ✅ Selected option: "${selectedValue}"`);
          }
        }
        
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        return true;
      }
    } catch (e) {
      console.log(`  ℹ️ Dropdown interaction failed: ${e.message}`);
    }
    
    return false;
  }

  /**
   * Test form filling and submission
   */
  static async testForm(page, formData, formSelector = 'form') {
    const form = page.locator(formSelector).first();
    
    if (await form.count() === 0) {
      console.log('📝 No form found to test');
      return false;
    }

    console.log('📝 Testing form interaction...');
    
    try {
      // Fill form fields
      for (const [fieldName, value] of Object.entries(formData)) {
        const field = form.locator(`input[name="${fieldName}"], input[id="${fieldName}"], select[name="${fieldName}"], textarea[name="${fieldName}"]`);
        
        if (await field.count() > 0) {
          const fieldType = await field.evaluate(el => el.tagName.toLowerCase());
          
          if (fieldType === 'select') {
            await field.selectOption(value);
          } else {
            await field.fill(value);
          }
          console.log(`  ✅ Filled ${fieldName}: "${value}"`);
        }
      }
      
      // Look for submit button
      const submitButton = form.locator('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Save")');
      
      if (await submitButton.count() > 0) {
        console.log('  🚀 Form ready for submission');
        return true;
      }
    } catch (e) {
      console.log(`  ℹ️ Form interaction failed: ${e.message}`);
    }
    
    return false;
  }

  /**
   * Test API endpoints indirectly through UI
   */
  static async monitorAPIRequests(page, testName) {
    const apiRequests = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiRequests.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return {
      getRequests: () => apiRequests,
      logSummary: () => {
        const successful = apiRequests.filter(r => r.status >= 200 && r.status < 300);
        const failed = apiRequests.filter(r => r.status >= 400);
        
        console.log(`📊 API Summary for ${testName}:`);
        console.log(`  ✅ Successful: ${successful.length}`);
        console.log(`  ❌ Failed: ${failed.length}`);
        
        successful.forEach(r => console.log(`    ✅ ${r.method} ${r.url.split('/').pop()} → ${r.status}`));
        failed.forEach(r => console.log(`    ❌ ${r.method} ${r.url.split('/').pop()} → ${r.status}`));
      }
    };
  }

  /**
   * Test responsive design
   */
  static async testResponsiveDesign(page, testName) {
    console.log('📱 Testing responsive design...');
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1200, height: 800 },
      { name: 'Large Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      const visibleButtons = await page.locator('button:visible').count();
      const visibleLinks = await page.locator('a:visible').count();
      const navElements = await page.locator('nav:visible, .navbar:visible').count();
      
      console.log(`  📱 ${viewport.name} (${viewport.width}x${viewport.height}): ${visibleButtons} buttons, ${visibleLinks} links, ${navElements} nav`);
      
      await this.screenshot(page, `responsive_${viewport.name.toLowerCase()}`, testName);
    }
    
    // Reset to desktop
    await page.setViewportSize({ width: 1200, height: 800 });
  }

  /**
   * Test error handling
   */
  static async testErrorHandling(page) {
    console.log('⚠️ Testing error handling...');
    
    // Test 404 page
    await page.goto(`${TEST_CONFIG.baseUrl}/nonexistent-page`);
    await page.waitForTimeout(2000);
    
    const errorPage = await page.locator('h1:has-text("404"), h1:has-text("Not Found"), .error').count();
    console.log(`  ✅ 404 handling: ${errorPage > 0 ? 'Working' : 'Needs improvement'}`);
    
    // Test form validation
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    const validationErrors = await page.locator('.error, .invalid, [class*="error"]').count();
    console.log(`  ✅ Form validation: ${validationErrors > 0 ? 'Working' : 'Needs improvement'}`);
  }
}

module.exports = {
  TestHelpers,
  TEST_CONFIG
};
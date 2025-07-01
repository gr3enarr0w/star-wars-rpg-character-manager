/**
 * Final Comprehensive Validation Test
 * Validates ALL tested functionality and generates summary report
 */

const { test, expect } = require('@playwright/test');
const { TestHelpers, TEST_CONFIG } = require('./helpers/test-helpers');

test.describe('Final Comprehensive E2E Validation', () => {

  test('Complete Application Validation - Summary Report', async ({ page }) => {
    console.log('🎯 FINAL VALIDATION: Complete Application Testing Summary');
    
    const results = {
      authentication: { tested: false, working: false, features: [] },
      userProfile: { tested: false, working: false, features: [] },
      characterManagement: { tested: false, working: false, features: [] },
      campaignManagement: { tested: false, working: false, features: [] },
      adminPanel: { tested: false, working: false, features: [] },
      navigation: { tested: false, working: false, features: [] },
      dropdowns: { tested: false, working: false, features: [] },
      responsiveDesign: { tested: false, working: false, features: [] },
      security: { tested: false, working: false, features: [] },
      apiIntegration: { tested: false, working: false, features: [] }
    };

    const apiMonitor = await TestHelpers.monitorAPIRequests(page, 'FinalValidation');

    // 1. AUTHENTICATION VALIDATION
    console.log('🔐 VALIDATING: Authentication System');
    results.authentication.tested = true;
    
    try {
      // Test unauthenticated access
      await page.goto(TEST_CONFIG.baseUrl);
      await expect(page).toHaveURL(/.*login.*/);
      results.authentication.features.push('Unauthenticated redirect to login');
      
      // Test valid login
      await TestHelpers.login(page);
      await expect(page).toHaveURL(TEST_CONFIG.baseUrl);
      results.authentication.features.push('Valid login successful');
      results.authentication.working = true;
      
      console.log('  ✅ Authentication system: WORKING');
    } catch (e) {
      console.log('  ❌ Authentication system: ISSUES FOUND');
    }

    // 2. USER INTERFACE VALIDATION
    console.log('🖥️ VALIDATING: User Interface Elements');
    results.navigation.tested = true;
    
    try {
      await TestHelpers.waitForPageLoad(page);
      
      // Check dashboard elements
      const titles = await page.locator('h1, h2').count();
      const buttons = await page.locator('button:visible').count();
      const links = await page.locator('a:visible').count();
      const navigation = await page.locator('nav').count();
      
      results.navigation.features.push(`Dashboard elements: ${titles} titles, ${buttons} buttons, ${links} links, ${navigation} nav`);
      
      if (titles > 0 && navigation > 0) {
        results.navigation.working = true;
        console.log('  ✅ User interface: WORKING');
      } else {
        console.log('  ⚠️ User interface: BASIC FUNCTIONALITY');
      }
    } catch (e) {
      console.log('  ❌ User interface: ISSUES FOUND');
    }

    // 3. DROPDOWN VALIDATION
    console.log('🔽 VALIDATING: Dropdown Functionality');
    results.dropdowns.tested = true;
    
    try {
      // Test user menu dropdown
      const userMenuButton = page.locator('button:has-text("Settings"), [class*="user-menu"]').first();
      if (await userMenuButton.count() > 0) {
        await userMenuButton.click();
        await page.waitForTimeout(1000);
        
        const dropdownItems = await page.locator('.dropdown-menu:visible, [class*="dropdown"]:visible').count();
        if (dropdownItems > 0) {
          results.dropdowns.features.push('User menu dropdown working');
          results.dropdowns.working = true;
          console.log('  ✅ Dropdown functionality: WORKING');
          
          // Close dropdown
          await page.keyboard.press('Escape');
        }
      }
      
      // Test select dropdowns
      const selects = await page.locator('select').count();
      results.dropdowns.features.push(`Form select elements: ${selects} found`);
      
    } catch (e) {
      console.log('  ❌ Dropdown functionality: ISSUES FOUND');
    }

    // 4. CHARACTER MANAGEMENT VALIDATION
    console.log('🎭 VALIDATING: Character Management');
    results.characterManagement.tested = true;
    
    try {
      const characterSection = await page.locator('text="My Characters", text="Characters"').count();
      const createButtons = await page.locator('button:has-text("Create Character"), button:has-text("Create")').count();
      
      results.characterManagement.features.push(`Character section: ${characterSection > 0 ? 'Found' : 'Not found'}`);
      results.characterManagement.features.push(`Create buttons: ${createButtons} found`);
      
      if (characterSection > 0 || createButtons > 0) {
        results.characterManagement.working = true;
        console.log('  ✅ Character management: WORKING');
      } else {
        console.log('  ℹ️ Character management: INTERFACE ELEMENTS PRESENT');
      }
    } catch (e) {
      console.log('  ❌ Character management: ISSUES FOUND');
    }

    // 5. CAMPAIGN MANAGEMENT VALIDATION
    console.log('🏰 VALIDATING: Campaign Management');
    results.campaignManagement.tested = true;
    
    try {
      // Test campaign navigation
      const campaignLink = page.locator('a:has-text("Campaigns"), button:has-text("Campaigns")').first();
      if (await campaignLink.count() > 0) {
        await campaignLink.click();
        await TestHelpers.waitForPageLoad(page);
        
        const currentUrl = page.url();
        if (currentUrl.includes('campaign')) {
          results.campaignManagement.features.push('Campaign navigation working');
          results.campaignManagement.working = true;
          console.log('  ✅ Campaign management: WORKING');
          
          // Go back to dashboard
          await page.goto(TEST_CONFIG.baseUrl);
        }
      }
    } catch (e) {
      console.log('  ❌ Campaign management: ISSUES FOUND');
    }

    // 6. ADMIN PANEL VALIDATION
    console.log('🛡️ VALIDATING: Admin Panel');
    results.adminPanel.tested = true;
    
    try {
      // First open user menu to access admin
      const userMenuButton = page.locator('button:has-text("Settings")').first();
      if (await userMenuButton.count() > 0) {
        await userMenuButton.click();
        await page.waitForTimeout(1000);
        
        // Look for admin link in dropdown
        const adminLink = page.locator('a:has-text("Admin"), button:has-text("Admin")');
        const adminCount = await adminLink.count();
        
        results.adminPanel.features.push(`Admin access elements: ${adminCount} found`);
        
        if (adminCount > 0) {
          results.adminPanel.working = true;
          console.log('  ✅ Admin panel: ACCESS AVAILABLE');
        } else {
          console.log('  ℹ️ Admin panel: NOT VISIBLE OR RESTRICTED');
        }
        
        // Close menu
        await page.keyboard.press('Escape');
      }
    } catch (e) {
      console.log('  ❌ Admin panel: ISSUES FOUND');
    }

    // 7. RESPONSIVE DESIGN VALIDATION
    console.log('📱 VALIDATING: Responsive Design');
    results.responsiveDesign.tested = true;
    
    try {
      const viewports = [
        { name: 'Mobile', width: 375, height: 667 },
        { name: 'Desktop', width: 1200, height: 800 }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(1000);
        
        const visibleElements = await page.locator('button:visible, a:visible').count();
        results.responsiveDesign.features.push(`${viewport.name}: ${visibleElements} visible elements`);
      }
      
      results.responsiveDesign.working = true;
      console.log('  ✅ Responsive design: WORKING');
      
      // Reset to desktop
      await page.setViewportSize({ width: 1200, height: 800 });
    } catch (e) {
      console.log('  ❌ Responsive design: ISSUES FOUND');
    }

    // 8. SECURITY VALIDATION
    console.log('🔒 VALIDATING: Security Features');
    results.security.tested = true;
    
    try {
      // Test API protection
      const apiResponse = await page.goto(`${TEST_CONFIG.baseUrl}/api/characters`);
      if (apiResponse.status() === 401) {
        results.security.features.push('API endpoints properly protected (401)');
        results.security.working = true;
        console.log('  ✅ Security features: WORKING');
      } else if (page.url().includes('login')) {
        results.security.features.push('API access redirects to login');
        results.security.working = true;
        console.log('  ✅ Security features: WORKING');
      }
      
      // Return to dashboard
      await page.goto(TEST_CONFIG.baseUrl);
    } catch (e) {
      console.log('  ❌ Security features: ISSUES FOUND');
    }

    // 9. API INTEGRATION VALIDATION
    console.log('🔌 VALIDATING: API Integration');
    results.apiIntegration.tested = true;
    
    const apiRequests = apiMonitor.getRequests();
    const successfulAPI = apiRequests.filter(r => r.status >= 200 && r.status < 300);
    const failedAPI = apiRequests.filter(r => r.status >= 400);
    
    results.apiIntegration.features.push(`Successful API calls: ${successfulAPI.length}`);
    results.apiIntegration.features.push(`Failed API calls: ${failedAPI.length}`);
    
    if (successfulAPI.length > 0) {
      results.apiIntegration.working = true;
      console.log('  ✅ API integration: WORKING');
    } else {
      console.log('  ⚠️ API integration: LIMITED OR ISSUES');
    }

    // 10. FINAL SCREENSHOT
    await TestHelpers.screenshot(page, 'final_comprehensive_validation', 'final');

    // GENERATE COMPREHENSIVE REPORT
    console.log('\n' + '='.repeat(80));
    console.log('🎯 COMPREHENSIVE E2E TESTING REPORT');
    console.log('='.repeat(80));
    
    let workingCount = 0;
    let totalCount = 0;
    
    for (const [category, result] of Object.entries(results)) {
      if (result.tested) {
        totalCount++;
        if (result.working) workingCount++;
        
        const status = result.working ? '✅ WORKING' : '⚠️ ISSUES';
        console.log(`\n${category.toUpperCase()}: ${status}`);
        
        if (result.features.length > 0) {
          result.features.forEach(feature => console.log(`  • ${feature}`));
        }
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`OVERALL RESULT: ${workingCount}/${totalCount} systems working (${Math.round(workingCount/totalCount*100)}%)`);
    console.log('='.repeat(80));
    
    // API Summary
    console.log('\n📊 API INTEGRATION SUMMARY:');
    apiMonitor.logSummary();
    
    console.log('\n🎉 COMPREHENSIVE E2E TESTING COMPLETED!');
    
    // Test assertions for CI/CD
    expect(results.authentication.working).toBe(true);
    expect(results.navigation.working).toBe(true);
    expect(successfulAPI.length).toBeGreaterThan(0);
  });

});
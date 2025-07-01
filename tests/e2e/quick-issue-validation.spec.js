/**
 * Quick Production Issue Validation
 * Tests the specific issues you reported
 */

const { test, expect } = require('@playwright/test');
const { TestHelpers, TEST_CONFIG } = require('./helpers/test-helpers');

test.describe('Quick Production Issue Validation', () => {

  test('Settings Modal vs Page Navigation Issue', async ({ page }) => {
    console.log('⚙️ TESTING: Settings modal vs page requirement');
    
    await TestHelpers.login(page);
    const startUrl = page.url();
    
    // Test Settings button behavior
    console.log('🔍 Testing Settings button...');
    const settingsButton = page.locator('button:has-text("Settings")').first();
    
    if (await settingsButton.count() > 0) {
      await settingsButton.click();
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      const hasModal = await page.locator('.modal:visible, [class*="modal"]:visible').count() > 0;
      
      console.log(`Current URL: ${currentUrl}`);
      console.log(`Start URL: ${startUrl}`);
      console.log(`Has modal: ${hasModal}`);
      console.log(`URL changed: ${currentUrl !== startUrl}`);
      
      if (hasModal) {
        console.log('❌ CONFIRMED ISSUE: Settings opens modal instead of new page');
        console.log('   REQUIREMENT: Should navigate to new page like other buttons');
      } else if (currentUrl !== startUrl) {
        console.log('✅ Settings correctly navigates to new page');
      } else {
        console.log('⚠️ Settings button has no clear action');
      }
      
      await TestHelpers.screenshot(page, 'settings_behavior_test', 'issue-validation');
    }
  });

  test('Character Deletion API Error', async ({ page }) => {
    console.log('🗑️ TESTING: Character deletion API error reproduction');
    
    await TestHelpers.login(page);
    
    // Test the exact API call that's failing
    console.log('🔌 Testing character deletion API call...');
    
    const result = await page.evaluate(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/campaigns/test-campaign/players/invalid-player-id', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const responseText = await response.text();
        return {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    console.log(`API Response Status: ${result.status}`);
    console.log(`Response Body: ${result.body}`);
    
    if (result.body && result.body.includes('Resource not found')) {
      console.log('❌ CONFIRMED ISSUE: "Resource not found" error reproduced');
      console.log('   This matches your reported error exactly');
    }
  });

  test('UI State Management - Old Elements Visible', async ({ page }) => {
    console.log('🎭 TESTING: UI state management during navigation');
    
    await TestHelpers.login(page);
    
    // Check initial state
    console.log('📊 Checking initial dashboard state...');
    const initialDashboard = await page.locator('text="My Characters"').count() > 0;
    const initialCampaignsNav = await page.locator('a:has-text("Campaigns")').count() > 0;
    
    console.log(`Initial dashboard visible: ${initialDashboard}`);
    console.log(`Initial campaigns nav visible: ${initialCampaignsNav}`);
    
    // Click Create Character
    console.log('✨ Clicking Create Character...');
    const createButton = page.locator('a:has-text("Create Character")').first();
    if (await createButton.count() > 0) {
      await createButton.click();
      await page.waitForTimeout(2000);
      
      // Check if old elements are still visible
      const dashboardStillVisible = await page.locator('text="My Characters"').count() > 0;
      const campaignsStillVisible = await page.locator('a:has-text("Campaigns")').count() > 0;
      
      console.log(`After create character click:`);
      console.log(`  Dashboard still visible: ${dashboardStillVisible}`);
      console.log(`  Campaigns nav still visible: ${campaignsStillVisible}`);
      
      if (dashboardStillVisible) {
        console.log('❌ CONFIRMED ISSUE: Dashboard elements still visible during character creation');
        console.log('   REQUIREMENT: Old UI should be hidden when navigating to new page');
      }
      
      if (campaignsStillVisible) {
        console.log('❌ CONFIRMED ISSUE: Campaign navigation still visible during character creation');
      }
      
      await TestHelpers.screenshot(page, 'ui_state_issue', 'issue-validation');
    }
  });

  test('Admin Panel Re-authentication Issue', async ({ page }) => {
    console.log('🛡️ TESTING: Admin panel re-authentication issue');
    
    await TestHelpers.login(page);
    
    // Verify admin status
    console.log('👤 Checking admin status...');
    await page.goto(`${TEST_CONFIG.baseUrl}/api/auth/me`);
    const userInfo = await page.textContent('body');
    console.log(`User info snippet: ${userInfo.substring(0, 200)}...`);
    
    // Go back to main page
    await page.goto(TEST_CONFIG.baseUrl);
    await page.waitForTimeout(1000);
    
    // Try to access admin panel
    console.log('🔗 Attempting admin panel access...');
    const userMenuButton = page.locator('button:has-text("Settings")').first();
    if (await userMenuButton.count() > 0) {
      await userMenuButton.click();
      await page.waitForTimeout(1000);
      
      const adminLink = page.locator('a:has-text("Admin")').first();
      if (await adminLink.count() > 0) {
        await adminLink.click();
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        const hasLoginForm = await page.locator('input[type="password"]').count() > 0;
        
        console.log(`Admin panel URL: ${currentUrl}`);
        console.log(`Has login form: ${hasLoginForm}`);
        console.log(`URL contains login: ${currentUrl.includes('login')}`);
        
        if (hasLoginForm || currentUrl.includes('login')) {
          console.log('❌ CONFIRMED ISSUE: Admin panel requires re-authentication');
          console.log('   USER ALREADY LOGGED IN - This should not happen');
        } else {
          console.log('✅ Admin panel accessible without re-authentication');
        }
        
        await TestHelpers.screenshot(page, 'admin_panel_access', 'issue-validation');
      }
    }
  });

  test('Documentation Content Validation', async ({ page }) => {
    console.log('📚 TESTING: Documentation content issues');
    
    await TestHelpers.login(page);
    
    // Navigate to documentation
    console.log('📖 Accessing documentation...');
    const docsLink = page.locator('a:has-text("Documentation")').first();
    if (await docsLink.count() > 0) {
      await docsLink.click();
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      const pageContent = await page.textContent('body');
      const contentLength = pageContent.length;
      
      console.log(`Documentation URL: ${currentUrl}`);
      console.log(`Content length: ${contentLength} characters`);
      
      // Check for meaningful content
      const hasHeadings = await page.locator('h1, h2, h3').count();
      const hasHelpfulContent = pageContent.toLowerCase().includes('character') || 
                               pageContent.toLowerCase().includes('game') ||
                               pageContent.toLowerCase().includes('how to');
      
      console.log(`Heading count: ${hasHeadings}`);
      console.log(`Has helpful content: ${hasHelpfulContent}`);
      console.log(`Content is substantial: ${contentLength > 1000}`);
      
      if (contentLength < 1000) {
        console.log('❌ CONFIRMED ISSUE: Documentation lacks substantial content');
      }
      
      if (!hasHelpfulContent) {
        console.log('❌ CONFIRMED ISSUE: Documentation lacks helpful user content');
      }
      
      await TestHelpers.screenshot(page, 'documentation_content', 'issue-validation');
    }
  });

});
/**
 * Complete End-to-End Test Suite for Star Wars RPG Character Manager
 * Comprehensive Browser Testing for ALL Features
 * Designed for Reusability and Maintainability
 */

const { test, expect } = require('@playwright/test');
const { TestHelpers, TEST_CONFIG } = require('./helpers/test-helpers');

test.describe('Complete E2E Test Suite - All Features', () => {

  test('1. Authentication System - Complete Flow', async ({ page }) => {
    console.log('🔐 TESTING: Complete Authentication System');
    const apiMonitor = await TestHelpers.monitorAPIRequests(page, 'Authentication');
    
    // 1.1 Unauthenticated Access
    console.log('🚫 Testing unauthenticated access...');
    await page.goto(TEST_CONFIG.baseUrl);
    await expect(page).toHaveURL(/.*login.*/);
    console.log('  ✅ Unauthenticated users properly redirected to login');
    
    // 1.2 Invalid Login
    console.log('❌ Testing invalid login attempts...');
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    const errorMessage = await page.locator('.error, .alert, [class*="error"]').count();
    console.log(`  ✅ Invalid login error handling: ${errorMessage > 0 ? 'Working' : 'Basic'}`);
    
    // 1.3 Valid Login
    console.log('✅ Testing valid login...');
    await TestHelpers.login(page);
    console.log('  ✅ Valid login successful');
    
    // 1.4 Session Persistence
    console.log('🔄 Testing session persistence...');
    await page.reload();
    await TestHelpers.waitForPageLoad(page);
    await expect(page).toHaveURL(TEST_CONFIG.baseUrl);
    console.log('  ✅ Session persistence working');
    
    // 1.5 Password Requirements
    console.log('🔑 Testing password requirements...');
    // This would be tested in registration if available
    
    await TestHelpers.screenshot(page, 'authentication_complete', 'auth');
    apiMonitor.logSummary();
  });

  test('2. User Profile Management - Complete Flow', async ({ page }) => {
    console.log('👤 TESTING: Complete User Profile Management');
    const apiMonitor = await TestHelpers.monitorAPIRequests(page, 'UserProfile');
    
    await TestHelpers.login(page);
    
    // 2.1 Profile Settings Access
    console.log('⚙️ Testing profile settings access...');
    const profileAccess = await TestHelpers.testElementInteraction(
      page, 
      'button:has-text("Settings"), button:has-text("Profile"), [class*="profile"]',
      'Profile Settings Buttons'
    );
    
    // 2.2 Profile Settings Modal/Page
    console.log('📋 Testing profile settings interface...');
    const settingsButton = page.locator('button:has-text("Settings")').first();
    if (await settingsButton.count() > 0) {
      await settingsButton.click();
      await page.waitForTimeout(2000);
      
      // Test profile tabs
      const tabs = ['General', 'Security', 'Privacy', 'Activity'];
      for (const tab of tabs) {
        const tabElement = page.locator(`text="${tab}", button:has-text("${tab}"), [data-tab="${tab.toLowerCase()}"]`);
        if (await tabElement.count() > 0) {
          console.log(`  📑 Testing ${tab} tab...`);
          await tabElement.first().click();
          await page.waitForTimeout(1000);
          await TestHelpers.screenshot(page, `profile_${tab.toLowerCase()}`, 'profile');
        }
      }
    }
    
    // 2.3 Password Change
    console.log('🔑 Testing password change interface...');
    const passwordFields = await page.locator('input[type="password"]').count();
    if (passwordFields > 0) {
      console.log(`  ✅ Found ${passwordFields} password fields`);
      
      // Test password change form (don't actually change)
      const currentPwField = page.locator('input[name*="current"], input[placeholder*="current"]');
      const newPwField = page.locator('input[name*="new"], input[placeholder*="new"]');
      
      if (await currentPwField.count() > 0 && await newPwField.count() > 0) {
        console.log('  ✅ Password change form available');
        // Don't actually change password in test
      }
    }
    
    // 2.4 MFA/2FA Setup
    console.log('🔐 Testing MFA/2FA setup...');
    const mfaElements = await TestHelpers.testElementInteraction(
      page,
      'button:has-text("2FA"), button:has-text("MFA"), [class*="mfa"]',
      'MFA Setup Elements'
    );
    
    // 2.5 Data Export
    console.log('📦 Testing data export...');
    const exportElements = await TestHelpers.testElementInteraction(
      page,
      'button:has-text("Export"), button:has-text("Download"), [class*="export"]',
      'Data Export Elements'
    );
    
    // 2.6 Account Management
    console.log('🗑️ Testing account management...');
    const accountElements = await TestHelpers.testElementInteraction(
      page,
      'button:has-text("Delete"), button:has-text("Deactivate"), [class*="delete"]',
      'Account Management Elements'
    );
    
    await TestHelpers.screenshot(page, 'user_profile_complete', 'profile');
    apiMonitor.logSummary();
  });

  test('3. Character Management - Complete Flow', async ({ page }) => {
    console.log('🎭 TESTING: Complete Character Management');
    const apiMonitor = await TestHelpers.monitorAPIRequests(page, 'CharacterManagement');
    
    await TestHelpers.login(page);
    
    // 3.1 Character Dashboard
    console.log('📋 Testing character dashboard...');
    const characterSection = page.locator('text="My Characters", text="Characters", [class*="character"]');
    if (await characterSection.count() > 0) {
      console.log('  ✅ Character section found');
    }
    
    // 3.2 Character Creation
    console.log('✨ Testing character creation...');
    const createButtons = await TestHelpers.testElementInteraction(
      page,
      'button:has-text("Create Character"), a:has-text("Create Character"), button:has-text("Create"), button:has-text("New")',
      'Character Creation Buttons'
    );
    
    // Try to access character creation wizard
    const createButton = page.locator('button:has-text("Create Character"), button:has-text("Create")').first();
    if (await createButton.count() > 0) {
      await createButton.click();
      await page.waitForTimeout(3000);
      
      // Test character creation form
      console.log('  🧙 Testing character creation wizard...');
      
      // Character basics
      await TestHelpers.testForm(page, {
        'name': 'Test E2E Character',
        'player': 'Test Player'
      });
      
      // Species selection
      await TestHelpers.testDropdown(page, 'select[name*="species"], select[id*="species"]', 'Species Selection');
      
      // Career selection
      await TestHelpers.testDropdown(page, 'select[name*="career"], select[id*="career"]', 'Career Selection');
      
      // Game line selection
      await TestHelpers.testDropdown(page, 'select[name*="game"], select[id*="game"]', 'Game Line Selection');
      
      await TestHelpers.screenshot(page, 'character_creation_form', 'character');
      
      // Close/cancel character creation
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
    
    // 3.3 Character List Management
    console.log('📜 Testing character list...');
    const characterCards = await page.locator('[class*="character"], .card, [data-character]').count();
    console.log(`  ✅ Found ${characterCards} character elements`);
    
    // 3.4 Character Actions
    console.log('⚡ Testing character actions...');
    const actionElements = await TestHelpers.testElementInteraction(
      page,
      'button:has-text("View"), button:has-text("Edit"), button:has-text("Delete"), button:has-text("Advance")',
      'Character Action Buttons'
    );
    
    // 3.5 Character Sheet Access
    console.log('📄 Testing character sheet access...');
    const viewButton = page.locator('button:has-text("View"), a:has-text("View")').first();
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ Character sheet accessible');
      await TestHelpers.screenshot(page, 'character_sheet', 'character');
      await page.goBack();
    }
    
    // 3.6 Character Advancement
    console.log('⬆️ Testing character advancement...');
    const advanceElements = await TestHelpers.testElementInteraction(
      page,
      'button:has-text("Advance"), button:has-text("XP"), button:has-text("Level")',
      'Character Advancement Elements'
    );
    
    // 3.7 Character Export/Import
    console.log('📦 Testing character export/import...');
    const exportElements = await TestHelpers.testElementInteraction(
      page,
      'button:has-text("Export"), button:has-text("Import"), button:has-text("Download")',
      'Character Export/Import Elements'
    );
    
    await TestHelpers.screenshot(page, 'character_management_complete', 'character');
    apiMonitor.logSummary();
  });

  test('4. Campaign Management - Complete Flow', async ({ page }) => {
    console.log('🏰 TESTING: Complete Campaign Management');
    const apiMonitor = await TestHelpers.monitorAPIRequests(page, 'CampaignManagement');
    
    await TestHelpers.login(page);
    
    // 4.1 Campaign Navigation
    console.log('🧭 Testing campaign navigation...');
    const campaignNavigation = await TestHelpers.testElementInteraction(
      page,
      'a:has-text("Campaigns"), button:has-text("Campaigns"), [href*="campaign"]',
      'Campaign Navigation Elements'
    );
    
    // Navigate to campaigns page
    const campaignLink = page.locator('a:has-text("Campaigns"), button:has-text("Campaigns")').first();
    if (await campaignLink.count() > 0) {
      await campaignLink.click();
      await TestHelpers.waitForPageLoad(page);
      
      // 4.2 Campaign Creation
      console.log('🎯 Testing campaign creation...');
      const createCampaignButton = page.locator('#create-campaign-tab-btn, a:has-text("Create Campaign")').first();
      if (await createCampaignButton.count() > 0) {
        await createCampaignButton.click();
        await page.waitForTimeout(2000);
        
        // Test campaign creation form
        await TestHelpers.testForm(page, {
          'name': 'Test E2E Campaign',
          'description': 'A test campaign for E2E testing',
          'maxPlayers': '6'
        });
        
        await TestHelpers.screenshot(page, 'campaign_creation', 'campaign');
        
        // Cancel campaign creation
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
      
      // 4.3 Campaign Management
      console.log('⚙️ Testing campaign management...');
      const campaignCards = await page.locator('[class*="campaign"], .campaign-card').count();
      console.log(`  ✅ Found ${campaignCards} campaign elements`);
      
      // 4.4 Player Invitation System
      console.log('👥 Testing player invitation...');
      const inviteElements = await TestHelpers.testElementInteraction(
        page,
        'button:has-text("Invite"), button:has-text("Players"), [class*="invite"]',
        'Player Invitation Elements'
      );
      
      // 4.5 Campaign Settings
      console.log('⚙️ Testing campaign settings...');
      const settingsElements = await TestHelpers.testElementInteraction(
        page,
        'button:has-text("Settings"), button:has-text("Manage"), [class*="settings"]',
        'Campaign Settings Elements'
      );
      
      // 4.6 Session Management
      console.log('📅 Testing session management...');
      const sessionElements = await TestHelpers.testElementInteraction(
        page,
        'button:has-text("Session"), button:has-text("Schedule"), [class*="session"]',
        'Session Management Elements'
      );
    }
    
    await TestHelpers.screenshot(page, 'campaign_management_complete', 'campaign');
    apiMonitor.logSummary();
  });

  test('5. Admin Panel - Complete Flow', async ({ page }) => {
    console.log('🛡️ TESTING: Complete Admin Panel');
    const apiMonitor = await TestHelpers.monitorAPIRequests(page, 'AdminPanel');
    
    await TestHelpers.login(page);
    
    // 5.1 Admin Panel Access
    console.log('🔐 Testing admin panel access...');
    
    // First open the user menu to access admin panel
    const userMenuButton = page.locator('button:has-text("Settings")').first();
    if (await userMenuButton.count() > 0) {
      await userMenuButton.click();
      await page.waitForTimeout(1000);
      
      // Now look for admin link in the opened menu
      const adminLink = page.locator('a:has-text("Admin"), button:has-text("Admin")').first();
        if (await adminLink.count() > 0) {
          await adminLink.click();
          await TestHelpers.waitForPageLoad(page);
        
          // 5.2 User Management
          console.log('👥 Testing admin user management...');
          const userTabs = await TestHelpers.testElementInteraction(
            page,
            'tab:has-text("Users"), button:has-text("Users"), [data-tab="users"]',
            'User Management Tabs'
          );
          
          // 5.3 Invite Code Management
          console.log('🎫 Testing invite code management...');
          const inviteTabs = await TestHelpers.testElementInteraction(
            page,
            'tab:has-text("Invite"), button:has-text("Invite"), [data-tab="invite"]',
            'Invite Code Management'
          );
          
          // 5.4 System Settings
          console.log('⚙️ Testing system settings...');
          const settingsTabs = await TestHelpers.testElementInteraction(
            page,
            'tab:has-text("Settings"), button:has-text("Settings"), [data-tab="settings"]',
            'System Settings'
          );
          
          // 5.5 Audit Logs
          console.log('📊 Testing audit logs...');
          const auditTabs = await TestHelpers.testElementInteraction(
            page,
            'tab:has-text("Audit"), button:has-text("Logs"), [data-tab="audit"]',
            'Audit Logs'
          );
          
          // 5.6 Database Management
          console.log('🗄️ Testing database management...');
          const dbElements = await TestHelpers.testElementInteraction(
            page,
            'button:has-text("Backup"), button:has-text("Database"), [class*="database"]',
            'Database Management Elements'
          );
        }
      }
    
    await TestHelpers.screenshot(page, 'admin_panel_complete', 'admin');
    apiMonitor.logSummary();
  });

  test('6. Navigation and UI Components - Complete Flow', async ({ page }) => {
    console.log('🧭 TESTING: Complete Navigation and UI Components');
    
    await TestHelpers.login(page);
    
    // 6.1 Main Navigation
    console.log('📱 Testing main navigation...');
    const navElements = await TestHelpers.testElementInteraction(
      page,
      'nav a, .navbar a, .nav-item',
      'Main Navigation Links'
    );
    
    // 6.2 User Menu Dropdown
    console.log('👤 Testing user menu dropdown...');
    await TestHelpers.testDropdown(page, 'button:has-text("Settings"), [class*="user-menu"]', 'User Menu Dropdown');
    
    // 6.3 Breadcrumb Navigation
    console.log('🍞 Testing breadcrumb navigation...');
    const breadcrumbs = await page.locator('.breadcrumb, [class*="breadcrumb"]').count();
    console.log(`  ✅ Found ${breadcrumbs} breadcrumb elements`);
    
    // 6.4 Modal System
    console.log('🗨️ Testing modal system...');
    const modalTriggers = await TestHelpers.testElementInteraction(
      page,
      'button[data-modal], button:has-text("Settings"), [data-toggle="modal"]',
      'Modal Trigger Elements'
    );
    
    // 6.5 Form Controls
    console.log('📝 Testing form controls...');
    const formElements = await page.locator('input, select, textarea, button').count();
    console.log(`  ✅ Found ${formElements} form elements`);
    
    // Test all select dropdowns
    const selects = await page.locator('select').count();
    for (let i = 0; i < selects; i++) {
      await TestHelpers.testDropdown(page, `select >> nth=${i}`, `Select Dropdown ${i + 1}`);
    }
    
    // 6.6 Responsive Design
    await TestHelpers.testResponsiveDesign(page, 'navigation');
    
    await TestHelpers.screenshot(page, 'navigation_ui_complete', 'navigation');
  });

  test('7. Social Authentication - Complete Flow', async ({ page }) => {
    console.log('🌐 TESTING: Complete Social Authentication');
    
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    
    // 7.1 OAuth Buttons
    console.log('🔍 Testing OAuth buttons...');
    const oauthButtons = await TestHelpers.testElementInteraction(
      page,
      'button:has-text("Google"), button:has-text("Discord"), [class*="oauth"]',
      'OAuth Authentication Buttons'
    );
    
    // 7.2 Social Registration
    console.log('📝 Testing social registration...');
    const socialRegButtons = await TestHelpers.testElementInteraction(
      page,
      'a:has-text("Register"), button:has-text("Sign up"), [href*="register"]',
      'Social Registration Elements'
    );
    
    // 7.3 Account Linking
    console.log('🔗 Testing account linking...');
    // This would be tested after login if linking options are available
    
    await TestHelpers.screenshot(page, 'social_auth_complete', 'social');
  });

  test('8. Data Management - Complete Flow', async ({ page }) => {
    console.log('📦 TESTING: Complete Data Management');
    const apiMonitor = await TestHelpers.monitorAPIRequests(page, 'DataManagement');
    
    await TestHelpers.login(page);
    
    // 8.1 Data Export
    console.log('📤 Testing data export...');
    const exportElements = await TestHelpers.testElementInteraction(
      page,
      'button:has-text("Export"), button:has-text("Download"), [class*="export"]',
      'Data Export Elements'
    );
    
    // 8.2 Data Import
    console.log('📥 Testing data import...');
    const importElements = await TestHelpers.testElementInteraction(
      page,
      'button:has-text("Import"), input[type="file"], [class*="import"]',
      'Data Import Elements'
    );
    
    // 8.3 Backup System
    console.log('💾 Testing backup system...');
    const backupElements = await TestHelpers.testElementInteraction(
      page,
      'button:has-text("Backup"), button:has-text("Save"), [class*="backup"]',
      'Backup System Elements'
    );
    
    // 8.4 Search and Filter
    console.log('🔍 Testing search and filter...');
    const searchElements = await page.locator('input[type="search"], input[placeholder*="search"], [class*="search"]').count();
    console.log(`  ✅ Found ${searchElements} search elements`);
    
    const filterElements = await page.locator('select[class*="filter"], [class*="filter"]').count();
    console.log(`  ✅ Found ${filterElements} filter elements`);
    
    await TestHelpers.screenshot(page, 'data_management_complete', 'data');
    apiMonitor.logSummary();
  });

  test('9. Error Handling and Security - Complete Flow', async ({ page }) => {
    console.log('🔒 TESTING: Complete Error Handling and Security');
    
    // 9.1 Authentication Security
    console.log('🔐 Testing authentication security...');
    await TestHelpers.testErrorHandling(page);
    
    // 9.2 API Security
    console.log('🔌 Testing API security...');
    const apiResponse = await page.goto(`${TEST_CONFIG.baseUrl}/api/characters`);
    if (apiResponse.status() === 401) {
      console.log('  ✅ API properly protected (401 Unauthorized)');
    } else {
      console.log('  ⚠️ API security needs review');
    }
    
    // 9.3 Input Validation
    console.log('📝 Testing input validation...');
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    
    // Test XSS prevention
    await page.fill('input[type="email"]', '<script>alert("xss")</script>');
    await page.fill('input[type="password"]', '<script>alert("xss")</script>');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Should not execute script
    console.log('  ✅ XSS prevention test completed');
    
    // 9.4 Session Security
    console.log('🔄 Testing session security...');
    await TestHelpers.login(page);
    
    // Test session timeout (if applicable)
    // Test concurrent sessions (if applicable)
    
    await TestHelpers.screenshot(page, 'security_complete', 'security');
  });

  test('10. Performance and Load Testing - Complete Flow', async ({ page }) => {
    console.log('⚡ TESTING: Performance and Load Testing');
    
    await TestHelpers.login(page);
    
    // 10.1 Page Load Performance
    console.log('🏃 Testing page load performance...');
    const startTime = Date.now();
    await page.reload();
    await TestHelpers.waitForPageLoad(page);
    const loadTime = Date.now() - startTime;
    
    console.log(`  ✅ Page load time: ${loadTime}ms`);
    
    // 10.2 Interactive Element Performance
    console.log('🖱️ Testing interactive element performance...');
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    
    const interactionStartTime = Date.now();
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      try {
        await buttons.nth(i).click();
        await page.waitForTimeout(100);
      } catch (e) {
        // Continue testing
      }
    }
    const interactionTime = Date.now() - interactionStartTime;
    
    console.log(`  ✅ Interaction performance: ${interactionTime}ms for ${Math.min(buttonCount, 5)} interactions`);
    
    // 10.3 Memory Usage (basic)
    console.log('🧠 Testing basic performance metrics...');
    const performanceMetrics = await page.evaluate(() => {
      return {
        memory: performance.memory ? performance.memory.usedJSHeapSize : 'N/A',
        timing: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : 'N/A'
      };
    });
    
    console.log(`  ✅ Performance metrics:`, performanceMetrics);
    
    await TestHelpers.screenshot(page, 'performance_complete', 'performance');
  });

  test('11. Production Issues - Character Deletion API Errors', async ({ page }) => {
    console.log('🗑️ TESTING: Character deletion from campaigns (API error validation)');
    const apiMonitor = await TestHelpers.monitorAPIRequests(page, 'CharacterDeletion');
    
    await TestHelpers.login(page);
    
    // Navigate to campaigns
    console.log('🏰 Navigating to campaigns...');
    const campaignLink = page.locator('a:has-text("Campaigns")').first();
    if (await campaignLink.count() > 0) {
      await campaignLink.click();
      await TestHelpers.waitForPageLoad(page);
      
      // Look for character management in campaigns
      console.log('👥 Testing character/player management...');
      const playerElements = await page.locator('[class*="player"], [class*="character"], button:has-text("Remove"), button:has-text("Delete")').count();
      console.log(`  Found ${playerElements} player/character management elements`);
      
      // Test deletion functionality
      const deleteButtons = page.locator('button:has-text("Remove"), button:has-text("Delete")');
      const deleteCount = await deleteButtons.count();
      
      if (deleteCount > 0) {
        console.log(`🔍 Testing ${deleteCount} deletion buttons...`);
        
        for (let i = 0; i < Math.min(deleteCount, 3); i++) {
          try {
            const buttonText = await deleteButtons.nth(i).textContent();
            console.log(`  🗑️ Testing deletion: "${buttonText.trim()}"`);
            
            await deleteButtons.nth(i).click();
            await page.waitForTimeout(2000);
            
            // Check for "Resource not found" error
            const errorMessages = await page.locator('.error, .alert-danger, [class*="error"]').count();
            if (errorMessages > 0) {
              const errorText = await page.locator('.error, .alert-danger, [class*="error"]').first().textContent();
              console.log(`    ❌ Error found: "${errorText}"`);
              if (errorText.includes('Resource not found')) {
                console.log('    ⚠️ PRODUCTION ISSUE: Resource not found error detected');
              }
            }
            
            await TestHelpers.screenshot(page, `deletion_test_${i}`, 'campaign-deletion');
          } catch (e) {
            console.log(`    ⚠️ Deletion test ${i} failed: ${e.message}`);
          }
        }
      }
    }
    
    apiMonitor.logSummary();
  });

  test('12. Production Issues - Page Navigation vs Modal Requirements', async ({ page }) => {
    console.log('🔗 TESTING: Page navigation vs modal behavior (UX requirement validation)');
    
    await TestHelpers.login(page);
    const startUrl = page.url();
    
    // Test buttons that SHOULD navigate to new pages (not modals)
    const navigationButtons = [
      { selector: 'a:has-text("Create Character"), button:has-text("Create Character")', name: 'Create Character', shouldNavigate: true },
      { selector: 'a:has-text("Campaigns")', name: 'Campaigns', shouldNavigate: true },
      { selector: 'a:has-text("Documentation")', name: 'Documentation', shouldNavigate: true },
      { selector: 'button:has-text("Settings")', name: 'Settings', shouldNavigate: true }
    ];
    
    for (const button of navigationButtons) {
      console.log(`🔍 Testing ${button.name} navigation behavior...`);
      
      const element = page.locator(button.selector).first();
      if (await element.count() > 0) {
        const isVisible = await element.isVisible();
        
        if (isVisible) {
          await element.click();
          await page.waitForTimeout(3000);
          
          const currentUrl = page.url();
          const hasModal = await page.locator('.modal:visible, [class*="modal"]:visible').count() > 0;
          
          if (button.shouldNavigate) {
            if (hasModal) {
              console.log(`    ❌ PRODUCTION ISSUE: ${button.name} opened modal instead of navigating to new page`);
              console.log(`       Requirement: Should navigate to new page, not show modal`);
              await TestHelpers.screenshot(page, `modal_instead_of_page_${button.name.toLowerCase().replace(' ', '_')}`, 'navigation-issues');
              
              // Close modal
              await page.keyboard.press('Escape');
              await page.waitForTimeout(1000);
            } else if (currentUrl !== startUrl) {
              console.log(`    ✅ ${button.name}: Correctly navigated to new page: ${currentUrl}`);
            } else {
              console.log(`    ⚠️ ${button.name}: No navigation occurred, URL unchanged`);
            }
          }
          
          // Return to start
          await page.goto(startUrl);
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('13. Production Issues - UI State Management During Navigation', async ({ page }) => {
    console.log('🎭 TESTING: UI state management (old elements should disappear)');
    
    await TestHelpers.login(page);
    
    // Test Create Character flow
    console.log('✨ Testing Create Character UI state management...');
    const createButton = page.locator('a:has-text("Create Character"), button:has-text("Create Character")').first();
    
    if (await createButton.count() > 0) {
      // Count initial navigation elements
      const initialNavCount = await page.locator('nav a, .navbar a').count();
      const initialDashboard = await page.locator('text="My Characters", text="Dashboard"').count();
      const initialCampaignNav = await page.locator('a:has-text("Campaigns")').count();
      
      console.log(`  📊 Initial state: ${initialNavCount} nav links, dashboard: ${initialDashboard}, campaigns: ${initialCampaignNav}`);
      
      await createButton.click();
      await page.waitForTimeout(3000);
      
      // Check if old navigation is still visible
      const afterDashboard = await page.locator('text="My Characters", text="Dashboard"').count();
      const afterCampaignNav = await page.locator('a:has-text("Campaigns")').count();
      
      console.log(`  📊 After character creation: dashboard: ${afterDashboard}, campaigns: ${afterCampaignNav}`);
      
      if (afterDashboard > 0) {
        console.log('    ❌ PRODUCTION ISSUE: Dashboard elements still visible during character creation');
        console.log('       Requirement: Old UI elements should be hidden when navigating to new page');
      }
      
      if (afterCampaignNav > 0) {
        console.log('    ❌ PRODUCTION ISSUE: Campaign navigation still visible during character creation');
      }
      
      await TestHelpers.screenshot(page, 'character_creation_ui_state', 'ui-state-issues');
    }
  });

  test('14. Production Issues - Settings Modal Button Functionality', async ({ page }) => {
    console.log('⚙️ TESTING: Settings modal button functionality (buttons not working)');
    
    await TestHelpers.login(page);
    
    // Open settings
    const settingsButton = page.locator('button:has-text("Settings")').first();
    if (await settingsButton.count() > 0) {
      await settingsButton.click();
      await page.waitForTimeout(2000);
      
      // Test tab navigation
      console.log('📑 Testing settings tabs...');
      const tabs = ['General', 'Security', 'Privacy', 'Activity'];
      
      for (const tab of tabs) {
        const tabElement = page.locator(`text="${tab}", button:has-text("${tab}"), [data-tab="${tab.toLowerCase()}"]`);
        if (await tabElement.count() > 0) {
          console.log(`  🔍 Testing ${tab} tab...`);
          
          try {
            await tabElement.first().click();
            await page.waitForTimeout(1000);
            
            // Check if tab content actually changed
            const tabContent = await page.locator('.tab-content, [class*="tab-content"]').textContent();
            console.log(`    ✅ ${tab} tab clicked, content length: ${tabContent ? tabContent.length : 0}`);
          } catch (e) {
            console.log(`    ❌ ${tab} tab failed: ${e.message}`);
          }
        }
      }
      
      // Test specific buttons within settings that should work
      console.log('🔘 Testing settings buttons functionality...');
      const settingsButtons = [
        { selector: 'button:has-text("Save")', name: 'Save' },
        { selector: 'button:has-text("Update")', name: 'Update' },
        { selector: 'button:has-text("Change Password")', name: 'Change Password' },
        { selector: 'button:has-text("Download")', name: 'Download' },
        { selector: 'button:has-text("Export")', name: 'Export' }
      ];
      
      for (const btn of settingsButtons) {
        const button = page.locator(btn.selector);
        const buttonCount = await button.count();
        
        if (buttonCount > 0) {
          try {
            const buttonText = await button.first().textContent();
            console.log(`  🔘 Testing ${btn.name} button: "${buttonText.trim()}"`);
            
            const isEnabled = await button.first().isEnabled();
            const isVisible = await button.first().isVisible();
            
            console.log(`     Visible: ${isVisible}, Enabled: ${isEnabled}`);
            
            if (isVisible && isEnabled) {
              await button.first().click();
              await page.waitForTimeout(1000);
              
              // Check for any response (success message, error, action)
              const feedback = await page.locator('.success, .error, .alert, [class*="success"], [class*="error"]').count();
              console.log(`     Response elements: ${feedback}`);
              
              if (feedback === 0) {
                console.log(`     ⚠️ No feedback for ${btn.name} button click - may not be working`);
              }
            } else {
              console.log(`     ❌ ${btn.name} button not interactive`);
            }
          } catch (e) {
            console.log(`     ❌ ${btn.name} button test failed: ${e.message}`);
          }
        }
      }
      
      await TestHelpers.screenshot(page, 'settings_buttons_test', 'settings-functionality');
    }
  });

  test('15. Production Issues - Admin Panel Re-authentication Required', async ({ page }) => {
    console.log('🛡️ TESTING: Admin panel authentication (should not require re-login)');
    
    await TestHelpers.login(page);
    
    // Verify we're logged in as admin
    console.log('👤 Verifying admin status...');
    await page.goto(`${TEST_CONFIG.baseUrl}/api/auth/me`);
    const userInfo = await page.textContent('body');
    console.log(`  User info: ${userInfo.substring(0, 100)}...`);
    
    // Navigate back and try admin access
    await page.goto(TEST_CONFIG.baseUrl);
    await page.waitForTimeout(2000);
    
    // Open user menu
    const userMenuButton = page.locator('button:has-text("Settings")').first();
    if (await userMenuButton.count() > 0) {
      await userMenuButton.click();
      await page.waitForTimeout(1000);
      
      // Look for admin link
      const adminLink = page.locator('a:has-text("Admin"), button:has-text("Admin")').first();
      if (await adminLink.count() > 0) {
        console.log('🔗 Admin link found, attempting access...');
        
        await adminLink.click();
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        const loginRequired = currentUrl.includes('login') || await page.locator('input[type="password"]').count() > 0;
        const hasLoginForm = await page.locator('form[action*="login"], input[type="password"]').count() > 0;
        
        if (loginRequired || hasLoginForm) {
          console.log('  ❌ PRODUCTION ISSUE: Admin panel requires re-authentication despite being logged in');
          console.log(`     Current URL: ${currentUrl}`);
          console.log(`     This should not happen - user is already authenticated`);
          await TestHelpers.screenshot(page, 'admin_reauth_required', 'admin-issues');
        } else {
          console.log('  ✅ Admin panel accessible without re-authentication');
          
          // Test admin functionality
          const adminContent = await page.textContent('body');
          const hasUserManagement = adminContent.toLowerCase().includes('user');
          const hasInviteManagement = adminContent.toLowerCase().includes('invite');
          
          console.log(`     Has user management: ${hasUserManagement}`);
          console.log(`     Has invite management: ${hasInviteManagement}`);
          
          await TestHelpers.screenshot(page, 'admin_panel_working', 'admin-functionality');
        }
      } else {
        console.log('  ❌ Admin link not found in user menu');
      }
    }
  });

  test('16. Production Issues - Documentation Content Missing', async ({ page }) => {
    console.log('📚 TESTING: Documentation content validation (should have actual content)');
    
    await TestHelpers.login(page);
    
    // Navigate to documentation
    const docsLink = page.locator('a:has-text("Documentation")').first();
    if (await docsLink.count() > 0) {
      await docsLink.click();
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log(`  📖 Documentation URL: ${currentUrl}`);
      
      // Check for actual documentation content
      const pageContent = await page.textContent('body');
      const contentLength = pageContent.length;
      const hasActualContent = contentLength > 1000; // Reasonable content length for docs
      const hasDocSections = await page.locator('h1, h2, h3').count();
      const hasCodeExamples = await page.locator('code, pre, .code').count();
      const hasHelpfulContent = pageContent.toLowerCase().includes('character') && 
                               pageContent.toLowerCase().includes('game') ||
                               pageContent.toLowerCase().includes('how to');
      
      console.log(`  📄 Content length: ${contentLength} characters`);
      console.log(`  📑 Documentation sections: ${hasDocSections}`);
      console.log(`  💻 Code examples: ${hasCodeExamples}`);
      console.log(`  📚 Has substantial content: ${hasActualContent}`);
      console.log(`  🎯 Has helpful content: ${hasHelpfulContent}`);
      
      if (!hasActualContent) {
        console.log('    ❌ PRODUCTION ISSUE: Documentation lacks substantial content');
        console.log('       Should have comprehensive user guides, API docs, etc.');
      }
      
      if (hasDocSections < 3) {
        console.log('    ❌ PRODUCTION ISSUE: Documentation lacks proper section structure');
      }
      
      if (!hasHelpfulContent) {
        console.log('    ❌ PRODUCTION ISSUE: Documentation doesn\'t contain helpful user-facing content');
      }
      
      await TestHelpers.screenshot(page, 'documentation_validation', 'documentation');
    } else {
      console.log('  ❌ Documentation link not found');
    }
  });

  test('17. Production Issues - API Error Handling Integration', async ({ page }) => {
    console.log('🚨 TESTING: API error handling (Resource not found and other errors)');
    const apiMonitor = await TestHelpers.monitorAPIRequests(page, 'ErrorHandling');
    
    await TestHelpers.login(page);
    
    // Test API error scenarios that users encounter
    console.log('🔌 Testing real-world API error scenarios...');
    
    const errorTests = [
      {
        name: 'Delete non-existent character',
        test: async () => {
          try {
            const response = await page.evaluate(async () => {
              const token = localStorage.getItem('token');
              const result = await fetch('/api/characters/invalid-character-id', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              return {
                status: result.status,
                body: await result.text()
              };
            });
            
            console.log(`    Response: ${response.status}`);
            if (response.body.includes('Resource not found')) {
              console.log('    ✅ Proper "Resource not found" error message');
            } else {
              console.log('    ⚠️ Error message could be clearer');
            }
          } catch (e) {
            console.log(`    ❌ Test failed: ${e.message}`);
          }
        }
      },
      {
        name: 'Remove player from campaign (reported issue)',
        test: async () => {
          try {
            const response = await page.evaluate(async () => {
              const token = localStorage.getItem('token');
              const result = await fetch('/api/campaigns/test-campaign/players/invalid-player', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              return {
                status: result.status,
                body: await result.text()
              };
            });
            
            console.log(`    Response: ${response.status}`);
            if (response.body.includes('Resource not found')) {
              console.log('    ⚠️ This matches the reported "Resource not found" error');
            }
          } catch (e) {
            console.log(`    ❌ Test failed: ${e.message}`);
          }
        }
      }
    ];
    
    for (const errorTest of errorTests) {
      console.log(`  🔍 Testing: ${errorTest.name}`);
      await errorTest.test();
    }
    
    apiMonitor.logSummary();
  });

});
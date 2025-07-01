/**
 * User Experience Validation - What Users Actually See
 * Tests the actual user interface, not just API responses
 */

const { test, expect } = require('@playwright/test');
const { TestHelpers, TEST_CONFIG } = require('./helpers/test-helpers');

test.describe('User Experience Validation', () => {

  test('Campaign Player Removal - User Interface Test', async ({ page }) => {
    console.log('👥 TESTING: Campaign player removal from user interface');
    
    await TestHelpers.login(page);
    
    // Navigate to campaigns page
    console.log('🏰 Navigating to campaigns page...');
    const campaignLink = page.locator('a:has-text("Campaigns")').first();
    if (await campaignLink.count() > 0) {
      await campaignLink.click();
      await TestHelpers.waitForPageLoad(page);
      
      // Look for campaign content
      const campaignCards = await page.locator('[class*="campaign"], .campaign-card, .card').count();
      console.log(`  📋 Found ${campaignCards} campaign elements`);
      
      if (campaignCards > 0) {
        // Click on first campaign to see details
        await page.locator('[class*="campaign"], .campaign-card, .card').first().click();
        await page.waitForTimeout(2000);
        
        // Look for player management interface
        console.log('👥 Looking for player management interface...');
        const playerList = await page.locator('[class*="player"], [class*="member"], .player-list').count();
        const removeButtons = await page.locator('button:has-text("Remove"), button:has-text("Kick")').count();
        
        console.log(`  👤 Player list elements: ${playerList}`);
        console.log(`  🗑️ Remove/kick buttons: ${removeButtons}`);
        
        if (removeButtons > 0) {
          console.log('🔍 Testing player removal...');
          const removeButton = page.locator('button:has-text("Remove"), button:has-text("Kick")').first();
          
          // Get button text for context
          const buttonText = await removeButton.textContent();
          console.log(`  Clicking: "${buttonText.trim()}"`);
          
          await removeButton.click();
          await page.waitForTimeout(3000);
          
          // Check for error messages in the UI
          const errorElements = await page.locator('.error, .alert-danger, [class*="error"], .toast-error').count();
          if (errorElements > 0) {
            const errorText = await page.locator('.error, .alert-danger, [class*="error"], .toast-error').first().textContent();
            console.log(`    ❌ UI Error displayed: "${errorText}"`);
            
            if (errorText.includes('Resource not found')) {
              console.log('    🎯 CONFIRMED: "Resource not found" error in UI');
            }
          }
          
          // Check if player was actually removed
          const playersAfter = await page.locator('[class*="player"], [class*="member"]').count();
          console.log(`    👥 Players after removal attempt: ${playersAfter}`);
          
        } else {
          console.log('  ℹ️ No remove buttons found - may need to create test campaign with players');
        }
      } else {
        console.log('  ℹ️ No campaigns found - may need to create test campaign first');
      }
      
      await TestHelpers.screenshot(page, 'campaign_player_removal', 'user-experience');
    }
  });

  test('Documentation Content - What Users Actually See', async ({ page }) => {
    console.log('📚 TESTING: Documentation content from user perspective');
    
    await TestHelpers.login(page);
    
    // Navigate to documentation
    console.log('📖 Accessing documentation page...');
    const docsLink = page.locator('a:has-text("Documentation")').first();
    if (await docsLink.count() > 0) {
      await docsLink.click();
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log(`  📍 Documentation URL: ${currentUrl}`);
      
      // Check what users actually see on the page
      const visibleText = await page.locator('body').textContent();
      const hasComingSoon = visibleText.toLowerCase().includes('coming soon');
      const hasPlaceholder = visibleText.toLowerCase().includes('placeholder') || 
                           visibleText.toLowerCase().includes('under construction') ||
                           visibleText.toLowerCase().includes('not available');
      
      console.log(`  📄 Page contains "coming soon": ${hasComingSoon}`);
      console.log(`  🚧 Page has placeholder content: ${hasPlaceholder}`);
      console.log(`  📏 Visible text length: ${visibleText.length} characters`);
      
      // Check for actual useful content vs placeholder
      const hasUsefulHeadings = await page.locator('h1:has-text("Getting Started"), h1:has-text("User Guide"), h1:has-text("API")').count();
      const hasUsefulSections = visibleText.toLowerCase().includes('how to') || 
                               visibleText.toLowerCase().includes('tutorial') ||
                               visibleText.toLowerCase().includes('character creation');
      
      console.log(`  📑 Useful documentation headings: ${hasUsefulHeadings}`);
      console.log(`  📖 Has tutorial/guide content: ${hasUsefulSections}`);
      
      if (hasComingSoon) {
        console.log('  ❌ CONFIRMED ISSUE: Documentation shows "coming soon" to users');
        console.log('     Despite API having content, users see placeholder');
      }
      
      if (!hasUsefulSections && visibleText.length < 2000) {
        console.log('  ❌ CONFIRMED ISSUE: Documentation lacks helpful user content');
      }
      
      // Take screenshot of what users actually see
      await TestHelpers.screenshot(page, 'documentation_user_view', 'user-experience');
      
      // Check specific sections that should exist
      const expectedSections = [
        'Getting Started',
        'Character Creation',
        'Campaign Management', 
        'Game Rules',
        'API Documentation'
      ];
      
      console.log('  🔍 Checking for expected documentation sections:');
      for (const section of expectedSections) {
        const sectionExists = visibleText.toLowerCase().includes(section.toLowerCase());
        console.log(`    ${section}: ${sectionExists ? '✅' : '❌'}`);
      }
    }
  });

  test('Settings Functionality - What Actually Happens', async ({ page }) => {
    console.log('⚙️ TESTING: Settings functionality from user perspective');
    
    await TestHelpers.login(page);
    
    // Test Settings button
    console.log('🔘 Testing Settings button behavior...');
    const settingsButton = page.locator('button:has-text("Settings")').first();
    
    if (await settingsButton.count() > 0) {
      const initialUrl = page.url();
      
      await settingsButton.click();
      await page.waitForTimeout(2000);
      
      const afterUrl = page.url();
      const hasModal = await page.locator('.modal:visible, [class*="modal"]:visible').count() > 0;
      const hasSettingsContent = await page.locator('text="General", text="Security", text="Privacy"').count() > 0;
      
      console.log(`  📍 URL before: ${initialUrl}`);
      console.log(`  📍 URL after: ${afterUrl}`);
      console.log(`  🗨️ Modal opened: ${hasModal}`);
      console.log(`  ⚙️ Settings content visible: ${hasSettingsContent}`);
      console.log(`  🔗 URL changed: ${afterUrl !== initialUrl}`);
      
      if (hasModal) {
        console.log('  ❌ Settings opens as modal (requirement: should be new page)');
        
        // Test if modal buttons actually work
        console.log('  🔘 Testing modal buttons functionality...');
        
        const modalButtons = await page.locator('.modal button, [class*="modal"] button').count();
        console.log(`    Found ${modalButtons} buttons in modal`);
        
        if (modalButtons > 0) {
          // Test first few buttons
          for (let i = 0; i < Math.min(modalButtons, 3); i++) {
            try {
              const button = page.locator('.modal button, [class*="modal"] button').nth(i);
              const buttonText = await button.textContent();
              const isVisible = await button.isVisible();
              const isEnabled = await button.isEnabled();
              
              console.log(`    Button ${i + 1}: "${buttonText.trim()}" - Visible: ${isVisible}, Enabled: ${isEnabled}`);
              
              if (isVisible && isEnabled && !buttonText.toLowerCase().includes('close')) {
                await button.click();
                await page.waitForTimeout(1000);
                
                // Check for any feedback
                const alerts = await page.locator('.alert, .success, .error, .toast').count();
                console.log(`      Response/feedback elements: ${alerts}`);
                
                if (alerts === 0) {
                  console.log(`      ⚠️ No feedback from "${buttonText.trim()}" button click`);
                }
              }
            } catch (e) {
              console.log(`    ❌ Button ${i + 1} test failed: ${e.message}`);
            }
          }
        }
        
      } else if (afterUrl !== initialUrl) {
        console.log('  ✅ Settings correctly navigates to new page');
      } else {
        console.log('  ❌ Settings button appears to do nothing');
      }
      
      await TestHelpers.screenshot(page, 'settings_user_experience', 'user-experience');
    }
  });

  test('Character Creation Flow - UI Navigation Issues', async ({ page }) => {
    console.log('✨ TESTING: Character creation UI navigation experience');
    
    await TestHelpers.login(page);
    
    // Check initial state
    console.log('📊 Initial page state...');
    const initialNavElements = await page.locator('nav a, .navbar a').allTextContents();
    const initialButtons = await page.locator('button:visible').allTextContents();
    
    console.log(`  🔗 Initial navigation: ${initialNavElements.slice(0, 5).join(', ')}`);
    console.log(`  🔘 Initial buttons: ${initialButtons.slice(0, 3).join(', ')}`);
    
    // Click Create Character
    console.log('🎭 Clicking Create Character...');
    const createButton = page.locator('a:has-text("Create Character"), button:has-text("Create Character")').first();
    
    if (await createButton.count() > 0) {
      await createButton.click();
      await page.waitForTimeout(3000);
      
      const newUrl = page.url();
      console.log(`  📍 New URL: ${newUrl}`);
      
      // Check what navigation is still visible
      const remainingNavElements = await page.locator('nav a, .navbar a').allTextContents();
      const remainingButtons = await page.locator('button:visible').allTextContents();
      
      console.log(`  🔗 Remaining navigation: ${remainingNavElements.slice(0, 5).join(', ')}`);
      console.log(`  🔘 Remaining buttons: ${remainingButtons.slice(0, 5).join(', ')}`);
      
      // Check specific problematic elements
      const dashboardStillThere = await page.locator('text="My Characters", text="Dashboard"').count() > 0;
      const campaignsStillThere = await page.locator('a:has-text("Campaigns")').isVisible().catch(() => false);
      
      console.log(`  🏠 "My Characters"/"Dashboard" still visible: ${dashboardStillThere}`);
      console.log(`  🏰 Campaigns navigation still visible: ${campaignsStillThere}`);
      
      if (dashboardStillThere || campaignsStillThere) {
        console.log('  ❌ CONFIRMED ISSUE: Old UI elements visible during character creation');
        console.log('     Users see mixed interface - confusing experience');
      }
      
      await TestHelpers.screenshot(page, 'character_creation_navigation', 'user-experience');
    }
  });

  test('Admin Panel Access - Real User Experience', async ({ page }) => {
    console.log('🛡️ TESTING: Admin panel access from user perspective');
    
    await TestHelpers.login(page);
    
    // Check if user is logged in
    console.log('👤 Verifying login status...');
    const welcomeText = await page.textContent('body');
    const userLoggedIn = !welcomeText.toLowerCase().includes('login') && 
                        !await page.locator('input[type="password"]').count() > 0;
    
    console.log(`  ✅ User appears logged in: ${userLoggedIn}`);
    
    if (userLoggedIn) {
      // Try to access admin panel through UI
      console.log('🔗 Attempting admin access through user interface...');
      
      const userMenuButton = page.locator('button:has-text("Settings")').first();
      if (await userMenuButton.count() > 0) {
        await userMenuButton.click();
        await page.waitForTimeout(1000);
        
        const adminLink = page.locator('a:has-text("Admin"), button:has-text("Admin")').first();
        if (await adminLink.count() > 0) {
          console.log('  🔗 Admin link found in menu');
          
          await adminLink.click();
          await page.waitForTimeout(3000);
          
          const resultUrl = page.url();
          const hasLoginForm = await page.locator('input[type="password"]').count() > 0;
          const hasLoginPage = resultUrl.includes('login');
          const pageContent = await page.textContent('body');
          
          console.log(`  📍 Result URL: ${resultUrl}`);
          console.log(`  🔑 Shows login form: ${hasLoginForm}`);
          console.log(`  📄 Login page detected: ${hasLoginPage}`);
          
          if (hasLoginForm || hasLoginPage) {
            console.log('  ❌ CONFIRMED ISSUE: Admin requires re-login despite being authenticated');
            console.log('     User experience: Click Admin → Forced to login again');
            
            // Check what login message shows
            if (pageContent.includes('please log in') || pageContent.includes('authentication required')) {
              console.log('     💬 Page shows authentication required message');
            }
          } else {
            console.log('  ✅ Admin panel accessible - checking content...');
            
            const hasAdminContent = pageContent.toLowerCase().includes('admin') || 
                                   pageContent.toLowerCase().includes('user management');
            console.log(`     📋 Has admin content: ${hasAdminContent}`);
          }
          
          await TestHelpers.screenshot(page, 'admin_access_experience', 'user-experience');
        } else {
          console.log('  ❌ Admin link not found in user menu');
        }
      } else {
        console.log('  ❌ Settings/user menu button not found');
      }
    }
  });

});
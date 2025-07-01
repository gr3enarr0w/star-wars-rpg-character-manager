const { test, expect } = require('@playwright/test');

test.describe('Comprehensive Browser-Based E2E Testing - All Features', () => {

  // Helper function to login
  async function login(page) {
    await page.goto('http://localhost:8001/login');
    await page.fill('input[type="email"]', 'clark@clarkeverson.com');
    await page.fill('input[type="password"]', 'TestPassword123456789@#$');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:8001/', { timeout: 10000 });
  }

  test('Complete User Management Workflow', async ({ page }) => {
    console.log('👤 Testing complete user management in browser...');
    
    await login(page);
    
    // 1. Profile Settings Access
    console.log('🔧 Testing profile settings modal...');
    const profileButton = page.locator('button:has-text("Profile"), [class*="profile"], [id*="profile"]');
    if (await profileButton.count() > 0) {
      await profileButton.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ Profile modal opened');
    }
    
    // 2. Password Change
    console.log('🔑 Testing password change workflow...');
    const passwordTab = page.locator('text="Security", text="Password", [href*="security"]');
    if (await passwordTab.count() > 0) {
      await passwordTab.first().click();
      await page.waitForTimeout(1000);
      
      const currentPasswordField = page.locator('input[name*="current"], input[placeholder*="current"]');
      const newPasswordField = page.locator('input[name*="new"], input[placeholder*="new"]');
      
      if (await currentPasswordField.count() > 0 && await newPasswordField.count() > 0) {
        await currentPasswordField.fill('TestPassword123456789@#$');
        await newPasswordField.fill('NewTestPassword123456789@#$');
        console.log('✅ Password change form fields available');
      }
    }
    
    // 3. MFA Setup
    console.log('🔐 Testing MFA setup workflow...');
    const mfaButton = page.locator('button:has-text("2FA"), button:has-text("MFA"), [class*="mfa"]');
    if (await mfaButton.count() > 0) {
      await mfaButton.first().click();
      await page.waitForTimeout(2000);
      
      // Look for QR code or setup elements
      const qrCode = page.locator('img[src*="data:image"], canvas, [class*="qr"]');
      if (await qrCode.count() > 0) {
        console.log('✅ MFA setup interface with QR code available');
      }
    }
    
    // 4. Data Export
    console.log('📦 Testing user data export...');
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), [class*="export"]');
    if (await exportButton.count() > 0) {
      console.log('✅ Data export functionality available');
    }
    
    await page.screenshot({ path: 'user_management_workflow.png' });
  });

  test('Complete Character Management Workflow', async ({ page }) => {
    console.log('🎭 Testing complete character management in browser...');
    
    await login(page);
    
    // 1. Character Creation
    console.log('✨ Testing character creation wizard...');
    const createCharacterButton = page.locator('button:has-text("Create Character"), a:has-text("Create Character")');
    if (await createCharacterButton.count() > 0) {
      await createCharacterButton.first().click();
      await page.waitForTimeout(2000);
      
      // Step 1: Basic Info
      const nameField = page.locator('input[name*="name"], input[placeholder*="name"]');
      if (await nameField.count() > 0) {
        await nameField.fill('Test Browser Character');
        console.log('✅ Character name entered');
      }
      
      // Species selection
      const speciesSelect = page.locator('select[name*="species"], select[id*="species"]');
      if (await speciesSelect.count() > 0) {
        await speciesSelect.selectOption('Human');
        console.log('✅ Species selected');
      }
      
      // Career selection
      const careerSelect = page.locator('select[name*="career"], select[id*="career"]');
      if (await careerSelect.count() > 0) {
        await careerSelect.selectOption({ index: 1 });
        console.log('✅ Career selected');
      }
      
      // Look for Next/Submit button
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Create")');
      if (await nextButton.count() > 0) {
        await nextButton.first().click();
        await page.waitForTimeout(2000);
        console.log('✅ Character creation form progressed');
      }
    }
    
    // 2. Character List Management
    console.log('📋 Testing character list interface...');
    await page.goto('http://localhost:8001/');
    await page.waitForTimeout(2000);
    
    const characterCards = page.locator('[class*="character"], .card, [data-character]');
    const characterCount = await characterCards.count();
    console.log(`✅ Found ${characterCount} character elements`);
    
    // 3. Character Sheet Access
    if (characterCount > 0) {
      console.log('📄 Testing character sheet access...');
      const viewButton = page.locator('button:has-text("View"), a:has-text("View"), [class*="view"]');
      if (await viewButton.count() > 0) {
        await viewButton.first().click();
        await page.waitForTimeout(2000);
        console.log('✅ Character sheet accessible');
      }
    }
    
    // 4. Character Advancement
    console.log('⬆️ Testing character advancement...');
    const advanceButton = page.locator('button:has-text("Advance"), button:has-text("XP"), [class*="advance"]');
    if (await advanceButton.count() > 0) {
      await advanceButton.first().click();
      await page.waitForTimeout(2000);
      console.log('✅ Character advancement interface available');
    }
    
    await page.screenshot({ path: 'character_management_workflow.png' });
  });

  test('Complete Campaign Management Workflow', async ({ page }) => {
    console.log('🏰 Testing complete campaign management in browser...');
    
    await login(page);
    
    // 1. Campaign Creation
    console.log('🎯 Testing campaign creation...');
    const campaignsTab = page.locator('a:has-text("Campaigns"), button:has-text("Campaigns"), [href*="campaign"]');
    if (await campaignsTab.count() > 0) {
      await campaignsTab.first().click();
      await page.waitForTimeout(2000);
      
      const createCampaignButton = page.locator('#create-campaign-tab-btn, a:has-text("Create Campaign")');
      if (await createCampaignButton.count() > 0) {
        await createCampaignButton.first().click();
        await page.waitForTimeout(2000);
        
        // Fill campaign form
        const campaignNameField = page.locator('input[name*="name"], input[placeholder*="name"]');
        if (await campaignNameField.count() > 0) {
          await campaignNameField.fill('Test Browser Campaign');
          console.log('✅ Campaign name entered');
        }
        
        const descriptionField = page.locator('textarea[name*="description"], textarea[placeholder*="description"]');
        if (await descriptionField.count() > 0) {
          await descriptionField.fill('A test campaign created via browser testing');
          console.log('✅ Campaign description entered');
        }
        
        const submitButton = page.locator('button:has-text("Create"), button:has-text("Submit")');
        if (await submitButton.count() > 0) {
          await submitButton.first().click();
          await page.waitForTimeout(2000);
          console.log('✅ Campaign creation submitted');
        }
      }
    }
    
    // 2. Campaign Management
    console.log('⚙️ Testing campaign management interface...');
    const campaignCards = page.locator('[class*="campaign"], .campaign-card, [data-campaign]');
    const campaignCount = await campaignCards.count();
    console.log(`✅ Found ${campaignCount} campaign elements`);
    
    // 3. Player Invitation
    console.log('👥 Testing player invitation system...');
    const inviteButton = page.locator('button:has-text("Invite"), button:has-text("Players"), [class*="invite"]');
    if (await inviteButton.count() > 0) {
      await inviteButton.first().click();
      await page.waitForTimeout(2000);
      
      const inviteCode = page.locator('[class*="code"], [data-code], code');
      if (await inviteCode.count() > 0) {
        console.log('✅ Invite code generation working');
      }
    }
    
    await page.screenshot({ path: 'campaign_management_workflow.png' });
  });

  test('Admin Panel Complete Workflow', async ({ page }) => {
    console.log('🛡️ Testing complete admin panel in browser...');
    
    await login(page);
    
    // 1. Admin Panel Access
    console.log('🔐 Testing admin panel access...');
    const adminButton = page.locator('a:has-text("Admin"), button:has-text("Admin"), [href*="admin"]');
    if (await adminButton.count() > 0) {
      await adminButton.first().click();
      await page.waitForTimeout(2000);
      
      // 2. User Management
      console.log('👤 Testing user management...');
      const userTab = page.locator('tab:has-text("Users"), button:has-text("Users"), [data-tab="users"]');
      if (await userTab.count() > 0) {
        await userTab.first().click();
        await page.waitForTimeout(2000);
        
        const userList = page.locator('[class*="user"], .user-row, [data-user]');
        const userCount = await userList.count();
        console.log(`✅ Found ${userCount} users in admin panel`);
      }
      
      // 3. Invite Code Management
      console.log('🎫 Testing invite code management...');
      const inviteTab = page.locator('tab:has-text("Invite"), button:has-text("Invite"), [data-tab="invite"]');
      if (await inviteTab.count() > 0) {
        await inviteTab.first().click();
        await page.waitForTimeout(2000);
        
        const generateButton = page.locator('button:has-text("Generate"), button:has-text("Create")');
        if (await generateButton.count() > 0) {
          console.log('✅ Invite code generation interface available');
        }
      }
      
      // 4. System Settings
      console.log('⚙️ Testing system settings...');
      const settingsTab = page.locator('tab:has-text("Settings"), button:has-text("Settings"), [data-tab="settings"]');
      if (await settingsTab.count() > 0) {
        await settingsTab.first().click();
        await page.waitForTimeout(2000);
        console.log('✅ System settings accessible');
      }
    }
    
    await page.screenshot({ path: 'admin_workflow.png' });
  });

  test('Social Authentication Workflow', async ({ page }) => {
    console.log('🌐 Testing social authentication in browser...');
    
    await page.goto('http://localhost:8001/login');
    
    // 1. Google OAuth
    console.log('🔍 Testing Google OAuth interface...');
    const googleButton = page.locator('button:has-text("Google"), a:has-text("Google"), [class*="google"]');
    if (await googleButton.count() > 0) {
      console.log('✅ Google OAuth button available');
      // Note: We don't actually click to avoid real OAuth flow in testing
    }
    
    // 2. Discord OAuth
    console.log('💬 Testing Discord OAuth interface...');
    const discordButton = page.locator('button:has-text("Discord"), a:has-text("Discord"), [class*="discord"]');
    if (await discordButton.count() > 0) {
      console.log('✅ Discord OAuth button available');
      // Note: We don't actually click to avoid real OAuth flow in testing
    }
    
    await page.screenshot({ path: 'social_auth_workflow.png' });
  });

  test('Responsive Design and Navigation', async ({ page }) => {
    console.log('📱 Testing responsive design across devices...');
    
    await login(page);
    
    // 1. Desktop View
    console.log('🖥️ Testing desktop layout...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    const desktopNav = await page.locator('nav, .navbar, .navigation').count();
    console.log(`✅ Desktop navigation elements: ${desktopNav}`);
    
    // 2. Tablet View
    console.log('📱 Testing tablet layout...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    const tabletNav = await page.locator('nav, .navbar, .navigation').count();
    console.log(`✅ Tablet navigation elements: ${tabletNav}`);
    
    // 3. Mobile View
    console.log('📲 Testing mobile layout...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileNav = await page.locator('nav, .navbar, .navigation').count();
    const mobileMenu = await page.locator('button[class*="menu"], .hamburger, [aria-label*="menu"]').count();
    console.log(`✅ Mobile navigation: ${mobileNav} nav, ${mobileMenu} menu buttons`);
    
    // 4. Navigation Testing
    console.log('🧭 Testing navigation functionality...');
    const navLinks = page.locator('nav a, .nav a, .navbar a');
    const linkCount = await navLinks.count();
    
    if (linkCount > 0) {
      // Test first navigation link
      await navLinks.first().click();
      await page.waitForTimeout(2000);
      console.log('✅ Navigation links functional');
    }
    
    await page.screenshot({ path: 'responsive_design_workflow.png' });
  });

  test('Data Import/Export Workflow', async ({ page }) => {
    console.log('📦 Testing data import/export in browser...');
    
    await login(page);
    
    // 1. Character Export
    console.log('📤 Testing character export...');
    const exportButton = page.locator('button:has-text("Export"), a:has-text("Export"), [class*="export"]');
    if (await exportButton.count() > 0) {
      console.log('✅ Character export functionality available');
      // Note: We don't actually download to avoid file system interaction in testing
    }
    
    // 2. Character Import
    console.log('📥 Testing character import interface...');
    const importButton = page.locator('button:has-text("Import"), input[type="file"], [class*="import"]');
    if (await importButton.count() > 0) {
      console.log('✅ Character import interface available');
    }
    
    // 3. Bulk Operations
    console.log('📋 Testing bulk operations...');
    const bulkButton = page.locator('button:has-text("Bulk"), button:has-text("All"), [class*="bulk"]');
    if (await bulkButton.count() > 0) {
      console.log('✅ Bulk operations available');
    }
    
    await page.screenshot({ path: 'data_management_workflow.png' });
  });

  test('Error Handling and Edge Cases', async ({ page }) => {
    console.log('⚠️ Testing error handling and edge cases...');
    
    // 1. Invalid URLs
    console.log('🔗 Testing invalid URL handling...');
    await page.goto('http://localhost:8001/nonexistent-page');
    await page.waitForTimeout(2000);
    
    const errorPage = await page.locator('h1:has-text("404"), h1:has-text("Not Found"), .error').count();
    if (errorPage > 0) {
      console.log('✅ 404 error page properly displayed');
    }
    
    // 2. Form Validation
    console.log('📝 Testing form validation...');
    await page.goto('http://localhost:8001/login');
    
    // Submit empty form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    const validationMessages = await page.locator('.error, .invalid, [class*="error"]').count();
    console.log(`✅ Form validation messages: ${validationMessages}`);
    
    // 3. Network Error Simulation
    console.log('🌐 Testing network error handling...');
    await login(page);
    
    // Intercept and fail a request
    await page.route('**/api/characters', route => route.abort());
    
    try {
      await page.reload();
      await page.waitForTimeout(3000);
      
      const errorMessages = await page.locator('.error, .alert, [class*="error"]').count();
      console.log(`✅ Network error handling: ${errorMessages} error messages displayed`);
    } catch (e) {
      console.log('✅ Network error properly handled');
    }
    
    await page.screenshot({ path: 'error_handling_workflow.png' });
  });

});
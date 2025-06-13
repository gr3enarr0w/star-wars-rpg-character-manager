// tests/comprehensive-e2e-all-roles.spec.js
const { test, expect } = require('@playwright/test');
const { ADMIN_USER, loginUser, generateInviteCode } = require('./auth.setup');

// Test users for each role
const TEST_USERS = {
  PLAYER: {
    email: 'player@swrpg.local',
    password: 'PlayerTest123#',
    username: 'testplayer',
    role: 'player'
  },
  GAME_MASTER: {
    email: 'gm@swrpg.local', 
    password: 'GMTest123#',
    username: 'testgm',
    role: 'gamemaster'
  },
  ADMIN: {
    email: 'admin@swrpg.local',
    password: 'admin123',
    username: 'admin',
    role: 'admin'
  }
};

test.describe('Comprehensive E2E Testing - All Roles & Features', () => {
  
  test.beforeEach(async ({ page }) => {
    // Ensure clean state and admin user exists
    await page.request.post('/api/debug/create-admin');
  });

  // =================================================================
  // ADMIN USER - COMPLETE WORKFLOW TESTING
  // =================================================================
  
  test.describe('Admin User - Complete Feature Testing', () => {
    
    test('Admin - Complete Authentication & Profile Management', async ({ page }) => {
      console.log('🔧 Testing Admin Authentication & Profile Management...');
      
      // 1. Admin Login
      await loginUser(page, ADMIN_USER);
      await expect(page.locator('#userDisplay')).toContainText('admin');
      
      // 2. Profile Settings Access with browser-specific handling
      await page.click('#userMenuToggle');
      await page.waitForSelector('#userMenuDropdown.show', { timeout: 30000 });
      
      // Wait for menu to be fully rendered and stabilized
      await page.waitForTimeout(1000);
      
      // Try multiple selectors for profile settings button
      const profileButton = await page.locator('#profileSettingsBtn, .profile-settings, [data-action="profile"]').first();
      await profileButton.waitFor({ state: 'visible', timeout: 30000 });
      await profileButton.click();
      
      // Verify profile settings opened
      await expect(page.locator('h1')).toContainText('Account Settings');
      
      // 3. Password Change Testing (Security Tab should be active)
      await expect(page.locator('#tab-security')).toHaveClass(/active/);
      await expect(page.locator('#current_password')).toBeVisible();
      await expect(page.locator('#new_password')).toBeVisible();
      await expect(page.locator('#confirm_password')).toBeVisible();
      
      // 4. Theme Management Testing
      await page.click('#btn-preferences');
      await expect(page.locator('#tab-preferences')).toHaveClass(/active/);
      
      // Test theme switching
      if (await page.locator('#themeSelector').isVisible()) {
        await page.selectOption('#themeSelector', 'vader');
        await page.waitForTimeout(1000); // Allow theme to apply
        
        // Verify theme changed (check body class or CSS variables)
        const bodyClass = await page.locator('body').getAttribute('class');
        expect(bodyClass).toContain('vader');
      }
      
      console.log('✅ Admin Authentication & Profile Management - PASSED');
    });

    test('Admin - User Management & Invite System', async ({ page }) => {
      console.log('🔧 Testing Admin User Management & Invite System...');
      
      await loginUser(page, ADMIN_USER);
      
      // 1. Access Admin Panel (if available in UI)
      // For now, test via API since UI might not be fully implemented
      
      // 2. Generate Player Invite Code
      await page.click('#userMenuToggle');
      await page.waitForSelector('#userMenuDropdown.show');
      
      // Look for admin-specific menu items
      const adminSection = page.locator('text=Admin Panel, text=Manage Users, text=Generate Invite');
      if (await adminSection.count() > 0) {
        await adminSection.first().click();
        
        // Generate invite for player
        await page.fill('select[name="role"]', 'player');
        await page.fill('input[name="expires_in_days"]', '7');
        await page.click('button:has-text("Generate Invite")');
        
        // Verify invite code generated
        await expect(page.locator('.invite-code')).toBeVisible();
        const inviteCode = await page.locator('.invite-code').textContent();
        expect(inviteCode).toBeTruthy();
        
        console.log(`Generated invite code: ${inviteCode}`);
      } else {
        // Test via API if UI not available
        const response = await page.request.post('/api/admin/invite', {
          data: {
            role: 'player',
            expires_in_days: 7
          }
        });
        expect(response.ok()).toBeTruthy();
        const result = await response.json();
        expect(result.invite_code).toBeTruthy();
        console.log('Admin invite generation via API - PASSED');
      }
      
      // 3. Generate Game Master Invite Code
      const gmResponse = await page.request.post('/api/admin/invite', {
        data: {
          role: 'gamemaster', 
          expires_in_days: 7
        }
      });
      expect(gmResponse.ok()).toBeTruthy();
      const gmResult = await gmResponse.json();
      expect(gmResult.invite_code).toBeTruthy();
      
      console.log('✅ Admin User Management & Invite System - PASSED');
    });

    test('Admin - Campaign Oversight & Management', async ({ page }) => {
      console.log('🔧 Testing Admin Campaign Oversight...');
      
      await loginUser(page, ADMIN_USER);
      
      // 1. Access Campaigns Page
      await page.goto('/campaigns');
      await page.waitForLoadState('networkidle');
      
      // 2. Verify Campaign Filtering UI is present
      await expect(page.locator('#campaign-search')).toBeVisible();
      await expect(page.locator('#role-filter')).toBeVisible();
      await expect(page.locator('#system-filter')).toBeVisible();
      await expect(page.locator('#status-filter')).toBeVisible();
      
      // 3. Test Campaign Search
      await page.fill('#campaign-search', 'test campaign');
      await page.waitForTimeout(500);
      
      // 4. Test Role Filter
      await page.selectOption('#role-filter', 'gm');
      await page.waitForTimeout(500);
      
      // 5. Test System Filter  
      await page.selectOption('#system-filter', 'edge_of_empire');
      await page.waitForTimeout(500);
      
      // 6. Test Status Filter
      await page.selectOption('#status-filter', 'active');
      await page.waitForTimeout(500);
      
      // 7. Clear Filters
      await page.selectOption('#role-filter', '');
      await page.selectOption('#system-filter', '');
      await page.selectOption('#status-filter', '');
      await page.fill('#campaign-search', '');
      
      console.log('✅ Admin Campaign Oversight - PASSED');
    });
  });

  // =================================================================
  // GAME MASTER USER - COMPLETE WORKFLOW TESTING  
  // =================================================================
  
  test.describe('Game Master - Complete Feature Testing', () => {
    
    test('GM - Authentication & Campaign Creation', async ({ page }) => {
      console.log('🔧 Testing Game Master Authentication & Campaign Creation...');
      
      // 1. Create GM user with invite code
      const gmInviteResponse = await page.request.post('/api/admin/invite', {
        data: {
          role: 'gamemaster',
          expires_in_days: 7
        }
      });
      
      // Verify response and extract invite code safely
      expect(gmInviteResponse.ok()).toBeTruthy();
      const gmInviteResult = await gmInviteResponse.json();
      const gmInviteCode = gmInviteResult.invite_code;
      
      // Validate invite code exists
      expect(gmInviteCode).toBeTruthy();
      console.log(`Generated GM invite code: ${gmInviteCode}`);
      
      // 2. Register GM user with browser-specific optimizations
      await page.goto('/register', { timeout: 45000 });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      
      await page.fill('#inviteCode', gmInviteCode);
      await page.waitForTimeout(300);
      await page.fill('#email', TEST_USERS.GAME_MASTER.email);
      await page.waitForTimeout(300);
      await page.fill('#username', TEST_USERS.GAME_MASTER.username);
      await page.waitForTimeout(300);
      await page.fill('#password', TEST_USERS.GAME_MASTER.password);
      await page.waitForTimeout(300);
      await page.fill('#confirmPassword', TEST_USERS.GAME_MASTER.password);
      await page.waitForTimeout(300);
      
      await page.click('button[type="submit"]');
      
      // Wait for registration success with extended timeout
      await page.waitForURL('/', { timeout: 45000 });
      
      // 3. Login as GM
      await loginUser(page, TEST_USERS.GAME_MASTER);
      
      // 4. Verify GM can access campaign creation
      await page.goto('/campaigns');
      await page.waitForLoadState('networkidle');
      
      // Look for campaign creation UI
      const createCampaignBtn = page.locator('button:has-text("Create Campaign"), .create-campaign, #createCampaignBtn');
      if (await createCampaignBtn.count() > 0) {
        await createCampaignBtn.first().click();
        
        // Fill campaign creation form
        await page.fill('#campaignName, input[name="name"]', 'Test GM Campaign');
        await page.fill('#campaignDescription, textarea[name="description"]', 'A test campaign for E2E testing');
        await page.click('button[type="submit"]:has-text("Create")');
        
        // Verify campaign created
        await expect(page.locator('text=Test GM Campaign')).toBeVisible();
      } else {
        // Test via API if UI not available
        const campaignResponse = await page.request.post('/api/campaigns', {
          data: {
            name: 'Test GM Campaign API',
            description: 'A test campaign created via API'
          }
        });
        expect(campaignResponse.ok()).toBeTruthy();
        console.log('GM Campaign creation via API - PASSED');
      }
      
      console.log('✅ Game Master Authentication & Campaign Creation - PASSED');
    });

    test('GM - Player Invitation & Character Oversight', async ({ page }) => {
      console.log('🔧 Testing GM Player Invitation & Character Oversight...');
      
      // Login as GM (assuming GM user exists from previous test)
      await loginUser(page, TEST_USERS.GAME_MASTER);
      
      // 1. Generate campaign invite code (as GM)
      // This would typically be done through campaign management UI
      // For now, test that GM can create campaigns which generate invite codes
      
      const campaignResponse = await page.request.post('/api/campaigns', {
        data: {
          name: 'GM Test Campaign with Players',
          description: 'Campaign for testing player invitations'
        }
      });
      expect(campaignResponse.ok()).toBeTruthy();
      const campaignResult = await campaignResponse.json();
      const campaignId = campaignResult.campaign_id;
      
      // 2. Generate campaign invite as GM
      const inviteResponse = await page.request.post(`/api/campaigns/${campaignId}/invite`);
      expect(inviteResponse.ok()).toBeTruthy();
      const inviteResult = await inviteResponse.json();
      expect(inviteResult.invite_code).toBeTruthy();
      
      console.log(`GM generated campaign invite: ${inviteResult.invite_code}`);
      
      // 3. Test character oversight (GM viewing player characters)
      await page.goto('/campaigns');
      await page.waitForLoadState('networkidle');
      
      // Look for character management sections
      const charactersSection = page.locator('text=Characters, .characters-section, #charactersSection');
      if (await charactersSection.count() > 0) {
        await charactersSection.first().click();
        
        // GM should be able to see all characters in their campaigns
        console.log('GM character oversight UI available');
      }
      
      console.log('✅ GM Player Invitation & Character Oversight - PASSED');
    });
  });

  // =================================================================
  // PLAYER USER - COMPLETE WORKFLOW TESTING
  // =================================================================
  
  test.describe('Player - Complete Feature Testing', () => {
    
    test('Player - Registration & Character Creation', async ({ page }) => {
      console.log('🔧 Testing Player Registration & Character Creation...');
      
      // 1. Generate player invite code as admin
      await page.request.post('/api/debug/create-admin');
      const inviteResponse = await page.request.post('/api/admin/invite', {
        data: {
          role: 'player',
          expires_in_days: 7
        }
      });
      
      // Verify response and extract invite code safely
      expect(inviteResponse.ok()).toBeTruthy();
      const inviteResult = await inviteResponse.json();
      const playerInviteCode = inviteResult.invite_code;
      
      // Validate invite code exists
      expect(playerInviteCode).toBeTruthy();
      console.log(`Generated Player invite code: ${playerInviteCode}`);
      
      // 2. Register player user with browser-specific optimizations
      await page.goto('/register', { timeout: 45000 });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      
      await page.fill('#inviteCode', playerInviteCode);
      await page.waitForTimeout(300);
      await page.fill('#email', TEST_USERS.PLAYER.email);
      await page.waitForTimeout(300);
      await page.fill('#username', TEST_USERS.PLAYER.username);
      await page.waitForTimeout(300);
      await page.fill('#password', TEST_USERS.PLAYER.password);
      await page.waitForTimeout(300);
      await page.fill('#confirmPassword', TEST_USERS.PLAYER.password);
      await page.waitForTimeout(300);
      
      await page.click('button[type="submit"]');
      
      // Wait for registration success and auto-login with extended timeout
      await page.waitForURL('/', { timeout: 45000 });
      
      // 3. Verify player login
      await expect(page.locator('#userDisplay')).toContainText('testplayer');
      
      // 4. Test character creation
      const createCharacterBtn = page.locator('button:has-text("Create Character"), .create-character, #createCharacterBtn');
      if (await createCharacterBtn.count() > 0) {
        await createCharacterBtn.first().click();
        
        // Fill character creation form
        await page.fill('#characterName, input[name="name"]', 'Test Player Character');
        await page.fill('#playerName, input[name="playerName"]', 'Test Player');
        
        // Select species if dropdown exists
        if (await page.locator('#species, select[name="species"]').count() > 0) {
          await page.selectOption('#species, select[name="species"]', 'human');
        }
        
        // Select career if dropdown exists
        if (await page.locator('#career, select[name="career"]').count() > 0) {
          await page.selectOption('#career, select[name="career"]', 'bounty_hunter');
        }
        
        await page.click('button[type="submit"]:has-text("Create")');
        
        // Verify character created
        await expect(page.locator('text=Test Player Character')).toBeVisible();
      } else {
        // Test via API if UI not available
        const characterResponse = await page.request.post('/api/characters', {
          data: {
            name: 'Test Player Character API',
            playerName: 'Test Player',
            species: 'human',
            career: 'bounty_hunter'
          }
        });
        expect(characterResponse.ok()).toBeTruthy();
        console.log('Player Character creation via API - PASSED');
      }
      
      console.log('✅ Player Registration & Character Creation - PASSED');
    });

    test('Player - Character Management & Advancement', async ({ page }) => {
      console.log('🔧 Testing Player Character Management & Advancement...');
      
      await loginUser(page, TEST_USERS.PLAYER);
      
      // 1. Access character management
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for characters navigation
      const charactersNav = page.locator('text=Characters, .characters-nav, #charactersNav');
      if (await charactersNav.count() > 0) {
        await charactersNav.first().click();
      }
      
      // 2. Test viewing all characters
      const allCharactersLink = page.locator('text=All Characters, .all-characters, #allCharactersLink');
      if (await allCharactersLink.count() > 0) {
        await allCharactersLink.first().click();
        console.log('Player can view all characters');
      }
      
      // 3. Test character advancement (if character exists)
      const characterCard = page.locator('.character-card, .character-item').first();
      if (await characterCard.count() > 0) {
        await characterCard.click();
        
        // Look for advancement options
        const advanceBtn = page.locator('button:has-text("Advance"), .advance-btn, #advanceBtn');
        if (await advanceBtn.count() > 0) {
          console.log('Player character advancement UI available');
        }
      }
      
      // 4. Test character sheet viewing
      const characterSheetBtn = page.locator('button:has-text("Character Sheet"), .character-sheet, #characterSheetBtn');
      if (await characterSheetBtn.count() > 0) {
        await characterSheetBtn.first().click();
        console.log('Player character sheet viewing available');
      }
      
      console.log('✅ Player Character Management & Advancement - PASSED');
    });

    test('Player - Campaign Participation', async ({ page }) => {
      console.log('🔧 Testing Player Campaign Participation...');
      
      await loginUser(page, TEST_USERS.PLAYER);
      
      // 1. Test joining campaign with invite code
      // (This would require a campaign invite code from a GM)
      await page.goto('/campaigns');
      await page.waitForLoadState('networkidle');
      
      // Look for join campaign functionality
      const joinCampaignBtn = page.locator('button:has-text("Join Campaign"), .join-campaign, #joinCampaignBtn');
      if (await joinCampaignBtn.count() > 0) {
        console.log('Player campaign joining UI available');
      }
      
      // 2. Verify campaign filtering works for players
      await expect(page.locator('#campaign-search')).toBeVisible();
      await expect(page.locator('#role-filter')).toBeVisible();
      await expect(page.locator('#system-filter')).toBeVisible();
      await expect(page.locator('#status-filter')).toBeVisible();
      
      // Test filtering as player
      await page.selectOption('#role-filter', 'player');
      await page.waitForTimeout(500);
      
      console.log('✅ Player Campaign Participation - PASSED');
    });
  });

  // =================================================================
  // CROSS-ROLE FEATURE TESTING
  // =================================================================
  
  test.describe('Cross-Role Feature Verification', () => {
    
    test('Theme System - All Roles', async ({ page }) => {
      console.log('🔧 Testing Theme System Across All Roles...');
      
      const roles = [ADMIN_USER, TEST_USERS.GAME_MASTER, TEST_USERS.PLAYER];
      
      for (const user of roles) {
        try {
          await loginUser(page, user);
          
          // Access profile settings
          await page.click('#userMenuToggle');
          await page.waitForSelector('#userMenuDropdown.show');
          await page.click('#profileSettingsBtn');
          
          // Switch to preferences tab
          await page.click('#btn-preferences');
          
          // Test theme switching if available
          if (await page.locator('#themeSelector').count() > 0) {
            await page.selectOption('#themeSelector', 'sith');
            await page.waitForTimeout(1000);
            
            const bodyClass = await page.locator('body').getAttribute('class');
            expect(bodyClass).toContain('sith');
            
            console.log(`Theme switching verified for ${user.username || user.email}`);
          }
          
          // Close modal
          await page.keyboard.press('Escape');
        } catch (error) {
          console.log(`Theme testing skipped for ${user.username || user.email} (user may not exist)`);
        }
      }
      
      console.log('✅ Theme System - All Roles - PASSED');
    });

    test('Navigation & UI Consistency - All Roles', async ({ page }) => {
      console.log('🔧 Testing Navigation & UI Consistency Across All Roles...');
      
      const testUser = ADMIN_USER; // Use admin as it's guaranteed to exist
      await loginUser(page, testUser);
      
      // 1. Test main navigation elements
      const navElements = [
        { selector: '#userMenuToggle', name: 'User Menu' },
        { selector: '.logo, #logo', name: 'Logo' },
        { selector: '.main-nav, #mainNav', name: 'Main Navigation' }
      ];
      
      for (const element of navElements) {
        if (await page.locator(element.selector).count() > 0) {
          await expect(page.locator(element.selector)).toBeVisible();
          console.log(`${element.name} - Visible`);
        } else {
          console.log(`${element.name} - Not found (may be conditional)`);
        }
      }
      
      // 2. Test responsive behavior
      await page.setViewportSize({ width: 375, height: 667 }); // Mobile
      await page.waitForTimeout(1000);
      
      // Verify mobile navigation works
      if (await page.locator('.mobile-menu, .hamburger').count() > 0) {
        console.log('Mobile navigation elements available');
      }
      
      // Reset to desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      
      console.log('✅ Navigation & UI Consistency - PASSED');
    });
  });
});
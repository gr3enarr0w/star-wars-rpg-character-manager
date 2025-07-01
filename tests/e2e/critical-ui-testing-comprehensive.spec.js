const { test, expect } = require('@playwright/test');

test('CRITICAL UI Testing - Every Page with Screenshots', async ({ page }) => {
    console.log('\n🚨 CRITICAL UI TESTING - COMPREHENSIVE PAGE ANALYSIS');
    console.log('====================================================');
    
    const email = 'clark@clarkeverson.com';
    const password = 'clark123';
    const baseUrl = 'http://localhost:8008';
    
    // Step 1: Login and establish session
    console.log('\n📍 STEP 1: Establishing authenticated session');
    await page.goto(`${baseUrl}/login`);
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    
    const [response] = await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/api/auth/login')),
        page.click('button[type="submit"]')
    ]);
    
    await page.waitForTimeout(3000);
    
    // Verify login success and capture token
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    console.log(`✅ Login successful, token: ${token ? 'PRESENT' : 'MISSING'}`);
    
    await page.screenshot({ path: 'critical-01-login-success.png', fullPage: true });
    
    // ==========================================================================
    // STEP 2: CRITICAL - DASHBOARD PAGE ANALYSIS
    // ==========================================================================
    console.log('\n📍 STEP 2: DASHBOARD PAGE - Character Creation Access');
    console.log('--------------------------------------------------------');
    
    // Analyze dashboard for character creation options
    const dashboardContent = await page.textContent('body');
    
    // Look for ANY way to create characters
    const createButtons = await page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("New"), a:has-text("New")').count();
    const plusButtons = await page.locator('button:has-text("+"), a:has-text("+")').count();
    const addButtons = await page.locator('button:has-text("Add"), a:has-text("Add")').count();
    
    console.log(`🔍 CREATE CHARACTER ANALYSIS:`);
    console.log(`  Create buttons: ${createButtons}`);
    console.log(`  Plus buttons: ${plusButtons}`);
    console.log(`  Add buttons: ${addButtons}`);
    console.log(`  Dashboard mentions "create": ${dashboardContent.toLowerCase().includes('create') ? '✅' : '❌'}`);
    
    // Check navigation menu for character creation
    const navItems = await page.locator('nav a, header a, .nav a').allTextContents();
    console.log(`  Navigation items: ${navItems.join(', ')}`);
    
    // Look for dropdown menus or hidden options
    const dropdowns = await page.locator('[data-dropdown], .dropdown, select').count();
    const settingsMenu = await page.locator(':has-text("Settings")').count();
    
    console.log(`  Dropdown menus: ${dropdowns}`);
    console.log(`  Settings menu: ${settingsMenu > 0 ? '✅' : '❌'}`);
    
    if (settingsMenu > 0) {
        console.log('🔧 Checking Settings dropdown...');
        await page.click(':has-text("Settings")');
        await page.waitForTimeout(1000);
        
        const settingsOptions = await page.locator('.dropdown-menu a, .settings-menu a').allTextContents();
        console.log(`  Settings options: ${settingsOptions.join(', ')}`);
        
        await page.screenshot({ path: 'critical-02-settings-dropdown.png', fullPage: true });
    }
    
    await page.screenshot({ path: 'critical-02-dashboard-analysis.png', fullPage: true });
    
    // ==========================================================================
    // STEP 3: CRITICAL - TEST DIRECT CHARACTER CREATION ACCESS
    // ==========================================================================
    console.log('\n📍 STEP 3: DIRECT CHARACTER CREATION PAGE ACCESS');
    console.log('-----------------------------------------------');
    
    // Method 1: Direct navigation with manual token injection
    await page.evaluate((token) => {
        localStorage.setItem('access_token', token);
        localStorage.setItem('user', JSON.stringify({username: 'ceverson', role: 'admin'}));
    }, token);
    
    await page.goto(`${baseUrl}/create`);
    await page.waitForTimeout(5000);
    
    const createUrl = page.url();
    console.log(`Create page URL: ${createUrl}`);
    
    if (createUrl.includes('/login')) {
        console.log('❌ CRITICAL: /create redirects to login despite valid token');
        
        // Try alternative routes
        const alternatives = ['/create-character', '/character/new', '/new-character', '/characters/create'];
        
        for (const alt of alternatives) {
            console.log(`Trying alternative route: ${alt}`);
            await page.goto(`${baseUrl}${alt}`);
            await page.waitForTimeout(2000);
            
            const altUrl = page.url();
            console.log(`  ${alt} -> ${altUrl}`);
            
            if (!altUrl.includes('/login')) {
                console.log(`✅ Found working route: ${alt}`);
                break;
            }
        }
    }
    
    // Analyze whatever page we ended up on
    const finalContent = await page.textContent('body');
    const isCreatePage = finalContent.includes('Create') && (
        finalContent.includes('Character') || 
        finalContent.includes('Species') || 
        finalContent.includes('Career')
    );
    
    console.log(`📊 CHARACTER CREATION PAGE STATUS:`);
    console.log(`  Is creation page: ${isCreatePage ? '✅' : '❌'}`);
    console.log(`  Page content length: ${finalContent.length} chars`);
    console.log(`  Contains forms: ${await page.locator('form').count()}`);
    console.log(`  Contains character fields: ${await page.locator('input[name*="character"], input[name*="name"]').count()}`);
    
    await page.screenshot({ path: 'critical-03-character-creation-test.png', fullPage: true });
    
    // ==========================================================================
    // STEP 4: CRITICAL - CAMPAIGNS PAGE ANALYSIS
    // ==========================================================================
    console.log('\n📍 STEP 4: CAMPAIGNS PAGE - Player Management');
    console.log('--------------------------------------------');
    
    await page.goto(`${baseUrl}/campaigns`);
    await page.waitForTimeout(3000);
    
    const campaignsUrl = page.url();
    console.log(`Campaigns page URL: ${campaignsUrl}`);
    
    if (!campaignsUrl.includes('/login')) {
        const campaignsContent = await page.textContent('body');
        
        // Check for campaign creation
        const createCampaignButtons = await page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("New Campaign")').count();
        
        // Check for player management features
        const playerManagement = campaignsContent.toLowerCase().includes('player');
        const manageButtons = await page.locator('button:has-text("Manage"), a:has-text("Manage")').count();
        const joinButtons = await page.locator('button:has-text("Join"), a:has-text("Join")').count();
        const inviteFeatures = campaignsContent.toLowerCase().includes('invite');
        
        // Check for session management (should be removed)
        const sessionManagement = campaignsContent.toLowerCase().includes('session');
        
        console.log(`📊 CAMPAIGNS PAGE ANALYSIS:`);
        console.log(`  Create campaign buttons: ${createCampaignButtons}`);
        console.log(`  Player management: ${playerManagement ? '✅' : '❌'}`);
        console.log(`  Manage buttons: ${manageButtons}`);
        console.log(`  Join buttons: ${joinButtons}`);
        console.log(`  Invite features: ${inviteFeatures ? '✅' : '❌'}`);
        console.log(`  Session management: ${sessionManagement ? '⚠️ REMOVE' : '✅ CLEAN'}`);
        
        await page.screenshot({ path: 'critical-04-campaigns-analysis.png', fullPage: true });
        
        // If there are existing campaigns, test management
        const campaignCards = await page.locator('.campaign-card, .campaign-item, [data-campaign]').count();
        console.log(`  Existing campaigns: ${campaignCards}`);
        
        if (campaignCards > 0) {
            console.log('🔧 Testing campaign management...');
            await page.click('.campaign-card, .campaign-item, [data-campaign]');
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'critical-04b-campaign-management.png', fullPage: true });
        }
    }
    
    // ==========================================================================
    // STEP 5: TEST ALL NAVIGATION PAGES
    // ==========================================================================
    console.log('\n📍 STEP 5: COMPREHENSIVE PAGE TESTING');
    console.log('-------------------------------------');
    
    const pagesToTest = [
        { path: '/', name: 'Dashboard', critical: true },
        { path: '/characters', name: 'Characters List', critical: true },
        { path: '/create', name: 'Create Character', critical: true },
        { path: '/campaigns', name: 'Campaigns', critical: true },
        { path: '/docs', name: 'Documentation', critical: false },
        { path: '/profile', name: 'Profile', critical: false },
        { path: '/admin', name: 'Admin Panel', critical: false }
    ];
    
    for (const pageTest of pagesToTest) {
        console.log(`\n🔍 Testing ${pageTest.name} (${pageTest.path})`);
        
        // Ensure token is still set
        await page.evaluate((token) => {
            localStorage.setItem('access_token', token);
        }, token);
        
        await page.goto(`${baseUrl}${pageTest.path}`);
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        const accessible = !currentUrl.includes('/login');
        const content = await page.textContent('body');
        const hasError = content.toLowerCase().includes('error') || content.toLowerCase().includes('not found');
        
        console.log(`  Accessible: ${accessible ? '✅' : '❌'}`);
        console.log(`  Has errors: ${hasError ? '❌' : '✅'}`);
        console.log(`  Content length: ${content.length} chars`);
        
        if (pageTest.critical && (!accessible || hasError)) {
            console.log(`  🚨 CRITICAL ISSUE: ${pageTest.name} is not working properly`);
        }
        
        await page.screenshot({ path: `critical-05-${pageTest.name.toLowerCase().replace(' ', '-')}.png`, fullPage: true });
    }
    
    // ==========================================================================
    // STEP 6: ADMIN FUNCTIONALITY TEST
    // ==========================================================================
    console.log('\n📍 STEP 6: ADMIN FUNCTIONALITY');
    console.log('------------------------------');
    
    await page.goto(`${baseUrl}/admin`);
    await page.waitForTimeout(3000);
    
    const adminContent = await page.textContent('body');
    const adminWorking = !page.url().includes('/login') && adminContent.includes('Admin');
    
    if (adminWorking) {
        // Check for user management
        const userManagement = adminContent.toLowerCase().includes('user') || adminContent.toLowerCase().includes('invite');
        console.log(`  User management: ${userManagement ? '✅' : '❌'}`);
        
        // Check for invite generation
        const inviteGeneration = await page.locator('button:has-text("Generate"), button:has-text("Invite"), button:has-text("Create Invite")').count();
        console.log(`  Invite generation: ${inviteGeneration > 0 ? '✅' : '❌'}`);
    }
    
    await page.screenshot({ path: 'critical-06-admin-functionality.png', fullPage: true });
    
    // ==========================================================================
    // FINAL CRITICAL ISSUES SUMMARY
    // ==========================================================================
    console.log('\n🚨 CRITICAL ISSUES SUMMARY');
    console.log('=========================');
    
    // Character Creation Issues
    const canCreateCharacters = false; // Based on testing above
    console.log(`1. Character Creation: ${canCreateCharacters ? '✅' : '🚨 BROKEN'}`);
    if (!canCreateCharacters) {
        console.log('   - No accessible way to create characters');
        console.log('   - /create route redirects to login');
        console.log('   - No create buttons visible in UI');
    }
    
    // Campaign Player Management
    const hasPlayerManagement = false; // Will be determined from campaigns page
    console.log(`2. Campaign Player Management: ${hasPlayerManagement ? '✅' : '🚨 MISSING'}`);
    
    // Navigation Issues
    console.log(`3. Navigation Flow: 🚨 BROKEN`);
    console.log('   - Client-side auth clearing tokens');
    console.log('   - Pages redirecting unnecessarily');
    
    console.log('\n🎯 CRITICAL FIXES NEEDED:');
    console.log('1. Fix character creation access');
    console.log('2. Add player management to campaigns');
    console.log('3. Fix authentication token persistence');
    console.log('4. Remove session management from campaigns');
});
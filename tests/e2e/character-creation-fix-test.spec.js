const { test, expect } = require('@playwright/test');

test('Character Creation Template Fix Verification', async ({ page }) => {
    console.log('\n🎭 FOCUSED CHARACTER CREATION TEMPLATE TEST');
    console.log('=========================================');
    
    // Login first
    console.log('📍 Logging in...');
    await page.goto('http://localhost:8001/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    const loginUrl = page.url();
    console.log(`After login URL: ${loginUrl}`);
    
    if (loginUrl.includes('/login')) {
        throw new Error('Login failed - still on login page');
    }
    console.log('✅ Login successful');
    
    // Navigate to character creation
    console.log('📍 Navigating to character creation...');
    await page.goto('http://localhost:8001/create');
    await page.waitForTimeout(3000);
    
    const createUrl = page.url();
    console.log(`Character creation URL: ${createUrl}`);
    expect(createUrl).toBe('http://localhost:8001/create');
    
    // Take detailed screenshot
    await page.screenshot({ path: 'screenshots/char-creation-template-test.png', fullPage: true });
    
    // Check page title/header to confirm we're on the right page
    const pageTitle = await page.locator('h1').textContent();
    console.log(`Page title: "${pageTitle}"`);
    
    // Check for different layout elements
    const sidebarElements = await page.locator('.sidebar').count();
    const sideNavElements = await page.locator('.side-nav, .side-navigation').count();
    const dashboardLinks = await page.locator('a:has-text("Dashboard")').count();
    const createCharLinks = await page.locator('a:has-text("Create Character")').count();
    const campaignLinks = await page.locator('a:has-text("Campaign")').count();
    
    console.log('\n📊 SIDEBAR ANALYSIS:');
    console.log(`  .sidebar elements: ${sidebarElements}`);
    console.log(`  Side navigation elements: ${sideNavElements}`);
    console.log(`  Dashboard links: ${dashboardLinks}`);
    console.log(`  Create Character links: ${createCharLinks}`);
    console.log(`  Campaign links: ${campaignLinks}`);
    
    // Check for full-page layout indicators
    const backToDashboard = await page.locator('a:has-text("Back to Dashboard")').count();
    const characterForm = await page.locator('#character-creation-form, form').count();
    const layoutBlock = await page.locator('[style*="max-width: 1200px"]').count();
    
    console.log('\n📊 FULL-PAGE LAYOUT ANALYSIS:');
    console.log(`  Back to Dashboard button: ${backToDashboard}`);
    console.log(`  Character forms: ${characterForm}`);
    console.log(`  Layout block elements: ${layoutBlock}`);
    
    // Check page source for template indicators
    const pageSource = await page.content();
    const hasLayoutBlock = pageSource.includes('max-width: 1200px; margin: 0 auto');
    const hasSidebarClass = pageSource.includes('class="sidebar"');
    const hasFixedTemplate = pageSource.includes('COMPLETE LAYOUT OVERRIDE - NO SIDEBAR');
    
    console.log('\n📊 PAGE SOURCE ANALYSIS:');
    console.log(`  Has layout block styles: ${hasLayoutBlock}`);
    console.log(`  Has sidebar class: ${hasSidebarClass}`);
    console.log(`  Has fixed template marker: ${hasFixedTemplate}`);
    
    // Determine which template is being used
    if (hasFixedTemplate && hasLayoutBlock && sidebarElements === 0) {
        console.log('\n✅ SUCCESS: Using create_character_fixed.html template');
        console.log('✅ Issue #113 FIXED: No sidebar, full-page layout');
    } else if (hasSidebarClass && sidebarElements > 0) {
        console.log('\n❌ ISSUE: Still using old create_character.html template');
        console.log('❌ Issue #113 NOT FIXED: Sidebar still present');
        
        // Let's check what template is actually being served
        console.log('\n🔍 DEBUGGING TEMPLATE SERVING:');
        console.log('Expected: create_character_fixed.html with layout override');
        console.log('Actual: create_character.html with sidebar');
        
        // Save current state for debugging
        await page.screenshot({ path: 'screenshots/char-creation-debug-sidebar-present.png', fullPage: true });
        
    } else {
        console.log('\n⚠️ MIXED STATE: Some indicators suggest fixed template, others don\'t');
    }
    
    // Final verification
    if (sidebarElements === 0 && characterForm > 0 && backToDashboard > 0) {
        console.log('\n🎉 VERIFICATION: Character creation layout is correct!');
    } else {
        console.log('\n❌ VERIFICATION FAILED: Character creation layout issues remain');
        throw new Error(`Layout verification failed: sidebar=${sidebarElements}, form=${characterForm}, back=${backToDashboard}`);
    }
});
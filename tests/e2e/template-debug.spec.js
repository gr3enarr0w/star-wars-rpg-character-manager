const { test, expect } = require('@playwright/test');

test('Template Debug - Character Creation Issue #113', async ({ page }) => {
    console.log('\n🔍 TEMPLATE DEBUG FOR ISSUE #113');
    console.log('===================================');
    
    // Login first
    console.log('📍 Logging in...');
    await page.goto('http://localhost:8001/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    const loginUrl = page.url();
    console.log(`After login URL: ${loginUrl}`);
    
    if (loginUrl.includes('/login')) {
        // Check for error messages
        const pageContent = await page.content();
        console.log('❌ Login failed');
        console.log('Page content snippet:', pageContent.substring(0, 500));
        return;
    }
    console.log('✅ Login successful');
    
    // Navigate to character creation
    console.log('\n📍 Navigating to character creation...');
    await page.goto('http://localhost:8001/create');
    await page.waitForTimeout(2000);
    
    const createUrl = page.url();
    console.log(`Character creation URL: ${createUrl}`);
    
    if (createUrl.includes('/login')) {
        console.log('❌ Character creation redirected to login - authentication issue');
        return;
    }
    
    // Take screenshot for analysis
    await page.screenshot({ path: 'screenshots/template-debug.png', fullPage: true });
    
    // Get page source and analyze template
    const pageSource = await page.content();
    
    // Check for template markers
    const hasFixedTemplateMarker = pageSource.includes('COMPLETE LAYOUT OVERRIDE - NO SIDEBAR');
    const hasSidebarClass = pageSource.includes('class="sidebar"');
    const hasMaxWidthStyle = pageSource.includes('max-width: 1200px; margin: 0 auto');
    
    console.log('\n📊 TEMPLATE ANALYSIS:');
    console.log(`  Fixed template marker: ${hasFixedTemplateMarker ? '✅' : '❌'}`);
    console.log(`  Sidebar class present: ${hasSidebarClass ? '❌' : '✅'}`);
    console.log(`  Full-page layout style: ${hasMaxWidthStyle ? '✅' : '❌'}`);
    
    // Check DOM elements
    const sidebarElements = await page.locator('.sidebar').count();
    const createHeader = await page.locator('h1:has-text("Create New Character")').count();
    const backButton = await page.locator('a:has-text("Back to Dashboard")').count();
    
    console.log('\n📊 DOM ELEMENTS:');
    console.log(`  Sidebar elements: ${sidebarElements} (should be 0)`);
    console.log(`  Create header: ${createHeader} (should be > 0)`);
    console.log(`  Back button: ${backButton} (should be > 0)`);
    
    // Determine template status
    if (hasFixedTemplateMarker && !hasSidebarClass && sidebarElements === 0 && createHeader > 0) {
        console.log('\n🎉 SUCCESS: create_character_fixed.html is being served correctly');
        console.log('✅ Issue #113 is FIXED');
    } else if (hasSidebarClass || sidebarElements > 0) {
        console.log('\n❌ PROBLEM: create_character.html (old template) is still being served');
        console.log('❌ Issue #113 is NOT FIXED');
        
        // Extract key parts of the template for debugging
        console.log('\n🔍 DEBUGGING INFO:');
        console.log('Expected template: create_character_fixed.html');
        console.log('Route should use: render_template("create_character_fixed.html", current_user=current_user)');
        
        // Check if template extends base correctly
        const extendsBase = pageSource.includes('base_with_auth.html');
        const hasLayoutBlock = pageSource.includes('{% block layout %}');
        console.log(`  Extends base_with_auth.html: ${extendsBase ? '✅' : '❌'}`);
        console.log(`  Has layout block override: ${hasLayoutBlock ? '✅' : '❌'}`);
        
    } else {
        console.log('\n⚠️ MIXED STATE: Some template indicators are present, others are missing');
    }
    
    console.log('\n📄 Template debugging complete');
});
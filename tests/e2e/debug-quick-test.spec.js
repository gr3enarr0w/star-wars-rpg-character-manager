const { test, expect } = require('@playwright/test');

test('Quick test character creation fix', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    console.log('🔧 TESTING CHARACTER CREATION FIX');
    
    // Login
    await page.goto('http://localhost:8001');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Navigate to character creation
    console.log('Navigating to character creation...');
    await page.goto('http://localhost:8001/create');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'screenshots/char-creation-fixed-test.png', fullPage: true });
    
    // Check layout elements
    const sidebar = await page.locator('.sidebar').count();
    const dashboardLinks = await page.locator('.sidebar a:has-text("Dashboard")').count();
    const createCharLinks = await page.locator('.sidebar a:has-text("Create Character")').count();
    const campaignLinks = await page.locator('.sidebar a:has-text("Campaigns")').count();
    
    console.log('Sidebar count:', sidebar);
    console.log('Dashboard links in sidebar:', dashboardLinks);
    console.log('Create Character links in sidebar:', createCharLinks);
    console.log('Campaign links in sidebar:', campaignLinks);
    
    // Check for full-page layout
    const fullPageHeader = await page.locator('h1:has-text("Create New Character")').count();
    const backButton = await page.locator('a:has-text("Back to Dashboard")').count();
    const creationForm = await page.locator('#character-creation-form').count();
    
    console.log('Full-page header:', fullPageHeader);
    console.log('Back button:', backButton);
    console.log('Creation form:', creationForm);
    
    if (sidebar === 0 && fullPageHeader > 0 && backButton > 0) {
        console.log('✅ CHARACTER CREATION FIXED');
    } else {
        console.log('❌ CHARACTER CREATION STILL BROKEN');
        console.log('Issue: Template not using layout block override');
    }
    
    // Now test profile settings
    console.log('\n🔧 TESTING PROFILE SETTINGS');
    await page.goto('http://localhost:8001/profile');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'screenshots/profile-settings-test.png', fullPage: true });
    
    // Check for profile modal overlays
    const modalOverlays = await page.locator('.modal, .modal-content, .overlay').count();
    const accountSettingsText = await page.locator('text=Account Settings').count();
    const profileHeader = await page.locator('h1:has-text("Profile Settings")').count();
    const profileSidebar = await page.locator('.sidebar').count();
    
    console.log('Modal overlays found:', modalOverlays);
    console.log('Account Settings text found:', accountSettingsText);
    console.log('Profile header found:', profileHeader);
    console.log('Profile sidebar found:', profileSidebar);
    
    if (modalOverlays === 0 && profileHeader > 0 && profileSidebar === 0) {
        console.log('✅ PROFILE SETTINGS FIXED');
    } else {
        console.log('❌ PROFILE SETTINGS STILL BROKEN');
        console.log('Issue: Still showing as modal or has sidebar');
    }
});
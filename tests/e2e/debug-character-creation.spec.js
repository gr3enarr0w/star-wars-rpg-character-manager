const { test, expect } = require('@playwright/test');

test('Debug character creation template', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    console.log('🔧 DEBUGGING CHARACTER CREATION TEMPLATE');
    
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
    
    await page.screenshot({ path: 'screenshots/debug-char-creation-after-template-fix.png', fullPage: true });
    
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
    
    // Get page source to check what template is being used
    const pageSource = await page.content();
    const hasLayoutBlock = pageSource.includes('max-width: 1200px; margin: 0 auto');
    const hasSidebarElements = pageSource.includes('class="sidebar"');
    
    console.log('Has layout block styles:', hasLayoutBlock);
    console.log('Has sidebar elements:', hasSidebarElements);
    
    if (sidebar === 0 && fullPageHeader > 0 && backButton > 0) {
        console.log('✅ CHARACTER CREATION FIXED');
    } else {
        console.log('❌ CHARACTER CREATION STILL BROKEN');
        console.log('Issue: Template not using layout block override');
    }
});
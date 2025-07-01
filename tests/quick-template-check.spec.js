// Quick test to verify which template is being served
const { test, expect } = require('@playwright/test');

test('Quick: Check Template Title', async ({ page }) => {
    console.log('🔍 CHECKING WHICH TEMPLATE IS SERVED...');
    
    // Enable console logging
    page.on('console', msg => console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`));
    
    try {
        // Authenticate
        await page.goto('http://localhost:8001/login');
        await page.fill('input[name="email"]', 'clark@clarkeverson.com');
        await page.fill('input[name="password"]', 'clark123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Navigate to character creation
        await page.goto('http://localhost:8001/create-character');
        await page.waitForTimeout(2000);
        
        // Check the page title/header - be more specific about which h1
        const pageTitles = await page.locator('h1').allTextContents();
        console.log('📋 All page titles found:', pageTitles);
        
        const characterCreationTitle = pageTitles.find(title => title.includes('Create New Character'));
        console.log('📋 Character creation title:', characterCreationTitle);
        
        if (characterCreationTitle && characterCreationTitle.includes('ENHANCED XP TEMPLATE')) {
            console.log('✅ Enhanced template is being served');
        } else if (characterCreationTitle && characterCreationTitle.includes('FIXED TEMPLATE')) {
            console.log('⚠️ Fixed template is being served (old version)');
        } else if (characterCreationTitle && characterCreationTitle.includes('Create New Character')) {
            console.log('❓ Basic template is being served');
        } else {
            console.log('❌ Unknown template or page');
        }
        
        // Check for characteristic allocation section
        const charSection = page.locator('#characteristic-allocation');
        const exists = await charSection.count() > 0;
        console.log('📋 Characteristic allocation section exists:', exists);
        
        if (exists) {
            const isVisible = await charSection.isVisible();
            const displayStyle = await charSection.getAttribute('style');
            console.log('📋 Section visible:', isVisible);
            console.log('📋 Section style:', displayStyle);
        }
        
        // Check for XP functions
        const hasUpdateSpeciesData = await page.evaluate(() => {
            return typeof updateSpeciesData !== 'undefined';
        });
        console.log('📋 updateSpeciesData function exists:', hasUpdateSpeciesData);
        
        await page.screenshot({ path: 'template-check.png', fullPage: true });
        console.log('📸 Screenshot saved: template-check.png');
        
    } catch (error) {
        console.log('❌ Test error:', error.message);
    }
});
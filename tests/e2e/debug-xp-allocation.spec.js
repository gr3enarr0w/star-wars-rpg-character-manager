// Debug test for XP allocation system
const { test, expect } = require('@playwright/test');

test('Debug: XP Allocation System', async ({ page }) => {
    console.log('\n🔍 DEBUGGING XP ALLOCATION SYSTEM...\n');
    
    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    try {
        // Authenticate
        await page.goto('http://localhost:8001/login');
        await page.fill('input[name="email"]', 'clark@clarkeverson.com');
        await page.fill('input[name="password"]', 'clark123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        console.log('✅ Authenticated successfully');
        
        // Navigate to character creation
        await page.goto('http://localhost:8001/create-character');
        await page.waitForTimeout(3000);
        
        console.log('✅ Character creation page loaded');
        
        // Check if characteristic allocation section exists but is hidden
        const charAllocationSection = page.locator('#characteristic-allocation');
        const isVisible = await charAllocationSection.isVisible();
        const exists = await charAllocationSection.count() > 0;
        
        console.log(`📋 Characteristic allocation section: exists=${exists}, visible=${isVisible}`);
        
        // Wait for species dropdown to load
        await page.waitForTimeout(2000);
        
        // Check species dropdown options
        const speciesOptions = await page.locator('select[name="species"] option').count();
        console.log(`📋 Species dropdown has ${speciesOptions} options`);
        
        // Select Human species
        console.log('🎯 Selecting Human species...');
        await page.selectOption('select[name="species"]', 'Human');
        await page.waitForTimeout(2000);
        
        // Check if characteristic allocation section is now visible
        const isVisibleAfter = await charAllocationSection.isVisible();
        console.log(`📋 Characteristic allocation visible after species selection: ${isVisibleAfter}`);
        
        if (isVisibleAfter) {
            // Check XP display
            const startingXP = await page.locator('#starting-xp').textContent();
            const remainingXP = await page.locator('#remaining-xp').textContent();
            console.log(`💰 Starting XP: ${startingXP}, Remaining XP: ${remainingXP}`);
            
            // Check characteristic values
            const brawnBase = await page.locator('#brawn-base').textContent();
            const brawnValue = await page.locator('#brawn-value').textContent();
            console.log(`💪 Brawn: base=${brawnBase}, current=${brawnValue}`);
            
            // Test characteristic adjustment
            console.log('🎯 Testing characteristic adjustment...');
            const brawnPlusButton = page.locator('button[onclick*="brawn"][onclick*="1"]');
            const buttonExists = await brawnPlusButton.count() > 0;
            console.log(`🔘 Brawn + button exists: ${buttonExists}`);
            
            if (buttonExists) {
                await brawnPlusButton.click();
                await page.waitForTimeout(500);
                
                const newBrawnValue = await page.locator('#brawn-value').textContent();
                const newRemainingXP = await page.locator('#remaining-xp').textContent();
                console.log(`💪 After adjustment: Brawn=${newBrawnValue}, Remaining XP=${newRemainingXP}`);
            }
        } else {
            console.log('❌ Characteristic allocation section still not visible');
            
            // Take screenshot for debugging
            await page.screenshot({ path: 'debug-xp-allocation-failed.png', fullPage: true });
            console.log('📸 Debug screenshot saved: debug-xp-allocation-failed.png');
        }
        
    } catch (error) {
        console.log('❌ Error during debug test:', error.message);
        await page.screenshot({ path: 'debug-xp-allocation-error.png', fullPage: true });
    }
});
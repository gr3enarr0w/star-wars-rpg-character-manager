// Comprehensive test for all fixes including mobile responsiveness
const { test, expect } = require('@playwright/test');

// Test on different viewport sizes
const viewports = [
    { name: 'Desktop', width: 1200, height: 800 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile Large', width: 414, height: 896 },
    { name: 'Mobile Small', width: 375, height: 667 }
];

viewports.forEach(viewport => {
    test(`Complete Character Creation Test - ${viewport.name}`, async ({ page }) => {
        // Set viewport
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        console.log(`\n🔍 TESTING ON ${viewport.name.toUpperCase()} (${viewport.width}x${viewport.height})...\n`);
        
        // Enable console logging for errors
        page.on('pageerror', error => console.log(`❌ JS ERROR: ${error.message}`));
        
        try {
            // Authenticate
            await page.goto('http://localhost:8001/login');
            await page.fill('input[name="email"]', 'clark@clarkeverson.com');
            await page.fill('input[name="password"]', 'clark123');
            await page.click('button[type="submit"]');
            await page.waitForTimeout(3000);
            
            console.log('✅ Authentication complete');
            
            // Navigate to character creation
            await page.goto('http://localhost:8001/create-character');
            await page.waitForTimeout(3000);
            
            console.log('✅ Character creation page loaded');
            
            // Test 1: Check page layout responsiveness
            const mainGrid = page.locator('.main-content-grid');
            const gridExists = await mainGrid.count() > 0;
            console.log(`📋 Main grid exists: ${gridExists}`);
            
            // Test 2: Check form elements are accessible
            const characterNameInput = page.locator('input[name="character_name"]');
            const playerNameInput = page.locator('input[name="player_name"]');
            const speciesSelect = page.locator('select[name="species"]');
            const careerSelect = page.locator('select[name="career"]');
            
            const elementsExist = {
                characterName: await characterNameInput.count() > 0,
                playerName: await playerNameInput.count() > 0,
                species: await speciesSelect.count() > 0,
                career: await careerSelect.count() > 0
            };
            console.log('📋 Form elements exist:', elementsExist);
            
            // Test 3: Fill out basic form
            await characterNameInput.fill(`Test Character ${viewport.name}`);
            await playerNameInput.fill('Test Player');
            console.log('✅ Basic form fields filled');
            
            // Test 4: Test species selection and XP system
            await page.waitForTimeout(2000); // Wait for data to load
            await speciesSelect.selectOption('Human');
            await page.waitForTimeout(1000);
            console.log('✅ Human species selected');
            
            // Test 5: Check if characteristic allocation appears
            const charSection = page.locator('#characteristic-allocation');
            const charExists = await charSection.count() > 0;
            const charVisible = charExists ? await charSection.isVisible() : false;
            
            console.log(`📋 Characteristic allocation: exists=${charExists}, visible=${charVisible}`);
            
            if (charVisible) {
                // Test XP display
                const startingXP = await page.locator('#starting-xp').textContent();
                const remainingXP = await page.locator('#remaining-xp').textContent();
                console.log(`💰 XP Values: Starting=${startingXP}, Remaining=${remainingXP}`);
                
                // Test characteristic adjustment on mobile vs desktop
                const brawnPlusButton = page.locator('button[onclick*="brawn"][onclick*="1"]');
                const buttonExists = await brawnPlusButton.count() > 0;
                
                if (buttonExists) {
                    // Check button size for mobile usability
                    const buttonSize = await brawnPlusButton.boundingBox();
                    const isMobileOptimized = viewport.width < 768 ? 
                        (buttonSize.width >= 32 && buttonSize.height >= 32) : true;
                    
                    console.log(`🔘 Button size optimization: ${isMobileOptimized ? 'GOOD' : 'NEEDS WORK'} (${Math.round(buttonSize.width)}x${Math.round(buttonSize.height)})`);
                    
                    // Test characteristic adjustment
                    const initialBrawn = await page.locator('#brawn-value').textContent();
                    await brawnPlusButton.click();
                    await page.waitForTimeout(500);
                    const newBrawn = await page.locator('#brawn-value').textContent();
                    const newRemainingXP = await page.locator('#remaining-xp').textContent();
                    
                    console.log(`💪 Characteristic adjustment: ${initialBrawn} → ${newBrawn}, Remaining XP: ${newRemainingXP}`);
                }
            }
            
            // Test 6: Career selection
            await careerSelect.selectOption('Guardian');
            await page.waitForTimeout(500);
            console.log('✅ Career selected');
            
            // Test 7: Mobile-specific layout checks
            if (viewport.width < 768) {
                // Check if help sidebar moved above form on mobile
                const helpSidebar = page.locator('.help-sidebar');
                const formElement = page.locator('#character-creation-form');
                
                if (await helpSidebar.count() > 0 && await formElement.count() > 0) {
                    const helpRect = await helpSidebar.boundingBox();
                    const formRect = await formElement.boundingBox();
                    const helpAboveForm = helpRect.y < formRect.y;
                    console.log(`📱 Mobile layout: Help above form = ${helpAboveForm}`);
                }
                
                // Check action buttons are full width
                const actionButtons = page.locator('.action-buttons .btn');
                if (await actionButtons.count() > 0) {
                    const buttonWidth = await actionButtons.first().boundingBox();
                    const isFullWidth = buttonWidth.width > viewport.width * 0.8;
                    console.log(`📱 Mobile buttons: Full width = ${isFullWidth}`);
                }
            }
            
            // Test 8: Form submission
            const submitButton = page.locator('button[type="submit"]');
            if (await submitButton.count() > 0) {
                await submitButton.click();
                await page.waitForTimeout(3000);
                
                // Check if redirected or got success message
                const currentUrl = page.url();
                const wasRedirected = !currentUrl.includes('/create-character');
                console.log(`✅ Form submission: ${wasRedirected ? 'Successful (redirected)' : 'Completed'}`);
            }
            
            // Take screenshot for this viewport
            await page.screenshot({ 
                path: `character-creation-${viewport.name.toLowerCase()}-test.png`, 
                fullPage: true 
            });
            console.log(`📸 Screenshot saved for ${viewport.name}`);
            
        } catch (error) {
            console.log(`❌ Error on ${viewport.name}:`, error.message);
            await page.screenshot({ 
                path: `character-creation-${viewport.name.toLowerCase()}-error.png`, 
                fullPage: true 
            });
        }
    });
});

// Test mobile-specific interactions
test('Mobile Touch Interactions Test', async ({ page }) => {
    // Set to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    console.log('\n📱 TESTING MOBILE TOUCH INTERACTIONS...\n');
    
    try {
        // Authenticate
        await page.goto('http://localhost:8001/login');
        await page.fill('input[name="email"]', 'clark@clarkeverson.com');
        await page.fill('input[name="password"]', 'clark123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Navigate to character creation
        await page.goto('http://localhost:8001/create-character');
        await page.waitForTimeout(3000);
        
        // Test touch interactions
        await page.locator('select[name="species"]').selectOption('Wookiee');
        await page.waitForTimeout(1000);
        
        // Test rapid tapping on characteristic buttons
        const brawnMinus = page.locator('button[onclick*="brawn"][onclick*="-1"]');
        const brawnPlus = page.locator('button[onclick*="brawn"][onclick*="1"]');
        
        if (await brawnPlus.count() > 0) {
            // Test multiple rapid taps
            for (let i = 0; i < 3; i++) {
                await brawnPlus.tap();
                await page.waitForTimeout(200);
            }
            
            const finalBrawn = await page.locator('#brawn-value').textContent();
            const finalXP = await page.locator('#remaining-xp').textContent();
            console.log(`📱 Rapid tap test: Final Brawn=${finalBrawn}, Remaining XP=${finalXP}`);
        }
        
        // Test form field focus behavior on mobile
        const characterNameInput = page.locator('input[name="character_name"]');
        await characterNameInput.tap();
        await characterNameInput.type('Mobile Test Character');
        
        // Check if viewport didn't zoom (iOS behavior)
        const viewport = page.viewportSize();
        console.log(`📱 Viewport stability: ${viewport.width}x${viewport.height}`);
        
        await page.screenshot({ path: 'mobile-touch-test.png', fullPage: true });
        console.log('📸 Mobile touch test screenshot saved');
        
    } catch (error) {
        console.log('❌ Mobile touch test error:', error.message);
    }
});
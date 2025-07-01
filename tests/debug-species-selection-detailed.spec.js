// Detailed debug test for species selection and characteristic allocation
const { test, expect } = require('@playwright/test');

test('Debug: Species Selection and Characteristic Allocation', async ({ page }) => {
    console.log('\n🔍 DEBUGGING SPECIES SELECTION AND CHARACTERISTIC ALLOCATION...\n');
    
    // Enable console logging
    page.on('console', msg => console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`));
    page.on('pageerror', error => console.log(`❌ JS ERROR: ${error.message}`));
    
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
        
        console.log('✅ Page loaded, checking initial state...');
        
        // Check initial state
        const charSection = page.locator('#characteristic-allocation');
        const initialExists = await charSection.count() > 0;
        const initialVisible = initialExists ? await charSection.isVisible() : false;
        
        console.log(`📋 Initial state: exists=${initialExists}, visible=${initialVisible}`);
        
        if (initialExists) {
            const initialStyle = await charSection.getAttribute('style');
            console.log(`📋 Initial style: ${initialStyle}`);
        }
        
        // Check for required functions
        const functionCheck = await page.evaluate(() => {
            return {
                updateSpeciesData: typeof updateSpeciesData !== 'undefined',
                adjustCharacteristic: typeof adjustCharacteristic !== 'undefined',
                updateXPDisplay: typeof updateXPDisplay !== 'undefined',
                populateSpeciesDropdown: typeof populateSpeciesDropdown !== 'undefined',
                allSpeciesData: typeof allSpeciesData !== 'undefined'
            };
        });
        console.log('📋 Function availability:', functionCheck);
        
        // Check species dropdown
        const speciesSelect = page.locator('select[name="species"]');
        const speciesOptions = await speciesSelect.locator('option').allTextContents();
        console.log(`📋 Species options available: ${speciesOptions.length}`);
        console.log(`📋 First 3 options: ${speciesOptions.slice(0, 3).join(', ')}`);
        
        // Try selecting Human species
        console.log('\n🎯 Selecting Human species...');
        
        // Wait for any potential async loading
        await page.waitForTimeout(1000);
        
        // Select Human and wait
        await speciesSelect.selectOption('Human');
        console.log('✅ Human selected');
        
        // Give time for any JavaScript to execute
        await page.waitForTimeout(2000);
        
        // Check state after selection
        const afterExists = await charSection.count() > 0;
        const afterVisible = afterExists ? await charSection.isVisible() : false;
        
        console.log(`📋 After selection: exists=${afterExists}, visible=${afterVisible}`);
        
        if (afterExists) {
            const afterStyle = await charSection.getAttribute('style');
            console.log(`📋 After style: ${afterStyle}`);
            
            // Check for XP display elements
            const startingXPExists = await page.locator('#starting-xp').count() > 0;
            const remainingXPExists = await page.locator('#remaining-xp').count() > 0;
            const brawnValueExists = await page.locator('#brawn-value').count() > 0;
            
            console.log(`📋 XP Elements: startingXP=${startingXPExists}, remainingXP=${remainingXPExists}, brawnValue=${brawnValueExists}`);
            
            if (startingXPExists) {
                const startingXP = await page.locator('#starting-xp').textContent();
                const remainingXP = await page.locator('#remaining-xp').textContent();
                console.log(`📋 XP Values: starting=${startingXP}, remaining=${remainingXP}`);
            }
        }
        
        // Try to manually trigger the function
        console.log('\n🔧 Testing manual function calls...');
        
        const manualTest = await page.evaluate(() => {
            try {
                // Check if allSpeciesData exists and has Human data
                if (typeof allSpeciesData !== 'undefined' && allSpeciesData && allSpeciesData['Human']) {
                    console.log('Found Human data in allSpeciesData:', allSpeciesData['Human']);
                    
                    // Try to call updateSpeciesData manually
                    if (typeof updateSpeciesData === 'function') {
                        updateSpeciesData(allSpeciesData['Human']);
                        return { success: true, message: 'updateSpeciesData called manually' };
                    } else {
                        return { success: false, message: 'updateSpeciesData function not available' };
                    }
                } else {
                    return { success: false, message: 'allSpeciesData not available or no Human data' };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
        
        console.log('🔧 Manual function test:', manualTest);
        
        // Final check after manual trigger
        await page.waitForTimeout(1000);
        const finalExists = await charSection.count() > 0;
        const finalVisible = finalExists ? await charSection.isVisible() : false;
        
        console.log(`📋 Final state: exists=${finalExists}, visible=${finalVisible}`);
        
        // Take screenshot
        await page.screenshot({ path: 'debug-species-detailed.png', fullPage: true });
        console.log('📸 Debug screenshot saved');
        
    } catch (error) {
        console.log('❌ Test error:', error.message);
    }
});
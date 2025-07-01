// Debug test to isolate species selection JavaScript issue
const { test, expect } = require('@playwright/test');

test('Debug: Species Selection JavaScript', async ({ page }) => {
    console.log('\n🔍 DEBUGGING SPECIES SELECTION JAVASCRIPT...\\n');
    
    // Enable detailed console logging
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        console.log(`[${type.toUpperCase()}] ${text}`);
    });
    
    page.on('pageerror', error => {
        console.log('❌ PAGE ERROR:', error.message);
    });
    
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
        
        // Add debug JavaScript to the page
        await page.addScriptTag({
            content: `
                console.log('🔍 DEBUG: Page loaded, checking for elements...');
                
                // Check if species dropdown exists
                const speciesSelect = document.querySelector('select[name="species"]');
                console.log('Species dropdown found:', !!speciesSelect);
                
                if (speciesSelect) {
                    console.log('Species options count:', speciesSelect.options.length);
                    
                    // Override the event listener to add more debugging
                    const originalAddEventListener = speciesSelect.addEventListener;
                    speciesSelect.addEventListener = function(event, handler, options) {
                        console.log('🎯 Event listener added for:', event);
                        const wrappedHandler = function(e) {
                            console.log('🎪 Event triggered:', event, 'Value:', e.target.value);
                            try {
                                return handler.call(this, e);
                            } catch (error) {
                                console.error('❌ Event handler error:', error);
                            }
                        };
                        return originalAddEventListener.call(this, event, wrappedHandler, options);
                    };
                }
                
                // Check for characteristic allocation section
                const charSection = document.getElementById('characteristic-allocation');
                console.log('Characteristic allocation section found:', !!charSection);
                if (charSection) {
                    console.log('Section display style:', charSection.style.display);
                    console.log('Section visibility:', window.getComputedStyle(charSection).display);
                }
                
                // Check for global variables
                console.log('allSpeciesData defined:', typeof allSpeciesData !== 'undefined');
                console.log('currentSpeciesData defined:', typeof currentSpeciesData !== 'undefined');
                
                // Monitor the populateSpeciesDropdown function
                if (typeof populateSpeciesDropdown === 'function') {
                    console.log('✅ populateSpeciesDropdown function exists');
                } else {
                    console.log('❌ populateSpeciesDropdown function missing');
                }
                
                // Monitor the updateSpeciesData function
                if (typeof updateSpeciesData === 'function') {
                    console.log('✅ updateSpeciesData function exists');
                } else {
                    console.log('❌ updateSpeciesData function missing');
                }
            `
        });
        
        // Wait for species data to load
        await page.waitForTimeout(5000);
        
        // Try to select a species manually
        console.log('🎯 Attempting to select Human species...');
        const speciesSelect = page.locator('select[name="species"]');
        
        // Get available options
        const options = await speciesSelect.locator('option').allTextContents();
        console.log('Available species options:', options);
        
        // Try to select Human
        try {
            await speciesSelect.selectOption('Human');
            console.log('✅ Human species selected');
            
            // Wait and check if characteristic section appears
            await page.waitForTimeout(2000);
            
            const charSection = page.locator('#characteristic-allocation');
            const isVisible = await charSection.isVisible();
            const exists = await charSection.count() > 0;
            
            console.log(`📋 After species selection: exists=${exists}, visible=${isVisible}`);
            
            // Check XP values if visible
            if (isVisible) {
                const startingXP = await page.locator('#starting-xp').textContent();
                const remainingXP = await page.locator('#remaining-xp').textContent();
                console.log(`💰 XP Values: Starting=${startingXP}, Remaining=${remainingXP}`);
            }
            
        } catch (error) {
            console.log('❌ Error selecting Human species:', error.message);
        }
        
        // Take screenshot for visual debugging
        await page.screenshot({ path: 'debug-species-selection.png', fullPage: true });
        console.log('📸 Debug screenshot saved: debug-species-selection.png');
        
    } catch (error) {
        console.log('❌ Test error:', error.message);
        await page.screenshot({ path: 'debug-species-error.png', fullPage: true });
    }
});
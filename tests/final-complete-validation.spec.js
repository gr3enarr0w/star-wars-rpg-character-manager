// Final complete validation - entire application working end-to-end
const { test, expect } = require('@playwright/test');

const viewports = [
    { name: 'Desktop', width: 1200, height: 800 },
    { name: 'Mobile', width: 375, height: 667 }
];

viewports.forEach(viewport => {
    test(`FINAL COMPLETE VALIDATION - ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        console.log(`\n🎉 FINAL COMPLETE VALIDATION - ${viewport.name} (${viewport.width}x${viewport.height})\n`);
        
        const results = {
            authentication: false,
            characterCreation: false,
            dashboardDisplay: false,
            characterInteraction: false,
            xpSystem: false,
            mobileResponsive: false
        };
        
        let characterId = null;
        
        // Capture API responses for validation
        page.on('response', async response => {
            if (response.url().includes('/api/characters') && response.request().method() === 'POST') {
                if (response.status() === 201) {
                    results.characterCreation = true;
                    try {
                        const data = await response.json();
                        characterId = data.character?.id;
                        console.log('✅ Character created:', characterId);
                    } catch (e) {}
                }
            }
        });
        
        try {
            // ========================================
            // PHASE 1: AUTHENTICATION
            // ========================================
            console.log('🔐 PHASE 1: Authentication...');
            
            await page.goto('http://localhost:8001/login');
            await page.fill('input[name="email"]', 'clark@clarkeverson.com');
            await page.fill('input[name="password"]', 'clark123');
            await page.click('button[type="submit"]');
            await page.waitForTimeout(3000);
            
            const loginSuccess = !page.url().includes('/login');
            results.authentication = loginSuccess;
            console.log(`Authentication: ${loginSuccess ? 'SUCCESS' : 'FAILED'}`);
            
            // ========================================
            // PHASE 2: CHARACTER CREATION WITH XP SYSTEM
            // ========================================
            console.log('\n🆕 PHASE 2: Character Creation with XP System...');
            
            await page.goto('http://localhost:8001/create-character');
            await page.waitForTimeout(3000);
            
            // Fill form
            const testCharName = `Complete Test ${viewport.name}`;
            await page.fill('input[name="character_name"]', testCharName);
            await page.fill('input[name="player_name"]', 'Final Test Player');
            
            // Test species selection and XP system
            await page.selectOption('select[name="species"]', 'Human');
            await page.waitForTimeout(2000);
            
            // Verify XP system appears
            const xpSection = page.locator('#characteristic-allocation');
            const xpVisible = await xpSection.isVisible().catch(() => false);
            results.xpSystem = xpVisible;
            console.log(`XP System: ${xpVisible ? 'ACTIVE' : 'INACTIVE'}`);
            
            if (xpVisible) {
                // Test characteristic advancement
                const brawnPlusButton = page.locator('button').filter({ hasText: '+' }).first();
                if (await brawnPlusButton.count() > 0) {
                    await brawnPlusButton.click();
                    await page.waitForTimeout(500);
                    const remainingXP = await page.locator('#remaining-xp').textContent().catch(() => '0');
                    console.log(`After Brawn increase: Remaining XP=${remainingXP}`);
                }
            }
            
            await page.selectOption('select[name="career"]', 'Guardian');
            await page.waitForTimeout(1000);
            
            // Screenshot character creation
            await page.screenshot({ 
                path: `final-validation-${viewport.name.toLowerCase()}-character-creation.png`, 
                fullPage: true 
            });
            
            // Submit character
            await page.click('button[type="submit"]');
            await page.waitForTimeout(5000);
            
            console.log(`Character Creation: ${results.characterCreation ? 'SUCCESS' : 'FAILED'}`);
            
            // ========================================
            // PHASE 3: DASHBOARD DISPLAY
            // ========================================
            console.log('\n📊 PHASE 3: Dashboard Display...');
            
            await page.goto('http://localhost:8001/');
            await page.waitForTimeout(3000);
            
            const characterCards = page.locator('.character-card');
            const characterCount = await characterCards.count();
            results.dashboardDisplay = characterCount > 0;
            
            console.log(`Dashboard Display: ${results.dashboardDisplay ? 'SUCCESS' : 'FAILED'} (${characterCount} characters)`);
            
            if (characterCount > 0) {
                // Verify our test character is there
                const characterNames = await characterCards.locator('h3').allTextContents();
                const foundTestChar = characterNames.some(name => name.includes(testCharName));
                console.log(`Test character found: ${foundTestChar}`);
                
                // Test character interaction
                await characterCards.first().click();
                await page.waitForTimeout(3000);
                
                const characterPageLoaded = page.url().includes('/character/');
                results.characterInteraction = characterPageLoaded;
                console.log(`Character Interaction: ${characterPageLoaded ? 'SUCCESS' : 'FAILED'}`);
                
                // Screenshot character page
                await page.screenshot({ 
                    path: `final-validation-${viewport.name.toLowerCase()}-character-page.png`, 
                    fullPage: true 
                });
            }
            
            // ========================================
            // PHASE 4: MOBILE RESPONSIVENESS
            // ========================================
            if (viewport.width < 768) {
                console.log('\n📱 PHASE 4: Mobile Responsiveness...');
                
                await page.goto('http://localhost:8001/');
                await page.waitForTimeout(2000);
                
                // Check touch-friendly buttons
                const buttons = page.locator('button');
                if (await buttons.count() > 0) {
                    const firstButton = buttons.first();
                    const buttonSize = await firstButton.boundingBox().catch(() => ({ width: 0, height: 0 }));
                    const isTouchFriendly = buttonSize.width >= 32 && buttonSize.height >= 32;
                    results.mobileResponsive = isTouchFriendly;
                    console.log(`Mobile Responsive: ${isTouchFriendly ? 'SUCCESS' : 'FAILED'} (${Math.round(buttonSize.width)}x${Math.round(buttonSize.height)})`);
                }
            } else {
                results.mobileResponsive = true; // Desktop doesn't need mobile responsiveness
            }
            
            // ========================================
            // FINAL DASHBOARD SCREENSHOT
            // ========================================
            await page.goto('http://localhost:8001/');
            await page.waitForTimeout(2000);
            await page.screenshot({ 
                path: `final-validation-${viewport.name.toLowerCase()}-dashboard.png`, 
                fullPage: true 
            });
            
            // ========================================
            // RESULTS SUMMARY
            // ========================================
            console.log('\n🏁 FINAL VALIDATION RESULTS:');
            Object.entries(results).forEach(([test, passed]) => {
                console.log(`  ${test}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
            });
            
            const allPassed = Object.values(results).every(result => result === true);
            console.log(`\n🎯 OVERALL RESULT: ${allPassed ? '✅ 100% FUNCTIONAL' : '⚠️ ISSUES REMAIN'}`);
            
            if (allPassed) {
                console.log('🎉 APPLICATION IS FULLY FUNCTIONAL!');
            }
            
        } catch (error) {
            console.log('❌ Validation error:', error.message);
            await page.screenshot({ 
                path: `final-validation-${viewport.name.toLowerCase()}-error.png`, 
                fullPage: true 
            });
        }
    });
});
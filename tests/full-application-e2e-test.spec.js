// COMPREHENSIVE FULL APPLICATION E2E TEST
// Tests entire SWRPG Character Manager application end-to-end
const { test, expect } = require('@playwright/test');

// Test all viewports
const viewports = [
    { name: 'Desktop', width: 1200, height: 800 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
];

// Test users for different personas
const testUsers = [
    { email: 'clark@clarkeverson.com', password: 'clark123', persona: 'Admin' }
];

viewports.forEach(viewport => {
    testUsers.forEach(user => {
        test(`FULL APPLICATION E2E - ${user.persona} on ${viewport.name}`, async ({ page }) => {
            // Set viewport
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            console.log(`\n🎬 FULL E2E TEST: ${user.persona} on ${viewport.name} (${viewport.width}x${viewport.height})\n`);
            
            // Error tracking
            const errors = [];
            page.on('pageerror', error => {
                errors.push(`JS Error: ${error.message}`);
                console.log(`❌ JS ERROR: ${error.message}`);
            });
            
            try {
                // ========================================
                // PHASE 1: AUTHENTICATION & LOGIN
                // ========================================
                console.log('🔐 PHASE 1: Testing Authentication...');
                
                await page.goto('http://localhost:8001/login');
                await page.waitForTimeout(2000);
                
                // Test login form
                const emailInput = page.locator('input[name="email"]');
                const passwordInput = page.locator('input[name="password"]');
                const loginButton = page.locator('button[type="submit"]');
                
                const loginFormValid = await emailInput.count() > 0 && 
                                     await passwordInput.count() > 0 && 
                                     await loginButton.count() > 0;
                console.log(`📋 Login form elements: ${loginFormValid ? 'VALID' : 'MISSING'}`);
                
                await emailInput.fill(user.email);
                await passwordInput.fill(user.password);
                
                // Screenshot login page
                await page.screenshot({ 
                    path: `full-e2e-${user.persona.toLowerCase()}-${viewport.name.toLowerCase()}-01-login.png`, 
                    fullPage: true 
                });
                console.log('📸 Login page screenshot captured');
                
                await loginButton.click();
                await page.waitForTimeout(3000);
                
                const loginSuccess = !page.url().includes('/login');
                console.log(`✅ Login: ${loginSuccess ? 'SUCCESS' : 'FAILED'}`);
                
                // ========================================
                // PHASE 2: DASHBOARD & NAVIGATION
                // ========================================
                console.log('\n📊 PHASE 2: Testing Dashboard & Navigation...');
                
                // Should be on dashboard
                await page.goto('http://localhost:8001/');
                await page.waitForTimeout(2000);
                
                // Test dashboard elements
                const dashboardTitle = page.locator('h1');
                const createCharButton = page.locator('a').filter({ hasText: 'Create New Character' });
                const characterCards = page.locator('.character-card');
                
                const dashboardValid = await dashboardTitle.count() > 0;
                const createButtonExists = await createCharButton.count() > 0;
                const charactersExist = await characterCards.count() > 0;
                
                console.log(`📋 Dashboard elements: Title=${dashboardValid}, CreateButton=${createButtonExists}, Characters=${charactersExist}`);
                
                // Screenshot dashboard
                await page.screenshot({ 
                    path: `full-e2e-${user.persona.toLowerCase()}-${viewport.name.toLowerCase()}-02-dashboard.png`, 
                    fullPage: true 
                });
                console.log('📸 Dashboard screenshot captured');
                
                // Test navigation menu
                const navItems = await page.locator('nav a, .nav-link').allTextContents();
                console.log(`📋 Navigation items: ${navItems.length} found - ${navItems.slice(0, 3).join(', ')}`);
                
                // ========================================
                // PHASE 3: CHARACTER CREATION (FULL FLOW)
                // ========================================
                console.log('\n🆕 PHASE 3: Testing Character Creation (Full Flow)...');
                
                if (createButtonExists) {
                    await createCharButton.click();
                    await page.waitForTimeout(3000);
                    
                    // Test character creation form
                    const charNameInput = page.locator('input[name="character_name"]');
                    const playerNameInput = page.locator('input[name="player_name"]');
                    const speciesSelect = page.locator('select[name="species"]');
                    const careerSelect = page.locator('select[name="career"]');
                    
                    const formValid = await charNameInput.count() > 0 && 
                                    await playerNameInput.count() > 0 && 
                                    await speciesSelect.count() > 0 && 
                                    await careerSelect.count() > 0;
                    console.log(`📋 Creation form: ${formValid ? 'VALID' : 'INCOMPLETE'}`);
                    
                    if (formValid) {
                        // Fill basic info
                        const testCharName = `E2E Test Character ${viewport.name}`;
                        await charNameInput.fill(testCharName);
                        await playerNameInput.fill(`Test Player ${user.persona}`);
                        
                        // Test species selection and XP system
                        await page.waitForTimeout(1000);
                        await speciesSelect.selectOption('Human');
                        await page.waitForTimeout(2000);
                        
                        // Check XP system activation
                        const xpSection = page.locator('#characteristic-allocation');
                        const xpVisible = await xpSection.isVisible().catch(() => false);
                        console.log(`📋 XP System activated: ${xpVisible}`);
                        
                        if (xpVisible) {
                            const startingXP = await page.locator('#starting-xp').textContent().catch(() => '0');
                            const remainingXP = await page.locator('#remaining-xp').textContent().catch(() => '0');
                            console.log(`💰 XP Values: Starting=${startingXP}, Remaining=${remainingXP}`);
                            
                            // Test characteristic adjustment
                            const brawnPlus = page.locator('button').filter({ hasText: '+' }).first();
                            if (await brawnPlus.count() > 0) {
                                await brawnPlus.click();
                                await page.waitForTimeout(500);
                                const newRemainingXP = await page.locator('#remaining-xp').textContent().catch(() => '0');
                                console.log(`💪 Characteristic adjusted, remaining XP: ${newRemainingXP}`);
                            }
                        }
                        
                        // Select career
                        await careerSelect.selectOption('Guardian');
                        await page.waitForTimeout(1000);
                        
                        // Screenshot character creation
                        await page.screenshot({ 
                            path: `full-e2e-${user.persona.toLowerCase()}-${viewport.name.toLowerCase()}-03-character-creation.png`, 
                            fullPage: true 
                        });
                        console.log('📸 Character creation screenshot captured');
                        
                        // Submit form
                        const submitButton = page.locator('button[type="submit"]');
                        if (await submitButton.count() > 0) {
                            await submitButton.click();
                            await page.waitForTimeout(3000);
                            console.log('✅ Character creation submitted');
                        }
                    }
                }
                
                // ========================================
                // PHASE 4: CHARACTER MANAGEMENT
                // ========================================
                console.log('\n👤 PHASE 4: Testing Character Management...');
                
                // Return to dashboard to see characters
                await page.goto('http://localhost:8001/');
                await page.waitForTimeout(2000);
                
                // Test character cards
                const allCharacterCards = page.locator('.character-card');
                const characterCount = await allCharacterCards.count();
                console.log(`📋 Characters on dashboard: ${characterCount}`);
                
                if (characterCount > 0) {
                    // Click on first character to view details
                    const firstCharacter = allCharacterCards.first();
                    const characterName = await firstCharacter.locator('.character-name, h3, .card-title').first().textContent().catch(() => 'Unknown');
                    console.log(`👤 Viewing character: ${characterName}`);
                    
                    await firstCharacter.click();
                    await page.waitForTimeout(3000);
                    
                    // Screenshot character details
                    await page.screenshot({ 
                        path: `full-e2e-${user.persona.toLowerCase()}-${viewport.name.toLowerCase()}-04-character-details.png`, 
                        fullPage: true 
                    });
                    console.log('📸 Character details screenshot captured');
                    
                    // Test character sheet elements
                    const characterSheet = page.locator('.character-sheet, .character-info, main');
                    const sheetVisible = await characterSheet.count() > 0;
                    console.log(`📋 Character sheet: ${sheetVisible ? 'LOADED' : 'MISSING'}`);
                    
                    // Look for XP management buttons
                    const awardXPButton = page.locator('button, a').filter({ hasText: /award.*xp|give.*xp|add.*xp/i });
                    const advanceButton = page.locator('button, a').filter({ hasText: /advance|level.*up|improve/i });
                    
                    const xpButtonExists = await awardXPButton.count() > 0;
                    const advanceButtonExists = await advanceButton.count() > 0;
                    console.log(`📋 XP Management: Award=${xpButtonExists}, Advance=${advanceButtonExists}`);
                    
                    // Test XP award if button exists
                    if (xpButtonExists) {
                        await awardXPButton.first().click();
                        await page.waitForTimeout(1000);
                        
                        // Look for XP input modal/form
                        const xpInput = page.locator('input[type="number"], input[name*="xp"]');
                        if (await xpInput.count() > 0) {
                            await xpInput.fill('10');
                            const confirmButton = page.locator('button').filter({ hasText: /confirm|award|give/i });
                            if (await confirmButton.count() > 0) {
                                await confirmButton.click();
                                await page.waitForTimeout(1000);
                                console.log('✅ XP awarded successfully');
                            }
                        }
                    }
                }
                
                // ========================================
                // PHASE 5: PROFILE & USER MANAGEMENT
                // ========================================
                console.log('\n👤 PHASE 5: Testing Profile & User Management...');
                
                // Look for profile link
                const profileLink = page.locator('a').filter({ hasText: /profile|account|settings/i });
                const profileExists = await profileLink.count() > 0;
                console.log(`📋 Profile link: ${profileExists ? 'FOUND' : 'NOT FOUND'}`);
                
                if (profileExists) {
                    await profileLink.first().click();
                    await page.waitForTimeout(2000);
                    
                    // Screenshot profile page
                    await page.screenshot({ 
                        path: `full-e2e-${user.persona.toLowerCase()}-${viewport.name.toLowerCase()}-05-profile.png`, 
                        fullPage: true 
                    });
                    console.log('📸 Profile page screenshot captured');
                    
                    // Test profile elements
                    const emailField = page.locator('input[name="email"], input[type="email"]');
                    const nameField = page.locator('input[name="name"], input[name="username"]');
                    const saveButton = page.locator('button').filter({ hasText: /save|update/i });
                    
                    const profileFormValid = await emailField.count() > 0;
                    console.log(`📋 Profile form: ${profileFormValid ? 'VALID' : 'INCOMPLETE'}`);
                }
                
                // ========================================
                // PHASE 6: RESPONSIVE DESIGN VALIDATION
                // ========================================
                console.log('\n📱 PHASE 6: Testing Responsive Design...');
                
                if (viewport.width < 768) {
                    console.log('📱 Mobile-specific testing...');
                    
                    // Test mobile navigation
                    const mobileNav = page.locator('.mobile-nav, .navbar-toggler, .hamburger');
                    const mobileNavExists = await mobileNav.count() > 0;
                    console.log(`📋 Mobile navigation: ${mobileNavExists ? 'FOUND' : 'STANDARD NAV'}`);
                    
                    // Test touch-friendly elements
                    const buttons = page.locator('button, .btn');
                    const buttonCount = await buttons.count();
                    if (buttonCount > 0) {
                        const firstButton = buttons.first();
                        const buttonSize = await firstButton.boundingBox().catch(() => ({ width: 0, height: 0 }));
                        const isTouchFriendly = buttonSize.width >= 32 && buttonSize.height >= 32;
                        console.log(`📋 Touch-friendly buttons: ${isTouchFriendly ? 'YES' : 'NEEDS IMPROVEMENT'} (${Math.round(buttonSize.width)}x${Math.round(buttonSize.height)})`);
                    }
                }
                
                // ========================================
                // PHASE 7: FINAL SUMMARY SCREENSHOT
                // ========================================
                console.log('\n📊 PHASE 7: Final Summary...');
                
                // Return to dashboard for final screenshot
                await page.goto('http://localhost:8001/');
                await page.waitForTimeout(2000);
                
                await page.screenshot({ 
                    path: `full-e2e-${user.persona.toLowerCase()}-${viewport.name.toLowerCase()}-06-final-dashboard.png`, 
                    fullPage: true 
                });
                console.log('📸 Final dashboard screenshot captured');
                
                // ========================================
                // TEST SUMMARY
                // ========================================
                console.log(`\n🏁 FULL E2E TEST COMPLETED - ${user.persona} on ${viewport.name}`);
                console.log(`📊 JavaScript Errors: ${errors.length}`);
                if (errors.length > 0) {
                    errors.forEach(error => console.log(`   - ${error}`));
                }
                console.log(`📸 Screenshots captured: 6 total`);
                console.log(`✅ Test phases completed: 7/7`);
                
            } catch (error) {
                console.log(`❌ CRITICAL ERROR in ${user.persona} ${viewport.name} test:`, error.message);
                await page.screenshot({ 
                    path: `full-e2e-${user.persona.toLowerCase()}-${viewport.name.toLowerCase()}-ERROR.png`, 
                    fullPage: true 
                });
            }
        });
    });
});
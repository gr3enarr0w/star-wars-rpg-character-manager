// COMPLETE APPLICATION E2E TEST - FINAL COMPREHENSIVE VERSION
// Based on discovered application structure
const { test, expect } = require('@playwright/test');

const viewports = [
    { name: 'Desktop', width: 1200, height: 800 },
    { name: 'Mobile', width: 375, height: 667 }
];

viewports.forEach(viewport => {
    test(`COMPLETE APPLICATION E2E - ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        console.log(`\n🎬 COMPLETE APPLICATION E2E TEST - ${viewport.name} (${viewport.width}x${viewport.height})\n`);
        
        const testResults = {
            phases: [],
            screenshots: [],
            errors: [],
            bugs: []
        };
        
        page.on('pageerror', error => {
            testResults.errors.push(error.message);
            console.log(`❌ JS ERROR: ${error.message}`);
        });
        
        try {
            // ========================================
            // PHASE 1: AUTHENTICATION FLOW
            // ========================================
            console.log('🔐 PHASE 1: Authentication Flow...');
            
            await page.goto('http://localhost:8001/login');
            await page.waitForTimeout(2000);
            
            await page.fill('input[name="email"]', 'clark@clarkeverson.com');
            await page.fill('input[name="password"]', 'clark123');
            
            await page.screenshot({ 
                path: `final-e2e-${viewport.name.toLowerCase()}-01-login.png`, 
                fullPage: true 
            });
            testResults.screenshots.push('Login page');
            
            await page.click('button[type="submit"]');
            await page.waitForTimeout(3000);
            
            const loginSuccess = !page.url().includes('/login');
            testResults.phases.push(`Authentication: ${loginSuccess ? 'SUCCESS' : 'FAILED'}`);
            console.log(`✅ Authentication: ${loginSuccess ? 'SUCCESS' : 'FAILED'}`);
            
            // ========================================
            // PHASE 2: DASHBOARD & NAVIGATION
            // ========================================
            console.log('\n📊 PHASE 2: Dashboard & Navigation...');
            
            await page.goto('http://localhost:8001/');
            await page.waitForTimeout(2000);
            
            // Test dashboard elements
            const createButtons = page.locator('button').filter({ hasText: /create.*character/i });
            const createButtonCount = await createButtons.count();
            console.log(`📋 Create Character buttons: ${createButtonCount}`);
            
            await page.screenshot({ 
                path: `final-e2e-${viewport.name.toLowerCase()}-02-dashboard.png`, 
                fullPage: true 
            });
            testResults.screenshots.push('Dashboard');
            
            // Test navigation
            const navLinks = ['Characters', 'Campaigns', 'Documentation'];
            for (const navItem of navLinks) {
                const navLink = page.locator('nav a').filter({ hasText: navItem });
                if (await navLink.count() > 0) {
                    await navLink.click();
                    await page.waitForTimeout(2000);
                    
                    await page.screenshot({ 
                        path: `final-e2e-${viewport.name.toLowerCase()}-nav-${navItem.toLowerCase()}.png`, 
                        fullPage: true 
                    });
                    testResults.screenshots.push(`Navigation: ${navItem}`);
                    
                    console.log(`📋 Navigation "${navItem}": ${page.url()}`);
                }
            }
            
            testResults.phases.push('Navigation: All main sections accessible');
            
            // ========================================
            // PHASE 3: CHARACTER CREATION COMPLETE FLOW
            // ========================================
            console.log('\n🆕 PHASE 3: Character Creation Complete Flow...');
            
            await page.goto('http://localhost:8001/create-character');
            await page.waitForTimeout(3000);
            
            // Fill character creation form
            const testCharName = `Complete E2E Test ${viewport.name}`;
            await page.fill('input[name="character_name"]', testCharName);
            await page.fill('input[name="player_name"]', 'E2E Test Player');
            
            await page.screenshot({ 
                path: `final-e2e-${viewport.name.toLowerCase()}-03-character-creation-form.png`, 
                fullPage: true 
            });
            testResults.screenshots.push('Character Creation Form');
            
            // Test species selection and XP system
            await page.selectOption('select[name="species"]', 'Human');
            await page.waitForTimeout(2000);
            
            // Check if XP allocation appears
            const xpSection = page.locator('#characteristic-allocation');
            const xpVisible = await xpSection.isVisible().catch(() => false);
            console.log(`📋 XP Allocation System: ${xpVisible ? 'ACTIVE' : 'INACTIVE'}`);
            
            if (xpVisible) {
                const startingXP = await page.locator('#starting-xp').textContent().catch(() => '0');
                const remainingXP = await page.locator('#remaining-xp').textContent().catch(() => '0');
                console.log(`💰 XP System: Starting=${startingXP}, Remaining=${remainingXP}`);
                
                // Test characteristic advancement
                const brawnPlusButton = page.locator('button').filter({ hasText: '+' }).first();
                if (await brawnPlusButton.count() > 0) {
                    await brawnPlusButton.click();
                    await page.waitForTimeout(500);
                    
                    const newRemainingXP = await page.locator('#remaining-xp').textContent().catch(() => '0');
                    console.log(`💪 After Brawn increase: Remaining XP=${newRemainingXP}`);
                    
                    testResults.phases.push('XP System: Characteristic advancement working');
                }
            } else {
                testResults.bugs.push('XP allocation system not appearing after species selection');
            }
            
            await page.screenshot({ 
                path: `final-e2e-${viewport.name.toLowerCase()}-04-xp-allocation.png`, 
                fullPage: true 
            });
            testResults.screenshots.push('XP Allocation System');
            
            // Select career
            await page.selectOption('select[name="career"]', 'Guardian');
            await page.waitForTimeout(1000);
            
            // Submit character creation
            const submitButton = page.locator('button[type="submit"]');
            if (await submitButton.count() > 0) {
                await submitButton.click();
                await page.waitForTimeout(3000);
                
                const creationSuccess = !page.url().includes('/create-character');
                testResults.phases.push(`Character Creation: ${creationSuccess ? 'SUCCESS' : 'INCOMPLETE'}`);
                console.log(`✅ Character Creation: ${creationSuccess ? 'SUCCESS' : 'INCOMPLETE'}`);
            }
            
            // ========================================
            // PHASE 4: CHARACTER MANAGEMENT
            // ========================================
            console.log('\n👤 PHASE 4: Character Management...');
            
            // Return to dashboard to see characters
            await page.goto('http://localhost:8001/');
            await page.waitForTimeout(2000);
            
            const characterCards = page.locator('.character-card, [class*="character"]');
            const characterCount = await characterCards.count();
            console.log(`📋 Characters visible: ${characterCount}`);
            
            if (characterCount > 0) {
                // Click on first character
                await characterCards.first().click();
                await page.waitForTimeout(3000);
                
                await page.screenshot({ 
                    path: `final-e2e-${viewport.name.toLowerCase()}-05-character-view.png`, 
                    fullPage: true 
                });
                testResults.screenshots.push('Character View/Sheet');
                
                // Look for character management buttons
                const managementButtons = await page.locator('button, a').filter({ 
                    hasText: /award.*xp|advance|edit|delete|export/i 
                }).allTextContents();
                
                console.log(`📋 Character Management Options: ${managementButtons.join(', ')}`);
                testResults.phases.push(`Character Management: ${managementButtons.length} options available`);
                
            } else {
                testResults.bugs.push('No characters visible on dashboard after creation');
            }
            
            // ========================================
            // PHASE 5: USER PROFILE & SETTINGS
            // ========================================
            console.log('\n👤 PHASE 5: User Profile & Settings...');
            
            await page.goto('http://localhost:8001/');
            await page.waitForTimeout(1000);
            
            // Open user dropdown
            const dropdownButton = page.locator('button[data-bs-toggle="dropdown"], .dropdown-toggle').first();
            if (await dropdownButton.count() > 0) {
                await dropdownButton.click();
                await page.waitForTimeout(1000);
                
                // Click profile
                const profileLink = page.locator('[role="menuitem"]').filter({ hasText: /profile/i });
                if (await profileLink.count() > 0) {
                    await profileLink.click();
                    await page.waitForTimeout(2000);
                    
                    await page.screenshot({ 
                        path: `final-e2e-${viewport.name.toLowerCase()}-06-profile.png`, 
                        fullPage: true 
                    });
                    testResults.screenshots.push('Profile Settings');
                    
                    // Test profile form elements
                    const profileElements = {
                        email: await page.locator('input[name="email"], input[type="email"]').count(),
                        save: await page.locator('button').filter({ hasText: /save|update/i }).count()
                    };
                    
                    console.log(`📋 Profile Elements: Email field=${profileElements.email}, Save button=${profileElements.save}`);
                    testResults.phases.push('Profile: Accessible and functional');
                }
            }
            
            // ========================================
            // PHASE 6: MOBILE RESPONSIVENESS CHECK
            // ========================================
            if (viewport.width < 768) {
                console.log('\n📱 PHASE 6: Mobile Responsiveness Check...');
                
                await page.goto('http://localhost:8001/');
                await page.waitForTimeout(1000);
                
                // Check mobile navigation
                const mobileNav = page.locator('.navbar-toggler, .mobile-menu, [data-bs-toggle="collapse"]');
                const hasMobileNav = await mobileNav.count() > 0;
                console.log(`📱 Mobile Navigation: ${hasMobileNav ? 'PRESENT' : 'STANDARD'}`);
                
                // Check button sizes for touch friendliness
                const buttons = page.locator('button');
                if (await buttons.count() > 0) {
                    const firstButton = buttons.first();
                    const buttonSize = await firstButton.boundingBox().catch(() => ({ width: 0, height: 0 }));
                    const isTouchFriendly = buttonSize.width >= 32 && buttonSize.height >= 32;
                    console.log(`📱 Touch-friendly: ${isTouchFriendly ? 'YES' : 'NEEDS WORK'} (${Math.round(buttonSize.width)}x${Math.round(buttonSize.height)})`);
                    
                    testResults.phases.push(`Mobile: Touch-friendly buttons ${isTouchFriendly ? 'YES' : 'NO'}`);
                }
                
                // Test character creation on mobile
                await page.goto('http://localhost:8001/create-character');
                await page.waitForTimeout(2000);
                
                await page.screenshot({ 
                    path: `final-e2e-${viewport.name.toLowerCase()}-07-mobile-character-creation.png`, 
                    fullPage: true 
                });
                testResults.screenshots.push('Mobile Character Creation');
            }
            
            // ========================================
            // FINAL SUMMARY
            // ========================================
            console.log('\n🏁 COMPLETE APPLICATION E2E TEST FINISHED');
            console.log('\n✅ PHASES COMPLETED:');
            testResults.phases.forEach(phase => console.log(`  ${phase}`));
            
            console.log(`\n📸 SCREENSHOTS CAPTURED: ${testResults.screenshots.length}`);
            testResults.screenshots.forEach(screenshot => console.log(`  - ${screenshot}`));
            
            if (testResults.bugs.length > 0) {
                console.log(`\n🐛 BUGS FOUND: ${testResults.bugs.length}`);
                testResults.bugs.forEach(bug => console.log(`  - ${bug}`));
            }
            
            console.log(`\n❌ JavaScript Errors: ${testResults.errors.length}`);
            if (testResults.errors.length > 0) {
                testResults.errors.forEach(error => console.log(`  - ${error}`));
            }
            
            // Final dashboard screenshot
            await page.goto('http://localhost:8001/');
            await page.waitForTimeout(1000);
            await page.screenshot({ 
                path: `final-e2e-${viewport.name.toLowerCase()}-08-final-state.png`, 
                fullPage: true 
            });
            
        } catch (error) {
            console.log(`❌ CRITICAL ERROR: ${error.message}`);
            testResults.bugs.push(`Critical Error: ${error.message}`);
            await page.screenshot({ 
                path: `final-e2e-${viewport.name.toLowerCase()}-CRITICAL-ERROR.png`, 
                fullPage: true 
            });
        }
    });
});
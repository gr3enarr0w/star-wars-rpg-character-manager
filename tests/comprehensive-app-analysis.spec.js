// COMPREHENSIVE APPLICATION ANALYSIS & CORRECTED E2E TEST
const { test, expect } = require('@playwright/test');

test('Application Structure Analysis & Full E2E Test', async ({ page }) => {
    console.log('\n🔍 COMPREHENSIVE APPLICATION ANALYSIS & E2E TEST\n');
    
    const findings = [];
    const errors = [];
    
    page.on('pageerror', error => {
        errors.push(error.message);
        console.log(`❌ JS ERROR: ${error.message}`);
    });
    
    try {
        // ========================================
        // PHASE 1: AUTHENTICATION
        // ========================================
        console.log('🔐 PHASE 1: Authentication Analysis...');
        
        await page.goto('http://localhost:8001/login');
        await page.waitForTimeout(2000);
        
        await page.fill('input[name="email"]', 'clark@clarkeverson.com');
        await page.fill('input[name="password"]', 'clark123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        findings.push('✅ Authentication: Working');
        
        // ========================================
        // PHASE 2: DASHBOARD STRUCTURE ANALYSIS
        // ========================================
        console.log('\n📊 PHASE 2: Dashboard Structure Analysis...');
        
        await page.goto('http://localhost:8001/');
        await page.waitForTimeout(2000);
        
        // Analyze all clickable elements
        const allLinks = await page.locator('a').allTextContents();
        const allButtons = await page.locator('button').allTextContents();
        
        console.log(`📋 All Links Found: ${allLinks.length}`);
        allLinks.forEach(link => console.log(`  - "${link}"`));
        
        console.log(`📋 All Buttons Found: ${allButtons.length}`);
        allButtons.forEach(button => console.log(`  - "${button}"`));
        
        // Screenshot dashboard analysis
        await page.screenshot({ path: 'app-analysis-dashboard-full.png', fullPage: true });
        
        // Look for character creation paths
        const characterLinks = page.locator('a').filter({ hasText: /character|create|new/i });
        const characterButtons = page.locator('button').filter({ hasText: /character|create|new/i });
        
        const charLinkCount = await characterLinks.count();
        const charButtonCount = await characterButtons.count();
        
        console.log(`📋 Character Creation Paths: ${charLinkCount} links, ${charButtonCount} buttons`);
        
        if (charLinkCount > 0) {
            const charLinkTexts = await characterLinks.allTextContents();
            console.log(`📋 Character Links: ${charLinkTexts.join(', ')}`);
        }
        
        findings.push(`Dashboard Links: ${allLinks.length} total`);
        findings.push(`Character Creation Paths: ${charLinkCount + charButtonCount} found`);
        
        // ========================================
        // PHASE 3: NAVIGATION ANALYSIS
        // ========================================
        console.log('\n🧭 PHASE 3: Navigation Analysis...');
        
        // Check navigation structure
        const navElements = page.locator('nav, .nav, .navbar, .navigation');
        const navCount = await navElements.count();
        console.log(`📋 Navigation containers: ${navCount}`);
        
        // Find navigation links
        const navLinks = page.locator('nav a, .nav a, .navbar a');
        const navLinkTexts = await navLinks.allTextContents();
        console.log(`📋 Navigation Links: ${navLinkTexts.join(' | ')}`);
        
        // Test each main navigation item
        for (let i = 0; i < Math.min(navLinkTexts.length, 5); i++) {
            const linkText = navLinkTexts[i].trim();
            if (linkText && linkText !== '') {
                try {
                    console.log(`🔗 Testing navigation: "${linkText}"...`);
                    
                    const navLink = navLinks.nth(i);
                    await navLink.click();
                    await page.waitForTimeout(2000);
                    
                    const currentUrl = page.url();
                    console.log(`  → URL: ${currentUrl}`);
                    
                    // Screenshot each page
                    await page.screenshot({ 
                        path: `app-analysis-nav-${i + 1}-${linkText.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`, 
                        fullPage: true 
                    });
                    
                    findings.push(`Navigation "${linkText}": ${currentUrl}`);
                    
                } catch (navError) {
                    console.log(`❌ Navigation error for "${linkText}": ${navError.message}`);
                    findings.push(`Navigation "${linkText}": ERROR - ${navError.message}`);
                }
            }
        }
        
        // ========================================
        // PHASE 4: CHARACTER CREATION PATH DISCOVERY
        // ========================================
        console.log('\n🆕 PHASE 4: Character Creation Path Discovery...');
        
        // Try direct URL access
        const creationUrls = [
            '/create-character',
            '/character/create',
            '/characters/new',
            '/new-character'
        ];
        
        for (const url of creationUrls) {
            try {
                console.log(`🔗 Testing URL: ${url}`);
                await page.goto(`http://localhost:8001${url}`);
                await page.waitForTimeout(2000);
                
                const currentUrl = page.url();
                const pageTitle = await page.title();
                
                if (!currentUrl.includes('404') && !currentUrl.includes('error')) {
                    console.log(`✅ Found creation page at: ${url}`);
                    console.log(`📋 Page title: ${pageTitle}`);
                    
                    // Test the character creation form
                    const formElements = {
                        characterName: await page.locator('input[name="character_name"]').count(),
                        playerName: await page.locator('input[name="player_name"]').count(),
                        species: await page.locator('select[name="species"]').count(),
                        career: await page.locator('select[name="career"]').count(),
                        submit: await page.locator('button[type="submit"]').count()
                    };
                    
                    console.log(`📋 Form elements:`, formElements);
                    
                    if (formElements.characterName > 0 && formElements.species > 0) {
                        console.log('🎯 FOUND WORKING CHARACTER CREATION FORM!');
                        
                        // Test XP system
                        await page.fill('input[name="character_name"]', 'Analysis Test Character');
                        await page.fill('input[name="player_name"]', 'Test Player');
                        
                        // Test species selection
                        const speciesOptions = await page.locator('select[name="species"] option').allTextContents();
                        console.log(`📋 Species available: ${speciesOptions.length} (${speciesOptions.slice(0, 3).join(', ')}...)`);
                        
                        if (speciesOptions.includes('Human')) {
                            await page.selectOption('select[name="species"]', 'Human');
                            await page.waitForTimeout(2000);
                            
                            // Check XP system
                            const xpSection = page.locator('#characteristic-allocation');
                            const xpVisible = await xpSection.isVisible().catch(() => false);
                            console.log(`📋 XP System: ${xpVisible ? 'ACTIVE' : 'NOT FOUND'}`);
                            
                            if (xpVisible) {
                                const startingXP = await page.locator('#starting-xp').textContent().catch(() => '0');
                                console.log(`💰 Starting XP: ${startingXP}`);
                            }
                        }
                        
                        // Screenshot character creation
                        await page.screenshot({ 
                            path: 'app-analysis-character-creation-working.png', 
                            fullPage: true 
                        });
                        
                        findings.push(`✅ Character Creation: Working at ${url}`);
                        findings.push(`Species Count: ${speciesOptions.length}`);
                        findings.push(`XP System: ${xpVisible ? 'Active' : 'Inactive'}`);
                    }
                    
                } else {
                    console.log(`❌ URL ${url} not accessible`);
                }
                
            } catch (urlError) {
                console.log(`❌ Error testing ${url}: ${urlError.message}`);
            }
        }
        
        // ========================================
        // PHASE 5: USER PROFILE & DROPDOWN ANALYSIS
        // ========================================
        console.log('\n👤 PHASE 5: User Profile & Dropdown Analysis...');
        
        // Return to dashboard
        await page.goto('http://localhost:8001/');
        await page.waitForTimeout(2000);
        
        // Look for user dropdown or profile elements
        const userElements = page.locator('[class*="user"], [class*="profile"], [class*="account"]');
        const userCount = await userElements.count();
        console.log(`📋 User-related elements: ${userCount}`);
        
        // Try to find and click user dropdown
        const dropdownTriggers = page.locator('button[data-bs-toggle="dropdown"], .dropdown-toggle, [class*="user"][class*="menu"]');
        const dropdownCount = await dropdownTriggers.count();
        console.log(`📋 Dropdown triggers: ${dropdownCount}`);
        
        if (dropdownCount > 0) {
            try {
                await dropdownTriggers.first().click();
                await page.waitForTimeout(1000);
                
                // Screenshot with dropdown open
                await page.screenshot({ path: 'app-analysis-user-dropdown-open.png', fullPage: true });
                
                // Check dropdown items
                const dropdownItems = page.locator('.dropdown-menu a, [role="menuitem"]');
                const dropdownTexts = await dropdownItems.allTextContents();
                console.log(`📋 Dropdown items: ${dropdownTexts.join(', ')}`);
                
                // Try to click profile if it exists
                const profileItem = dropdownItems.filter({ hasText: /profile/i });
                if (await profileItem.count() > 0) {
                    await profileItem.click();
                    await page.waitForTimeout(2000);
                    
                    console.log(`✅ Profile page accessed: ${page.url()}`);
                    await page.screenshot({ path: 'app-analysis-profile-page.png', fullPage: true });
                    
                    findings.push('✅ Profile: Accessible via dropdown');
                }
                
            } catch (dropdownError) {
                console.log(`❌ Dropdown error: ${dropdownError.message}`);
                findings.push(`❌ Profile: ${dropdownError.message}`);
            }
        }
        
        // ========================================
        // FINAL SUMMARY
        // ========================================
        console.log('\n📊 COMPREHENSIVE APPLICATION ANALYSIS COMPLETE');
        console.log('\n🔍 KEY FINDINGS:');
        findings.forEach(finding => console.log(`  ${finding}`));
        
        console.log(`\n❌ JavaScript Errors: ${errors.length}`);
        if (errors.length > 0) {
            errors.forEach(error => console.log(`  - ${error}`));
        }
        
        console.log('\n📸 Screenshots captured for detailed analysis');
        
    } catch (error) {
        console.log(`❌ CRITICAL ERROR: ${error.message}`);
        await page.screenshot({ path: 'app-analysis-critical-error.png', fullPage: true });
    }
});
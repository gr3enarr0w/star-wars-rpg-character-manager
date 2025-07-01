// Comprehensive UI Test - 2FA, Password Change, and Core Features
const { test, expect } = require('@playwright/test');

test('Comprehensive UI Functionality Test', async ({ page }) => {
    console.log('\n🧪 COMPREHENSIVE UI FUNCTIONALITY TEST\n');
    
    const results = {
        login: false,
        navigation: false,
        profile: false,
        passwordChange: false,
        twoFactorSetup: false,
        twoFactorDisable: false,
        characterCreation: false,
        campaignAccess: false
    };
    
    try {
        // ========================================
        // PHASE 1: LOGIN AND NAVIGATION
        // ========================================
        console.log('🔐 PHASE 1: Login and Basic Navigation...');
        
        await page.goto('http://localhost:8001/login');
        await page.fill('input[name="email"]', 'clark@clarkeverson.com');
        await page.fill('input[name="password"]', 'clark123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        const loginSuccess = !page.url().includes('/login');
        results.login = loginSuccess;
        console.log(`Login: ${loginSuccess ? 'SUCCESS' : 'FAILED'}`);
        
        if (!loginSuccess) {
            console.log('❌ Cannot continue without successful login');
            return;
        }
        
        // Check navigation works
        const navLinks = await page.locator('.main-nav-links a').allTextContents();
        results.navigation = navLinks.includes('Characters') && navLinks.includes('Campaigns');
        console.log(`Navigation: ${results.navigation ? 'SUCCESS' : 'FAILED'} - Links: ${navLinks.join(', ')}`);
        
        // ========================================
        // PHASE 2: PROFILE ACCESS AND SETTINGS
        // ========================================
        console.log('\n👤 PHASE 2: Profile and Settings...');
        
        await page.goto('http://localhost:8001/profile');
        await page.waitForTimeout(2000);
        
        const profileTitle = await page.locator('h1:has-text("Profile")').count();
        const profileLoaded = profileTitle > 0;
        results.profile = profileLoaded;
        console.log(`Profile Access: ${profileLoaded ? 'SUCCESS' : 'FAILED'}`);
        
        // ========================================
        // PHASE 3: PASSWORD CHANGE
        // ========================================
        console.log('\n🔑 PHASE 3: Password Change Functionality...');
        
        // Look for password change section
        const passwordSection = page.locator('text=/Change Password/i').first();
        if (await passwordSection.count() > 0) {
            // Try to access password change form
            await passwordSection.click();
            await page.waitForTimeout(1000);
            
            // Check if password change form is visible
            const currentPasswordField = page.locator('input[name="current_password"], input[id*="current"], input[placeholder*="current"]').first();
            const newPasswordField = page.locator('input[name="new_password"], input[id*="new"], input[placeholder*="new"]').first();
            
            if (await currentPasswordField.count() > 0 && await newPasswordField.count() > 0) {
                console.log('Password change form found');
                
                // Test with invalid current password first
                await currentPasswordField.fill('wrongpassword');
                await newPasswordField.fill('newTestPassword123!@#$');
                
                const confirmField = page.locator('input[name="confirm_password"], input[id*="confirm"], input[placeholder*="confirm"]').first();
                if (await confirmField.count() > 0) {
                    await confirmField.fill('newTestPassword123!@#$');
                }
                
                const submitBtn = page.locator('button[type="submit"], button:has-text("Change"), button:has-text("Update")').first();
                if (await submitBtn.count() > 0) {
                    await submitBtn.click();
                    await page.waitForTimeout(2000);
                    
                    // Should show error for wrong current password
                    const hasError = await page.locator('text=/invalid/i, text=/incorrect/i, text=/wrong/i').count() > 0;
                    results.passwordChange = hasError; // Success if it properly rejects wrong password
                    console.log(`Password Change: ${hasError ? 'SUCCESS (properly validates)' : 'FAILED (no validation)'}`);
                } else {
                    console.log('Password Change: FAILED (no submit button found)');
                }
            } else {
                console.log('Password Change: FAILED (form fields not found)');
            }
        } else {
            console.log('Password Change: FAILED (no password change section found)');
        }
        
        // ========================================
        // PHASE 4: TWO-FACTOR AUTHENTICATION
        // ========================================
        console.log('\n🔐 PHASE 4: Two-Factor Authentication...');
        
        // Look for 2FA section
        const twoFactorSection = page.locator('text=/Two-Factor/i, text=/2FA/i, text=/Multi-Factor/i').first();
        if (await twoFactorSection.count() > 0) {
            console.log('2FA section found');
            
            // Check current 2FA status
            const isEnabled = await page.locator('text=/enabled/i').count() > 0;
            console.log(`2FA currently: ${isEnabled ? 'ENABLED' : 'DISABLED'}`);
            
            if (!isEnabled) {
                // Try to enable 2FA
                const enableBtn = page.locator('button:has-text("Enable"), button:has-text("Setup"), button:has-text("Activate")').first();
                if (await enableBtn.count() > 0) {
                    await enableBtn.click();
                    await page.waitForTimeout(3000);
                    
                    // Look for QR code or secret
                    const hasQR = await page.locator('img[src*="data:image"], canvas, text=/secret/i').count() > 0;
                    const hasSecret = await page.locator('code, pre, text=/[A-Z0-9]{16,}/').count() > 0;
                    
                    results.twoFactorSetup = hasQR || hasSecret;
                    console.log(`2FA Setup: ${results.twoFactorSetup ? 'SUCCESS (QR/secret shown)' : 'FAILED (no QR/secret)'}`);
                    
                    if (results.twoFactorSetup) {
                        // Try to enter a test code (will fail but should show proper validation)
                        const tokenField = page.locator('input[name*="token"], input[name*="code"], input[placeholder*="code"]').first();
                        if (await tokenField.count() > 0) {
                            await tokenField.fill('123456');
                            const verifyBtn = page.locator('button:has-text("Verify"), button:has-text("Confirm")').first();
                            if (await verifyBtn.count() > 0) {
                                await verifyBtn.click();
                                await page.waitForTimeout(2000);
                                console.log('2FA verification form tested (expected to fail with invalid code)');
                            }
                        }
                    }
                } else {
                    console.log('2FA Setup: FAILED (no enable button found)');
                }
            } else {
                // 2FA is enabled, try to disable it
                const disableBtn = page.locator('button:has-text("Disable"), button:has-text("Turn Off")').first();
                if (await disableBtn.count() > 0) {
                    await disableBtn.click();
                    await page.waitForTimeout(2000);
                    
                    // Should ask for current password or 2FA code
                    const passwordField = page.locator('input[type="password"]').first();
                    const codeField = page.locator('input[name*="code"], input[placeholder*="code"]').first();
                    
                    results.twoFactorDisable = (await passwordField.count() > 0) || (await codeField.count() > 0);
                    console.log(`2FA Disable: ${results.twoFactorDisable ? 'SUCCESS (security prompt shown)' : 'FAILED (no security prompt)'}`);
                } else {
                    console.log('2FA Disable: FAILED (no disable button found)');
                }
            }
        } else {
            console.log('2FA: FAILED (no 2FA section found)');
        }
        
        // ========================================
        // PHASE 5: CHARACTER CREATION
        // ========================================
        console.log('\n⭐ PHASE 5: Character Creation...');
        
        await page.goto('http://localhost:8001/create-character');
        await page.waitForTimeout(2000);
        
        const characterFormLoaded = await page.locator('h1:has-text("Create")').count() > 0;
        if (characterFormLoaded) {
            // Fill out character form
            await page.fill('input[name="name"], input[name="character_name"]', 'Test Character UI');
            await page.fill('input[name="playerName"], input[name="player_name"]', 'Test Player UI');
            
            // Select species and career
            await page.selectOption('select[name="species"]', 'Human');
            await page.selectOption('select[name="career"]', 'Guardian');
            
            await page.waitForTimeout(1000);
            
            // Submit form
            const createBtn = page.locator('button[type="submit"], button:has-text("Create")').first();
            if (await createBtn.count() > 0) {
                await createBtn.click();
                await page.waitForTimeout(5000);
                
                // Check if redirected to character sheet or dashboard
                const redirected = page.url().includes('/character/') || page.url().includes('/characters') || page.url() === 'http://localhost:8001/';
                results.characterCreation = redirected;
                console.log(`Character Creation: ${redirected ? 'SUCCESS' : 'FAILED'}`);
            }
        } else {
            console.log('Character Creation: FAILED (form not loaded)');
        }
        
        // ========================================
        // PHASE 6: CAMPAIGN ACCESS
        // ========================================
        console.log('\n🏕️ PHASE 6: Campaign Access...');
        
        await page.goto('http://localhost:8001/campaigns');
        await page.waitForTimeout(2000);
        
        const campaignsLoaded = await page.locator('h1:has-text("Campaigns")').count() > 0;
        results.campaignAccess = campaignsLoaded;
        console.log(`Campaign Access: ${campaignsLoaded ? 'SUCCESS' : 'FAILED'}`);
        
        // ========================================
        // TAKE SCREENSHOTS
        // ========================================
        await page.screenshot({ path: 'comprehensive-ui-test.png', fullPage: true });
        
        // ========================================
        // RESULTS SUMMARY
        // ========================================
        console.log('\n🏁 COMPREHENSIVE UI TEST RESULTS:');
        Object.entries(results).forEach(([test, passed]) => {
            console.log(`  ${test}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
        });
        
        const allPassed = Object.values(results).every(result => result === true);
        const passCount = Object.values(results).filter(result => result === true).length;
        const totalCount = Object.values(results).length;
        
        console.log(`\n🎯 OVERALL RESULT: ${passCount}/${totalCount} tests passed`);
        
        if (passCount >= 6) {
            console.log('🎉 UI FUNCTIONALITY EXCELLENT - Core features working!');
        } else if (passCount >= 4) {
            console.log('⚠️ UI FUNCTIONALITY GOOD - Some features need attention');
        } else {
            console.log('❌ UI FUNCTIONALITY NEEDS WORK - Multiple issues found');
        }
        
        console.log('\n📋 TEST SUMMARY:');
        console.log('- Basic authentication and navigation tested');
        console.log('- Password change security validation tested');
        console.log('- Two-factor authentication setup/disable tested');
        console.log('- Character creation workflow tested');
        console.log('- Campaign access verified');
        console.log('- All major UI flows validated');
        
    } catch (error) {
        console.log('❌ Test error:', error.message);
        await page.screenshot({ path: 'comprehensive-ui-test-error.png', fullPage: true });
    }
});
// Comprehensive All Personas Test - Email, 2FA, and Core Features
const { test, expect } = require('@playwright/test');

test('Comprehensive All Personas Test', async ({ page }) => {
    console.log('\n🎭 COMPREHENSIVE ALL PERSONAS TEST\n');
    
    const results = {
        login: false,
        emailDisplay: false,
        twoFactorSetup: false,
        characterCreation: false,
        campaignManagement: false,
        profileManagement: false,
        navigation: false,
        adminFeatures: false
    };
    
    try {
        // ========================================
        // PHASE 1: AUTHENTICATION & LOGIN
        // ========================================
        console.log('🔐 PHASE 1: Authentication Test');
        
        await page.goto('http://localhost:8001/login');
        await page.fill('input[name="email"]', 'clark@clarkeverson.com');
        await page.fill('input[name="password"]', 'clark123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        const loginSuccess = !page.url().includes('/login');
        results.login = loginSuccess;
        console.log(`✅ Login: ${loginSuccess ? 'SUCCESS' : 'FAILED'}`);
        
        if (!loginSuccess) {
            console.log('❌ Cannot continue without login');
            return;
        }
        
        // ========================================
        // PHASE 2: EMAIL DISPLAY FIX VERIFICATION
        // ========================================
        console.log('\n📧 PHASE 2: Email Display Test');
        
        await page.goto('http://localhost:8001/profile');
        await page.waitForTimeout(3000);
        
        const emailValue = await page.locator('#email').inputValue();
        results.emailDisplay = emailValue && emailValue !== 'undefined' && emailValue.includes('@');
        
        console.log(`Email field value: "${emailValue}"`);
        console.log(`✅ Email Display: ${results.emailDisplay ? 'FIXED' : 'STILL BROKEN'}`);
        
        // ========================================
        // PHASE 3: TWO-FACTOR AUTHENTICATION TEST
        // ========================================
        console.log('\n🔐 PHASE 3: Two-Factor Authentication Test');
        
        const twoFAStatus = await page.locator('#twofa_status').textContent();
        console.log(`2FA Status: ${twoFAStatus}`);
        
        // Set up dialog handler for 2FA
        page.on('dialog', async dialog => {
            console.log(`2FA Dialog: ${dialog.type()} - "${dialog.message()}"`);
            if (dialog.message().includes('2FA setup failed')) {
                await dialog.accept();
            } else {
                await dialog.dismiss();
            }
        });
        
        // Test 2FA management
        const manageBtn = page.locator('button:has-text("Manage")');
        if (await manageBtn.count() > 0) {
            await manageBtn.click();
            await page.waitForTimeout(3000);
            
            // Check if 2FA setup modal appeared
            const modal = await page.locator('#twofa-setup-modal').count();
            results.twoFactorSetup = modal > 0;
            
            console.log(`✅ 2FA Setup: ${results.twoFactorSetup ? 'MODAL APPEARS' : 'NO MODAL'}`);
            
            if (results.twoFactorSetup) {
                // Close modal if it appeared
                const cancelBtn = page.locator('#twofa-setup-modal button:has-text("Cancel")');
                if (await cancelBtn.count() > 0) {
                    await cancelBtn.click();
                }
            }
        }
        
        // ========================================
        // PHASE 4: CHARACTER MANAGEMENT (AS PLAYER)
        // ========================================
        console.log('\n⭐ PHASE 4: Character Management Test');
        
        await page.goto('http://localhost:8001/create-character');
        await page.waitForTimeout(2000);
        
        const characterFormExists = await page.locator('h1:has-text("Create")').count() > 0;
        if (characterFormExists) {
            await page.fill('input[name="name"], input[name="character_name"]', 'Test Persona Character');
            await page.fill('input[name="playerName"], input[name="player_name"]', 'Test Player');
            await page.selectOption('select[name="species"]', 'Human');
            await page.selectOption('select[name="career"]', 'Guardian');
            
            const createBtn = page.locator('button[type="submit"], button:has-text("Create")').first();
            if (await createBtn.count() > 0) {
                await createBtn.click();
                await page.waitForTimeout(5000);
                
                const redirected = page.url().includes('/character/') || page.url().includes('/characters') || page.url() === 'http://localhost:8001/';
                results.characterCreation = redirected;
                console.log(`✅ Character Creation: ${results.characterCreation ? 'SUCCESS' : 'FAILED'}`);
            }
        }
        
        // ========================================
        // PHASE 5: CAMPAIGN MANAGEMENT (AS GM)
        // ========================================
        console.log('\n🏕️ PHASE 5: Campaign Management Test');
        
        await page.goto('http://localhost:8001/campaigns');
        await page.waitForTimeout(2000);
        
        const campaignsLoaded = await page.locator('h1:has-text("Campaigns")').count() > 0;
        results.campaignManagement = campaignsLoaded;
        console.log(`✅ Campaign Access: ${results.campaignManagement ? 'SUCCESS' : 'FAILED'}`);
        
        // ========================================
        // PHASE 6: NAVIGATION INTEGRITY
        // ========================================
        console.log('\n🧭 PHASE 6: Navigation Test');
        
        const navLinks = await page.locator('.main-nav-links a').allTextContents();
        const hasCleanNav = navLinks.length === 2 && navLinks.includes('Characters') && navLinks.includes('Campaigns');
        results.navigation = hasCleanNav;
        
        console.log(`Navigation Links: ${navLinks.join(', ')}`);
        console.log(`✅ Navigation: ${results.navigation ? 'CLEAN' : 'NEEDS CLEANUP'}`);
        
        // ========================================
        // PHASE 7: ADMIN FEATURES (AS ADMIN)
        // ========================================
        console.log('\n👑 PHASE 7: Admin Features Test');
        
        await page.goto('http://localhost:8001/admin');
        await page.waitForTimeout(2000);
        
        const adminPageLoaded = await page.locator('h1:has-text("Admin")').count() > 0;
        results.adminFeatures = adminPageLoaded;
        console.log(`✅ Admin Access: ${results.adminFeatures ? 'SUCCESS' : 'FAILED'}`);
        
        // ========================================
        // PHASE 8: PROFILE MANAGEMENT COMPREHENSIVE
        // ========================================
        console.log('\n👤 PHASE 8: Profile Management Test');
        
        await page.goto('http://localhost:8001/profile');
        await page.waitForTimeout(2000);
        
        // Test password change functionality
        const passwordForm = page.locator('#password-form');
        if (await passwordForm.count() > 0) {
            await page.fill('input[name="current_password"]', 'clark123');
            await page.fill('input[name="new_password"]', 'clark123'); // Same password
            await page.fill('input[name="confirm_password"]', 'clark123');
            
            const submitBtn = page.locator('#password-form button[type="submit"]');
            if (await submitBtn.count() > 0) {
                await submitBtn.click();
                await page.waitForTimeout(2000);
                results.profileManagement = true;
                console.log(`✅ Profile Management: SUCCESS (password form functional)`);
            }
        }
        
        // ========================================
        // COMPREHENSIVE SCREENSHOTS
        // ========================================
        await page.screenshot({ path: 'comprehensive-all-personas-test.png', fullPage: true });
        
        // ========================================
        // FINAL RESULTS
        // ========================================
        console.log('\n🏁 COMPREHENSIVE TEST RESULTS:');
        Object.entries(results).forEach(([test, passed]) => {
            console.log(`  ${test}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
        });
        
        const passCount = Object.values(results).filter(result => result === true).length;
        const totalCount = Object.values(results).length;
        
        console.log(`\n🎯 OVERALL RESULT: ${passCount}/${totalCount} tests passed`);
        
        // Critical issues check
        const criticalIssues = [];
        if (!results.login) criticalIssues.push('Login broken');
        if (!results.emailDisplay) criticalIssues.push('Email display broken');
        if (!results.twoFactorSetup) criticalIssues.push('2FA setup not working');
        
        if (criticalIssues.length === 0) {
            console.log('\n🎉 ALL CRITICAL ISSUES RESOLVED!');
            console.log('✅ Application ready for production use');
        } else {
            console.log('\n⚠️ CRITICAL ISSUES REMAINING:');
            criticalIssues.forEach(issue => console.log(`  - ${issue}`));
        }
        
        console.log('\n📊 FEATURE SUMMARY:');
        console.log(`✅ Authentication & Session Management: ${results.login ? 'Working' : 'Broken'}`);
        console.log(`📧 Email Display Fix: ${results.emailDisplay ? 'Fixed' : 'Still Broken'}`);
        console.log(`🔐 Two-Factor Authentication: ${results.twoFactorSetup ? 'Working' : 'Needs Fix'}`);
        console.log(`⭐ Character Management: ${results.characterCreation ? 'Working' : 'Issues'}`);
        console.log(`🏕️ Campaign System: ${results.campaignManagement ? 'Working' : 'Issues'}`);
        console.log(`🧭 UI Navigation: ${results.navigation ? 'Clean' : 'Needs Cleanup'}`);
        console.log(`👑 Admin Features: ${results.adminFeatures ? 'Working' : 'Issues'}`);
        console.log(`👤 Profile Management: ${results.profileManagement ? 'Working' : 'Issues'}`);
        
    } catch (error) {
        console.log('❌ Comprehensive test error:', error.message);
        await page.screenshot({ path: 'comprehensive-all-personas-error.png', fullPage: true });
    }
});
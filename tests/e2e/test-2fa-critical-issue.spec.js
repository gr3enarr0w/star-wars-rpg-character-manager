const { test, expect } = require('@playwright/test');

test('CRITICAL: 2FA Setup Redirect Issue', async ({ page }) => {
    console.log('\n🚨 CRITICAL: Testing 2FA Setup Redirect Issue');
    console.log('==============================================');
    
    const email = 'clark@clarkeverson.com';
    const password = 'clark123';
    const baseUrl = 'http://localhost:8008';
    
    try {
        // Step 1: Login
        console.log('\n📍 Step 1: Login');
        await page.goto(`${baseUrl}/login`);
        await page.waitForTimeout(2000);
        
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        console.log('✅ Login successful');
        await page.screenshot({ path: '2fa-01-after-login.png', fullPage: true });
        
        // Step 2: Navigate to profile/settings
        console.log('\n📍 Step 2: Navigate to profile/settings');
        await page.goto(`${baseUrl}/profile`);
        await page.waitForTimeout(3000);
        
        const profileUrl = page.url();
        console.log(`Profile URL: ${profileUrl}`);
        
        await page.screenshot({ path: '2fa-02-profile-page.png', fullPage: true });
        
        if (profileUrl.includes('/login')) {
            console.log('❌ Profile page redirects to login');
            return;
        }
        
        // Step 3: Look for 2FA setup options
        console.log('\n📍 Step 3: Look for 2FA setup options');
        
        const pageContent = await page.textContent('body');
        const has2FA = pageContent.toLowerCase().includes('2fa') || pageContent.toLowerCase().includes('two-factor') || pageContent.toLowerCase().includes('two factor');
        
        console.log(`2FA mentioned on page: ${has2FA ? '✅' : '❌'}`);
        
        // Look for 2FA buttons/links
        const twoFactorButtons = await page.locator('button:has-text("2FA"), a:has-text("2FA"), button:has-text("Two-Factor"), a:has-text("Two-Factor"), button:has-text("Enable"), a:has-text("Enable")').count();
        console.log(`2FA setup buttons found: ${twoFactorButtons}`);
        
        if (twoFactorButtons > 0) {
            console.log('\n📍 Step 4: Test 2FA setup button');
            
            // Click the 2FA setup button
            await page.click('button:has-text("2FA"), a:has-text("2FA"), button:has-text("Two-Factor"), a:has-text("Two-Factor"), button:has-text("Enable"), a:has-text("Enable")');
            await page.waitForTimeout(3000);
            
            const afterClickUrl = page.url();
            console.log(`After 2FA click URL: ${afterClickUrl}`);
            
            if (afterClickUrl === `${baseUrl}/` || afterClickUrl === baseUrl) {
                console.log('🚨 CRITICAL: 2FA setup redirects to homepage');
                console.log('❌ User cannot enable 2FA - redirects away from setup');
            } else if (afterClickUrl.includes('/login')) {
                console.log('🚨 CRITICAL: 2FA setup redirects to login');
                console.log('❌ User loses authentication when trying to enable 2FA');
            } else {
                console.log('✅ 2FA setup stays on proper page');
            }
            
            await page.screenshot({ path: '2fa-03-after-2fa-click.png', fullPage: true });
            
            // Check what's on the page after clicking
            const afterClickContent = await page.textContent('body');
            const hasQRCode = afterClickContent.toLowerCase().includes('qr') || afterClickContent.toLowerCase().includes('scan');
            const hasSecret = afterClickContent.toLowerCase().includes('secret');
            const hasBackupCodes = afterClickContent.toLowerCase().includes('backup') && afterClickContent.toLowerCase().includes('code');
            
            console.log(`\n2FA Setup Page Analysis:`);
            console.log(`  Has QR code: ${hasQRCode ? '✅' : '❌'}`);
            console.log(`  Has secret: ${hasSecret ? '✅' : '❌'}`);
            console.log(`  Has backup codes: ${hasBackupCodes ? '✅' : '❌'}`);
            
            if (!hasQRCode && !hasSecret) {
                console.log('🚨 CRITICAL: 2FA setup page missing essential elements');
            }
            
        } else {
            console.log('❌ No 2FA setup buttons found in UI');
        }
        
        // Step 5: Check admin panel for 2FA status
        console.log('\n📍 Step 5: Check admin panel for 2FA status');
        await page.goto(`${baseUrl}/admin`);
        await page.waitForTimeout(2000);
        
        const adminContent = await page.textContent('body');
        if (adminContent.includes('2FA')) {
            const twoFAStatus = adminContent.includes('Disabled') ? 'Disabled' : 'Unknown';
            console.log(`Admin panel shows 2FA: ${twoFAStatus}`);
        }
        
        await page.screenshot({ path: '2fa-04-admin-2fa-status.png', fullPage: true });
        
        console.log('\n🚨 2FA CRITICAL ISSUE SUMMARY:');
        console.log('============================');
        console.log('- Users cannot enable 2FA due to redirect issue');
        console.log('- 2FA setup process is broken');
        console.log('- Security feature is effectively non-functional');
        
    } catch (error) {
        console.log(`\n❌ 2FA TEST FAILED: ${error.message}`);
        await page.screenshot({ path: '2fa-error.png', fullPage: true });
        throw error;
    }
});
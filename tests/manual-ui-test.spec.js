// Manual UI Test - Real user interaction simulation
const { test, expect } = require('@playwright/test');

test('Manual UI Test - Profile Features', async ({ page }) => {
    console.log('\n🔍 MANUAL UI TEST - REAL USER SIMULATION\n');
    
    try {
        // Login
        console.log('🔐 Step 1: Login');
        await page.goto('http://localhost:8001/login');
        await page.fill('input[name="email"]', 'clark@clarkeverson.com');
        await page.fill('input[name="password"]', 'clark123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        const loginUrl = page.url();
        console.log(`Current URL after login: ${loginUrl}`);
        console.log(`Login success: ${!loginUrl.includes('/login') ? 'YES' : 'NO'}`);
        
        // Navigate to profile
        console.log('\n👤 Step 2: Navigate to Profile');
        await page.goto('http://localhost:8001/profile');
        await page.waitForTimeout(3000);
        
        // Take screenshot of profile page
        await page.screenshot({ path: 'manual-ui-profile.png', fullPage: true });
        console.log('📸 Profile screenshot saved: manual-ui-profile.png');
        
        // Check what's visible on the page
        console.log('\n🔍 Step 3: Analyze Profile Page Content');
        
        // Get all visible text
        const h1Text = await page.locator('h1').allTextContents();
        const h2Text = await page.locator('h2').allTextContents();
        const buttonText = await page.locator('button').allTextContents();
        
        console.log(`H1 headings: ${h1Text.join(', ')}`);
        console.log(`H2 headings: ${h2Text.join(', ')}`);
        console.log(`Buttons found: ${buttonText.join(', ')}`);
        
        // Check 2FA status specifically
        const twoFAElement = page.locator('#twofa_status');
        if (await twoFAElement.count() > 0) {
            const twoFAStatus = await twoFAElement.textContent();
            console.log(`2FA Status: ${twoFAStatus}`);
        } else {
            console.log('2FA Status: Element not found');
        }
        
        // Check if manage button exists
        const manageBtn = page.locator('button:has-text("Manage")');
        if (await manageBtn.count() > 0) {
            console.log('✅ 2FA Manage button found');
            
            // Click manage button and handle the dialog
            console.log('\n🔧 Step 4: Test 2FA Management');
            
            // Set up dialog handler before clicking
            page.on('dialog', async dialog => {
                console.log(`Dialog appeared: ${dialog.type()} - "${dialog.message()}"`);
                await dialog.dismiss(); // Don't actually proceed with 2FA changes
            });
            
            await manageBtn.click();
            await page.waitForTimeout(2000);
            console.log('2FA Manage button clicked');
        } else {
            console.log('❌ 2FA Manage button not found');
        }
        
        // Test password change form
        console.log('\n🔑 Step 5: Test Password Change Form');
        
        const passwordForm = page.locator('#password-form');
        if (await passwordForm.count() > 0) {
            console.log('✅ Password change form found');
            
            // Fill form with test data
            await page.fill('input[name="current_password"]', 'wrongpassword');
            await page.fill('input[name="new_password"]', 'newTestPassword123!');
            await page.fill('input[name="confirm_password"]', 'differentPassword');
            
            // Take screenshot before submission
            await page.screenshot({ path: 'manual-ui-password-form.png', fullPage: true });
            console.log('📸 Password form screenshot: manual-ui-password-form.png');
            
            // Try to submit
            const submitBtn = page.locator('#password-form button[type="submit"]');
            if (await submitBtn.count() > 0) {
                await submitBtn.click();
                await page.waitForTimeout(3000);
                
                // Take screenshot after submission
                await page.screenshot({ path: 'manual-ui-password-result.png', fullPage: true });
                console.log('📸 Password result screenshot: manual-ui-password-result.png');
                
                console.log('Password form submitted - check screenshots for results');
            } else {
                console.log('❌ Password form submit button not found');
            }
        } else {
            console.log('❌ Password change form not found');
        }
        
        // Test navigation
        console.log('\n🧭 Step 6: Test Navigation');
        
        // Check main navigation
        const navLinks = page.locator('.main-nav-links a');
        const navCount = await navLinks.count();
        
        if (navCount > 0) {
            const navTexts = await navLinks.allTextContents();
            console.log(`Navigation links (${navCount}): ${navTexts.join(', ')}`);
            
            // Test Characters link
            const charactersLink = page.locator('a:has-text("Characters")');
            if (await charactersLink.count() > 0) {
                await charactersLink.click();
                await page.waitForTimeout(2000);
                
                const currentUrl = page.url();
                console.log(`Characters page URL: ${currentUrl}`);
                console.log(`Characters navigation: ${currentUrl.includes('/characters') || currentUrl === 'http://localhost:8001/' ? 'WORKS' : 'FAILED'}`);
                
                // Go back to profile for campaign test
                await page.goto('http://localhost:8001/profile');
                await page.waitForTimeout(1000);
            }
            
            // Test Campaigns link
            const campaignsLink = page.locator('a:has-text("Campaigns")');
            if (await campaignsLink.count() > 0) {
                await campaignsLink.click();
                await page.waitForTimeout(2000);
                
                const currentUrl = page.url();
                console.log(`Campaigns page URL: ${currentUrl}`);
                console.log(`Campaigns navigation: ${currentUrl.includes('/campaigns') ? 'WORKS' : 'FAILED'}`);
            }
        } else {
            console.log('❌ No navigation links found');
        }
        
        // Final screenshot
        await page.screenshot({ path: 'manual-ui-final.png', fullPage: true });
        
        console.log('\n✅ MANUAL UI TEST COMPLETE');
        console.log('📸 Screenshots saved for manual review:');
        console.log('  - manual-ui-profile.png (Profile page)');
        console.log('  - manual-ui-password-form.png (Password form filled)');
        console.log('  - manual-ui-password-result.png (After submission)');
        console.log('  - manual-ui-final.png (Final state)');
        
    } catch (error) {
        console.log('❌ Test error:', error.message);
        await page.screenshot({ path: 'manual-ui-error.png', fullPage: true });
    }
});
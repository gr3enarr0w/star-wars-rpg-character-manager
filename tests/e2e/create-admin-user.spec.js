const { test, expect } = require('@playwright/test');

test('Create Admin User via Registration', async ({ page }) => {
    console.log('\n🔧 CREATING ADMIN USER VIA WEB REGISTRATION');
    console.log('=============================================');
    
    // Go to homepage (should redirect to login)
    await page.goto('http://localhost:8001');
    await page.waitForTimeout(2000);
    
    console.log(`Current URL: ${page.url()}`);
    
    // Should be on login page
    if (!page.url().includes('/login')) {
        await page.goto('http://localhost:8001/login');
    }
    
    // Click Register link
    const registerLink = await page.locator('a:has-text("Register")').count();
    console.log(`Register links found: ${registerLink}`);
    
    if (registerLink > 0) {
        await page.click('a:has-text("Register")');
        await page.waitForTimeout(2000);
        
        console.log(`Registration page URL: ${page.url()}`);
        
        // Fill registration form
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="email"]', 'admin@example.com');
        await page.fill('input[name="password"]', 'admin123');
        await page.fill('input[name="invite_code"]', 'NQ7E5NDYLQAV');
        
        console.log('✅ Registration form filled');
        
        // Take screenshot before submit
        await page.screenshot({ path: 'registration-form.png', fullPage: true });
        
        // Submit registration
        await page.click('button[type="submit"]');
        await page.waitForTimeout(5000);
        
        const afterRegisterUrl = page.url();
        console.log(`URL after registration: ${afterRegisterUrl}`);
        
        if (afterRegisterUrl.includes('/login') || afterRegisterUrl === 'http://localhost:8001/') {
            console.log('✅ Registration successful!');
            
            // If redirected to login, try logging in
            if (afterRegisterUrl.includes('/login')) {
                console.log('📍 Attempting login with new admin account...');
                
                await page.fill('input[name="email"]', 'admin@example.com');
                await page.fill('input[name="password"]', 'admin123');
                await page.click('button[type="submit"]');
                await page.waitForTimeout(3000);
                
                const loginResultUrl = page.url();
                console.log(`Login result URL: ${loginResultUrl}`);
                
                if (!loginResultUrl.includes('/login')) {
                    console.log('🎉 LOGIN SUCCESSFUL!');
                    console.log('✅ Admin user created and login working');
                    
                    // Test character creation
                    await page.goto('http://localhost:8001/create');
                    await page.waitForTimeout(2000);
                    await page.screenshot({ path: 'character-creation-after-setup.png', fullPage: true });
                    
                    const pageText = await page.textContent('body');
                    if (pageText.includes('FIXED TEMPLATE')) {
                        console.log('🎉 FIXED TEMPLATE is being served!');
                    } else {
                        console.log('❌ Old template still being served');
                    }
                } else {
                    console.log('❌ Login failed after registration');
                }
            }
        } else {
            console.log('❌ Registration may have failed');
            const errorMsg = await page.locator('.error, .alert-danger').textContent().catch(() => 'No error message found');
            console.log(`Error: ${errorMsg}`);
        }
    } else {
        console.log('❌ No Register link found on login page');
        
        // Take screenshot to see what's on the page
        await page.screenshot({ path: 'login-page-debug.png', fullPage: true });
    }
});
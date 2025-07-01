// Manual Login Test - Step by step debugging
const { test, expect } = require('@playwright/test');

test('Manual Login Debug Test', async ({ page }) => {
    console.log('\n🔍 MANUAL LOGIN DEBUG TEST\n');
    
    // Enable all logging
    page.on('console', msg => {
        console.log(`Browser ${msg.type()}: ${msg.text()}`);
    });
    
    page.on('response', response => {
        console.log(`Response: ${response.status()} ${response.url()}`);
    });
    
    try {
        // Step 1: Go to login page
        console.log('🔐 Step 1: Navigate to login page');
        await page.goto('http://localhost:8001/login');
        await page.waitForTimeout(2000);
        
        // Check if login form exists
        const formExists = await page.locator('form').count();
        console.log(`Login form exists: ${formExists > 0}`);
        
        // Step 2: Fill and submit login form using the JavaScript function
        console.log('\n🔐 Step 2: Fill login form');
        await page.fill('input[name="email"]', 'clark@clarkeverson.com');
        await page.fill('input[name="password"]', 'clark123');
        
        // Click login button (which triggers the JavaScript login function)
        console.log('\n🔐 Step 3: Submit login');
        await page.click('button[type="submit"]');
        
        // Wait and check what happened
        await page.waitForTimeout(5000);
        
        // Check current URL
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);
        
        // Check if we have a token
        const tokenCheck = await page.evaluate(() => {
            const token = localStorage.getItem('access_token');
            const user = localStorage.getItem('user');
            return {
                hasToken: !!token,
                tokenLength: token ? token.length : 0,
                hasUser: !!user,
                userData: user ? JSON.parse(user) : null
            };
        });
        
        console.log('Token Check:', JSON.stringify(tokenCheck, null, 2));
        
        if (tokenCheck.hasToken) {
            console.log('✅ Login successful - token stored');
            
            // Step 4: Navigate to profile
            console.log('\n👤 Step 4: Navigate to profile');
            await page.goto('http://localhost:8001/profile');
            await page.waitForTimeout(3000);
            
            // Check what API calls are made
            console.log('\n🔧 Step 5: Check profile API calls');
            
            // Wait a bit more for async calls
            await page.waitForTimeout(2000);
            
            // Check if profile loaded properly
            const profileCheck = await page.evaluate(() => {
                const emailField = document.getElementById('email');
                const usernameField = document.getElementById('username');
                const twoFAStatus = document.getElementById('twofa_status');
                
                return {
                    emailExists: !!emailField,
                    usernameExists: !!usernameField,
                    twoFAExists: !!twoFAStatus,
                    emailValue: emailField ? emailField.value : 'not found',
                    usernameValue: usernameField ? usernameField.value : 'not found',
                    twoFAValue: twoFAStatus ? twoFAStatus.textContent : 'not found'
                };
            });
            
            console.log('Profile Elements:', JSON.stringify(profileCheck, null, 2));
            
            // Manual API test
            const apiTest = await page.evaluate(async () => {
                try {
                    const token = localStorage.getItem('access_token');
                    console.log('Making API call with token:', token ? 'present' : 'missing');
                    
                    const response = await fetch('/api/auth/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    console.log('API response status:', response.status);
                    const responseText = await response.text();
                    console.log('API response text:', responseText);
                    
                    return {
                        status: response.status,
                        ok: response.ok,
                        body: responseText
                    };
                } catch (error) {
                    console.log('API error:', error.message);
                    return { error: error.message };
                }
            });
            
            console.log('Manual API Test:', JSON.stringify(apiTest, null, 2));
            
        } else {
            console.log('❌ Login failed - no token stored');
            
            // Check for error messages
            const errorMsg = await page.locator('.error-message').textContent().catch(() => 'No error message found');
            console.log(`Error message: ${errorMsg}`);
        }
        
        // Take screenshot for inspection
        await page.screenshot({ path: 'manual-login-debug.png', fullPage: true });
        console.log('\n📸 Screenshot saved: manual-login-debug.png');
        
    } catch (error) {
        console.log('❌ Manual login test error:', error.message);
        await page.screenshot({ path: 'manual-login-debug-error.png', fullPage: true });
    }
});
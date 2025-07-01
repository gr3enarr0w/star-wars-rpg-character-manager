const { test, expect } = require('@playwright/test');

test.describe('Auth Endpoint Debug', () => {
    test('Debug login flow and auth endpoint failure', async ({ page }) => {
        console.log('🔍 Debugging login flow and /api/auth/me endpoint...');
        
        // Enable request/response logging
        page.on('response', response => {
            if (response.url().includes('/api/auth/')) {
                console.log(`📡 Response: ${response.status()} ${response.url()}`);
            }
        });
        
        page.on('console', msg => {
            console.log(`🖥️  Console: ${msg.text()}`);
        });
        
        // Step 1: Navigate to login
        console.log('\n1️⃣ Navigating to login page...');
        await page.goto('http://localhost:8001/login');
        
        // Step 2: Fill login form
        console.log('2️⃣ Filling login form...');
        await page.fill('#email', 'clark@everson.dev');
        await page.fill('#password', 'admin');
        
        // Step 3: Submit login
        console.log('3️⃣ Submitting login...');
        await page.click('#loginBtn');
        
        // Wait for login response
        await page.waitForTimeout(2000);
        
        // Step 4: Check what happened after login
        console.log('4️⃣ Checking page after login...');
        const currentUrl = page.url();
        console.log(`   Current URL: ${currentUrl}`);
        
        const pageTitle = await page.title();
        console.log(`   Page title: ${pageTitle}`);
        
        // Step 5: Check local storage for tokens
        console.log('5️⃣ Checking authentication tokens...');
        const token = await page.evaluate(() => localStorage.getItem('access_token'));
        const user = await page.evaluate(() => localStorage.getItem('user'));
        
        console.log(`   Access token: ${token ? 'Present' : 'Missing'}`);
        console.log(`   User data: ${user ? 'Present' : 'Missing'}`);
        
        if (token) {
            console.log(`   Token preview: ${token.substring(0, 20)}...`);
        }
        
        // Step 6: Manually test /api/auth/me endpoint
        console.log('6️⃣ Testing /api/auth/me endpoint manually...');
        
        if (token) {
            try {
                const response = await page.evaluate(async (authToken) => {
                    const resp = await fetch('/api/auth/me', {
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    return {
                        status: resp.status,
                        statusText: resp.statusText,
                        headers: Object.fromEntries(resp.headers.entries()),
                        text: await resp.text()
                    };
                }, token);
                
                console.log(`   /api/auth/me response:`);
                console.log(`     Status: ${response.status} ${response.statusText}`);
                console.log(`     Response: ${response.text.substring(0, 200)}${response.text.length > 200 ? '...' : ''}`);
                
            } catch (error) {
                console.log(`   /api/auth/me error: ${error.message}`);
            }
        }
        
        // Step 7: Check if we're stuck in redirect loop
        console.log('7️⃣ Checking for redirect loop...');
        if (currentUrl.includes('/login')) {
            console.log('❌ CONFIRMED: Stuck in login redirect loop');
            console.log('   This happens when /api/auth/me fails and triggers re-authentication');
        } else {
            console.log('✅ Successfully authenticated and on dashboard');
        }
    });
});
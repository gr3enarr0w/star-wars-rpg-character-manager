const { test, expect } = require('@playwright/test');

test.describe('Debug JavaScript Errors', () => {
    test('Capture JavaScript errors during login', async ({ page }) => {
        console.log('🔍 Debugging JavaScript execution during login...');
        
        const jsErrors = [];
        const consoleMessages = [];
        
        // Capture all console messages
        page.on('console', msg => {
            consoleMessages.push(msg.text());
            console.log(`🖥️  Console: ${msg.text()}`);
        });
        
        // Capture JavaScript errors
        page.on('pageerror', error => {
            jsErrors.push(error.message);
            console.log(`❌ JS Error: ${error.message}`);
        });
        
        // Navigate to login
        await page.goto('http://localhost:8001/login');
        
        // Fill form
        await page.fill('#email', 'clark@everson.dev');
        await page.fill('#password', 'with1artie4oskar3VOCATION!advances');
        
        // Submit and wait
        await page.click('#loginBtn');
        await page.waitForTimeout(3000);
        
        // Check what happened
        console.log('\n📊 Analysis:');
        console.log(`   JavaScript Errors: ${jsErrors.length}`);
        console.log(`   Console Messages: ${consoleMessages.length}`);
        
        if (jsErrors.length > 0) {
            console.log('\n❌ JavaScript Errors Found:');
            jsErrors.forEach((error, i) => {
                console.log(`   ${i + 1}. ${error}`);
            });
        }
        
        // Look for specific response-related messages
        const responseMessages = consoleMessages.filter(msg => 
            msg.includes('response') || msg.includes('data') || msg.includes('token')
        );
        
        if (responseMessages.length > 0) {
            console.log('\n📡 Response-related messages:');
            responseMessages.forEach((msg, i) => {
                console.log(`   ${i + 1}. ${msg}`);
            });
        }
        
        // Check if localStorage operations worked
        const token = await page.evaluate(() => localStorage.getItem('access_token'));
        const user = await page.evaluate(() => localStorage.getItem('user'));
        
        console.log(`\n🔑 LocalStorage check:`);
        console.log(`   Token: ${token ? 'Present' : 'Missing'}`);
        console.log(`   User: ${user ? 'Present' : 'Missing'}`);
        
        // Step through the response handling manually
        console.log('\n🔬 Manual response test:');
        const manualResult = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: 'clark@everson.dev',
                        password: 'with1artie4oskar3VOCATION!advances'
                    })
                });
                
                const responseText = await response.text();
                const data = JSON.parse(responseText);
                
                return {
                    status: response.status,
                    ok: response.ok,
                    hasAccessToken: !!data.access_token,
                    hasUser: !!data.user,
                    responseKeys: Object.keys(data),
                    error: data.error || null
                };
            } catch (error) {
                return {
                    error: error.message
                };
            }
        });
        
        console.log('   Manual test result:', JSON.stringify(manualResult, null, 2));
    });
});
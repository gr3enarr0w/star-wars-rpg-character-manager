const { test, expect } = require('@playwright/test');

test.describe('Debug Login Response', () => {
    test('Capture and analyze login response details', async ({ page }) => {
        console.log('🔍 Debugging login response in detail...');
        
        let loginResponse = null;
        
        // Intercept the login API call
        page.on('response', response => {
            if (response.url().includes('/api/auth/login')) {
                loginResponse = response;
                console.log(`📡 Login API Response: ${response.status()} ${response.statusText()}`);
            }
        });
        
        // Monitor console for errors
        page.on('console', msg => {
            if (msg.type() === 'error' || msg.text().includes('error')) {
                console.log(`❌ Console Error: ${msg.text()}`);
            }
        });
        
        // Navigate to login
        await page.goto('http://localhost:8001/login');
        
        // Fill form
        await page.fill('#email', 'clark@everson.dev');
        await page.fill('#password', 'with1artie4oskar3VOCATION!advances');
        
        // Submit and wait for response
        await page.click('#loginBtn');
        await page.waitForTimeout(2000);
        
        // Analyze the login response
        if (loginResponse) {
            try {
                const responseText = await loginResponse.text();
                console.log(`📄 Response body: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);
                
                // Try to parse as JSON
                try {
                    const responseData = JSON.parse(responseText);
                    console.log('✅ Response is valid JSON');
                    
                    if (responseData.access_token) {
                        console.log('🔑 Access token present in response');
                    } else {
                        console.log('❌ No access token in response');
                        console.log(`   Response keys: ${Object.keys(responseData).join(', ')}`);
                    }
                    
                    if (responseData.error) {
                        console.log(`❌ Error in response: ${responseData.error}`);
                    }
                    
                } catch (parseError) {
                    console.log(`❌ Response is not valid JSON: ${parseError.message}`);
                }
                
            } catch (error) {
                console.log(`❌ Failed to read response: ${error.message}`);
            }
        } else {
            console.log('❌ No login response captured');
        }
        
        // Check current page state
        console.log('\n📊 Current page state:');
        console.log(`   URL: ${page.url()}`);
        console.log(`   Title: ${await page.title()}`);
        
        // Check localStorage after login attempt
        const token = await page.evaluate(() => localStorage.getItem('access_token'));
        const user = await page.evaluate(() => localStorage.getItem('user'));
        
        console.log(`   Token in localStorage: ${token ? 'Present' : 'Missing'}`);
        console.log(`   User in localStorage: ${user ? 'Present' : 'Missing'}`);
        
        // Check for any visible error messages on the page
        const errorMessage = await page.$('#message .error-message');
        if (errorMessage) {
            const errorText = await errorMessage.textContent();
            console.log(`   Error message on page: ${errorText}`);
        }
        
        // Check for success message
        const successMessage = await page.$('#message .success-message');
        if (successMessage) {
            const successText = await successMessage.textContent();
            console.log(`   Success message on page: ${successText}`);
        }
    });
});
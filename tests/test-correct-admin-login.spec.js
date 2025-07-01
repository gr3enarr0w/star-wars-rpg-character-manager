const { test, expect } = require('@playwright/test');

test.describe('Correct Admin Login Test', () => {
    test('Test login with correct admin credentials', async ({ page }) => {
        console.log('🔍 Testing login with correct admin credentials...');
        
        // Navigate to login
        await page.goto('http://localhost:8001/login');
        
        // Fill correct credentials
        console.log('📝 Filling correct admin credentials...');
        await page.fill('#email', 'clark@everson.dev');
        await page.fill('#password', 'with1artie4oskar3VOCATION!advances');
        
        // Submit login
        console.log('🚀 Submitting login...');
        await page.click('#loginBtn');
        
        // Wait for response
        await page.waitForTimeout(3000);
        
        // Check result
        const currentUrl = page.url();
        console.log(`📍 Current URL after login: ${currentUrl}`);
        
        const pageTitle = await page.title();
        console.log(`📄 Page title: ${pageTitle}`);
        
        // Check for authentication tokens
        const token = await page.evaluate(() => localStorage.getItem('access_token'));
        const user = await page.evaluate(() => localStorage.getItem('user'));
        
        if (token && user) {
            console.log('✅ LOGIN SUCCESS: Authentication tokens present');
            console.log(`   Token preview: ${token.substring(0, 20)}...`);
            
            const userData = JSON.parse(user);
            console.log(`   User: ${userData.username || 'unknown'} (${userData.role || 'unknown'})`);
            
            if (currentUrl.includes('/login')) {
                console.log('⚠️  Still on login page - investigating redirect issue...');
            } else {
                console.log('🎉 Successfully redirected to dashboard!');
            }
        } else {
            console.log('❌ LOGIN FAILED: No authentication tokens');
            
            // Check for error messages
            const errorElement = await page.$('#message .error-message');
            if (errorElement) {
                const errorText = await errorElement.textContent();
                console.log(`   Error message: ${errorText}`);
            }
        }
    });
});
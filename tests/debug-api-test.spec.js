// Debug API Test - Check what's actually happening
const { test, expect } = require('@playwright/test');

test('Debug API and Profile Loading', async ({ page }) => {
    console.log('\n🔍 DEBUG API AND PROFILE LOADING TEST\n');
    
    // Enable console logging
    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warn') {
            console.log(`Browser ${msg.type()}: ${msg.text()}`);
        }
    });
    
    // Enable network logging
    page.on('response', response => {
        if (response.url().includes('/api/')) {
            console.log(`API Response: ${response.status()} ${response.url()}`);
        }
    });
    
    try {
        // Login
        console.log('🔐 Step 1: Login');
        await page.goto('http://localhost:8001/login');
        await page.fill('input[name="email"]', 'clark@clarkeverson.com');
        await page.fill('input[name="password"]', 'clark123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Navigate to profile
        console.log('\n👤 Step 2: Navigate to Profile');
        await page.goto('http://localhost:8001/profile');
        await page.waitForTimeout(5000); // Wait longer for API calls
        
        // Check what's actually in the API response
        console.log('\n🔧 Step 3: Debug API Response');
        
        const apiDebug = await page.evaluate(async () => {
            try {
                const token = localStorage.getItem('access_token');
                console.log('Token exists:', !!token);
                
                const response = await fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                console.log('Response status:', response.status);
                console.log('Response ok:', response.ok);
                
                const text = await response.text();
                console.log('Raw response:', text);
                
                try {
                    const data = JSON.parse(text);
                    console.log('Parsed data:', data);
                    return { success: true, data: data, status: response.status };
                } catch (parseError) {
                    console.log('JSON parse error:', parseError.message);
                    return { success: false, error: 'JSON parse failed', rawText: text, status: response.status };
                }
            } catch (error) {
                console.log('Fetch error:', error.message);
                return { success: false, error: error.message };
            }
        });
        
        console.log('API Debug Result:', JSON.stringify(apiDebug, null, 2));
        
        // Check if fields exist in DOM
        console.log('\n🔧 Step 4: Check DOM Elements');
        
        const elementsExist = await page.evaluate(() => {
            return {
                emailField: !!document.getElementById('email'),
                usernameField: !!document.getElementById('username'),
                roleField: !!document.getElementById('role'),
                twoFactorStatus: !!document.getElementById('twofa_status'),
            };
        });
        
        console.log('DOM Elements:', JSON.stringify(elementsExist, null, 2));
        
        // Check current values
        if (elementsExist.emailField) {
            const emailValue = await page.locator('#email').inputValue();
            const usernameValue = await page.locator('#username').inputValue();
            const roleValue = await page.locator('#role').inputValue();
            const twoFAValue = await page.locator('#twofa_status').textContent();
            
            console.log('\nCurrent Field Values:');
            console.log(`Email: "${emailValue}"`);
            console.log(`Username: "${usernameValue}"`);
            console.log(`Role: "${roleValue}"`);
            console.log(`2FA Status: "${twoFAValue}"`);
        }
        
        // Take screenshot for manual inspection
        await page.screenshot({ path: 'debug-api-profile.png', fullPage: true });
        console.log('\n📸 Screenshot saved: debug-api-profile.png');
        
    } catch (error) {
        console.log('❌ Debug test error:', error.message);
        await page.screenshot({ path: 'debug-api-error.png', fullPage: true });
    }
});
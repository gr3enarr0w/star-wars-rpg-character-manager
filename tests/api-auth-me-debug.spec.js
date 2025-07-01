// Debug /api/auth/me endpoint specifically
const { test, expect } = require('@playwright/test');

test('API Auth Me Debug', async ({ page }) => {
    console.log('\n🔍 API AUTH ME DEBUG\n');
    
    try {
        // Login
        await page.goto('http://localhost:8001/login');
        await page.fill('input[name="email"]', 'clark@clarkeverson.com');
        await page.fill('input[name="password"]', 'clark123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Check token storage
        const tokenData = await page.evaluate(() => {
            return {
                token: localStorage.getItem('access_token'),
                user: localStorage.getItem('user'),
                tokenExists: !!localStorage.getItem('access_token')
            };
        });
        
        console.log('📍 Token Data:', JSON.stringify({
            tokenExists: tokenData.tokenExists,
            tokenLength: tokenData.token ? tokenData.token.length : 0,
            userData: tokenData.user ? JSON.parse(tokenData.user) : null
        }, null, 2));
        
        // Test the /api/auth/me endpoint directly
        console.log('\n📍 Testing /api/auth/me API directly');
        
        const apiResponse = await page.evaluate(async () => {
            const token = localStorage.getItem('access_token');
            try {
                const response = await fetch('/api/auth/me', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const text = await response.text();
                return {
                    status: response.status,
                    ok: response.ok,
                    headers: Object.fromEntries(response.headers.entries()),
                    body: text,
                    bodyParsed: text ? JSON.parse(text) : null
                };
            } catch (error) {
                return {
                    error: error.message
                };
            }
        });
        
        console.log('API Response:', JSON.stringify(apiResponse, null, 2));
        
        // Now go to profile and monitor the DOMContentLoaded event
        console.log('\n📍 Testing Profile Page Loading');
        
        await page.goto('http://localhost:8001/profile');
        
        // Add debugging to page load
        await page.addInitScript(() => {
            window.profileDebug = {
                events: [],
                currentUser: null,
                apiCalls: []
            };
            
            // Track when DOMContentLoaded fires
            document.addEventListener('DOMContentLoaded', () => {
                window.profileDebug.events.push('DOMContentLoaded fired');
            });
            
            // Override fetch to track API calls
            const originalFetch = window.fetch;
            window.fetch = async function(...args) {
                if (args[0] && args[0].includes('/api/auth/me')) {
                    window.profileDebug.apiCalls.push({
                        url: args[0],
                        timestamp: new Date().toISOString()
                    });
                }
                return originalFetch.apply(this, args);
            };
        });
        
        await page.waitForTimeout(5000);
        
        const profileData = await page.evaluate(() => {
            return {
                debug: window.profileDebug,
                currentUser: window.currentUser,
                documentReady: document.readyState
            };
        });
        
        console.log('Profile Debug:', JSON.stringify(profileData, null, 2));
        
    } catch (error) {
        console.log('❌ Test error:', error.message);
    }
});
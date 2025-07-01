const { test, expect } = require('@playwright/test');

test.describe('Debug Token Verification', () => {
    test('Test token verification issue', async ({ page }) => {
        console.log('🔍 Debugging token verification issue...');
        
        // First, perform login and capture the token
        await page.goto('http://localhost:8001/login');
        await page.fill('#email', 'clark@everson.dev');
        await page.fill('#password', 'with1artie4oskar3VOCATION!advances');
        await page.click('#loginBtn');
        await page.waitForTimeout(1000);
        
        // Get the token that was saved
        const token = await page.evaluate(() => localStorage.getItem('access_token'));
        
        if (!token) {
            console.log('❌ No token was saved after login');
            return;
        }
        
        console.log(`🔑 Token captured: ${token.substring(0, 50)}...`);
        
        // Test the /api/auth/me endpoint directly
        const verificationResult = await page.evaluate(async (authToken) => {
            try {
                console.log('Testing /api/auth/me with token...');
                const response = await fetch('/api/auth/me', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const responseText = await response.text();
                console.log(`/api/auth/me response: ${response.status} ${response.statusText}`);
                console.log(`Response body: ${responseText}`);
                
                let data = null;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.log(`Failed to parse response as JSON: ${parseError.message}`);
                }
                
                return {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    responseText: responseText.substring(0, 200),
                    data: data,
                    headers: Object.fromEntries(response.headers.entries())
                };
            } catch (error) {
                console.log(`Error testing /api/auth/me: ${error.message}`);
                return {
                    error: error.message
                };
            }
        }, token);
        
        console.log('\n📊 Token verification result:');
        console.log(JSON.stringify(verificationResult, null, 2));
        
        // If verification failed, let's decode the JWT token to see what's wrong
        if (verificationResult.status !== 200) {
            console.log('\n🔬 Analyzing JWT token...');
            
            const tokenAnalysis = await page.evaluate((authToken) => {
                try {
                    // Decode JWT header and payload (not verifying signature)
                    const parts = authToken.split('.');
                    if (parts.length !== 3) {
                        return { error: 'Invalid JWT format' };
                    }
                    
                    const header = JSON.parse(atob(parts[0]));
                    const payload = JSON.parse(atob(parts[1]));
                    
                    const now = Math.floor(Date.now() / 1000);
                    const isExpired = payload.exp && payload.exp < now;
                    const isNotYetValid = payload.nbf && payload.nbf > now;
                    
                    return {
                        header: header,
                        payload: payload,
                        isExpired: isExpired,
                        isNotYetValid: isNotYetValid,
                        expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
                        notBefore: payload.nbf ? new Date(payload.nbf * 1000).toISOString() : null,
                        currentTime: new Date(now * 1000).toISOString()
                    };
                } catch (error) {
                    return { error: error.message };
                }
            }, token);
            
            console.log('   Token analysis:', JSON.stringify(tokenAnalysis, null, 2));
        }
    });
});
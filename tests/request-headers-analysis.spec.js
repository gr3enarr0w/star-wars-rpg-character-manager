const { test, expect } = require('@playwright/test');

test.describe('Request Headers Analysis', () => {
    test('Analyze browser request headers vs clean curl', async ({ page }) => {
        console.log('🔍 Analyzing request headers that might trigger different responses...');
        
        let interceptedRequest = null;
        
        // Intercept the request to examine headers
        page.on('request', request => {
            if (request.url().includes('/login')) {
                interceptedRequest = request;
                console.log('\n📨 BROWSER REQUEST HEADERS:');
                const headers = request.headers();
                Object.entries(headers).forEach(([key, value]) => {
                    console.log(`   ${key}: ${value}`);
                });
            }
        });
        
        await page.goto('http://localhost:8001/login', { 
            waitUntil: 'domcontentloaded' 
        });
        
        const content = await page.content();
        console.log(`\n📄 Browser response: ${content.length} chars`);
        
        // Test with modified User-Agent to mimic curl
        console.log('\n🔄 Testing with curl-like User-Agent...');
        
        await page.setExtraHTTPHeaders({
            'User-Agent': 'curl/7.68.0'
        });
        
        await page.goto('http://localhost:8001/login', { 
            waitUntil: 'domcontentloaded' 
        });
        
        const curlLikeContent = await page.content();
        console.log(`📄 Curl-like User-Agent response: ${curlLikeContent.length} chars`);
        
        if (content.length !== curlLikeContent.length) {
            console.log('🎯 USER-AGENT AFFECTS RESPONSE! This is the smoking gun!');
        } else {
            console.log('❌ User-Agent change didn\'t affect response');
        }
    });
    
    test('Test various User-Agent strings', async ({ page }) => {
        console.log('\n🔍 Testing different User-Agent strings...');
        
        const userAgents = [
            { name: 'Firefox', ua: 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0' },
            { name: 'Chrome', ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            { name: 'curl', ua: 'curl/7.68.0' },
            { name: 'wget', ua: 'Wget/1.20.3 (linux-gnu)' },
            { name: 'Python', ua: 'Python-urllib/3.8' },
            { name: 'Minimal', ua: 'Test' }
        ];
        
        for (const { name, ua } of userAgents) {
            console.log(`\n🌐 Testing ${name} User-Agent:`);
            
            await page.setExtraHTTPHeaders({
                'User-Agent': ua
            });
            
            try {
                await page.goto('http://localhost:8001/login', { 
                    waitUntil: 'domcontentloaded',
                    timeout: 5000
                });
                
                const content = await page.content();
                const hasProblems = content.toLowerCase().includes('passkey') || 
                                   content.toLowerCase().includes('2fa');
                
                console.log(`   Length: ${content.length} chars, Problems: ${hasProblems ? 'YES' : 'NO'}`);
                
            } catch (error) {
                console.log(`   ERROR: ${error.message}`);
            }
        }
    });
    
    test('Test request without browser-specific headers', async ({ page }) => {
        console.log('\n🔍 Testing with minimal headers (like curl)...');
        
        // Set minimal headers like curl would send
        await page.setExtraHTTPHeaders({
            'User-Agent': 'curl/7.68.0',
            'Accept': '*/*',
            'Host': 'localhost:8001'
        });
        
        // Remove browser-specific headers by using route interception
        await page.route('**/login', route => {
            const request = route.request();
            const headers = request.headers();
            
            // Keep only essential headers
            const minimalHeaders = {
                'Host': headers['host'] || 'localhost:8001',
                'User-Agent': 'curl/7.68.0',
                'Accept': '*/*'
            };
            
            route.continue({ headers: minimalHeaders });
        });
        
        await page.goto('http://localhost:8001/login', { 
            waitUntil: 'domcontentloaded' 
        });
        
        const content = await page.content();
        const hasProblems = content.toLowerCase().includes('passkey') || 
                           content.toLowerCase().includes('2fa');
        
        console.log(`📄 Minimal headers response: ${content.length} chars, Problems: ${hasProblems ? 'YES' : 'NO'}`);
    });
});
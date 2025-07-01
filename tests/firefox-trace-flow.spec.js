const { test, expect } = require('@playwright/test');

test.describe('Firefox Flow Trace', () => {
    test('01 - Trace exact navigation flow and requests', async ({ page }) => {
        console.log('🔍 TRACING: Firefox navigation flow...');
        
        // Track all navigation events
        page.on('framenavigated', frame => {
            console.log(`📍 Navigated to: ${frame.url()}`);
        });
        
        // Track all network requests
        const requests = [];
        page.on('request', request => {
            requests.push({
                url: request.url(),
                method: request.method(),
                type: request.resourceType()
            });
            console.log(`🌐 ${request.method()} ${request.url()}`);
        });
        
        // Navigate to root
        console.log('🚀 Starting navigation to http://localhost:8001');
        await page.goto('http://localhost:8001', { 
            waitUntil: 'domcontentloaded',
            timeout: 10000 
        });
        
        console.log(`📍 After goto: ${page.url()}`);
        
        // Wait for redirects to complete
        await page.waitForTimeout(1000);
        console.log(`📍 After wait: ${page.url()}`);
        
        // Wait for network to settle
        await page.waitForLoadState('networkidle');
        console.log(`📍 After networkidle: ${page.url()}`);
        
        // Get final content
        const content = await page.content();
        console.log(`📄 Final content length: ${content.length}`);
        
        // Check what files were loaded
        console.log('\\n📁 Files loaded:');
        const htmlRequests = requests.filter(r => r.type === 'document');
        htmlRequests.forEach(req => {
            console.log(`   📄 ${req.method} ${req.url}`);
        });
        
        const jsRequests = requests.filter(r => r.type === 'script');
        console.log('\\n📜 JavaScript files:');
        jsRequests.forEach(req => {
            console.log(`   🔧 ${req.url}`);
        });
        
        // Check for problematic terms
        const problematicTerms = ['passkey', '2fa', 'two-factor', 'authenticator'];
        const foundTerms = [];
        for (const term of problematicTerms) {
            const count = (content.toLowerCase().match(new RegExp(term.toLowerCase(), 'g')) || []).length;
            if (count > 0) {
                foundTerms.push(term);
            }
        }
        
        if (foundTerms.length > 0) {
            console.log(`\\n❌ Problematic terms found: ${foundTerms.join(', ')}`);
        } else {
            console.log('\\n✅ No problematic terms found');
        }
    });
});
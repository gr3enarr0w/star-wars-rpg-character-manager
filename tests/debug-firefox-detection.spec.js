const { test, expect } = require('@playwright/test');

test.describe('Debug Firefox Detection', () => {
    test('01 - Examine what Firefox sees', async ({ page }) => {
        console.log('🔍 DEBUGGING: What exactly is Firefox detecting?');
        
        await page.goto('http://localhost:8001', { waitUntil: 'networkidle' });
        
        // Get full HTML source
        const htmlSource = await page.content();
        
        // Search for specific problematic terms
        const badTerms = ['passkey', '2fa', 'two-factor', 'authenticator'];
        
        for (const term of badTerms) {
            const regex = new RegExp(term, 'gi');
            const matches = htmlSource.match(regex);
            if (matches) {
                console.log(`\n❌ Found "${term}" ${matches.length} times:`);
                
                // Get context around each match
                let index = 0;
                let searchFrom = 0;
                while ((index = htmlSource.toLowerCase().indexOf(term.toLowerCase(), searchFrom)) !== -1) {
                    const start = Math.max(0, index - 100);
                    const end = Math.min(htmlSource.length, index + 100);
                    const context = htmlSource.substring(start, end);
                    console.log(`   Context: ...${context}...`);
                    searchFrom = index + 1;
                }
            }
        }
        
        // Check for passkey buttons specifically
        const allButtons = await page.locator('button').all();
        for (let i = 0; i < allButtons.length; i++) {
            const buttonText = await allButtons[i].textContent();
            if (buttonText && buttonText.toLowerCase().includes('passkey')) {
                console.log(`❌ Found passkey button: "${buttonText}"`);
            }
        }
        
        // Check JavaScript console for errors or references
        const consoleMessages = [];
        page.on('console', msg => {
            consoleMessages.push(msg.text());
        });
        
        // Trigger any JavaScript that might load
        await page.waitForTimeout(2000);
        
        console.log('\n📝 Console Messages:');
        consoleMessages.forEach(msg => {
            if (msg.toLowerCase().includes('passkey') || 
                msg.toLowerCase().includes('2fa') || 
                msg.toLowerCase().includes('two-factor') || 
                msg.toLowerCase().includes('authenticator')) {
                console.log(`❌ Console message contains bad term: ${msg}`);
            }
        });
        
        // Check all network requests for bad terms
        const requests = [];
        page.on('request', request => {
            requests.push(request.url());
        });
        
        await page.reload();
        await page.waitForTimeout(1000);
        
        console.log('\n🌐 Network Requests:');
        requests.forEach(url => {
            if (url.toLowerCase().includes('passkey') || 
                url.toLowerCase().includes('2fa') || 
                url.toLowerCase().includes('two-factor') || 
                url.toLowerCase().includes('authenticator')) {
                console.log(`❌ Request URL contains bad term: ${url}`);
            }
        });
    });
});
const { test, expect } = require('@playwright/test');

test.describe('Multi-Browser Content Comparison', () => {
    const testScenarios = [
        { browser: 'firefox', description: 'Firefox' },
        { browser: 'chromium', description: 'Chromium' },
        { browser: 'webkit', description: 'WebKit/Safari' }
    ];

    for (const scenario of testScenarios) {
        test(`${scenario.description} - Content analysis`, async ({ browser }) => {
            console.log(`\n🔍 Testing ${scenario.description}...`);
            
            const context = await browser.newContext();
            const page = await context.newPage();
            
            // Navigate to login page
            await page.goto('http://localhost:8001/login', { 
                waitUntil: 'domcontentloaded' 
            });
            
            // Get content
            const content = await page.content();
            console.log(`📄 ${scenario.description} content length: ${content.length}`);
            
            // Check problematic terms
            const problematicTerms = ['passkey', '2fa', 'two-factor', 'authenticator'];
            let totalTerms = 0;
            
            for (const term of problematicTerms) {
                const count = (content.toLowerCase().match(new RegExp(term.toLowerCase(), 'g')) || []).length;
                if (count > 0) {
                    totalTerms += count;
                    console.log(`   Found "${term}": ${count} times`);
                }
            }
            
            console.log(`📊 ${scenario.description} total problematic terms: ${totalTerms}`);
            
            // Check input fields
            const inputs = await page.$$('input');
            console.log(`🔘 ${scenario.description} input fields: ${inputs.length}`);
            
            // Check buttons
            const buttons = await page.$$('button');
            console.log(`🔳 ${scenario.description} buttons: ${buttons.length}`);
            
            // Save content for comparison
            const fs = require('fs');
            fs.writeFileSync(`/tmp/${scenario.browser}_content.html`, content);
            
            await context.close();
        });
    }
    
    test('Compare browser contents', async () => {
        console.log('\n📋 CONTENT COMPARISON SUMMARY:');
        
        const fs = require('fs');
        const browsers = ['firefox', 'chromium', 'webkit'];
        const results = {};
        
        for (const browser of browsers) {
            try {
                const content = fs.readFileSync(`/tmp/${browser}_content.html`, 'utf8');
                results[browser] = {
                    length: content.length,
                    hasProblems: content.toLowerCase().includes('passkey') || 
                                content.toLowerCase().includes('2fa') ||
                                content.toLowerCase().includes('two-factor')
                };
            } catch (error) {
                results[browser] = { error: 'Failed to read content' };
            }
        }
        
        console.log('Browser Content Lengths:');
        for (const [browser, data] of Object.entries(results)) {
            if (data.error) {
                console.log(`   ${browser}: ${data.error}`);
            } else {
                console.log(`   ${browser}: ${data.length} chars, Problems: ${data.hasProblems ? 'YES' : 'NO'}`);
            }
        }
        
        // Check if all browsers show consistent results
        const lengths = Object.values(results).filter(r => !r.error).map(r => r.length);
        const allSame = lengths.every(len => len === lengths[0]);
        console.log(`🔍 All browsers consistent: ${allSame ? 'YES' : 'NO'}`);
        
        if (!allSame) {
            console.log('⚠️  Browsers receiving different content - suggests client-side issue');
        }
    });
});
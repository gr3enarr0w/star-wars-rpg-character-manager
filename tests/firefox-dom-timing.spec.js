const { test, expect } = require('@playwright/test');
const fs = require('fs');

test.describe('Firefox DOM Timing', () => {
    test('01 - Compare initial HTML vs final DOM to detect dynamic changes', async ({ page }) => {
        console.log('⏱️ Checking for dynamic DOM modifications...');
        
        // Navigate and immediately capture HTML before JavaScript executes
        await page.goto('http://localhost:8001', { waitUntil: 'domcontentloaded' });
        
        const initialHTML = await page.content();
        console.log(`📄 Initial HTML length: ${initialHTML.length}`);
        
        // Count problematic terms in initial HTML
        const problematicTerms = ['passkey', '2fa', 'two-factor', 'authenticator'];
        let initialProblems = 0;
        for (const term of problematicTerms) {
            const count = (initialHTML.toLowerCase().match(new RegExp(term.toLowerCase(), 'g')) || []).length;
            if (count > 0) {
                initialProblems++;
                console.log(`❌ Initial HTML has "${term}": ${count} times`);
            }
        }
        
        // Wait for all network requests and JavaScript to complete
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const finalHTML = await page.content();
        console.log(`📄 Final HTML length: ${finalHTML.length}`);
        
        // Count problematic terms in final HTML
        let finalProblems = 0;
        for (const term of problematicTerms) {
            const count = (finalHTML.toLowerCase().match(new RegExp(term.toLowerCase(), 'g')) || []).length;
            if (count > 0) {
                finalProblems++;
                console.log(`❌ Final HTML has "${term}": ${count} times`);
            }
        }
        
        console.log(`🔄 Analysis:`);
        console.log(`   Initial problems: ${initialProblems}`);
        console.log(`   Final problems: ${finalProblems}`);
        console.log(`   Length change: ${finalHTML.length - initialHTML.length} characters`);
        
        if (initialHTML.length === finalHTML.length) {
            console.log('✅ No dynamic DOM changes detected');
        } else {
            console.log('❌ DOM was modified after initial load');
        }
        
        // Save both versions for comparison
        fs.writeFileSync('/tmp/firefox_initial.html', initialHTML);
        fs.writeFileSync('/tmp/firefox_final.html', finalHTML);
        console.log('💾 Saved initial and final HTML for comparison');
    });
});
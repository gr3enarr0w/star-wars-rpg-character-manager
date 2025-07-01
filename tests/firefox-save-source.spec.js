const { test, expect } = require('@playwright/test');
const fs = require('fs');

test.describe('Firefox Save Source', () => {
    test('01 - Save the actual HTML source that Firefox receives', async ({ page }) => {
        console.log('💾 Saving Firefox page source...');
        
        await page.goto('http://localhost:8001', { waitUntil: 'networkidle' });
        
        const content = await page.content();
        console.log(`📄 Page content length: ${content.length}`);
        
        // Save the content to a file
        fs.writeFileSync('/tmp/firefox_actual_source.html', content);
        console.log('💾 Source saved to /tmp/firefox_actual_source.html');
        
        // Count problematic terms
        const problematicTerms = ['passkey', '2fa', 'two-factor', 'authenticator'];
        for (const term of problematicTerms) {
            const count = (content.toLowerCase().match(new RegExp(term.toLowerCase(), 'g')) || []).length;
            if (count > 0) {
                console.log(`❌ Found "${term}" ${count} times`);
            }
        }
        
        // Show a snippet around first passkey occurrence
        const passkeyIndex = content.toLowerCase().indexOf('passkey');
        if (passkeyIndex >= 0) {
            const start = Math.max(0, passkeyIndex - 100);
            const end = Math.min(content.length, passkeyIndex + 100);
            const snippet = content.substring(start, end);
            console.log(`📝 First passkey context: ...${snippet}...`);
        }
    });
});
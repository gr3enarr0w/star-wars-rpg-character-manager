const { test, expect } = require('@playwright/test');

test.describe('Debug Flask Route', () => {
    test('Directly test login route serving', async ({ page }) => {
        console.log('🔍 DEBUGGING: Flask route serving...');
        
        // Navigate directly to login (not through redirect)
        await page.goto('http://localhost:8001/login', { 
            waitUntil: 'domcontentloaded' 
        });
        
        // Get content immediately
        const content = await page.content();
        console.log(`📄 Direct /login content length: ${content.length}`);
        
        // Check problematic terms
        const problematicTerms = ['passkey', '2fa', 'two-factor', 'authenticator'];
        let foundTerms = 0;
        
        for (const term of problematicTerms) {
            const count = (content.toLowerCase().match(new RegExp(term.toLowerCase(), 'g')) || []).length;
            if (count > 0) {
                foundTerms += count;
                console.log(`   Found "${term}": ${count} times`);
            }
        }
        
        console.log(`Total problematic terms: ${foundTerms}`);
        
        // Check what inputs are present
        const inputs = await page.$$('input');
        console.log(`Total input fields: ${inputs.length}`);
        
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const type = await input.getAttribute('type') || 'text';
            const id = await input.getAttribute('id') || 'no-id';
            const name = await input.getAttribute('name') || 'no-name';
            console.log(`   Input ${i + 1}: type="${type}" id="${id}" name="${name}"`);
        }
        
        // Check for buttons
        const buttons = await page.$$('button');
        console.log(`Total buttons: ${buttons.length}`);
        
        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            const text = await button.textContent() || '';
            const id = await button.getAttribute('id') || 'no-id';
            console.log(`   Button ${i + 1}: id="${id}" text="${text.trim()}"`);
        }
        
        // Check for script tags
        const scripts = await page.$$('script[src]');
        console.log(`Script tags with src: ${scripts.length}`);
        
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i];
            const src = await script.getAttribute('src') || '';
            console.log(`   Script ${i + 1}: src="${src}"`);
        }
        
        // Save content for analysis
        const fs = require('fs');
        fs.writeFileSync('/tmp/debug_direct_login.html', content);
        console.log('📁 Content saved to /tmp/debug_direct_login.html');
    });
});
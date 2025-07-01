const { test, expect } = require('@playwright/test');

test.describe('Firefox Force Refresh', () => {
    test('01 - Clear cache and force reload to see fresh content', async ({ page, context }) => {
        console.log('🔄 FORCE REFRESH: Clearing cache and reloading...');
        
        // Clear all browser data
        await context.clearCookies();
        await context.clearPermissions();
        
        // Navigate with cache disabled
        await page.goto('http://localhost:8001', { 
            waitUntil: 'networkidle',
            timeout: 10000
        });
        
        console.log(`📍 URL after navigation: ${page.url()}`);
        
        // Force a hard refresh
        await page.reload({ waitUntil: 'networkidle' });
        console.log(`📍 URL after reload: ${page.url()}`);
        
        // Get fresh content
        const pageContent = await page.content();
        console.log(`📄 Page content length: ${pageContent.length}`);
        
        // Check for problematic terms
        const problematicTerms = ['passkey', '2fa', 'two-factor', 'authenticator'];
        const foundTerms = [];
        
        for (const term of problematicTerms) {
            const count = (pageContent.toLowerCase().match(new RegExp(term.toLowerCase(), 'g')) || []).length;
            if (count > 0) {
                foundTerms.push(`${term}(${count})`);
                console.log(`❌ Found "${term}" ${count} times`);
            }
        }
        
        if (foundTerms.length === 0) {
            console.log('✅ NO problematic terms found after cache clear!');
        } else {
            console.log(`❌ Still found: ${foundTerms.join(', ')}`);
        }
        
        // Check for external scripts
        const scripts = await page.locator('script[src]').all();
        console.log(`📜 External scripts: ${scripts.length}`);
        for (let script of scripts) {
            const src = await script.getAttribute('src');
            console.log(`   Script: ${src}`);
        }
    });
});
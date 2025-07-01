const { test, expect } = require('@playwright/test');

test.describe('Debug Container Content', () => {
    test('Compare curl vs browser content', async ({ page }) => {
        console.log('🔍 DEBUGGING: Container content serving...');
        
        // Get content via curl first
        const { exec } = require('child_process');
        const curlPromise = new Promise((resolve) => {
            exec('docker-compose exec web curl -s "http://localhost:8001/login"', (error, stdout) => {
                resolve(stdout);
            });
        });
        
        const curlContent = await curlPromise;
        console.log(`📄 CURL Content length: ${curlContent.length}`);
        
        // Navigate with browser
        await page.goto('http://localhost:8001/login', { 
            waitUntil: 'domcontentloaded' 
        });
        
        // Get initial content before JavaScript runs
        const initialContent = await page.content();
        console.log(`📄 INITIAL Browser content length: ${initialContent.length}`);
        
        // Wait for JavaScript to finish
        await page.waitForTimeout(2000);
        
        // Get final content after JavaScript
        const finalContent = await page.content();
        console.log(`📄 FINAL Browser content length: ${finalContent.length}`);
        
        // Check if content changed
        if (initialContent.length !== finalContent.length) {
            console.log('🔄 CONTENT CHANGED by JavaScript!');
            console.log(`   Initial: ${initialContent.length} chars`);
            console.log(`   Final: ${finalContent.length} chars`);
        }
        
        // Save both contents for comparison
        const fs = require('fs');
        fs.writeFileSync('/tmp/curl_content.html', curlContent);
        fs.writeFileSync('/tmp/browser_initial_content.html', initialContent);
        fs.writeFileSync('/tmp/browser_final_content.html', finalContent);
        
        console.log('📁 Content saved to /tmp/ for comparison');
        
        // Check for problematic terms in each
        const problematicTerms = ['passkey', '2fa', 'two-factor', 'authenticator'];
        
        console.log('\n🔍 Problematic terms analysis:');
        
        for (const term of problematicTerms) {
            const curlCount = (curlContent.toLowerCase().match(new RegExp(term.toLowerCase(), 'g')) || []).length;
            const initialCount = (initialContent.toLowerCase().match(new RegExp(term.toLowerCase(), 'g')) || []).length;
            const finalCount = (finalContent.toLowerCase().match(new RegExp(term.toLowerCase(), 'g')) || []).length;
            
            if (curlCount > 0 || initialCount > 0 || finalCount > 0) {
                console.log(`   ${term}: curl=${curlCount}, initial=${initialCount}, final=${finalCount}`);
            }
        }
    });
});
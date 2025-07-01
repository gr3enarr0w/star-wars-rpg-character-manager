const { test, expect } = require('@playwright/test');

test.describe('Firefox URL Debug', () => {
    test('01 - Show exactly what URL Firefox accesses and what it contains', async ({ page }) => {
        console.log('🔍 DEBUG: Starting Firefox URL investigation...');
        
        // Navigate to localhost:8001
        console.log('📍 Navigating to: http://localhost:8001');
        await page.goto('http://localhost:8001', { waitUntil: 'networkidle' });
        
        // Show current URL
        const currentURL = page.url();
        console.log(`📍 Current URL: ${currentURL}`);
        
        // Get page title
        const pageTitle = await page.title();
        console.log(`📄 Page title: ${pageTitle}`);
        
        // Check for login form vs dashboard
        const hasLoginForm = await page.locator('#loginForm').isVisible().catch(() => false);
        const hasCharactersGrid = await page.locator('#charactersGrid').isVisible().catch(() => false);
        const hasH1Login = await page.locator('h1:has-text("Login")').isVisible().catch(() => false);
        
        console.log(`🔍 Page analysis:`);
        console.log(`   Has login form: ${hasLoginForm}`);
        console.log(`   Has characters grid: ${hasCharactersGrid}`);
        console.log(`   Has "Login" h1: ${hasH1Login}`);
        
        // Get all H1 elements
        const h1Elements = await page.locator('h1').all();
        console.log(`📝 H1 elements found: ${h1Elements.length}`);
        for (let i = 0; i < h1Elements.length; i++) {
            const text = await h1Elements[i].textContent();
            console.log(`   H1 ${i + 1}: "${text}"`);
        }
        
        // Check for problematic terms in specific areas
        const pageContent = await page.content();
        const problematicTerms = ['passkey', '2fa', 'two-factor', 'authenticator'];
        
        for (const term of problematicTerms) {
            const count = (pageContent.toLowerCase().match(new RegExp(term.toLowerCase(), 'g')) || []).length;
            if (count > 0) {
                console.log(`❌ Found "${term}" ${count} times in page content`);
            }
        }
        
        // Check what JavaScript files are loaded
        const scripts = await page.locator('script[src]').all();
        console.log(`📜 External scripts loaded: ${scripts.length}`);
        for (let i = 0; i < scripts.length; i++) {
            const src = await scripts[i].getAttribute('src');
            console.log(`   Script ${i + 1}: ${src}`);
            if (src && src.toLowerCase().includes('passkey')) {
                console.log(`❌ Problematic script: ${src}`);
            }
        }
        
        // Wait for any dynamic content
        await page.waitForTimeout(2000);
        
        // Show final URL (in case of redirects)
        const finalURL = page.url();
        console.log(`📍 Final URL: ${finalURL}`);
    });
});
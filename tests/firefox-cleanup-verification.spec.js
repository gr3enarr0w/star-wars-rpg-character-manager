const { test, expect } = require('@playwright/test');

test.describe('Firefox 2FA/Passkey Cleanup Verification', () => {
    test('01 - Verify complete elimination of 2FA/Passkey references', async ({ page }) => {
        console.log('🔍 FINAL FIREFOX VERIFICATION: Scanning for 2FA/Passkey references...');
        
        await page.goto('http://localhost:8001', { waitUntil: 'networkidle' });
        
        // Get the complete page content
        const pageContent = await page.content();
        console.log('📄 Page content length:', pageContent.length);
        
        // Check for bad terms
        const badTerms = ['passkey', '2fa', 'two-factor', 'webauthn', 'authenticator', 'totp'];
        const foundTerms = [];
        
        for (const term of badTerms) {
            if (pageContent.toLowerCase().includes(term.toLowerCase())) {
                foundTerms.push(term);
                console.log(`❌ Found term: ${term}`);
            }
        }
        
        // Check for passkey buttons
        const passkeyButtons = await page.locator('button:has-text("passkey")').count();
        const passkeyButtonsCase = await page.locator('button:has-text("Passkey")').count();
        const totalPasskeyButtons = passkeyButtons + passkeyButtonsCase;
        
        // Check for 2FA input fields
        const tfaInputs = await page.locator('input[placeholder*="2FA"], input[placeholder*="two-factor"], input[name*="2fa"], input[id*="2fa"]').count();
        
        // Check for passkey links
        const passkeyLinks = await page.locator('a:has-text("passkey"), a:has-text("Passkey")').count();
        
        console.log('📊 FINAL SCAN RESULTS:');
        console.log(`   Problematic terms found: ${foundTerms.length}`);
        console.log(`   Passkey buttons: ${totalPasskeyButtons}`);
        console.log(`   2FA input fields: ${tfaInputs}`);
        console.log(`   Passkey links: ${passkeyLinks}`);
        
        if (foundTerms.length > 0) {
            console.log(`❌ Found problematic terms: ${foundTerms.join(', ')}`);
        }
        if (totalPasskeyButtons > 0) {
            console.log('❌ Found passkey button(s)');
        }
        if (tfaInputs > 0) {
            console.log('❌ Found 2FA input field(s)');
        }
        if (passkeyLinks > 0) {
            console.log('❌ Found passkey link(s)');
        }
        
        // The test passes only if ALL references are eliminated
        const isClean = foundTerms.length === 0 && totalPasskeyButtons === 0 && tfaInputs === 0 && passkeyLinks === 0;
        
        if (isClean) {
            console.log('✅ SUCCESS: Firefox detects NO 2FA/passkey references!');
        } else {
            console.log('❌ FAILURE: Firefox still detects 2FA/passkey references');
        }
        
        expect(foundTerms.length).toBe(0);
        expect(totalPasskeyButtons).toBe(0);
        expect(tfaInputs).toBe(0);
        expect(passkeyLinks).toBe(0);
    });
    
    test('02 - Test basic application functionality', async ({ page }) => {
        console.log('🚀 Testing basic application functionality...');
        
        await page.goto('http://localhost:8001');
        
        // Check that the application loads properly
        await expect(page.locator('h1')).toContainText('Star Wars RPG');
        
        // Check that login form is present and functional
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.locator('button:has-text("Login")')).toBeVisible();
        
        console.log('✅ Basic application functionality working');
    });
});
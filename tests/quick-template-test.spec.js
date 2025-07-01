// Quick Template Test - Check exact URLs
const { test, expect } = require('@playwright/test');

test('Quick Template Test', async ({ page }) => {
    console.log('\n⚡ QUICK TEMPLATE TEST\n');
    
    try {
        // Login
        await page.goto('http://localhost:8001/login');
        await page.fill('input[name="email"]', 'clark@clarkeverson.com');
        await page.fill('input[name="password"]', 'clark123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Test exact URLs
        const urls = [
            'http://localhost:8001/create-character',
            'http://localhost:8001/create',
        ];
        
        for (const url of urls) {
            console.log(`\n🔍 Testing: ${url}`);
            await page.goto(url);
            await page.waitForTimeout(2000);
            
            const h1s = await page.locator('h1').allTextContents();
            const pageText = await page.locator('body').textContent();
            
            console.log(`H1s: ${JSON.stringify(h1s)}`);
            console.log(`Has "ENHANCED XP TEMPLATE": ${pageText.includes('ENHANCED XP TEMPLATE')}`);
            console.log(`Has "template" (any case): ${pageText.toLowerCase().includes('template')}`);
            
            if (pageText.includes('ENHANCED XP TEMPLATE')) {
                console.log('❌ STILL HAS TEMPLATE TEXT');
            } else {
                console.log('✅ TEMPLATE TEXT REMOVED');
            }
        }
        
    } catch (error) {
        console.log('❌ Quick test error:', error.message);
    }
});
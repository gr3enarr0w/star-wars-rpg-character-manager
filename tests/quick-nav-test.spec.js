// Quick test to check navigation cleanup
const { test, expect } = require('@playwright/test');

test('Quick Navigation Test', async ({ page }) => {
    try {
        // Login
        await page.goto('http://localhost:8001/login');
        await page.fill('input[name="email"]', 'clark@clarkeverson.com');
        await page.fill('input[name="password"]', 'clark123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Check main navigation
        const navLinks = await page.locator('.main-nav-links a').allTextContents();
        const hasDocumentation = navLinks.some(link => link.includes('Documentation'));
        
        console.log('Main Navigation Links:', navLinks.join(', '));
        console.log('Documentation Removed:', !hasDocumentation ? 'YES' : 'NO');
        
        // Check character creation page
        await page.goto('http://localhost:8001/create-character');
        await page.waitForTimeout(2000);
        
        const docButtons = await page.locator('text=/View Documentation/i').count();
        console.log('Documentation buttons in character creation:', docButtons);
        
        console.log(docButtons === 0 ? '✅ ALL DOCUMENTATION LINKS REMOVED' : '❌ DOCUMENTATION LINKS STILL EXIST');
        
    } catch (error) {
        console.log('Error:', error.message);
    }
});
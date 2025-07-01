const { test, expect } = require('@playwright/test');

test('Simple screenshot test to debug UI issues', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Go to login page
    await page.goto('http://localhost:8001');
    await page.screenshot({ path: 'screenshots/debug-01-login.png', fullPage: true });
    
    // Login
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Take screenshot of dashboard and count buttons
    await page.screenshot({ path: 'screenshots/debug-02-dashboard.png', fullPage: true });
    
    // Count Create Character buttons
    const createCharacterButtons = await page.locator('text="Create Character"').count();
    console.log(`Found ${createCharacterButtons} "Create Character" buttons`);
    
    // Try to navigate using different selectors
    console.log('Looking for Create Character links...');
    const createLinks = await page.locator('a:has-text("Create Character")').count();
    console.log(`Found ${createLinks} Create Character links`);
    
    const createButtons = await page.locator('button:has-text("Create Character")').count();
    console.log(`Found ${createButtons} Create Character buttons`);
    
    // Try clicking the yellow button in top right if it exists
    const topButton = page.locator('.btn:has-text("Create Character")').first();
    if (await topButton.isVisible()) {
        console.log('Found top button, clicking it...');
        await topButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/debug-03-after-top-button-click.png', fullPage: true });
    }
});
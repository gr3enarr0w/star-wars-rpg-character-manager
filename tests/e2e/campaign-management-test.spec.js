const { test, expect } = require('@playwright/test');

test('Test campaign management popup vs page issue', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Login
    await page.goto('http://localhost:8001');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Go to campaigns page
    await page.goto('http://localhost:8001/campaigns');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/campaign-mgmt-01-campaigns-page.png', fullPage: true });
    
    // Look for management buttons
    const manageButtons = [
        'Manage Players',
        'Session Tracker', 
        'Edit Campaign',
        'Generate Invite'
    ];
    
    for (const buttonText of manageButtons) {
        const button = page.locator(`button:has-text("${buttonText}")`, `a:has-text("${buttonText}")`).first();
        if (await button.isVisible()) {
            console.log(`🔄 Testing ${buttonText} button...`);
            
            await button.click();
            await page.waitForTimeout(2000);
            
            const currentUrl = page.url();
            console.log(`${buttonText} URL:`, currentUrl);
            
            await page.screenshot({ path: `screenshots/campaign-mgmt-${buttonText.replace(/\s+/g, '-').toLowerCase()}.png`, fullPage: true });
            
            // Check for modal indicators
            const modal = page.locator('.modal, .popup, .overlay, [role="dialog"]');
            const modalVisible = await modal.isVisible().catch(() => false);
            console.log(`${buttonText} shows as modal:`, modalVisible);
            
            // Go back to campaigns page for next test
            await page.goto('http://localhost:8001/campaigns');
            await page.waitForTimeout(1000);
            break; // Test just one button for now
        }
    }
});
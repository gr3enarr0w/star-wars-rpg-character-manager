const { test, expect } = require('@playwright/test');

test('Debug console logs to understand dashboard issue', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Capture all console logs
    const consoleLogs = [];
    page.on('console', msg => {
        consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Go to login page
    await page.goto('http://localhost:8001');
    
    // Login
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000); // Wait for everything to load
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/debug-console-dashboard.png', fullPage: true });
    
    // Check page source for create character buttons
    const pageContent = await page.content();
    const createCharacterMatches = pageContent.match(/Create Character/g);
    console.log('Create Character text found in page source:', createCharacterMatches ? createCharacterMatches.length : 0);
    
    // Print all console logs
    console.log('\n=== CONSOLE LOGS ===');
    consoleLogs.forEach(log => console.log(log));
    
    // Check element visibility
    const charactersGrid = page.locator('#charactersGrid');
    const emptyState = page.locator('#emptyState');
    const loadingState = page.locator('#loadingState');
    
    console.log('\n=== ELEMENT STATES ===');
    console.log('charactersGrid visible:', await charactersGrid.isVisible());
    console.log('emptyState visible:', await emptyState.isVisible());
    console.log('loadingState visible:', await loadingState.isVisible());
    
    // Check if grid has content
    const gridContent = await charactersGrid.innerHTML();
    console.log('charactersGrid content length:', gridContent.length);
    console.log('charactersGrid content preview:', gridContent.substring(0, 200) + '...');
});
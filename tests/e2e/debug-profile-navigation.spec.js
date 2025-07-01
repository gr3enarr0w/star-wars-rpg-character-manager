const { test, expect } = require('@playwright/test');

test('Debug profile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Login
    await page.goto('http://localhost:8001');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('Current URL after login:', page.url());
    
    // Check the Settings menu HTML
    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(500);
    
    // Take screenshot of dropdown
    await page.screenshot({ path: 'screenshots/debug-01-dropdown.png' });
    
    // Get the Profile Settings link HTML
    const profileLink = await page.locator('a:has-text("Profile Settings")');
    const linkHref = await profileLink.getAttribute('href');
    console.log('Profile link href:', linkHref);
    
    // Check for any event listeners on the link
    const linkElement = await profileLink.elementHandle();
    const hasClickListener = await page.evaluate(el => {
        const events = getEventListeners ? getEventListeners(el) : {};
        return Object.keys(events);
    }, linkElement);
    console.log('Event listeners on link:', hasClickListener);
    
    // Click the link and see what happens
    console.log('Clicking Profile Settings link...');
    await page.click('a:has-text("Profile Settings")');
    await page.waitForTimeout(2000);
    
    console.log('URL after clicking:', page.url());
    
    // Take screenshot of result
    await page.screenshot({ path: 'screenshots/debug-02-after-click.png' });
    
    // Check if any modals exist
    const modals = await page.locator('.modal-overlay').count();
    console.log('Number of modals found:', modals);
    
    // Check the HTML of what's visible
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('Body contains "Account Settings":', bodyHTML.includes('Account Settings'));
    console.log('Body contains "Profile Settings":', bodyHTML.includes('Profile Settings'));
});
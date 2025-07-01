const { test, expect } = require('@playwright/test');

test('Debug profile modal issue', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    // Login
    await page.goto('http://localhost:8001');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('Current URL after login:', page.url());
    
    // Click Settings menu
    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(500);
    
    // Get the Profile Settings link and check for event listeners
    console.log('Checking Profile Settings link...');
    
    // Check the HTML source before clicking
    const linkHTML = await page.locator('a:has-text("Profile Settings")').innerHTML();
    const linkHref = await page.locator('a:has-text("Profile Settings")').getAttribute('href');
    console.log('Profile link HTML:', linkHTML);
    console.log('Profile link href:', linkHref);
    
    // Check all script tags for profile-related code
    const scripts = await page.locator('script').allTextContents();
    let foundProfileCode = false;
    scripts.forEach((script, index) => {
        if (script.includes('profile') || script.includes('Profile') || script.includes('Account Settings')) {
            console.log(`Script ${index} contains profile code:`, script.substring(0, 200) + '...');
            foundProfileCode = true;
        }
    });
    
    if (!foundProfileCode) {
        console.log('No profile-related JavaScript found in current page scripts');
    }
    
    // Check for any click event listeners
    const hasClickHandler = await page.evaluate(() => {
        const link = document.querySelector('a[href="/profile"]');
        if (link) {
            const events = getEventListeners ? getEventListeners(link) : 'getEventListeners not available';
            return events;
        }
        return 'Link not found';
    });
    console.log('Event listeners on profile link:', hasClickHandler);
    
    // Click and see what actually happens  
    console.log('Clicking Profile Settings...');
    await page.click('a:has-text("Profile Settings")');
    await page.waitForTimeout(2000);
    
    console.log('URL after clicking profile:', page.url());
    
    // Check what's actually on the page
    const pageContent = await page.content();
    const hasModal = pageContent.includes('Account Settings');
    const hasProfileModal = pageContent.includes('modal-overlay');
    
    console.log('Page contains "Account Settings":', hasModal);
    console.log('Page contains modal overlay:', hasProfileModal);
    
    if (hasModal) {
        console.log('FOUND: Modal is being generated dynamically or served from cache');
    }
    
    await page.screenshot({ path: 'screenshots/debug-profile-modal-investigation.png', fullPage: true });
});
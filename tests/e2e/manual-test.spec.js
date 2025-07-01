const { test, expect } = require('@playwright/test');

test('Manual test both fixes', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    console.log('🔧 MANUAL TEST OF UI FIXES');
    
    // Login
    await page.goto('http://localhost:8001');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForTimeout(5000);
    console.log('Current URL after login:', page.url());
    await page.screenshot({ path: 'screenshots/manual-after-login.png', fullPage: true });
    
    // Check if we're on dashboard
    const dashboardTitle = await page.locator('h1').textContent();
    console.log('Dashboard title:', dashboardTitle);
    
    // Check for Create Character link in nav
    const createCharNav = await page.locator('a:has-text("Create Character")').count();
    console.log('Create Character nav links:', createCharNav);
    
    if (createCharNav > 0) {
        console.log('Clicking Create Character from navigation...');
        await page.click('a:has-text("Create Character")');
        await page.waitForTimeout(3000);
        
        console.log('Current URL after clicking create character:', page.url());
        await page.screenshot({ path: 'screenshots/manual-char-creation.png', fullPage: true });
        
        // Check what we got
        const pageTitle = await page.locator('h1').textContent();
        console.log('Character creation page title:', pageTitle);
        
        const sidebar = await page.locator('.sidebar').count();
        console.log('Sidebar count on character creation:', sidebar);
    }
    
    // Test profile settings
    console.log('\n⚙️ TESTING PROFILE SETTINGS');
    
    // Try direct navigation
    await page.goto('http://localhost:8001/profile');
    await page.waitForTimeout(3000);
    
    console.log('Current URL after profile navigation:', page.url());
    await page.screenshot({ path: 'screenshots/manual-profile.png', fullPage: true });
    
    const profileTitle = await page.locator('h1').textContent();
    console.log('Profile page title:', profileTitle);
    
    const profileSidebar = await page.locator('.sidebar').count();
    console.log('Profile sidebar count:', profileSidebar);
});
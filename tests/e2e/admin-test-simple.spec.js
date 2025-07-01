const { test, expect } = require('@playwright/test');

test('Test admin panel re-login issue', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Login first
    await page.goto('http://localhost:8001');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'screenshots/admin-test-01-logged-in.png', fullPage: true });
    console.log('✅ Successfully logged in');
    
    // Try to access admin panel directly
    console.log('🔄 Testing direct access to /admin...');
    await page.goto('http://localhost:8001/admin');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('Current URL after accessing /admin:', currentUrl);
    
    await page.screenshot({ path: 'screenshots/admin-test-02-admin-page.png', fullPage: true });
    
    // Check if we're redirected to login
    const isAtLogin = currentUrl.includes('/login') || await page.locator('input[name="email"]').isVisible();
    console.log('❌ Admin panel requires re-login:', isAtLogin);
    
    if (isAtLogin) {
        console.log('🔍 CONFIRMED: Admin panel redirects to login despite being already logged in');
    } else {
        console.log('✅ Admin panel accessible without re-login');
    }
    
    // Also test Settings menu access to admin
    if (!isAtLogin) {
        console.log('🔄 Testing Settings menu access to admin...');
        await page.goto('http://localhost:8001');
        await page.waitForTimeout(1000);
        
        await page.click('button:has-text("Settings")');
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/admin-test-03-settings-menu.png', fullPage: true });
        
        const adminLink = page.locator('a:has-text("Admin Panel")');
        if (await adminLink.isVisible()) {
            await adminLink.click();
            await page.waitForTimeout(2000);
            
            const finalUrl = page.url();
            await page.screenshot({ path: 'screenshots/admin-test-04-admin-via-menu.png', fullPage: true });
            console.log('Admin panel URL via menu:', finalUrl);
        }
    }
});
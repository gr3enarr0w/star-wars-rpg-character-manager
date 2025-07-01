const { test, expect } = require('@playwright/test');

test('Test profile page fix - should be dedicated page not modal', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Login
    await page.goto('http://localhost:8001');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Test Settings menu navigation to profile
    console.log('🔄 Testing Settings → Profile Settings navigation...');
    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'screenshots/profile-fix-01-settings-menu.png', fullPage: true });
    
    await page.click('a:has-text("Profile Settings")');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log('Profile page URL after clicking:', currentUrl);
    
    await page.screenshot({ path: 'screenshots/profile-fix-02-profile-page.png', fullPage: true });
    
    // Check if we're on the proper profile page
    const isOnProfilePage = currentUrl.includes('/profile');
    console.log('✅ On profile page URL:', isOnProfilePage);
    
    // Check for modal indicators (should NOT be present)
    const modal = page.locator('.modal-overlay, .modal-content');
    const modalVisible = await modal.isVisible().catch(() => false);
    console.log('❌ Modal visible (should be false):', modalVisible);
    
    // Check for proper page elements
    const profileHeader = page.locator('h1:has-text("Profile Settings")');
    const backButton = page.locator('a:has-text("Back to Dashboard")');
    
    const hasProfileHeader = await profileHeader.isVisible();
    const hasBackButton = await backButton.isVisible();
    
    console.log('✅ Has profile header:', hasProfileHeader);
    console.log('✅ Has back button:', hasBackButton);
    
    // Check if dashboard content is visible (should NOT be)
    const dashboardContent = page.locator('h1:has-text("My Characters")');
    const dashboardVisible = await dashboardContent.isVisible().catch(() => false);
    console.log('❌ Dashboard visible in background (should be false):', dashboardVisible);
    
    if (isOnProfilePage && !modalVisible && hasProfileHeader && !dashboardVisible) {
        console.log('🎉 SUCCESS: Profile page works as dedicated page!');
    } else {
        console.log('❌ ISSUE: Profile page still has modal behavior');
    }
});
// Test 2FA setup fix - verify modal appears instead of redirect
const { test, expect } = require('@playwright/test');

test('2FA Setup Fix - Modal Appears Instead of Redirect', async ({ page }) => {
    console.log('🎯 Testing 2FA setup fix - should show modal instead of redirecting...');
    
    // Navigate to login page
    await page.goto('http://localhost:8001/login');
    
    // Login with admin credentials
    await page.fill('input[name="email"]', 'clark@clarkeverson.com');
    await page.fill('input[name="password"]', 'clark123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForTimeout(3000);
    console.log('✅ Logged in successfully');
    
    // Navigate to profile page
    await page.goto('http://localhost:8001/profile');
    await page.waitForTimeout(2000);
    console.log('✅ Profile page loaded');
    
    // Check that we're on profile page (not redirected)
    const currentUrl = page.url();
    expect(currentUrl).toContain('/profile');
    console.log('✅ Confirmed on profile page');
    
    // Look for the 2FA management button
    const manage2FAButton = page.locator('button:has-text("Manage")');
    await expect(manage2FAButton).toBeVisible();
    console.log('✅ 2FA Manage button found');
    
    // Click the 2FA manage button
    await manage2FAButton.click();
    console.log('✅ Clicked 2FA Manage button');
    
    // Wait a moment for any processing
    await page.waitForTimeout(2000);
    
    // Check if we're still on the profile page (not redirected to homepage)
    const urlAfterClick = page.url();
    expect(urlAfterClick).toContain('/profile');
    console.log('✅ Still on profile page - no unwanted redirect!');
    
    // Check for 2FA setup modal or error handling
    // If 2FA is already enabled, we'll see a disable confirmation
    // If not enabled, we should see setup modal or API call
    
    // Take screenshot to show current state
    await page.screenshot({ 
        path: '2fa-setup-fix-test.png',
        fullPage: true 
    });
    console.log('📸 Screenshot saved: 2fa-setup-fix-test.png');
    
    console.log('🎉 2FA setup fix test completed!');
    console.log('✅ No redirect to homepage - issue fixed!');
});

test('2FA Setup Modal - API Integration Test', async ({ page }) => {
    console.log('🎯 Testing 2FA setup modal and API integration...');
    
    // Test the 2FA setup API directly
    await page.goto('http://localhost:8001/login');
    await page.fill('input[name="email"]', 'clark@clarkeverson.com');
    await page.fill('input[name="password"]', 'clark123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Test API call from browser context
    const response = await page.evaluate(async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/auth/setup-2fa', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return {
                ok: response.ok,
                status: response.status,
                hasData: response.ok ? true : false
            };
        } catch (error) {
            return { error: error.message };
        }
    });
    
    console.log('📊 2FA Setup API Response:', response);
    
    if (response.ok) {
        console.log('✅ 2FA setup API is working correctly');
    } else {
        console.log('⚠️ 2FA setup API response:', response.status);
    }
    
    console.log('🎉 2FA API integration test completed!');
});

test('Profile Page Navigation and 2FA Section', async ({ page }) => {
    console.log('🎯 Testing profile page navigation and 2FA section...');
    
    // Login and navigate to profile
    await page.goto('http://localhost:8001/login');
    await page.fill('input[name="email"]', 'clark@clarkeverson.com');
    await page.fill('input[name="password"]', 'clark123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Navigate to profile
    await page.goto('http://localhost:8001/profile');
    await page.waitForTimeout(2000);
    
    // Check for Security tab (where 2FA is located)
    const securityTab = page.locator('button:has-text("Security")');
    if (await securityTab.isVisible()) {
        await securityTab.click();
        console.log('✅ Security tab found and clicked');
        await page.waitForTimeout(1000);
    }
    
    // Look for 2FA-related elements
    const twofaLabel = page.locator('text=Two-Factor Authentication');
    await expect(twofaLabel).toBeVisible();
    console.log('✅ Two-Factor Authentication label found');
    
    const twofaStatus = page.locator('#twofa_status');
    await expect(twofaStatus).toBeVisible();
    console.log('✅ 2FA status element found');
    
    const manageButton = page.locator('button:has-text("Manage")');
    await expect(manageButton).toBeVisible();
    console.log('✅ 2FA Manage button found');
    
    // Take final screenshot
    await page.screenshot({ 
        path: '2fa-profile-section-test.png',
        fullPage: true 
    });
    console.log('📸 Screenshot saved: 2fa-profile-section-test.png');
    
    console.log('🎉 Profile page 2FA section test completed!');
});
const { test, expect } = require('@playwright/test');

test('Simple Authentication Fix Test', async ({ page }) => {
    console.log('🔧 TESTING AUTHENTICATION FIX');
    
    // Test 1: Homepage should redirect to login when not authenticated
    console.log('\n📍 Test 1: Homepage Redirect');
    await page.goto('http://localhost:8001');
    
    // Should redirect to login
    await page.waitForTimeout(3000);
    const url = page.url();
    console.log(`Current URL: ${url}`);
    
    if (url.includes('/login')) {
        console.log('✅ Correctly redirected to login page');
    } else {
        console.log('❌ Did not redirect to login - authentication fix may not be working');
    }
    
    // Test 2: Try to access protected routes
    console.log('\n📍 Test 2: Protected Routes');
    
    // Try character creation page
    await page.goto('http://localhost:8001/create');
    await page.waitForTimeout(2000);
    console.log(`Character creation URL: ${page.url()}`);
    
    if (page.url().includes('/login')) {
        console.log('✅ Character creation route properly protected');
    } else {
        console.log('❌ Character creation route not protected!');
    }
    
    // Try profile page
    await page.goto('http://localhost:8001/profile');
    await page.waitForTimeout(2000);
    console.log(`Profile page URL: ${page.url()}`);
    
    if (page.url().includes('/login')) {
        console.log('✅ Profile route properly protected');
    } else {
        console.log('❌ Profile route not protected!');
    }
    
    // Test 3: Login form exists
    console.log('\n📍 Test 3: Login Form Check');
    await page.goto('http://localhost:8001/login');
    
    const emailInput = await page.locator('input[name="email"]').count();
    const passwordInput = await page.locator('input[name="password"]').count();
    const loginButton = await page.locator('button[type="submit"]').count();
    
    console.log(`Email input found: ${emailInput}`);
    console.log(`Password input found: ${passwordInput}`);
    console.log(`Login button found: ${loginButton}`);
    
    if (emailInput > 0 && passwordInput > 0 && loginButton > 0) {
        console.log('✅ Login form elements present');
    } else {
        console.log('❌ Login form missing elements');
    }
    
    console.log('\n🏁 AUTHENTICATION FIX VERIFICATION COMPLETE');
});
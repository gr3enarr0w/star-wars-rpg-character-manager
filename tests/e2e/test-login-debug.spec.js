const { test, expect } = require('@playwright/test');

test('Debug Login Process', async ({ page }) => {
    console.log('\n🔍 DEBUGGING LOGIN PROCESS');
    console.log('===========================');
    
    // Go to homepage
    await page.goto('http://localhost:8001');
    await page.waitForTimeout(2000);
    
    console.log(`Homepage URL: ${page.url()}`);
    
    // Should redirect to login
    if (page.url().includes('/login')) {
        console.log('✅ Redirected to login page');
    } else {
        console.log('❌ Not redirected to login');
        await page.goto('http://localhost:8001/login');
    }
    
    // Take screenshot of login page
    await page.screenshot({ path: 'login-debug.png', fullPage: true });
    console.log('📸 Screenshot saved as login-debug.png');
    
    // Check login form elements
    const emailInput = await page.locator('input[name="email"]').count();
    const passwordInput = await page.locator('input[name="password"]').count();
    const submitButton = await page.locator('button[type="submit"]').count();
    
    console.log(`\n📋 Form elements:`);
    console.log(`  Email input: ${emailInput}`);
    console.log(`  Password input: ${passwordInput}`);
    console.log(`  Submit button: ${submitButton}`);
    
    if (emailInput > 0 && passwordInput > 0 && submitButton > 0) {
        console.log('\n📍 Attempting login...');
        
        // Fill form
        await page.fill('input[name="email"]', 'admin@example.com');
        await page.fill('input[name="password"]', 'admin123');
        
        console.log('✅ Form filled with admin@example.com / admin123');
        
        // Take screenshot before submit
        await page.screenshot({ path: 'login-before-submit.png', fullPage: true });
        
        // Listen for network requests
        page.on('response', response => {
            if (response.url().includes('/api/auth/login')) {
                console.log(`🌐 Login API response: ${response.status()}`);
            }
        });
        
        // Submit form
        await page.click('button[type="submit"]');
        await page.waitForTimeout(5000);
        
        const afterLoginUrl = page.url();
        console.log(`\n📍 URL after login attempt: ${afterLoginUrl}`);
        
        // Take screenshot after submit
        await page.screenshot({ path: 'login-after-submit.png', fullPage: true });
        
        if (afterLoginUrl.includes('/login')) {
            console.log('❌ Still on login page - checking for error messages');
            
            // Check for error messages
            const errorElements = await page.locator('.error, .alert-danger, .text-danger').count();
            if (errorElements > 0) {
                const errorText = await page.locator('.error, .alert-danger, .text-danger').first().textContent();
                console.log(`   Error message: "${errorText}"`);
            }
            
            // Check page source for any clues
            const pageContent = await page.content();
            if (pageContent.includes('Invalid email or password')) {
                console.log('   Found "Invalid email or password" in page content');
            }
            
        } else {
            console.log('✅ Login successful - redirected from login page');
            
            // Test character creation now
            console.log('\n📍 Testing character creation page...');
            await page.goto('http://localhost:8001/create');
            await page.waitForTimeout(3000);
            
            const createUrl = page.url();
            console.log(`Character creation URL: ${createUrl}`);
            
            if (createUrl === 'http://localhost:8001/create') {
                // Take screenshot of character creation
                await page.screenshot({ path: 'character-creation-test.png', fullPage: true });
                
                // Check for sidebar
                const sidebarCount = await page.locator('.sidebar').count();
                const createHeader = await page.locator('h1:has-text("Create New Character")').count();
                
                console.log(`\n📊 Character Creation Analysis:`);
                console.log(`  Sidebar elements: ${sidebarCount} (should be 0)`);
                console.log(`  Create header: ${createHeader} (should be > 0)`);
                
                if (sidebarCount === 0 && createHeader > 0) {
                    console.log('🎉 SUCCESS: Issue #113 is FIXED!');
                } else {
                    console.log('❌ Issue #113 not fully fixed');
                }
            }
        }
    } else {
        console.log('❌ Login form elements missing');
    }
});
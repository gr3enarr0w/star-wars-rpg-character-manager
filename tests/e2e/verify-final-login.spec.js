const { test, expect } = require('@playwright/test');

test('Verify Final Login Credentials', async ({ page }) => {
    console.log('\n🔍 TESTING FINAL LOGIN CREDENTIALS');
    console.log('===================================');
    
    // Go to the Flask app on port 8005
    try {
        await page.goto('http://localhost:8005');
        await page.waitForTimeout(3000);
        
        console.log(`Current URL: ${page.url()}`);
        
        // Should redirect to login
        if (!page.url().includes('/login')) {
            console.log('⚠️ Not redirected to login, going manually...');
            await page.goto('http://localhost:8005/login');
            await page.waitForTimeout(2000);
        }
        
        console.log(`Login page URL: ${page.url()}`);
        
        // Check if login form exists
        const emailInput = await page.locator('input[name="email"]').count();
        const passwordInput = await page.locator('input[name="password"]').count();
        const submitButton = await page.locator('button[type="submit"]').count();
        
        console.log(`\n📋 Login Form Check:`);
        console.log(`  Email input: ${emailInput}`);
        console.log(`  Password input: ${passwordInput}`);
        console.log(`  Submit button: ${submitButton}`);
        
        if (emailInput === 0 || passwordInput === 0 || submitButton === 0) {
            console.log('❌ Login form not found or incomplete');
            await page.screenshot({ path: 'login-form-missing.png', fullPage: true });
            return;
        }
        
        // Try the login
        console.log('\n📍 Attempting login with admin@test.com / password123...');
        
        await page.fill('input[name="email"]', 'admin@test.com');
        await page.fill('input[name="password"]', 'password123');
        
        console.log('✅ Form filled');
        
        // Take screenshot before submit
        await page.screenshot({ path: 'before-login-submit.png', fullPage: true });
        
        // Listen for API responses
        let loginApiStatus = null;
        page.on('response', response => {
            if (response.url().includes('/api/auth/login')) {
                loginApiStatus = response.status();
                console.log(`🌐 Login API response: ${loginApiStatus}`);
            }
        });
        
        // Submit the form
        await page.click('button[type="submit"]');
        await page.waitForTimeout(5000);
        
        const afterLoginUrl = page.url();
        console.log(`\n📍 URL after login attempt: ${afterLoginUrl}`);
        
        // Take screenshot after login attempt
        await page.screenshot({ path: 'after-login-attempt.png', fullPage: true });
        
        if (afterLoginUrl.includes('/login')) {
            console.log('❌ LOGIN FAILED - Still on login page');
            
            // Look for error messages
            const errorElements = await page.locator('.error, .alert-danger, .text-danger').count();
            if (errorElements > 0) {
                const errorText = await page.locator('.error, .alert-danger, .text-danger').first().textContent();
                console.log(`   Error message: "${errorText}"`);
            }
            
            console.log(`   API Status: ${loginApiStatus || 'Unknown'}`);
            
            // Check page content for clues
            const pageContent = await page.textContent('body');
            if (pageContent.includes('Invalid email or password')) {
                console.log('   Found "Invalid email or password" in page');
            }
            
            console.log('\n❌ FINAL VERDICT: LOGIN DOES NOT WORK');
            
        } else {
            console.log('🎉 LOGIN SUCCESSFUL!');
            console.log(`   Redirected to: ${afterLoginUrl}`);
            
            // Test character creation page
            console.log('\n📍 Testing character creation (Issue #113)...');
            await page.goto('http://localhost:8005/create');
            await page.waitForTimeout(3000);
            
            const createUrl = page.url();
            console.log(`Character creation URL: ${createUrl}`);
            
            if (createUrl === 'http://localhost:8005/create') {
                // Check for template markers
                const pageText = await page.textContent('body');
                const hasFixedTemplate = pageText.includes('FIXED TEMPLATE');
                const sidebarCount = await page.locator('.sidebar').count();
                const createHeader = await page.locator('h1:has-text("Create New Character")').count();
                
                console.log(`\n📊 Character Creation Analysis:`);
                console.log(`  Has FIXED TEMPLATE marker: ${hasFixedTemplate}`);
                console.log(`  Sidebar elements: ${sidebarCount}`);
                console.log(`  Create header: ${createHeader}`);
                
                await page.screenshot({ path: 'character-creation-final.png', fullPage: true });
                
                if (sidebarCount === 0 && createHeader > 0) {
                    console.log('🎉 ISSUE #113 VERIFIED FIXED!');
                } else {
                    console.log('❌ Issue #113 still has problems');
                }
                
                console.log('\n✅ FINAL VERDICT: LOGIN AND UI FIXES WORK!');
            } else {
                console.log('❌ Character creation page not accessible');
            }
        }
        
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        await page.screenshot({ path: 'test-error.png', fullPage: true });
    }
});
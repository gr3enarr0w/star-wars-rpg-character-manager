// Debug Profile Page Loading
const { test, expect } = require('@playwright/test');

test('Profile Page Debug', async ({ page }) => {
    console.log('\n🔍 PROFILE PAGE DEBUG\n');
    
    try {
        // Login
        await page.goto('http://localhost:8001/login');
        await page.fill('input[name="email"]', 'clark@clarkeverson.com');
        await page.fill('input[name="password"]', 'clark123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Check what URL we're on after login
        console.log('📍 After login URL:', page.url());
        
        // Navigate to profile
        console.log('📍 Navigating to profile...');
        await page.goto('http://localhost:8001/profile');
        await page.waitForTimeout(3000);
        
        // Check final URL
        console.log('📍 Final URL:', page.url());
        
        // Check page title
        const title = await page.title();
        console.log('📍 Page Title:', title);
        
        // Check if page contains profile content
        const bodyText = await page.locator('body').textContent();
        const hasProfileContent = bodyText.includes('Profile Settings') || bodyText.includes('Account Information');
        console.log('📍 Has Profile Content:', hasProfileContent);
        
        // Check for specific profile elements
        const profileElements = await page.evaluate(() => {
            return {
                hasUsernameField: !!document.getElementById('username'),
                hasEmailField: !!document.getElementById('email'),
                hasManageButton: !!document.querySelector('button:contains("Manage")'),
                hasProfileScript: document.documentElement.outerHTML.includes('currentUser = null'),
                pageContent: document.body.textContent.substring(0, 200)
            };
        });
        
        console.log('📍 Profile Elements Check:', JSON.stringify(profileElements, null, 2));
        
        // Check for JavaScript errors or issues
        const scriptsCheck = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            return {
                scriptCount: scripts.length,
                hasInlineScript: scripts.some(s => s.innerHTML.includes('currentUser')),
                documentReady: document.readyState,
                userAgent: navigator.userAgent
            };
        });
        
        console.log('📍 Scripts Check:', JSON.stringify(scriptsCheck, null, 2));
        
        // Take a screenshot to see what's actually displayed
        await page.screenshot({ 
            path: '/Users/ceverson/Development/star-wars-rpg-character-manager/profile-page-debug.png',
            fullPage: true 
        });
        console.log('📸 Screenshot saved: profile-page-debug.png');
        
    } catch (error) {
        console.log('❌ Test error:', error.message);
    }
});
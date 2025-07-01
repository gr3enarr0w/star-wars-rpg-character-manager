const { test, expect } = require('@playwright/test');

test('Test final UI fixes', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    console.log('🔧 TESTING FINAL UI FIXES');
    
    // Login and wait for proper session
    await page.goto('http://localhost:8001');
    await page.waitForSelector('input[name="email"]');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/');
    await page.waitForSelector('h1', { timeout: 10000 });
    console.log('Successfully logged in');
    
    // Test character creation page
    console.log('\n📝 TESTING CHARACTER CREATION PAGE');
    await page.goto('http://localhost:8001/create');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'screenshots/final-char-creation-test.png', fullPage: true });
    
    // Check if we got the character creation page or login page
    const loginForm = await page.locator('h1:has-text("Login")').count();
    if (loginForm > 0) {
        console.log('❌ Redirected to login - authentication failed');
    } else {
        // Check layout elements
        const sidebar = await page.locator('.sidebar').count();
        const fullPageHeader = await page.locator('h1:has-text("Create New Character")').count();
        const backButton = await page.locator('a:has-text("Back to Dashboard")').count();
        const creationForm = await page.locator('#character-creation-form').count();
        
        console.log('Sidebar count:', sidebar);
        console.log('Full-page header:', fullPageHeader);
        console.log('Back button:', backButton);
        console.log('Creation form:', creationForm);
        
        if (sidebar === 0 && fullPageHeader > 0 && backButton > 0) {
            console.log('✅ CHARACTER CREATION FIXED');
        } else {
            console.log('❌ CHARACTER CREATION STILL BROKEN');
        }
    }
    
    // Test profile settings page
    console.log('\n⚙️ TESTING PROFILE SETTINGS PAGE');
    await page.goto('http://localhost:8001/profile');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'screenshots/final-profile-test.png', fullPage: true });
    
    // Check if we got the profile page or login page
    const profileLoginForm = await page.locator('h1:has-text("Login")').count();
    if (profileLoginForm > 0) {
        console.log('❌ Redirected to login - authentication failed');
    } else {
        // Check for profile modal overlays
        const modalOverlays = await page.locator('.modal, .modal-content, .overlay').count();
        const profileHeader = await page.locator('h1:has-text("Profile Settings")').count();
        const profileSidebar = await page.locator('.sidebar').count();
        const profileForm = await page.locator('form').count();
        
        console.log('Modal overlays found:', modalOverlays);
        console.log('Profile header found:', profileHeader);
        console.log('Profile sidebar found:', profileSidebar);
        console.log('Profile form found:', profileForm);
        
        if (modalOverlays === 0 && profileHeader > 0 && profileSidebar === 0) {
            console.log('✅ PROFILE SETTINGS FIXED');
        } else {
            console.log('❌ PROFILE SETTINGS STILL BROKEN');
        }
    }
    
    // Test by going back to dashboard and clicking Settings
    console.log('\n🏠 TESTING SETTINGS VIA DASHBOARD');
    await page.goto('http://localhost:8001/');
    await page.waitForTimeout(2000);
    
    // Try clicking Settings from the top navigation
    const settingsLink = await page.locator('a:has-text("Settings")').count();
    if (settingsLink > 0) {
        await page.click('a:has-text("Settings")');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'screenshots/final-settings-from-nav.png', fullPage: true });
        
        const settingsPage = await page.locator('h1:has-text("Profile Settings")').count();
        const settingsModal = await page.locator('.modal, .modal-content').count();
        
        console.log('Settings page header:', settingsPage);
        console.log('Settings modal elements:', settingsModal);
        
        if (settingsPage > 0 && settingsModal === 0) {
            console.log('✅ SETTINGS NAVIGATION WORKS');
        } else {
            console.log('❌ SETTINGS STILL SHOWS AS MODAL');
        }
    } else {
        console.log('⚠️ No Settings link found in navigation');
    }
});
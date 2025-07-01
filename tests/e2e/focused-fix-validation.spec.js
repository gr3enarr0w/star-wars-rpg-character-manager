const { test, expect } = require('@playwright/test');

test('Focused validation after server restart', async ({ page, context }) => {
    // Force disable cache to ensure fresh content
    await context.route('**/*', route => {
        route.continue({
            headers: {
                ...route.request().headers(),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
    });
    
    await page.setViewportSize({ width: 1200, height: 800 });
    
    console.log('🔄 FOCUSED FIX VALIDATION AFTER SERVER RESTART');
    
    // Step 1: Login with hard refresh
    console.log('\n🔐 Step 1: Fresh login');
    await page.goto('http://localhost:8001', { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'screenshots/focused-01-fresh-login.png', fullPage: true });
    
    // Step 2: Test Character Creation (Hard Refresh)
    console.log('\n🎯 Step 2: Testing Character Creation with hard refresh');
    await page.goto('http://localhost:8001/create', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'screenshots/focused-02-character-creation-fresh.png', fullPage: true });
    
    // Check sidebar elements
    const sidebarExists = await page.locator('.sidebar').count();
    const dashboardLink = await page.locator('a:has-text("Dashboard")').count();
    const createCharacterLink = await page.locator('a:has-text("Create Character")').count();
    const campaignsLink = await page.locator('a:has-text("Campaigns")').count();
    
    console.log('Sidebar elements found:', sidebarExists);
    console.log('Dashboard links found:', dashboardLink);
    console.log('Create Character links found:', createCharacterLink);
    console.log('Campaigns links found:', campaignsLink);
    
    // Check for full-page layout indicators
    const hasFullPageHeader = await page.locator('h1:has-text("Create New Character")').count();
    const hasBackButton = await page.locator('a:has-text("Back to Dashboard")').count();
    
    console.log('Full-page header found:', hasFullPageHeader);
    console.log('Back button found:', hasBackButton);
    
    if (sidebarExists === 0 && hasFullPageHeader > 0 && hasBackButton > 0) {
        console.log('✅ CHARACTER CREATION FIXED: No sidebar, full-page layout');
    } else {
        console.log('❌ CHARACTER CREATION STILL BROKEN: Sidebar exists or missing elements');
    }
    
    // Step 3: Test Profile Settings (Hard Refresh) 
    console.log('\n🎯 Step 3: Testing Profile Settings with hard refresh');
    await page.goto('http://localhost:8001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Click settings with explicit wait
    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'screenshots/focused-03-settings-dropdown.png', fullPage: true });
    
    // Navigate directly to profile URL to bypass any JavaScript
    console.log('Navigating directly to /profile URL...');
    await page.goto('http://localhost:8001/profile', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'screenshots/focused-04-profile-direct-url.png', fullPage: true });
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check for modal vs page
    const modalOverlay = await page.locator('.modal-overlay, [class*="modal"]').count();
    const accountSettingsModal = await page.getByText('Account Settings').count();
    const profilePageHeader = await page.locator('h1:has-text("Profile Settings")').count();
    const dashboardInBackground = await page.locator('h1:has-text("My Characters")').count();
    
    console.log('Modal overlays found:', modalOverlay);
    console.log('Account Settings text found:', accountSettingsModal);
    console.log('Profile page header found:', profilePageHeader);
    console.log('Dashboard in background:', dashboardInBackground);
    
    if (currentUrl.includes('/profile') && modalOverlay === 0 && profilePageHeader > 0 && dashboardInBackground === 0) {
        console.log('✅ PROFILE SETTINGS FIXED: Dedicated page, no modal');
    } else {
        console.log('❌ PROFILE SETTINGS STILL BROKEN: Modal exists or wrong page');
    }
    
    // Step 4: Check actual HTML content
    console.log('\n🔍 Step 4: Checking raw HTML content');
    const pageContent = await page.content();
    const hasAccountSettingsText = pageContent.includes('Account Settings');
    const hasModalClasses = pageContent.includes('modal-overlay') || pageContent.includes('modal-content');
    
    console.log('Page HTML contains "Account Settings":', hasAccountSettingsText);
    console.log('Page HTML contains modal classes:', hasModalClasses);
    
    // Step 5: Check for JavaScript errors
    const errors = [];
    page.on('pageerror', error => {
        errors.push(error.message);
    });
    
    console.log('JavaScript errors encountered:', errors.length);
    if (errors.length > 0) {
        console.log('Errors:', errors);
    }
    
    console.log('\n📋 FOCUSED VALIDATION COMPLETE');
});
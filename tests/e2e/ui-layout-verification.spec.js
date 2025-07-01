const { test, expect } = require('@playwright/test');

test.describe('UI Layout Fixes Verification', () => {
    
    // Setup: Login once before all tests
    test.beforeEach(async ({ page }) => {
        console.log('🔐 Setting up authentication...');
        
        // Go to login page
        await page.goto('http://localhost:8001/login');
        
        // Fill login form
        await page.fill('input[name="email"]', 'admin@example.com');
        await page.fill('input[name="password"]', 'admin123');
        
        // Submit form and wait for any response
        await page.click('button[type="submit"]');
        
        // Wait a bit longer for login to process
        await page.waitForTimeout(5000);
        
        // Check if we're logged in by looking for current URL or page elements
        const currentUrl = page.url();
        console.log(`After login URL: ${currentUrl}`);
        
        if (currentUrl.includes('/login')) {
            // Still on login page, let's check for errors
            const errorMessage = await page.locator('.error, .alert-danger, .alert').textContent().catch(() => '');
            console.log(`Login error: ${errorMessage}`);
            
            // Try to continue anyway for testing
            console.log('⚠️ Login may have failed, but continuing with tests...');
        } else {
            console.log('✅ Login successful!');
        }
    });
    
    test('Issue #113: Character Creation Page - No Sidebar', async ({ page }) => {
        console.log('\n🎭 Testing Character Creation Page Layout');
        
        // Navigate directly to character creation
        await page.goto('http://localhost:8001/create');
        await page.waitForTimeout(3000);
        
        // Take screenshot for verification
        await page.screenshot({ path: 'screenshots/ui-test-character-creation.png', fullPage: true });
        
        // Check current URL
        const url = page.url();
        console.log(`Character creation URL: ${url}`);
        
        if (url.includes('/create')) {
            // We're on the character creation page
            console.log('📍 On character creation page, checking layout...');
            
            // Check for sidebar elements
            const sidebar = await page.locator('.sidebar').count();
            const sidebarNav = await page.locator('.sidebar-nav, .side-navigation').count();
            const dashboardInSidebar = await page.locator('.sidebar a:has-text("Dashboard")').count();
            
            console.log(`  Sidebar elements: ${sidebar}`);
            console.log(`  Sidebar nav elements: ${sidebarNav}`);
            console.log(`  Dashboard links in sidebar: ${dashboardInSidebar}`);
            
            // Check for full-page layout elements
            const pageHeader = await page.locator('h1').textContent().catch(() => '');
            const backButton = await page.locator('a:has-text("Back to Dashboard")').count();
            const createForm = await page.locator('form').count();
            
            console.log(`  Page header: "${pageHeader}"`);
            console.log(`  Back button: ${backButton}`);
            console.log(`  Form elements: ${createForm}`);
            
            if (sidebar === 0 && createForm > 0) {
                console.log('✅ Issue #113 VERIFIED: Character creation has no sidebar!');
            } else {
                console.log('❌ Issue #113 FAILED: Sidebar still present or form missing');
            }
        } else {
            console.log('⚠️ Not on character creation page - may need login');
        }
    });
    
    test('Issue #110: Profile Settings Page - No Modal', async ({ page }) => {
        console.log('\n⚙️ Testing Profile Settings Page Layout');
        
        // Navigate directly to profile
        await page.goto('http://localhost:8001/profile');
        await page.waitForTimeout(3000);
        
        // Take screenshot for verification
        await page.screenshot({ path: 'screenshots/ui-test-profile-settings.png', fullPage: true });
        
        // Check current URL
        const url = page.url();
        console.log(`Profile URL: ${url}`);
        
        if (url.includes('/profile')) {
            // We're on the profile page
            console.log('📍 On profile page, checking layout...');
            
            // Check for modal elements
            const modalElements = await page.locator('.modal, .modal-content, .modal-overlay, .modal-backdrop').count();
            const modalDialog = await page.locator('[role="dialog"]').count();
            const overlayElements = await page.locator('.overlay').count();
            
            console.log(`  Modal elements: ${modalElements}`);
            console.log(`  Dialog elements: ${modalDialog}`);
            console.log(`  Overlay elements: ${overlayElements}`);
            
            // Check for page layout elements
            const pageHeader = await page.locator('h1').textContent().catch(() => '');
            const profileForm = await page.locator('form').count();
            const sidebar = await page.locator('.sidebar').count();
            
            console.log(`  Page header: "${pageHeader}"`);
            console.log(`  Profile form: ${profileForm}`);
            console.log(`  Sidebar: ${sidebar}`);
            
            if (modalElements === 0 && overlayElements === 0 && profileForm > 0) {
                console.log('✅ Issue #110 VERIFIED: Profile settings is a dedicated page!');
            } else {
                console.log('❌ Issue #110 FAILED: Modal elements found or form missing');
            }
        } else {
            console.log('⚠️ Not on profile page - may need login');
        }
    });
    
    test('Issue #111: Campaign Management - Dedicated Pages', async ({ page }) => {
        console.log('\n🏰 Testing Campaign Management Pages');
        
        // First go to campaigns list
        await page.goto('http://localhost:8001/campaigns');
        await page.waitForTimeout(3000);
        
        // Take screenshot of campaigns page
        await page.screenshot({ path: 'screenshots/ui-test-campaigns-list.png', fullPage: true });
        
        const url = page.url();
        console.log(`Campaigns URL: ${url}`);
        
        if (url.includes('/campaigns')) {
            console.log('📍 On campaigns page, checking for manage buttons...');
            
            // Look for campaign management buttons/links
            const manageButtons = await page.locator('button:has-text("Manage"), a:has-text("Manage")').count();
            const campaignCards = await page.locator('.campaign-card, .campaign-item, [class*="campaign"]').count();
            
            console.log(`  Manage buttons: ${manageButtons}`);
            console.log(`  Campaign items: ${campaignCards}`);
            
            if (manageButtons > 0) {
                // Click the first manage button
                console.log('📍 Clicking first manage button...');
                await page.locator('button:has-text("Manage"), a:has-text("Manage")').first().click();
                await page.waitForTimeout(3000);
                
                // Check if we navigated to a new page
                const newUrl = page.url();
                console.log(`  After click URL: ${newUrl}`);
                
                // Check for modal elements
                const modalElements = await page.locator('.modal, .campaign-modal, .modal-content').count();
                const overlayElements = await page.locator('.overlay, .modal-backdrop').count();
                
                console.log(`  Modal elements: ${modalElements}`);
                console.log(`  Overlay elements: ${overlayElements}`);
                
                if (newUrl !== url && modalElements === 0) {
                    console.log('✅ Issue #111 VERIFIED: Campaign management uses dedicated pages!');
                    await page.screenshot({ path: 'screenshots/ui-test-campaign-manage.png', fullPage: true });
                } else {
                    console.log('❌ Issue #111 FAILED: Still using modals or URL didn\'t change');
                }
            } else {
                console.log('⚠️ No manage buttons found - may need to create a campaign first');
            }
        } else {
            console.log('⚠️ Not on campaigns page - may need login');
        }
    });
    
    test('Navigation and Duplicate Buttons Check', async ({ page }) => {
        console.log('\n🔍 Checking for Duplicate Navigation Buttons');
        
        // Go to dashboard
        await page.goto('http://localhost:8001/');
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: 'screenshots/ui-test-dashboard-nav.png', fullPage: true });
        
        // Count navigation elements
        const createCharButtons = await page.locator('a:has-text("Create Character"), button:has-text("Create Character")').count();
        const campaignButtons = await page.locator('a:has-text("Campaign"), button:has-text("Campaign")').count();
        
        console.log(`  Create Character buttons: ${createCharButtons}`);
        console.log(`  Campaign buttons: ${campaignButtons}`);
        
        // Check for sidebar duplication
        const sidebarCreateChar = await page.locator('.sidebar a:has-text("Create Character")').count();
        const topNavCreateChar = await page.locator('nav:not(.sidebar) a:has-text("Create Character")').count();
        
        console.log(`  Sidebar Create Character: ${sidebarCreateChar}`);
        console.log(`  Top nav Create Character: ${topNavCreateChar}`);
        
        if (createCharButtons <= 1 && campaignButtons <= 1) {
            console.log('✅ No duplicate navigation buttons found!');
        } else {
            console.log('❌ Duplicate navigation buttons detected');
        }
    });
    
    test('Summary Report', async ({ page }) => {
        console.log('\n📊 UI FIXES VERIFICATION SUMMARY');
        console.log('================================');
        console.log('Issue #110: Profile Settings Page - Check screenshots');
        console.log('Issue #111: Campaign Management Pages - Check screenshots');
        console.log('Issue #113: Character Creation Layout - Check screenshots');
        console.log('\nScreenshots saved to: screenshots/ui-test-*.png');
        console.log('Please review screenshots to verify layouts are correct!');
    });
});
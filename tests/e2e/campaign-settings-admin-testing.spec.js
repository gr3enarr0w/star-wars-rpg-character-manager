const { test, expect } = require('@playwright/test');

test.describe('Campaign Management, Settings, and Admin Panel UI Testing', () => {
    test('Test campaign management, profile settings, and admin panel issues', async ({ page }) => {
        await page.setViewportSize({ width: 1200, height: 800 });
        
        // Step 1: Login
        await page.goto('http://localhost:8001');
        await page.fill('input[name="email"]', 'admin@example.com');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: 'screenshots/campaign-test-01-dashboard.png', fullPage: true });
        console.log('✅ Screenshot 1: Dashboard after login');

        // Step 2: Test Campaign Management
        console.log('🔄 Testing Campaign Management...');
        await page.click('a[href="/campaigns"]');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/campaign-test-02-campaigns-page.png', fullPage: true });
        console.log('✅ Screenshot 2: Campaigns page');

        // Create a test campaign to test management
        const createCampaignTab = page.locator('#create-campaign-tab-btn');
        if (await createCampaignTab.isVisible()) {
            await createCampaignTab.click();
            await page.waitForTimeout(1000);
            
            await page.fill('input[name="name"]', 'Test Campaign for Management');
            await page.selectOption('select[name="game_system"]', 'Edge of the Empire');
            await page.fill('textarea[name="description"]', 'Test campaign to check management UI');
            
            await page.screenshot({ path: 'screenshots/campaign-test-03-create-campaign-form.png', fullPage: true });
            console.log('✅ Screenshot 3: Create campaign form filled');
            
            await page.click('#create-campaign-submit-btn');
            await page.waitForTimeout(3000);
            
            await page.screenshot({ path: 'screenshots/campaign-test-04-after-campaign-creation.png', fullPage: true });
            console.log('✅ Screenshot 4: After campaign creation');
        }

        // Step 3: Test Campaign Management - check if it shows as popup vs dedicated page
        console.log('🔄 Testing Campaign Management Interface...');
        const manageCampaignBtn = page.locator('text=Manage Campaign', 'text=Manage Players', 'text=Settings').first();
        if (await manageCampaignBtn.isVisible()) {
            console.log('Found campaign management button, clicking...');
            await manageCampaignBtn.click();
            await page.waitForTimeout(2000);
            
            await page.screenshot({ path: 'screenshots/campaign-test-05-campaign-management.png', fullPage: true });
            console.log('✅ Screenshot 5: Campaign management interface - checking if popup vs dedicated page');
            
            // Check if we have a proper page or modal
            const currentUrl = page.url();
            console.log('Current URL after clicking manage:', currentUrl);
            
            // Check for modal/popup indicators
            const modal = page.locator('.modal, .popup, .overlay');
            const modalVisible = await modal.isVisible().catch(() => false);
            console.log('Modal/popup visible:', modalVisible);
            
        } else {
            console.log('No campaign management button found');
        }

        // Step 4: Test Profile/Settings Menu
        console.log('🔄 Testing Profile/Settings Menu...');
        await page.goto('http://localhost:8001'); // Go back to dashboard
        await page.waitForTimeout(1000);
        
        // Click the Settings dropdown
        const settingsButton = page.locator('button:has-text("Settings")');
        if (await settingsButton.isVisible()) {
            await settingsButton.click();
            await page.waitForTimeout(1000);
            
            await page.screenshot({ path: 'screenshots/campaign-test-06-settings-dropdown.png', fullPage: true });
            console.log('✅ Screenshot 6: Settings dropdown menu');
            
            // Click Profile Settings
            const profileLink = page.locator('a:has-text("Profile Settings")');
            if (await profileLink.isVisible()) {
                await profileLink.click();
                await page.waitForTimeout(2000);
                
                await page.screenshot({ path: 'screenshots/campaign-test-07-profile-page.png', fullPage: true });
                console.log('✅ Screenshot 7: Profile page - checking if popup vs dedicated page');
                
                const currentUrl = page.url();
                console.log('Profile page URL:', currentUrl);
                
                // Check for modal/popup indicators
                const profileModal = page.locator('.modal, .popup, .overlay');
                const profileModalVisible = await profileModal.isVisible().catch(() => false);
                console.log('Profile modal/popup visible:', profileModalVisible);
            }
        }

        // Step 5: Test Admin Panel Re-login Issue
        console.log('🔄 Testing Admin Panel Re-login Issue...');
        await page.goto('http://localhost:8001'); // Go back to dashboard
        await page.waitForTimeout(1000);
        
        // Click Settings dropdown again
        await page.click('button:has-text("Settings")');
        await page.waitForTimeout(500);
        
        // Click Admin Panel
        const adminLink = page.locator('a:has-text("Admin Panel")');
        if (await adminLink.isVisible()) {
            await adminLink.click();
            await page.waitForTimeout(3000); // Wait longer for potential redirect
            
            await page.screenshot({ path: 'screenshots/campaign-test-08-admin-panel.png', fullPage: true });
            console.log('✅ Screenshot 8: Admin panel - checking for re-login requirement');
            
            const currentUrl = page.url();
            console.log('Admin panel URL:', currentUrl);
            
            // Check if we're back at login page
            const isAtLogin = currentUrl.includes('/login') || await page.locator('input[name="email"]').isVisible();
            console.log('Admin panel requires re-login:', isAtLogin);
            
            if (isAtLogin) {
                console.log('❌ ISSUE CONFIRMED: Admin panel requires re-login despite being already logged in');
            } else {
                console.log('✅ Admin panel accessible without re-login');
            }
        } else {
            console.log('Admin Panel link not visible (may be role-based)');
        }

        // Step 6: Final dashboard check
        await page.goto('http://localhost:8001');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/campaign-test-09-final-dashboard.png', fullPage: true });
        console.log('✅ Screenshot 9: Final dashboard state');
        
        console.log('\n🎯 Campaign Management, Settings, and Admin Panel testing complete!');
        console.log('Check screenshots for visual evidence of UI issues.');
    });

    test('Test specific modal vs page behavior', async ({ page }) => {
        await page.setViewportSize({ width: 1200, height: 800 });
        
        // Login
        await page.goto('http://localhost:8001');
        await page.fill('input[name="email"]', 'admin@example.com');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);

        // Test direct navigation to profile page
        console.log('🔄 Testing direct navigation to /profile...');
        await page.goto('http://localhost:8001/profile');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/direct-profile-page.png', fullPage: true });
        
        const profileUrl = page.url();
        console.log('Direct profile page URL:', profileUrl);
        
        // Check page structure
        const hasProperHeader = await page.locator('h1').isVisible();
        const hasNavigation = await page.locator('nav').isVisible();
        const hasMainContent = await page.locator('main').isVisible();
        
        console.log('Profile page has proper structure:');
        console.log('  - Header:', hasProperHeader);
        console.log('  - Navigation:', hasNavigation);
        console.log('  - Main content:', hasMainContent);

        // Test direct navigation to admin page
        console.log('\n🔄 Testing direct navigation to /admin...');
        await page.goto('http://localhost:8001/admin');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/direct-admin-page.png', fullPage: true });
        
        const adminUrl = page.url();
        console.log('Direct admin page URL:', adminUrl);
        
        const adminRequiresLogin = adminUrl.includes('/login');
        console.log('Admin page requires login when accessing directly:', adminRequiresLogin);
    });
});
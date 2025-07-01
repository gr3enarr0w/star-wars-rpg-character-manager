const { test, expect } = require('@playwright/test');

test.describe('UI Issue Documentation with Screenshots', () => {
    test('Capture all UI issues mentioned by user', async ({ page }) => {
        await page.setViewportSize({ width: 1200, height: 800 });
        
        // Step 1: Go to application (should redirect to login)
        await page.goto('http://localhost:8001');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/01-login-page.png', fullPage: true });
        console.log('✅ Screenshot 1: Login page');

        // Step 2: Login with admin credentials
        await page.fill('input[name="email"]', 'admin@example.com');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000); // Wait for login and redirect
        
        // Step 3: Dashboard after login - check for duplicate buttons
        await page.screenshot({ path: 'screenshots/02-dashboard-after-login.png', fullPage: true });
        console.log('✅ Screenshot 2: Dashboard after login - check for duplicate Create Character/Campaign buttons');

        // Step 4: Navigate to character creation
        await page.click('a[href="/create"]');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/03-character-creation-page.png', fullPage: true });
        console.log('✅ Screenshot 3: Character creation page - check for old dashboard buttons');

        // Step 5: Fill character creation form
        await page.fill('input[name="name"]', 'Test Trandoshan');
        await page.fill('input[name="playerName"]', 'Test Player');
        await page.selectOption('select[name="species"]', 'Trandoshan');
        await page.selectOption('select[name="career"]', 'Technician');
        await page.fill('textarea[name="background"]', 'A skilled technician from Trandosha');
        
        await page.screenshot({ path: 'screenshots/04-character-form-filled.png', fullPage: true });
        console.log('✅ Screenshot 4: Character form filled out');

        // Step 6: Attempt to create character
        console.log('🔄 Attempting to click Create Character button...');
        
        // Enable console logging to catch JS errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ JS ERROR:', msg.text());
            } else if (msg.type() === 'log') {
                console.log('📝 JS LOG:', msg.text());
            }
        });
        
        await page.click('button[type="submit"]:has-text("Create Character")');
        await page.waitForTimeout(5000); // Wait for any response
        
        await page.screenshot({ path: 'screenshots/05-after-create-character-click.png', fullPage: true });
        console.log('✅ Screenshot 5: After clicking Create Character - check if form responds');

        // Step 7: Go to campaigns page
        await page.goto('http://localhost:8001/campaigns');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/06-campaigns-page.png', fullPage: true });
        console.log('✅ Screenshot 6: Campaigns page');

        // Step 8: Create a test campaign to test management
        await page.click('#create-campaign-tab-btn');
        await page.waitForTimeout(1000);
        await page.fill('input[name="name"]', 'Test Campaign');
        await page.selectOption('select[name="game_system"]', 'Edge of the Empire');
        await page.fill('textarea[name="description"]', 'Test campaign for UI testing');
        await page.click('#create-campaign-submit-btn');
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: 'screenshots/07-after-creating-campaign.png', fullPage: true });
        console.log('✅ Screenshot 7: After creating campaign');

        // Step 9: Try to manage the campaign (check if it shows as popup vs page)
        const manageCampaignBtn = page.locator('text=Manage Campaign').first();
        if (await manageCampaignBtn.isVisible()) {
            await manageCampaignBtn.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'screenshots/08-campaign-management.png', fullPage: true });
            console.log('✅ Screenshot 8: Campaign management - check if popup vs dedicated page');
        }

        // Step 10: Go to profile page
        await page.goto('http://localhost:8001/profile');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/09-profile-page.png', fullPage: true });
        console.log('✅ Screenshot 9: Profile page - check if popup vs dedicated page');

        // Step 11: Go to admin panel  
        await page.goto('http://localhost:8001/admin');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/10-admin-panel.png', fullPage: true });
        console.log('✅ Screenshot 10: Admin panel - check for re-login requirement');

        // Step 12: Final dashboard state
        await page.goto('http://localhost:8001');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/11-final-dashboard.png', fullPage: true });
        console.log('✅ Screenshot 11: Final dashboard state');
        
        console.log('\n🎯 All screenshots captured! Check the screenshots/ directory for UI issues.');
    });
});
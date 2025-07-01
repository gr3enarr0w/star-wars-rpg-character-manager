const { test, expect } = require('@playwright/test');

test.describe('Comprehensive UI Testing with Screenshots', () => {
    let page;

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        await page.setViewportSize({ width: 1200, height: 800 });
    });

    test('Complete UI flow with screenshots to identify issues', async () => {
        // Step 1: Load the application
        await page.goto('http://localhost:8001');
        await page.screenshot({ path: 'screenshots/01-initial-load.png', fullPage: true });
        console.log('Screenshot 1: Initial application load');

        // Step 2: Navigate to login if not already logged in
        const loginButton = page.locator('button:has-text("Login")').first();
        if (await loginButton.isVisible()) {
            await loginButton.click();
            await page.screenshot({ path: 'screenshots/02-login-page.png', fullPage: true });
            console.log('Screenshot 2: Login page');

            // Login with admin credentials
            await page.fill('input[name="email"]', 'admin@example.com');
            await page.fill('input[name="password"]', 'admin123');
            await page.click('button[type="submit"]');
            await page.waitForTimeout(2000); // Wait for login
        }

        // Step 3: Check dashboard after login
        await page.goto('http://localhost:8001');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/03-dashboard-after-login.png', fullPage: true });
        console.log('Screenshot 3: Dashboard after login - checking for duplicate buttons');

        // Step 4: Navigate to character creation
        await page.click('text=Create Character');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/04-character-creation-page.png', fullPage: true });
        console.log('Screenshot 4: Character creation page - checking for old dashboard buttons');

        // Step 5: Fill out character creation form
        await page.fill('input[name="name"]', 'Test Trandoshan');
        await page.fill('input[name="playerName"]', 'Test Player');
        await page.selectOption('select[name="species"]', 'Trandoshan');
        await page.selectOption('select[name="career"]', 'Technician');
        await page.fill('textarea[name="background"]', 'A skilled technician from Trandosha');
        
        await page.screenshot({ path: 'screenshots/05-character-form-filled.png', fullPage: true });
        console.log('Screenshot 5: Character creation form filled out');

        // Step 6: Attempt to create character and check for response
        console.log('Attempting to click Create Character button...');
        
        // Listen for console messages to capture any JS errors
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

        // Click create character button
        const createButton = page.locator('button[type="submit"]:has-text("Create Character")');
        await createButton.click();
        await page.waitForTimeout(3000); // Wait for any response
        
        await page.screenshot({ path: 'screenshots/06-after-create-click.png', fullPage: true });
        console.log('Screenshot 6: After clicking Create Character button');

        // Step 7: Check campaigns page
        await page.goto('http://localhost:8001/campaigns');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/07-campaigns-page.png', fullPage: true });
        console.log('Screenshot 7: Campaigns page');

        // Step 8: Try to manage a campaign (if any exist)
        const manageCampaignButton = page.locator('text=Manage Campaign').first();
        if (await manageCampaignButton.isVisible()) {
            await manageCampaignButton.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'screenshots/08-campaign-management.png', fullPage: true });
            console.log('Screenshot 8: Campaign management - checking if it shows as popup vs page');
        } else {
            console.log('No campaigns found to test management');
        }

        // Step 9: Check profile page
        await page.goto('http://localhost:8001/profile');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/09-profile-page.png', fullPage: true });
        console.log('Screenshot 9: Profile page - checking if it shows as popup vs page');

        // Step 10: Check admin panel
        await page.goto('http://localhost:8001/admin');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/10-admin-panel.png', fullPage: true });
        console.log('Screenshot 10: Admin panel - checking for re-login issues');

        // Step 11: Go back to dashboard to check final state
        await page.goto('http://localhost:8001');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/11-final-dashboard.png', fullPage: true });
        console.log('Screenshot 11: Final dashboard state');

        // Step 12: Check for any JavaScript errors in console
        const logs = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                logs.push(`ERROR: ${msg.text()}`);
            }
        });

        // Take a final screenshot showing any error states
        await page.screenshot({ path: 'screenshots/12-final-state.png', fullPage: true });
        console.log('Screenshot 12: Final application state');

        // Log any errors found
        if (logs.length > 0) {
            console.log('JavaScript errors found:');
            logs.forEach(log => console.log(log));
        }
    });

    test('Test specific UI elements mentioned in issues', async () => {
        await page.goto('http://localhost:8001');
        
        // Login first
        const loginButton = page.locator('button:has-text("Login")').first();
        if (await loginButton.isVisible()) {
            await loginButton.click();
            await page.fill('input[name="email"]', 'admin@example.com');
            await page.fill('input[name="password"]', 'admin123');
            await page.click('button[type="submit"]');
            await page.waitForTimeout(2000);
        }

        await page.goto('http://localhost:8001');
        await page.waitForTimeout(1000);

        // Take screenshot of dashboard to check for old buttons
        await page.screenshot({ path: 'screenshots/dashboard-buttons-check.png', fullPage: true });
        
        // Count how many "Create Character" buttons exist
        const createCharacterButtons = await page.locator('text=Create Character').count();
        console.log(`Found ${createCharacterButtons} "Create Character" buttons on dashboard`);
        
        // Count how many "Campaign" buttons exist
        const campaignButtons = await page.locator('text=Campaign').count();
        console.log(`Found ${campaignButtons} "Campaign" buttons on dashboard`);

        // Check character creation page
        await page.click('text=Create Character');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/create-character-buttons-check.png', fullPage: true });
        
        // Check for old dashboard buttons on character creation page
        const dashboardButtonsOnCreatePage = await page.locator('text=Dashboard').count();
        console.log(`Found ${dashboardButtonsOnCreatePage} "Dashboard" buttons on create character page`);
    });
});
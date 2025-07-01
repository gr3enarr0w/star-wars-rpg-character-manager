// Quick verification test to check if the reported bugs are actually bugs
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8001';
const TEST_USER = {
    email: 'clark@clarkeverson.com',
    password: 'clark123'
};

test.describe('Quick Bug Verification', () => {
    test('Verify reported bugs are actual issues', async ({ page }) => {
        // Test authentication
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[name="email"]', TEST_USER.email);
        await page.fill('input[name="password"]', TEST_USER.password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        console.log('\n🔍 TESTING REPORTED BUGS...\n');
        
        // 1. Test User Menu (Issue #129)
        console.log('1. Testing User Menu...');
        const userMenuButton = page.locator('#userMenuToggle');
        if (await userMenuButton.count() > 0) {
            console.log('   ✅ User menu button found with ID #userMenuToggle');
            await userMenuButton.click();
            await page.waitForTimeout(500);
            const dropdown = page.locator('#userMenuDropdown');
            if (await dropdown.isVisible()) {
                console.log('   ✅ User menu dropdown opens correctly');
            } else {
                console.log('   🐛 User menu dropdown does not open');
            }
        } else {
            console.log('   🐛 User menu button not found');
        }
        
        // 2. Test Character Creation Form (Issue #130)
        console.log('\n2. Testing Character Creation Form...');
        await page.goto(`${BASE_URL}/create-character`);
        await page.waitForTimeout(2000);
        
        const characterNameInput = page.locator('input[name="character_name"]');
        const playerNameInput = page.locator('input[name="player_name"]');
        const speciesSelect = page.locator('select[name="species"]');
        const careerSelect = page.locator('select[name="career"]');
        
        console.log(`   Character name input: ${await characterNameInput.count() > 0 ? '✅ Found' : '🐛 Missing'}`);
        console.log(`   Player name input: ${await playerNameInput.count() > 0 ? '✅ Found' : '🐛 Missing'}`);
        console.log(`   Species select: ${await speciesSelect.count() > 0 ? '✅ Found' : '🐛 Missing'}`);
        console.log(`   Career select: ${await careerSelect.count() > 0 ? '✅ Found' : '🐛 Missing'}`);
        
        // 3. Test Campaign Tab Navigation (Issue #131)
        console.log('\n3. Testing Campaign Tab Navigation...');
        await page.goto(`${BASE_URL}/campaigns`);
        await page.waitForTimeout(2000);
        
        const createTabBtn = page.locator('#create-campaign-tab-btn');
        const joinTabBtn = page.locator('#join-campaign-tab-btn');
        
        console.log(`   Create Campaign tab button: ${await createTabBtn.count() > 0 ? '✅ Found' : '🐛 Missing'}`);
        console.log(`   Join Campaign tab button: ${await joinTabBtn.count() > 0 ? '✅ Found' : '🐛 Missing'}`);
        
        if (await createTabBtn.count() > 0) {
            await createTabBtn.click();
            await page.waitForTimeout(500);
            const createTab = page.locator('#create-campaign-tab');
            console.log(`   Create Campaign tab content shows: ${await createTab.isVisible() ? '✅ Yes' : '🐛 No'}`);
        }
        
        // 4. Test Profile and 2FA (Issue #132)
        console.log('\n4. Testing Profile and 2FA...');
        await page.goto(`${BASE_URL}/profile`);
        await page.waitForTimeout(2000);
        
        const manage2FAButton = page.locator('button:has-text("Manage")');
        const emailField = page.locator('input[id="email"]');
        const usernameField = page.locator('input[id="username"]');
        
        console.log(`   2FA Manage button: ${await manage2FAButton.count() > 0 ? '✅ Found' : '🐛 Missing'}`);
        console.log(`   Email field: ${await emailField.count() > 0 ? '✅ Found' : '🐛 Missing'}`);
        console.log(`   Username field: ${await usernameField.count() > 0 ? '✅ Found' : '🐛 Missing'}`);
        
        // 5. Test Documentation Page (Issue #135)
        console.log('\n5. Testing Documentation Page...');
        await page.goto(`${BASE_URL}/docs`);
        await page.waitForTimeout(2000);
        
        const docContent = page.locator('text="Documentation", text="SWRPG", text="Character Manager"');
        console.log(`   Documentation content: ${await docContent.count() > 0 ? '✅ Found' : '🐛 Missing'}`);
        
        // Also test the /documentation URL that our tests used
        await page.goto(`${BASE_URL}/documentation`);
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        console.log(`   /documentation URL result: ${currentUrl}`);
        
        console.log('\n🔍 BUG VERIFICATION COMPLETE\n');
    });
});
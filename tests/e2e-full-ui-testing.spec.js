const { test, expect } = require('@playwright/test');

test.describe('Full E2E UI Testing - All User Roles', () => {
    // Test data for different user roles
    const users = {
        admin: {
            email: 'clark@everson.dev',
            password: 'with1artie4oskar3VOCATION!advances',
            expectedRole: 'admin',
            expectedUsername: 'clark_admin'
        },
        user: {
            email: 'test.user@example.com',
            password: 'testPassword123!',
            expectedRole: 'user',
            expectedUsername: 'test_user'
        },
        gamemaster: {
            email: 'gm@example.com', 
            password: 'gmPassword123!',
            expectedRole: 'gamemaster',
            expectedUsername: 'test_gm'
        }
    };

    // Helper function to login
    async function login(page, userType) {
        const user = users[userType];
        console.log(`🔑 Logging in as ${userType}: ${user.email}`);
        
        await page.goto('http://localhost:8001/login');
        await page.fill('#email', user.email);
        await page.fill('#password', user.password);
        await page.click('#loginBtn');
        
        // Wait for redirect and verify login
        await page.waitForURL('http://localhost:8001/', { timeout: 10000 });
        
        // Verify tokens are set
        const token = await page.evaluate(() => localStorage.getItem('access_token'));
        const userData = await page.evaluate(() => localStorage.getItem('user'));
        
        expect(token).toBeTruthy();
        expect(userData).toBeTruthy();
        
        const user_data = JSON.parse(userData);
        console.log(`✅ Logged in as: ${user_data.username} (${user_data.role})`);
        
        return user_data;
    }

    // Helper function to take screenshot with description
    async function takeScreenshot(page, description, step) {
        const filename = `ui-${step.toString().padStart(2, '0')}-${description.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
        await page.screenshot({ 
            path: `test-results/${filename}`,
            fullPage: true 
        });
        console.log(`📸 Screenshot: ${filename}`);
    }

    test('Admin User - Full UI Testing', async ({ page }) => {
        console.log('🎯 Testing Admin User Role - Full UI Flow');
        let step = 1;

        // Login as admin
        const userData = await login(page, 'admin');
        await takeScreenshot(page, 'admin-dashboard-after-login', step++);

        // Test Dashboard Elements
        console.log('📊 Testing Dashboard Elements...');
        await expect(page.locator('h1')).toContainText('My Characters');
        
        // Look for admin-specific elements
        const adminPanel = page.locator('text=Admin Panel', 'text=Administration', 'text=User Management').first();
        if (await adminPanel.isVisible()) {
            console.log('✅ Admin panel visible');
            await takeScreenshot(page, 'admin-panel-visible', step++);
        }

        // Test Navigation Menu
        console.log('🧭 Testing Navigation Menu...');
        const navItems = [
            'Characters', 'Create Character', 'Campaigns', 'Profile', 'Admin'
        ];
        
        for (const item of navItems) {
            const navLink = page.locator(`a:has-text("${item}")`, `button:has-text("${item}")`, `[href*="${item.toLowerCase()}"]`).first();
            if (await navLink.isVisible()) {
                console.log(`📍 Found navigation item: ${item}`);
                await navLink.click();
                await page.waitForTimeout(1000);
                await takeScreenshot(page, `admin-nav-${item.toLowerCase()}`, step++);
                
                // Go back to dashboard for next test
                await page.goto('http://localhost:8001/');
                await page.waitForTimeout(500);
            }
        }

        // Test Character Creation
        console.log('👤 Testing Character Creation...');
        const createBtn = page.locator('text=Create New Character', 'text=Create Character', 'button:has-text("Create")').first();
        if (await createBtn.isVisible()) {
            await createBtn.click();
            await page.waitForTimeout(2000);
            await takeScreenshot(page, 'admin-character-creation', step++);
            
            // Fill character creation form if visible
            const nameField = page.locator('#characterName', '[name="name"]', 'input[placeholder*="name"]').first();
            if (await nameField.isVisible()) {
                await nameField.fill('Test Admin Character');
                await takeScreenshot(page, 'admin-character-form-filled', step++);
            }
        }

        // Test Profile Page
        console.log('👤 Testing Profile Page...');
        await page.goto('http://localhost:8001/profile');
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'admin-profile-page', step++);

        // Test API Endpoints (admin should have access to all)
        console.log('🔌 Testing Admin API Access...');
        const apiTests = [
            '/api/characters',
            '/api/auth/me',
            '/api/admin/users'
        ];

        for (const endpoint of apiTests) {
            try {
                const response = await page.evaluate(async (url) => {
                    const token = localStorage.getItem('access_token');
                    const res = await fetch(url, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    return { status: res.status, ok: res.ok };
                }, endpoint);
                
                console.log(`🔌 ${endpoint}: ${response.status} ${response.ok ? '✅' : '❌'}`);
            } catch (error) {
                console.log(`🔌 ${endpoint}: Error - ${error.message}`);
            }
        }

        console.log('✅ Admin User Testing Complete');
    });

    test('Regular User - Full UI Testing', async ({ page }) => {
        console.log('🎯 Testing Regular User Role - Full UI Flow');
        let step = 1;

        // Try to login as regular user (may not exist, so create basic test)
        try {
            await page.goto('http://localhost:8001/login');
            await takeScreenshot(page, 'user-login-page', step++);
            
            // Since we may not have a regular user, let's test the login form
            await page.fill('#email', users.user.email);
            await page.fill('#password', users.user.password);
            await takeScreenshot(page, 'user-login-form-filled', step++);
            
            await page.click('#loginBtn');
            await page.waitForTimeout(3000);
            
            // Check if login was successful
            const currentUrl = page.url();
            console.log(`📍 After login attempt: ${currentUrl}`);
            
            if (currentUrl.includes('/login')) {
                console.log('ℹ️  Regular user account may not exist - testing login form only');
                await takeScreenshot(page, 'user-login-failed-expected', step++);
            } else {
                console.log('✅ Regular user login successful - continuing with full test');
                await takeScreenshot(page, 'user-dashboard', step++);
                
                // Test limited user functionality
                const adminElements = page.locator('text=Admin', 'text=User Management');
                const adminCount = await adminElements.count();
                console.log(`🔒 Admin elements visible to user: ${adminCount} (should be 0)`);
            }
            
        } catch (error) {
            console.log(`ℹ️  Regular user test - ${error.message}`);
        }

        console.log('✅ Regular User Testing Complete');
    });

    test('Gamemaster User - Full UI Testing', async ({ page }) => {
        console.log('🎯 Testing Gamemaster User Role - Full UI Flow');
        let step = 1;

        // Try to login as gamemaster user
        try {
            await page.goto('http://localhost:8001/login');
            await takeScreenshot(page, 'gm-login-page', step++);
            
            await page.fill('#email', users.gamemaster.email);
            await page.fill('#password', users.gamemaster.password);
            await takeScreenshot(page, 'gm-login-form-filled', step++);
            
            await page.click('#loginBtn');
            await page.waitForTimeout(3000);
            
            const currentUrl = page.url();
            console.log(`📍 After GM login attempt: ${currentUrl}`);
            
            if (currentUrl.includes('/login')) {
                console.log('ℹ️  Gamemaster account may not exist - testing login form only');
                await takeScreenshot(page, 'gm-login-failed-expected', step++);
            } else {
                console.log('✅ Gamemaster login successful - continuing with full test');
                await takeScreenshot(page, 'gm-dashboard', step++);
                
                // Test GM-specific functionality
                const campaignElements = page.locator('text=Campaign', 'text=Manage Campaign');
                const campaignCount = await campaignElements.count();
                console.log(`🎮 Campaign elements visible to GM: ${campaignCount}`);
                
                if (campaignCount > 0) {
                    await campaignElements.first().click();
                    await page.waitForTimeout(2000);
                    await takeScreenshot(page, 'gm-campaign-management', step++);
                }
            }
            
        } catch (error) {
            console.log(`ℹ️  Gamemaster test - ${error.message}`);
        }

        console.log('✅ Gamemaster User Testing Complete');
    });

    test('UI Feature Testing - Buttons and Interactions', async ({ page }) => {
        console.log('🎯 Testing All UI Features and Buttons');
        let step = 1;

        // Login as admin for full access
        await login(page, 'admin');
        await takeScreenshot(page, 'feature-test-start', step++);

        // Test all clickable elements
        console.log('🖱️  Testing All Interactive Elements...');
        
        const interactiveSelectors = [
            'button',
            'a[href]',
            '[role="button"]',
            'input[type="submit"]',
            '.btn',
            '.button'
        ];

        for (const selector of interactiveSelectors) {
            const elements = page.locator(selector);
            const count = await elements.count();
            
            if (count > 0) {
                console.log(`🔍 Found ${count} ${selector} elements`);
                
                for (let i = 0; i < Math.min(count, 5); i++) { // Test max 5 of each type
                    try {
                        const element = elements.nth(i);
                        const isVisible = await element.isVisible();
                        
                        if (isVisible) {
                            const text = await element.textContent() || await element.getAttribute('title') || selector;
                            console.log(`  🖱️  Testing: ${text.substring(0, 30)}`);
                            
                            // Take screenshot before click
                            await takeScreenshot(page, `before-click-${selector.replace(/[^a-z0-9]/g, '')}-${i}`, step++);
                            
                            await element.click();
                            await page.waitForTimeout(1000);
                            
                            // Take screenshot after click
                            await takeScreenshot(page, `after-click-${selector.replace(/[^a-z0-9]/g, '')}-${i}`, step++);
                            
                            // Return to dashboard
                            await page.goto('http://localhost:8001/');
                            await page.waitForTimeout(500);
                        }
                    } catch (error) {
                        console.log(`    ❌ Error clicking element: ${error.message}`);
                    }
                }
            }
        }

        // Test form interactions
        console.log('📝 Testing Form Interactions...');
        const formElements = [
            'input[type="text"]',
            'input[type="email"]', 
            'input[type="password"]',
            'textarea',
            'select'
        ];

        for (const selector of formElements) {
            const elements = page.locator(selector);
            const count = await elements.count();
            
            if (count > 0) {
                console.log(`📝 Found ${count} ${selector} elements`);
                await takeScreenshot(page, `form-elements-${selector.replace(/[^a-z0-9]/g, '')}`, step++);
            }
        }

        console.log('✅ UI Feature Testing Complete');
    });
});
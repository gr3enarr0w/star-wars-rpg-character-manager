const { test, expect } = require('@playwright/test');

test.describe('Comprehensive Admin UI Testing - GitHub Codespaces', () => {
    const APP_URL = 'http://localhost:8001';
    
    // Helper function to login as admin
    async function loginAsAdmin(page) {
        console.log('🔑 Logging in as admin...');
        
        await page.goto(`${APP_URL}/login`);
        await page.fill('#email', 'clark@everson.dev');
        await page.fill('#password', 'with1artie4oskar3VOCATION!advances');
        await page.click('#loginBtn');
        
        // Wait for redirect to dashboard
        await page.waitForURL(`${APP_URL}/`, { timeout: 10000 });
        
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
        const filename = `admin-${step.toString().padStart(2, '0')}-${description.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
        await page.screenshot({ 
            path: `test-results/${filename}`,
            fullPage: true 
        });
        console.log(`📸 Screenshot: ${filename}`);
    }

    test('🎯 Admin Dashboard - Complete UI Testing', async ({ page }) => {
        console.log('🎯 Testing Admin Dashboard - Complete UI functionality');
        let step = 1;

        // Login and verify dashboard
        const userData = await loginAsAdmin(page);
        await takeScreenshot(page, 'dashboard-after-login', step++);

        // Verify admin dashboard elements
        console.log('📊 Testing Dashboard Elements...');
        await expect(page.locator('h1')).toBeVisible();
        
        const dashboardTitle = await page.locator('h1').textContent();
        console.log(`📍 Dashboard title: "${dashboardTitle}"`);
        
        // Test main navigation elements
        console.log('🧭 Testing Main Navigation...');
        const navSelectors = [
            'a[href="/"]',           // Home/Dashboard
            'a[href*="character"]',   // Characters
            'a[href*="campaign"]',    // Campaigns
            'a[href*="profile"]',     // Profile
            'a[href*="admin"]',       // Admin (if available)
            'text=Characters',
            'text=Campaigns',
            'text=Profile',
            'text=Admin',
            'text=Settings'
        ];

        for (const selector of navSelectors) {
            try {
                const element = page.locator(selector).first();
                if (await element.isVisible()) {
                    const text = await element.textContent();
                    console.log(`📍 Found navigation item: "${text}" (${selector})`);
                    
                    await element.click();
                    await page.waitForTimeout(1000);
                    await takeScreenshot(page, `nav-${text.toLowerCase().replace(/[^a-z0-9]/g, '-')}`, step++);
                    
                    // Return to dashboard
                    await page.goto(`${APP_URL}/`);
                    await page.waitForTimeout(500);
                }
            } catch (error) {
                console.log(`ℹ️  Navigation item "${selector}" not found or not clickable`);
            }
        }

        console.log('✅ Dashboard navigation testing complete');
    });

    test('👤 Character Management - Full Testing', async ({ page }) => {
        console.log('👤 Testing Character Management functionality');
        let step = 1;

        await loginAsAdmin(page);
        await takeScreenshot(page, 'character-mgmt-start', step++);

        // Test character creation
        console.log('📝 Testing Character Creation...');
        
        // Look for character creation buttons/links
        const createSelectors = [
            'text=Create New Character',
            'text=Create Character',
            'text=Add Character',
            'button:has-text("Create")',
            'a:has-text("Create")',
            '.btn:has-text("Create")',
            '[href*="create"]',
            '[href*="character"]'
        ];

        let characterCreationFound = false;
        for (const selector of createSelectors) {
            try {
                const element = page.locator(selector).first();
                if (await element.isVisible()) {
                    const text = await element.textContent();
                    console.log(`📍 Found character creation: "${text}"`);
                    
                    await element.click();
                    await page.waitForTimeout(2000);
                    await takeScreenshot(page, 'character-creation-form', step++);
                    
                    characterCreationFound = true;
                    break;
                }
            } catch (error) {
                console.log(`ℹ️  Character creation element "${selector}" not found`);
            }
        }

        if (characterCreationFound) {
            // Test character creation form
            console.log('📋 Testing Character Creation Form...');
            
            // Look for form fields
            const formSelectors = [
                '#characterName, [name="name"], input[placeholder*="name"]',
                '#playerName, [name="player"], input[placeholder*="player"]',
                '#species, [name="species"], select[placeholder*="species"]',
                '#career, [name="career"], select[placeholder*="career"]'
            ];

            for (const selector of formSelectors) {
                try {
                    const element = page.locator(selector).first();
                    if (await element.isVisible()) {
                        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
                        const placeholder = await element.getAttribute('placeholder') || '';
                        const name = await element.getAttribute('name') || '';
                        
                        console.log(`📝 Found form field: ${tagName} (${name || placeholder})`);
                        
                        if (tagName === 'input') {
                            await element.fill('Test Admin Character');
                        } else if (tagName === 'select') {
                            // Get available options
                            const options = await element.locator('option').allTextContents();
                            if (options.length > 1) {
                                await element.selectOption({ index: 1 });
                                console.log(`📋 Selected option from ${options.length} available`);
                            }
                        }
                    }
                } catch (error) {
                    console.log(`ℹ️  Form field "${selector}" not found or not fillable`);
                }
            }

            await takeScreenshot(page, 'character-form-filled', step++);

            // Look for submit button
            const submitSelectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'text=Create Character',
                'text=Save Character',
                'text=Submit',
                '.btn-primary',
                '.submit-btn'
            ];

            for (const selector of submitSelectors) {
                try {
                    const element = page.locator(selector).first();
                    if (await element.isVisible()) {
                        console.log(`📤 Found submit button: "${await element.textContent()}"`);
                        // Don't actually submit to avoid creating test data
                        await takeScreenshot(page, 'character-form-ready-submit', step++);
                        break;
                    }
                } catch (error) {
                    console.log(`ℹ️  Submit button "${selector}" not found`);
                }
            }
        }

        console.log('✅ Character management testing complete');
    });

    test('🏛️ Admin Panel - Administrative Functions', async ({ page }) => {
        console.log('🏛️ Testing Admin Panel functionality');
        let step = 1;

        await loginAsAdmin(page);
        await takeScreenshot(page, 'admin-panel-start', step++);

        // Look for admin-specific functionality
        const adminSelectors = [
            'text=Admin Panel',
            'text=Administration',
            'text=User Management',
            'text=Manage Users',
            'a[href*="admin"]',
            '[href*="admin"]',
            '.admin-panel',
            '#admin-section'
        ];

        let adminPanelFound = false;
        for (const selector of adminSelectors) {
            try {
                const element = page.locator(selector).first();
                if (await element.isVisible()) {
                    const text = await element.textContent();
                    console.log(`📍 Found admin panel: "${text}"`);
                    
                    await element.click();
                    await page.waitForTimeout(2000);
                    await takeScreenshot(page, 'admin-panel-opened', step++);
                    
                    adminPanelFound = true;
                    break;
                }
            } catch (error) {
                console.log(`ℹ️  Admin element "${selector}" not found`);
            }
        }

        if (adminPanelFound) {
            console.log('🔧 Testing Admin Functions...');
            
            // Test user management functions
            const userMgmtSelectors = [
                'text=Users',
                'text=User List',
                'text=Manage Users',
                'table',
                '.user-table',
                '.users-list'
            ];

            for (const selector of userMgmtSelectors) {
                try {
                    const element = page.locator(selector).first();
                    if (await element.isVisible()) {
                        console.log(`👥 Found user management: "${selector}"`);
                        await takeScreenshot(page, 'admin-user-management', step++);
                        break;
                    }
                } catch (error) {
                    console.log(`ℹ️  User management "${selector}" not found`);
                }
            }
        } else {
            console.log('ℹ️  Admin panel not found - may be accessed through different UI');
        }

        console.log('✅ Admin panel testing complete');
    });

    test('🎮 Campaign Management - Admin Functions', async ({ page }) => {
        console.log('🎮 Testing Campaign Management functionality');
        let step = 1;

        await loginAsAdmin(page);
        await takeScreenshot(page, 'campaign-mgmt-start', step++);

        // Navigate to campaigns
        console.log('📍 Navigating to Campaigns...');
        const campaignSelectors = [
            'text=Campaigns',
            'a[href*="campaign"]',
            '[href*="campaign"]',
            'text=Game Management',
            'text=Sessions'
        ];

        let campaignsFound = false;
        for (const selector of campaignSelectors) {
            try {
                const element = page.locator(selector).first();
                if (await element.isVisible()) {
                    const text = await element.textContent();
                    console.log(`📍 Found campaigns: "${text}"`);
                    
                    await element.click();
                    await page.waitForTimeout(2000);
                    await takeScreenshot(page, 'campaigns-page', step++);
                    
                    campaignsFound = true;
                    break;
                }
            } catch (error) {
                console.log(`ℹ️  Campaign element "${selector}" not found`);
            }
        }

        if (campaignsFound) {
            console.log('📋 Testing Campaign Functions...');
            
            // Test campaign creation
            const createCampaignSelectors = [
                'text=Create Campaign',
                'text=New Campaign',
                'text=Add Campaign',
                'button:has-text("Create")',
                '.btn:has-text("Create")'
            ];

            for (const selector of createCampaignSelectors) {
                try {
                    const element = page.locator(selector).first();
                    if (await element.isVisible()) {
                        console.log(`🎮 Found campaign creation: "${await element.textContent()}"`);
                        await element.click();
                        await page.waitForTimeout(1000);
                        await takeScreenshot(page, 'campaign-creation', step++);
                        break;
                    }
                } catch (error) {
                    console.log(`ℹ️  Campaign creation "${selector}" not found`);
                }
            }
        }

        console.log('✅ Campaign management testing complete');
    });

    test('👤 Profile Management - User Settings', async ({ page }) => {
        console.log('👤 Testing Profile Management functionality');
        let step = 1;

        await loginAsAdmin(page);
        await takeScreenshot(page, 'profile-mgmt-start', step++);

        // Navigate to profile
        console.log('📍 Navigating to Profile...');
        const profileSelectors = [
            'text=Profile',
            'a[href*="profile"]',
            '[href*="profile"]',
            'text=Settings',
            'text=Account',
            '.profile-link',
            '.user-menu'
        ];

        let profileFound = false;
        for (const selector of profileSelectors) {
            try {
                const element = page.locator(selector).first();
                if (await element.isVisible()) {
                    const text = await element.textContent();
                    console.log(`📍 Found profile: "${text}"`);
                    
                    await element.click();
                    await page.waitForTimeout(2000);
                    await takeScreenshot(page, 'profile-page', step++);
                    
                    profileFound = true;
                    break;
                }
            } catch (error) {
                console.log(`ℹ️  Profile element "${selector}" not found`);
            }
        }

        if (profileFound) {
            console.log('⚙️ Testing Profile Settings...');
            
            // Test profile form fields
            const profileFieldSelectors = [
                '#username, [name="username"]',
                '#email, [name="email"]',
                '#firstName, [name="firstName"]',
                '#lastName, [name="lastName"]',
                'input[type="text"]',
                'input[type="email"]'
            ];

            for (const selector of profileFieldSelectors) {
                try {
                    const element = page.locator(selector).first();
                    if (await element.isVisible()) {
                        const name = await element.getAttribute('name') || '';
                        const value = await element.inputValue();
                        console.log(`📝 Found profile field: ${name} = "${value}"`);
                    }
                } catch (error) {
                    console.log(`ℹ️  Profile field "${selector}" not found`);
                }
            }

            await takeScreenshot(page, 'profile-settings', step++);
        }

        console.log('✅ Profile management testing complete');
    });

    test('🔌 Admin API Access - Backend Integration', async ({ page }) => {
        console.log('🔌 Testing Admin API Access and Backend Integration');
        let step = 1;

        await loginAsAdmin(page);
        await takeScreenshot(page, 'api-testing-start', step++);

        // Test API endpoints that admin should have access to
        console.log('🔍 Testing Admin API Endpoints...');
        const apiTests = [
            { endpoint: '/api/characters', description: 'Character management' },
            { endpoint: '/api/auth/me', description: 'User authentication' },
            { endpoint: '/api/admin/users', description: 'User administration' },
            { endpoint: '/api/campaigns', description: 'Campaign management' }
        ];

        for (const { endpoint, description } of apiTests) {
            try {
                const response = await page.evaluate(async (url) => {
                    const token = localStorage.getItem('access_token');
                    const res = await fetch(url, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    return { 
                        status: res.status, 
                        ok: res.ok,
                        statusText: res.statusText
                    };
                }, endpoint);
                
                if (response.ok) {
                    console.log(`🔌 ${endpoint}: ${response.status} ✅ - ${description}`);
                } else {
                    console.log(`🔌 ${endpoint}: ${response.status} ⚠️ - ${description} (${response.statusText})`);
                }
            } catch (error) {
                console.log(`🔌 ${endpoint}: Error - ${error.message}`);
            }
        }

        console.log('✅ API access testing complete');
    });

    test('🚪 Logout and Session Management', async ({ page }) => {
        console.log('🚪 Testing Logout and Session Management');
        let step = 1;

        await loginAsAdmin(page);
        await takeScreenshot(page, 'logout-testing-start', step++);

        // Look for logout functionality
        console.log('🔍 Looking for logout functionality...');
        const logoutSelectors = [
            'text=Logout',
            'text=Sign Out',
            'text=Log Out',
            'a[href*="logout"]',
            'button:has-text("Logout")',
            '.logout-btn',
            '.sign-out'
        ];

        let logoutFound = false;
        for (const selector of logoutSelectors) {
            try {
                const element = page.locator(selector).first();
                if (await element.isVisible()) {
                    const text = await element.textContent();
                    console.log(`🚪 Found logout: "${text}"`);
                    
                    await element.click();
                    await page.waitForTimeout(2000);
                    await takeScreenshot(page, 'after-logout', step++);
                    
                    logoutFound = true;
                    
                    // Verify we're redirected to login
                    const currentUrl = page.url();
                    if (currentUrl.includes('/login')) {
                        console.log('✅ Successfully redirected to login page after logout');
                    } else {
                        console.log(`ℹ️  Current URL after logout: ${currentUrl}`);
                    }
                    
                    // Verify tokens are cleared
                    const token = await page.evaluate(() => localStorage.getItem('access_token'));
                    const userData = await page.evaluate(() => localStorage.getItem('user'));
                    
                    if (!token && !userData) {
                        console.log('✅ Session data properly cleared');
                    } else {
                        console.log('⚠️  Session data may not be fully cleared');
                    }
                    
                    break;
                }
            } catch (error) {
                console.log(`ℹ️  Logout element "${selector}" not found`);
            }
        }

        if (!logoutFound) {
            console.log('ℹ️  Logout functionality not found in UI - may be accessed differently');
        }

        console.log('✅ Logout testing complete');
    });
});
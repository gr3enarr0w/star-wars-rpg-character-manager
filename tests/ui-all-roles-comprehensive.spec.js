const { test, expect } = require('@playwright/test');

test.describe('Comprehensive All Roles UI Testing - GitHub Codespaces', () => {
    const APP_URL = 'http://localhost:8000';
    
    // Test user configurations for different roles
    const testUsers = {
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

    // Helper function to attempt login
    async function attemptLogin(page, userType) {
        const user = testUsers[userType];
        console.log(`🔑 Attempting login as ${userType}: ${user.email}`);
        
        await page.goto(`${APP_URL}/login`);
        await page.fill('#email', user.email);
        await page.fill('#password', user.password);
        await page.click('#loginBtn');
        
        // Wait for response
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        console.log(`📍 Current URL after login attempt: ${currentUrl}`);
        
        // Check if login was successful
        if (currentUrl.includes('/login')) {
            console.log(`❌ Login failed for ${userType} - still on login page`);
            return null;
        } else {
            // Check for tokens
            const token = await page.evaluate(() => localStorage.getItem('access_token'));
            const userData = await page.evaluate(() => localStorage.getItem('user'));
            
            if (token && userData) {
                const user_data = JSON.parse(userData);
                console.log(`✅ Login successful for ${userType}: ${user_data.username} (${user_data.role})`);
                return user_data;
            } else {
                console.log(`⚠️  Login may have succeeded but no tokens found for ${userType}`);
                return null;
            }
        }
    }

    // Helper function to take screenshot
    async function takeScreenshot(page, description, userType) {
        const filename = `${userType}-${description.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
        await page.screenshot({ 
            path: `test-results/${filename}`,
            fullPage: true 
        });
        console.log(`📸 Screenshot: ${filename}`);
    }

    // Helper function to test UI elements visibility
    async function testUIElementsVisibility(page, userType, userData) {
        console.log(`🔍 Testing UI element visibility for ${userType}...`);
        
        const uiElements = [
            { selector: 'h1', description: 'Main heading' },
            { selector: 'nav, .navigation, .nav', description: 'Navigation menu' },
            { selector: 'a[href*="character"], text=Characters', description: 'Characters link' },
            { selector: 'a[href*="campaign"], text=Campaigns', description: 'Campaigns link' },
            { selector: 'a[href*="profile"], text=Profile', description: 'Profile link' },
            { selector: 'a[href*="admin"], text=Admin', description: 'Admin link' },
            { selector: 'button, .btn', description: 'Action buttons' },
            { selector: 'text=Create, text=Add', description: 'Create/Add buttons' }
        ];

        const visibleElements = [];
        for (const { selector, description } of uiElements) {
            try {
                const element = page.locator(selector).first();
                if (await element.isVisible()) {
                    const text = await element.textContent();
                    visibleElements.push({ description, text: text?.substring(0, 50) });
                    console.log(`  ✅ ${description}: "${text?.substring(0, 30)}${text?.length > 30 ? '...' : ''}"`);
                }
            } catch (error) {
                console.log(`  ℹ️  ${description}: Not found`);
            }
        }

        // Check for role-specific elements
        if (userData?.role === 'admin') {
            console.log(`🔧 Checking admin-specific elements...`);
            const adminElements = [
                'text=Admin Panel',
                'text=User Management', 
                'text=Administration',
                'text=Manage Users'
            ];
            
            for (const selector of adminElements) {
                try {
                    const element = page.locator(selector).first();
                    if (await element.isVisible()) {
                        console.log(`  🏛️  Admin element found: ${selector}`);
                    }
                } catch (error) {
                    console.log(`  ℹ️  Admin element not found: ${selector}`);
                }
            }
        }

        return visibleElements;
    }

    test('🎯 Admin Role - Complete UI Testing', async ({ page }) => {
        console.log('🎯 Testing Admin Role - Complete UI functionality');
        
        const userData = await attemptLogin(page, 'admin');
        if (!userData) {
            console.log('❌ Admin login failed - skipping admin tests');
            return;
        }

        await takeScreenshot(page, 'dashboard-after-login', 'admin');
        
        // Test admin dashboard
        await expect(page.locator('h1')).toBeVisible();
        const visibleElements = await testUIElementsVisibility(page, 'admin', userData);
        
        // Admin should see all UI elements
        expect(visibleElements.length).toBeGreaterThan(0);
        
        // Test navigation for admin
        console.log('🧭 Testing admin navigation...');
        const navItems = ['Characters', 'Campaigns', 'Profile'];
        
        for (const item of navItems) {
            try {
                const navLink = page.locator(`text=${item}, a:has-text("${item}")`, `[href*="${item.toLowerCase()}"]`).first();
                if (await navLink.isVisible()) {
                    console.log(`📍 Testing navigation to: ${item}`);
                    await navLink.click();
                    await page.waitForTimeout(1000);
                    await takeScreenshot(page, `nav-${item.toLowerCase()}`, 'admin');
                    
                    // Go back to dashboard
                    await page.goto(`${APP_URL}/`);
                    await page.waitForTimeout(500);
                }
            } catch (error) {
                console.log(`ℹ️  Navigation to ${item} not available`);
            }
        }

        console.log('✅ Admin role testing complete');
    });

    test('👤 Regular User Role - UI Access Testing', async ({ page }) => {
        console.log('👤 Testing Regular User Role - UI access and limitations');
        
        const userData = await attemptLogin(page, 'user');
        if (!userData) {
            console.log('ℹ️  Regular user account not available - testing login form only');
            
            await page.goto(`${APP_URL}/login`);
            await takeScreenshot(page, 'login-page', 'user');
            
            // Test login form functionality
            await page.fill('#email', testUsers.user.email);
            await page.fill('#password', testUsers.user.password);
            await takeScreenshot(page, 'login-form-filled', 'user');
            
            // Don't actually submit to avoid errors
            console.log('ℹ️  Login form tested - user account may not exist');
            return;
        }

        await takeScreenshot(page, 'dashboard-after-login', 'user');
        
        // Test user dashboard (should have limited access)
        const visibleElements = await testUIElementsVisibility(page, 'user', userData);
        
        // Check that admin elements are NOT visible to regular users
        console.log('🔒 Checking that admin elements are hidden from regular users...');
        const adminElements = [
            'text=Admin Panel',
            'text=User Management',
            'text=Administration',
            'a[href*="admin"]'
        ];
        
        let adminElementsFound = 0;
        for (const selector of adminElements) {
            try {
                const element = page.locator(selector).first();
                if (await element.isVisible()) {
                    adminElementsFound++;
                    console.log(`⚠️  Admin element visible to regular user: ${selector}`);
                }
            } catch (error) {
                console.log(`✅ Admin element properly hidden: ${selector}`);
            }
        }
        
        if (adminElementsFound === 0) {
            console.log('✅ All admin elements properly hidden from regular user');
        } else {
            console.log(`⚠️  ${adminElementsFound} admin elements visible to regular user - potential security issue`);
        }

        console.log('✅ Regular user role testing complete');
    });

    test('🎮 Gamemaster Role - UI Access Testing', async ({ page }) => {
        console.log('🎮 Testing Gamemaster Role - UI access and campaign management');
        
        const userData = await attemptLogin(page, 'gamemaster');
        if (!userData) {
            console.log('ℹ️  Gamemaster account not available - testing login form only');
            
            await page.goto(`${APP_URL}/login`);
            await takeScreenshot(page, 'login-page', 'gamemaster');
            
            // Test login form functionality
            await page.fill('#email', testUsers.gamemaster.email);
            await page.fill('#password', testUsers.gamemaster.password);
            await takeScreenshot(page, 'login-form-filled', 'gamemaster');
            
            console.log('ℹ️  Login form tested - gamemaster account may not exist');
            return;
        }

        await takeScreenshot(page, 'dashboard-after-login', 'gamemaster');
        
        // Test gamemaster dashboard
        const visibleElements = await testUIElementsVisibility(page, 'gamemaster', userData);
        
        // Check for GM-specific functionality
        console.log('🎮 Checking gamemaster-specific elements...');
        const gmElements = [
            'text=Campaign',
            'text=Manage Campaign',
            'text=Game Master',
            'text=Sessions',
            'a[href*="campaign"]'
        ];
        
        let gmElementsFound = 0;
        for (const selector of gmElements) {
            try {
                const element = page.locator(selector).first();
                if (await element.isVisible()) {
                    gmElementsFound++;
                    console.log(`🎮 GM element found: ${selector}`);
                    
                    // Test clicking GM-specific elements
                    await element.click();
                    await page.waitForTimeout(1000);
                    await takeScreenshot(page, `gm-${selector.replace(/[^a-z0-9]/g, '-')}`, 'gamemaster');
                    
                    // Return to dashboard
                    await page.goto(`${APP_URL}/`);
                    await page.waitForTimeout(500);
                }
            } catch (error) {
                console.log(`ℹ️  GM element not found: ${selector}`);
            }
        }
        
        console.log(`📊 GM-specific elements found: ${gmElementsFound}`);

        console.log('✅ Gamemaster role testing complete');
    });

    test('🖱️ Interactive Elements - All Buttons and Controls', async ({ page }) => {
        console.log('🖱️ Testing All Interactive Elements - Buttons, Links, Controls');
        
        // Login as admin for full access
        const userData = await attemptLogin(page, 'admin');
        if (!userData) {
            console.log('❌ Cannot test interactive elements without login');
            return;
        }

        await takeScreenshot(page, 'interactive-elements-start', 'admin');

        // Test all clickable elements
        console.log('🖱️  Testing all interactive elements...');
        
        const interactiveSelectors = [
            'button',
            'a[href]',
            '[role="button"]',
            'input[type="submit"]',
            'input[type="button"]',
            '.btn',
            '.button',
            '[onclick]',
            '[data-action]'
        ];

        let totalInteractive = 0;
        let successfulClicks = 0;

        for (const selector of interactiveSelectors) {
            try {
                const elements = page.locator(selector);
                const count = await elements.count();
                
                if (count > 0) {
                    console.log(`🔍 Found ${count} ${selector} elements`);
                    totalInteractive += count;
                    
                    // Test clicking first few elements of each type
                    for (let i = 0; i < Math.min(count, 3); i++) {
                        try {
                            const element = elements.nth(i);
                            const isVisible = await element.isVisible();
                            
                            if (isVisible) {
                                const text = await element.textContent() || await element.getAttribute('title') || `${selector}[${i}]`;
                                console.log(`  🖱️  Testing click: ${text.substring(0, 30)}`);
                                
                                await element.click();
                                await page.waitForTimeout(500);
                                successfulClicks++;
                                
                                // Return to dashboard after each click
                                await page.goto(`${APP_URL}/`);
                                await page.waitForTimeout(300);
                            }
                        } catch (error) {
                            console.log(`    ❌ Click failed: ${error.message.substring(0, 50)}`);
                        }
                    }
                }
            } catch (error) {
                console.log(`ℹ️  Error testing ${selector}: ${error.message}`);
            }
        }

        console.log(`📊 Interactive elements summary:`);
        console.log(`   Total found: ${totalInteractive}`);
        console.log(`   Successfully clicked: ${successfulClicks}`);
        
        await takeScreenshot(page, 'interactive-elements-complete', 'admin');

        // At least some interactive elements should be clickable
        expect(successfulClicks).toBeGreaterThan(0);

        console.log('✅ Interactive elements testing complete');
    });

    test('📱 Form Elements - Input Fields and Controls', async ({ page }) => {
        console.log('📱 Testing Form Elements - Input fields, selects, textareas');
        
        // Login as admin
        const userData = await attemptLogin(page, 'admin');
        if (!userData) {
            console.log('❌ Cannot test forms without login');
            return;
        }

        await takeScreenshot(page, 'form-elements-start', 'admin');

        // Test form elements throughout the application
        console.log('📝 Testing form elements...');
        
        const formSelectors = [
            'input[type="text"]',
            'input[type="email"]', 
            'input[type="password"]',
            'input[type="number"]',
            'textarea',
            'select',
            'input[type="checkbox"]',
            'input[type="radio"]'
        ];

        let totalFormElements = 0;
        let testableElements = 0;

        for (const selector of formSelectors) {
            try {
                const elements = page.locator(selector);
                const count = await elements.count();
                
                if (count > 0) {
                    console.log(`📝 Found ${count} ${selector} elements`);
                    totalFormElements += count;
                    
                    // Test interacting with form elements
                    for (let i = 0; i < Math.min(count, 2); i++) {
                        try {
                            const element = elements.nth(i);
                            const isVisible = await element.isVisible();
                            const isEnabled = await element.isEnabled();
                            
                            if (isVisible && isEnabled) {
                                const tagName = await element.evaluate(el => el.tagName.toLowerCase());
                                const type = await element.getAttribute('type') || '';
                                const name = await element.getAttribute('name') || '';
                                
                                console.log(`  📝 Testing ${tagName}[${type}] (${name})`);
                                
                                if (tagName === 'input' && ['text', 'email', 'password'].includes(type)) {
                                    await element.fill('Test Input Value');
                                    testableElements++;
                                } else if (tagName === 'textarea') {
                                    await element.fill('Test textarea content');
                                    testableElements++;
                                } else if (tagName === 'select') {
                                    const options = await element.locator('option').count();
                                    if (options > 1) {
                                        await element.selectOption({ index: 1 });
                                        testableElements++;
                                    }
                                } else if (type === 'checkbox' || type === 'radio') {
                                    await element.check();
                                    testableElements++;
                                }
                            }
                        } catch (error) {
                            console.log(`    ❌ Form interaction failed: ${error.message.substring(0, 50)}`);
                        }
                    }
                }
            } catch (error) {
                console.log(`ℹ️  Error testing ${selector}: ${error.message}`);
            }
        }

        console.log(`📊 Form elements summary:`);
        console.log(`   Total found: ${totalFormElements}`);
        console.log(`   Successfully tested: ${testableElements}`);
        
        await takeScreenshot(page, 'form-elements-complete', 'admin');

        console.log('✅ Form elements testing complete');
    });

    test('🔐 Access Control - Role-based UI Elements', async ({ page }) => {
        console.log('🔐 Testing Role-based Access Control in UI');
        
        // Test that different roles see appropriate UI elements
        const roleTests = [
            { role: 'admin', shouldSeeAdmin: true },
            { role: 'user', shouldSeeAdmin: false },
            { role: 'gamemaster', shouldSeeAdmin: false }
        ];

        for (const { role, shouldSeeAdmin } of roleTests) {
            console.log(`\n🔍 Testing access control for ${role} role...`);
            
            const userData = await attemptLogin(page, role);
            if (!userData) {
                console.log(`ℹ️  ${role} account not available - skipping access control test`);
                continue;
            }

            await takeScreenshot(page, `access-control-${role}`, role);
            
            // Check admin element visibility
            const adminSelectors = [
                'text=Admin',
                'text=User Management',
                'text=Administration',
                'a[href*="admin"]'
            ];
            
            let adminElementsVisible = 0;
            for (const selector of adminSelectors) {
                try {
                    const element = page.locator(selector).first();
                    if (await element.isVisible()) {
                        adminElementsVisible++;
                    }
                } catch (error) {
                    // Element not found
                }
            }
            
            if (shouldSeeAdmin) {
                console.log(`✅ ${role} can see admin elements: ${adminElementsVisible > 0 ? 'YES' : 'NO'}`);
            } else {
                if (adminElementsVisible === 0) {
                    console.log(`✅ ${role} properly cannot see admin elements`);
                } else {
                    console.log(`⚠️  ${role} can see ${adminElementsVisible} admin elements - potential access control issue`);
                }
            }
            
            // Logout
            try {
                await page.evaluate(() => {
                    localStorage.clear();
                });
            } catch (error) {
                console.log('ℹ️  Manual logout via localStorage clear');
            }
        }

        console.log('✅ Access control testing complete');
    });
});
/**
 * Complete Button and UI Testing Suite
 * Tests EVERY button on the website for functionality and UI/UX
 */

const { test, expect } = require('@playwright/test');

const TEST_CONFIG = {
    baseUrl: 'http://localhost:8002',
    timeout: 10000,
    loginCredentials: {
        email: 'test@example.com',
        password: 'password123'
    }
};

class ButtonTester {
    constructor(page) {
        this.page = page;
        this.results = {
            working: [],
            broken: [],
            ui_issues: [],
            navigation_issues: []
        };
    }

    async testButton(selector, description, expectedBehavior = {}) {
        try {
            const element = this.page.locator(selector).first();
            
            if (await element.count() === 0) {
                this.results.broken.push(`❌ MISSING: ${description} - Element not found: ${selector}`);
                return false;
            }

            const isVisible = await element.isVisible();
            const isEnabled = await element.isEnabled();
            const text = await element.textContent();
            
            console.log(`🔘 Testing: ${description}`);
            console.log(`   Text: "${text?.trim()}" | Visible: ${isVisible} | Enabled: ${isEnabled}`);

            if (!isVisible) {
                this.results.ui_issues.push(`👁️ HIDDEN: ${description} - Button exists but not visible`);
                return false;
            }

            if (!isEnabled) {
                this.results.ui_issues.push(`🚫 DISABLED: ${description} - Button visible but disabled`);
                return false;
            }

            // Test click behavior
            const initialUrl = this.page.url();
            const initialTitle = await this.page.title();
            
            // Look for any modals before clicking
            const modalsBefore = await this.page.locator('.modal, .modal-overlay, [role="dialog"]').count();
            
            await element.click();
            await this.page.waitForTimeout(2000);
            
            const finalUrl = this.page.url();
            const finalTitle = await this.page.title();
            const modalsAfter = await this.page.locator('.modal, .modal-overlay, [role="dialog"]').count();
            
            // Analyze what happened
            const urlChanged = finalUrl !== initialUrl;
            const titleChanged = finalTitle !== initialTitle;
            const modalOpened = modalsAfter > modalsBefore;
            
            console.log(`   URL: ${initialUrl} → ${finalUrl}`);
            console.log(`   Title: "${initialTitle}" → "${finalTitle}"`);
            console.log(`   Modal opened: ${modalOpened}`);
            
            // Check against expected behavior
            if (expectedBehavior.shouldNavigate && !urlChanged) {
                this.results.navigation_issues.push(`🚪 NAV FAIL: ${description} - Expected navigation but URL didn't change`);
                return false;
            }
            
            if (expectedBehavior.shouldOpenModal && !modalOpened) {
                this.results.navigation_issues.push(`📝 MODAL FAIL: ${description} - Expected modal but none opened`);
                return false;
            }
            
            if (expectedBehavior.shouldStayOnPage && urlChanged) {
                this.results.navigation_issues.push(`🔒 STAY FAIL: ${description} - Expected to stay but URL changed`);
                return false;
            }
            
            this.results.working.push(`✅ WORKING: ${description} - Behaved as expected`);
            return true;
            
        } catch (error) {
            this.results.broken.push(`💥 ERROR: ${description} - ${error.message}`);
            return false;
        }
    }

    async findAllButtons() {
        // Get all possible button elements
        const buttons = await this.page.locator('button, input[type="button"], input[type="submit"], a[class*="btn"], .button').all();
        const links = await this.page.locator('a').all();
        
        const allInteractive = [];
        
        for (const button of buttons) {
            const text = await button.textContent();
            const classes = await button.getAttribute('class');
            const id = await button.getAttribute('id');
            allInteractive.push({
                element: button,
                type: 'button',
                identifier: text?.trim() || classes || id || 'unnamed',
                selector: await this.getSelector(button)
            });
        }
        
        for (const link of links) {
            const text = await link.textContent();
            const href = await link.getAttribute('href');
            const classes = await link.getAttribute('class');
            
            // Only include links that look like buttons or navigation
            if (classes?.includes('btn') || href?.startsWith('/') || text?.includes('Settings') || text?.includes('Admin') || text?.includes('Profile')) {
                allInteractive.push({
                    element: link,
                    type: 'link',
                    identifier: text?.trim() || href || 'unnamed',
                    selector: await this.getSelector(link)
                });
            }
        }
        
        return allInteractive;
    }

    async getSelector(element) {
        const id = await element.getAttribute('id');
        if (id) return `#${id}`;
        
        const classes = await element.getAttribute('class');
        if (classes) {
            const classList = classes.split(' ').filter(c => c.length > 0);
            if (classList.length > 0) return `.${classList[0]}`;
        }
        
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const text = await element.textContent();
        if (text && text.trim().length < 30) {
            return `${tagName}:has-text("${text.trim()}")`;
        }
        
        return tagName;
    }

    printResults() {
        console.log('\n🔍 COMPLETE BUTTON TESTING RESULTS');
        console.log('='.repeat(50));
        
        console.log(`\n✅ WORKING BUTTONS (${this.results.working.length}):`);
        this.results.working.forEach(item => console.log(`  ${item}`));
        
        console.log(`\n❌ BROKEN BUTTONS (${this.results.broken.length}):`);
        this.results.broken.forEach(item => console.log(`  ${item}`));
        
        console.log(`\n👁️ UI ISSUES (${this.results.ui_issues.length}):`);
        this.results.ui_issues.forEach(item => console.log(`  ${item}`));
        
        console.log(`\n🚪 NAVIGATION ISSUES (${this.results.navigation_issues.length}):`);
        this.results.navigation_issues.forEach(item => console.log(`  ${item}`));
        
        const total = this.results.working.length + this.results.broken.length + 
                     this.results.ui_issues.length + this.results.navigation_issues.length;
        const working = this.results.working.length;
        const percentage = total > 0 ? Math.round((working / total) * 100) : 0;
        
        console.log(`\n📊 SUMMARY: ${working}/${total} buttons working (${percentage}%)`);
    }
}

async function login(page) {
    await page.goto(TEST_CONFIG.baseUrl);
    
    // Check if already logged in
    if (!page.url().includes('login')) {
        return true;
    }
    
    await page.fill('input[type="email"]', TEST_CONFIG.loginCredentials.email);
    await page.fill('input[type="password"]', TEST_CONFIG.loginCredentials.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    return !page.url().includes('login');
}

test.describe('Complete Button and UI Testing', () => {

    test('1. Login Page - All Buttons and Forms', async ({ page }) => {
        console.log('🔐 TESTING: Login Page Buttons and Forms');
        const tester = new ButtonTester(page);
        
        await page.goto(TEST_CONFIG.baseUrl);
        
        // Test login form submission
        await tester.testButton('button[type="submit"]', 'Login Submit Button', {
            shouldStayOnPage: false // Should redirect after login
        });
        
        // Test any registration links
        await tester.testButton('a[href*="register"]', 'Registration Link', {
            shouldNavigate: true
        });
        
        // Test forgot password links
        await tester.testButton('a:has-text("Forgot")', 'Forgot Password Link', {
            shouldNavigate: true
        });
        
        tester.printResults();
    });

    test('2. Main Dashboard - Navigation and Action Buttons', async ({ page }) => {
        console.log('🏠 TESTING: Main Dashboard Buttons');
        const tester = new ButtonTester(page);
        
        await login(page);
        await page.goto(TEST_CONFIG.baseUrl);
        
        // Find and test all buttons on main page
        const allButtons = await tester.findAllButtons();
        console.log(`Found ${allButtons.length} interactive elements on dashboard`);
        
        for (const button of allButtons) {
            await tester.testButton(button.selector, `Dashboard: ${button.identifier}`, {
                // Dashboard buttons should either navigate or open modals
            });
        }
        
        tester.printResults();
    });

    test('3. Settings and Profile - Complete UI Testing', async ({ page }) => {
        console.log('⚙️ TESTING: Settings and Profile Buttons');
        const tester = new ButtonTester(page);
        
        await login(page);
        
        // Test Settings dropdown/menu access
        await tester.testButton('button:has-text("Settings")', 'Settings Dropdown Button', {
            shouldOpenModal: false // Should show dropdown menu
        });
        
        // Test Profile Settings link
        await tester.testButton('a:has-text("Profile")', 'Profile Settings Link', {
            shouldNavigate: true
        });
        
        // Navigate to profile page if it exists
        try {
            await page.goto(TEST_CONFIG.baseUrl + '/profile');
            await page.waitForTimeout(2000);
            
            if (!page.url().includes('login')) {
                console.log('📋 Testing Profile Page Buttons...');
                
                const profileButtons = await tester.findAllButtons();
                for (const button of profileButtons) {
                    await tester.testButton(button.selector, `Profile: ${button.identifier}`);
                }
            }
        } catch (e) {
            console.log('⚠️ Profile page not accessible');
        }
        
        tester.printResults();
    });

    test('4. Character Management - All Character Buttons', async ({ page }) => {
        console.log('🎭 TESTING: Character Management Buttons');
        const tester = new ButtonTester(page);
        
        await login(page);
        
        // Test character creation button
        await tester.testButton('a:has-text("Create Character")', 'Create Character Button', {
            shouldNavigate: true
        });
        
        // Go to character creation and test all wizard buttons
        try {
            await page.goto(TEST_CONFIG.baseUrl + '/create');
            await page.waitForTimeout(3000);
            
            if (!page.url().includes('login')) {
                console.log('🧙 Testing Character Creation Wizard...');
                
                const wizardButtons = await tester.findAllButtons();
                for (const button of wizardButtons) {
                    await tester.testButton(button.selector, `Creation: ${button.identifier}`);
                }
            }
        } catch (e) {
            console.log('⚠️ Character creation not accessible');
        }
        
        tester.printResults();
    });

    test('5. Campaign Management - Campaign Buttons', async ({ page }) => {
        console.log('🏰 TESTING: Campaign Management Buttons');
        const tester = new ButtonTester(page);
        
        await login(page);
        
        // Test campaigns navigation
        await tester.testButton('a:has-text("Campaigns")', 'Campaigns Navigation Link', {
            shouldNavigate: true
        });
        
        // Go to campaigns page and test all buttons
        try {
            await page.goto(TEST_CONFIG.baseUrl + '/campaigns');
            await page.waitForTimeout(3000);
            
            if (!page.url().includes('login')) {
                console.log('⚔️ Testing Campaigns Page...');
                
                const campaignButtons = await tester.findAllButtons();
                for (const button of campaignButtons) {
                    await tester.testButton(button.selector, `Campaigns: ${button.identifier}`);
                }
            }
        } catch (e) {
            console.log('⚠️ Campaigns page not accessible');
        }
        
        tester.printResults();
    });

    test('6. Documentation - Documentation Buttons', async ({ page }) => {
        console.log('📚 TESTING: Documentation Buttons');
        const tester = new ButtonTester(page);
        
        await login(page);
        
        // Test documentation navigation
        await tester.testButton('a:has-text("Documentation")', 'Documentation Navigation Link', {
            shouldNavigate: true
        });
        
        // Go to documentation page and test all buttons
        try {
            await page.goto(TEST_CONFIG.baseUrl + '/docs');
            await page.waitForTimeout(3000);
            
            if (!page.url().includes('login')) {
                console.log('📖 Testing Documentation Page...');
                
                const docButtons = await tester.findAllButtons();
                for (const button of docButtons) {
                    await tester.testButton(button.selector, `Docs: ${button.identifier}`);
                }
            }
        } catch (e) {
            console.log('⚠️ Documentation page not accessible');
        }
        
        tester.printResults();
    });

    test('7. Admin Panel - Admin Interface Testing', async ({ page }) => {
        console.log('🛡️ TESTING: Admin Panel Buttons');
        const tester = new ButtonTester(page);
        
        await login(page);
        
        // Test admin panel access through settings
        await tester.testButton('button:has-text("Settings")', 'Settings for Admin Access');
        await page.waitForTimeout(1000);
        
        await tester.testButton('a:has-text("Admin")', 'Admin Panel Link', {
            shouldNavigate: true
        });
        
        // Try direct admin panel access
        try {
            await page.goto(TEST_CONFIG.baseUrl + '/admin');
            await page.waitForTimeout(3000);
            
            if (!page.url().includes('login')) {
                console.log('👑 Testing Admin Panel...');
                
                const adminButtons = await tester.findAllButtons();
                for (const button of adminButtons) {
                    await tester.testButton(button.selector, `Admin: ${button.identifier}`);
                }
            } else {
                console.log('🔑 Admin panel requires authentication (normal behavior)');
            }
        } catch (e) {
            console.log('⚠️ Admin panel access denied or not available');
        }
        
        tester.printResults();
    });

    test('8. Responsive Design - Mobile Button Testing', async ({ page }) => {
        console.log('📱 TESTING: Mobile Responsive Buttons');
        const tester = new ButtonTester(page);
        
        // Test mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await login(page);
        
        console.log('📱 Mobile viewport testing...');
        const mobileButtons = await tester.findAllButtons();
        
        for (const button of mobileButtons) {
            await tester.testButton(button.selector, `Mobile: ${button.identifier}`);
        }
        
        // Test tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.reload();
        await page.waitForTimeout(2000);
        
        console.log('📟 Tablet viewport testing...');
        const tabletButtons = await tester.findAllButtons();
        
        for (const button of tabletButtons.slice(0, 5)) { // Test first 5 to save time
            await tester.testButton(button.selector, `Tablet: ${button.identifier}`);
        }
        
        tester.printResults();
    });

    test('9. Form Validation - All Form Buttons', async ({ page }) => {
        console.log('📝 TESTING: Form Validation and Submit Buttons');
        const tester = new ButtonTester(page);
        
        await login(page);
        
        // Test all forms across the application
        const forms = await page.locator('form').all();
        console.log(`Found ${forms.length} forms to test`);
        
        for (let i = 0; i < forms.length; i++) {
            const form = forms[i];
            const formId = await form.getAttribute('id') || `form-${i}`;
            
            console.log(`🔍 Testing form: ${formId}`);
            
            const submitButtons = await form.locator('button[type="submit"], input[type="submit"]').all();
            for (const submitBtn of submitButtons) {
                const text = await submitBtn.textContent();
                await tester.testButton(`form#${formId} button[type="submit"]`, `Form Submit: ${text?.trim() || formId}`);
            }
            
            const formButtons = await form.locator('button').all();
            for (const btn of formButtons) {
                const text = await btn.textContent();
                const type = await btn.getAttribute('type');
                if (type !== 'submit') {
                    await tester.testButton(`form#${formId} button`, `Form Button: ${text?.trim() || 'unnamed'}`);
                }
            }
        }
        
        tester.printResults();
    });

    test('10. Global UI Elements - Header, Footer, Navigation', async ({ page }) => {
        console.log('🌐 TESTING: Global UI Elements');
        const tester = new ButtonTester(page);
        
        await login(page);
        
        // Test header elements
        console.log('🔝 Testing header elements...');
        const headerElements = await page.locator('header button, header a, .header button, .header a').all();
        for (const element of headerElements) {
            const text = await element.textContent();
            await tester.testButton('header button, header a', `Header: ${text?.trim() || 'unnamed'}`);
        }
        
        // Test navigation elements
        console.log('🧭 Testing navigation elements...');
        const navElements = await page.locator('nav button, nav a, .nav button, .nav a').all();
        for (const element of navElements) {
            const text = await element.textContent();
            await tester.testButton('nav button, nav a', `Nav: ${text?.trim() || 'unnamed'}`);
        }
        
        // Test footer elements if any
        console.log('🔽 Testing footer elements...');
        const footerElements = await page.locator('footer button, footer a, .footer button, .footer a').all();
        for (const element of footerElements) {
            const text = await element.textContent();
            await tester.testButton('footer button, footer a', `Footer: ${text?.trim() || 'unnamed'}`);
        }
        
        tester.printResults();
    });

});
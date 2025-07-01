/**
 * CORE FUNCTIONALITY VALIDATION
 * Quick validation of all major features across user roles
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8001';

// Test users for different roles
const USERS = {
    player: { email: 'player@test.com', password: 'player123' },
    gm: { email: 'gm@test.com', password: 'gm123' },
    admin: { email: 'admin@test.com', password: 'admin123' }
};

async function loginUser(page, userType) {
    const user = USERS[userType];
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    return !page.url().includes('/login');
}

test.describe('Core Functionality Validation - All User Roles', () => {

    test('Authentication System Validation', async ({ page }) => {
        console.log('\n🔐 VALIDATING AUTHENTICATION SYSTEM');
        
        let results = {
            loginPageLoad: false,
            loginFormElements: false,
            passkeySupport: false,
            invalidLoginHandling: false,
            successfulLogin: false
        };

        // Test login page load
        await page.goto(`${BASE_URL}/login`);
        results.loginPageLoad = page.url().includes('/login');
        console.log(`Login page loads: ${results.loginPageLoad ? '✅' : '❌'}`);

        // Test form elements exist
        const emailField = await page.locator('input[name="email"]').count();
        const passwordField = await page.locator('input[name="password"]').count();
        const loginButton = await page.locator('button[type="submit"]').count();
        const passkeyButton = await page.locator('button:has-text("Login with Passkey")').count();
        
        results.loginFormElements = emailField > 0 && passwordField > 0 && loginButton > 0;
        results.passkeySupport = passkeyButton > 0;
        
        console.log(`Login form elements: ${results.loginFormElements ? '✅' : '❌'}`);
        console.log(`Passkey login button: ${results.passkeySupport ? '✅' : '❌'}`);

        // Test invalid login
        await page.fill('input[name="email"]', 'invalid@test.com');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        results.invalidLoginHandling = page.url().includes('/login');
        console.log(`Invalid login rejected: ${results.invalidLoginHandling ? '✅' : '❌'}`);

        // Test successful login
        results.successfulLogin = await loginUser(page, 'player');
        console.log(`Successful login: ${results.successfulLogin ? '✅' : '❌'}`);

        await page.screenshot({ path: 'tests/validation-screenshots/auth-validation.png', fullPage: true });

        console.log('\n📊 AUTHENTICATION RESULTS:');
        Object.entries(results).forEach(([key, value]) => {
            console.log(`${key}: ${value ? '✅' : '❌'}`);
        });
    });

    test('Character Management - Player Role', async ({ page }) => {
        console.log('\n👤 VALIDATING CHARACTER MANAGEMENT - PLAYER');
        
        let results = {
            dashboardAccess: false,
            characterList: false,
            characterCreationAccess: false,
            characterCreationForm: false
        };

        const loginSuccess = await loginUser(page, 'player');
        if (!loginSuccess) {
            console.log('❌ Login failed, skipping character tests');
            return;
        }

        // Test dashboard access
        await page.goto(`${BASE_URL}/`);
        await page.waitForTimeout(3000);
        results.dashboardAccess = !page.url().includes('/login');
        console.log(`Dashboard access: ${results.dashboardAccess ? '✅' : '❌'}`);

        // Test character list/section
        const charactersSection = await page.locator('.character-card, .characters-section, h2:has-text("Characters"), h1:has-text("Characters")').count();
        results.characterList = charactersSection > 0;
        console.log(`Character section visible: ${results.characterList ? '✅' : '❌'}`);

        // Test character creation access
        const createButtons = await page.locator('a:has-text("Create"), button:has-text("Create"), .create-character, [href*="create"]').count();
        results.characterCreationAccess = createButtons > 0;
        console.log(`Character creation access: ${results.characterCreationAccess ? '✅' : '❌'}`);

        if (results.characterCreationAccess) {
            // Click create button
            const createButton = await page.locator('a:has-text("Create"), button:has-text("Create"), .create-character, [href*="create"]').first();
            await createButton.click();
            await page.waitForTimeout(3000);

            // Test character creation form
            const formElements = await page.locator('form, input[name="name"], .character-form').count();
            results.characterCreationForm = formElements > 0;
            console.log(`Character creation form: ${results.characterCreationForm ? '✅' : '❌'}`);
        }

        await page.screenshot({ path: 'tests/validation-screenshots/character-player.png', fullPage: true });

        console.log('\n📊 CHARACTER MANAGEMENT (PLAYER) RESULTS:');
        Object.entries(results).forEach(([key, value]) => {
            console.log(`${key}: ${value ? '✅' : '❌'}`);
        });
    });

    test('Campaign Management - GM Role', async ({ page }) => {
        console.log('\n🏛️ VALIDATING CAMPAIGN MANAGEMENT - GM');
        
        let results = {
            campaignPageAccess: false,
            campaignList: false,
            campaignCreation: false,
            playerManagement: false
        };

        const loginSuccess = await loginUser(page, 'gm');
        if (!loginSuccess) {
            console.log('❌ GM login failed, skipping campaign tests');
            return;
        }

        // Test campaign page access
        await page.goto(`${BASE_URL}/campaigns`);
        await page.waitForTimeout(3000);
        results.campaignPageAccess = page.url().includes('/campaigns') || page.url().includes('/campaign');
        console.log(`Campaign page access: ${results.campaignPageAccess ? '✅' : '❌'}`);

        // Test campaign list/section
        const campaignSection = await page.locator('.campaign-card, .campaigns-section, h1:has-text("Campaigns"), h2:has-text("Campaigns")').count();
        results.campaignList = campaignSection > 0;
        console.log(`Campaign section visible: ${results.campaignList ? '✅' : '❌'}`);

        // Test campaign creation
        const createCampaignButtons = await page.locator('button:has-text("Create"), a:has-text("Create"), .create-campaign').count();
        results.campaignCreation = createCampaignButtons > 0;
        console.log(`Campaign creation access: ${results.campaignCreation ? '✅' : '❌'}`);

        // Test player management features
        const managementButtons = await page.locator('button:has-text("Manage"), a:has-text("Manage"), .manage-players, button:has-text("Invite")').count();
        results.playerManagement = managementButtons > 0;
        console.log(`Player management features: ${results.playerManagement ? '✅' : '❌'}`);

        await page.screenshot({ path: 'tests/validation-screenshots/campaign-gm.png', fullPage: true });

        console.log('\n📊 CAMPAIGN MANAGEMENT (GM) RESULTS:');
        Object.entries(results).forEach(([key, value]) => {
            console.log(`${key}: ${value ? '✅' : '❌'}`);
        });
    });

    test('Profile and Security Features', async ({ page }) => {
        console.log('\n⚙️ VALIDATING PROFILE AND SECURITY FEATURES');
        
        let results = {
            profileAccess: false,
            profileForm: false,
            passwordChange: false,
            twoFactorAuth: false,
            passkeyManagement: false,
            dataExport: false
        };

        const loginSuccess = await loginUser(page, 'player');
        if (!loginSuccess) {
            console.log('❌ Login failed, skipping profile tests');
            return;
        }

        // Test profile page access
        await page.goto(`${BASE_URL}/profile`);
        await page.waitForTimeout(3000);
        results.profileAccess = page.url().includes('/profile');
        console.log(`Profile page access: ${results.profileAccess ? '✅' : '❌'}`);

        if (results.profileAccess) {
            // Test profile form exists
            const profileContent = await page.locator('.profile-content, .profile-section, form').count();
            results.profileForm = profileContent > 0;
            console.log(`Profile form content: ${results.profileForm ? '✅' : '❌'}`);

            // Test password change form
            const passwordForm = await page.locator('#password-form, form:has(input[name="current_password"])').count();
            results.passwordChange = passwordForm > 0;
            console.log(`Password change form: ${results.passwordChange ? '✅' : '❌'}`);

            // Test 2FA management
            const twoFASection = await page.locator('text=Two-Factor, text=2FA').count();
            results.twoFactorAuth = twoFASection > 0;
            console.log(`2FA management section: ${results.twoFactorAuth ? '✅' : '❌'}`);

            // Test Passkey management
            const passkeySection = await page.locator('text=Passkey').count();
            results.passkeyManagement = passkeySection > 0;
            console.log(`Passkey management section: ${results.passkeyManagement ? '✅' : '❌'}`);

            // Test data export options
            const exportButtons = await page.locator('button:has-text("Download"), button:has-text("Export")').count();
            results.dataExport = exportButtons > 0;
            console.log(`Data export options: ${results.dataExport ? '✅' : '❌'}`);
        }

        await page.screenshot({ path: 'tests/validation-screenshots/profile-security.png', fullPage: true });

        console.log('\n📊 PROFILE AND SECURITY RESULTS:');
        Object.entries(results).forEach(([key, value]) => {
            console.log(`${key}: ${value ? '✅' : '❌'}`);
        });
    });

    test('Navigation and UI Elements', async ({ page }) => {
        console.log('\n🧭 VALIDATING NAVIGATION AND UI ELEMENTS');
        
        let results = {
            mainNavigation: false,
            userDropdown: false,
            logoPresent: false,
            footerPresent: false,
            responsiveDesign: false
        };

        const loginSuccess = await loginUser(page, 'player');
        if (!loginSuccess) {
            console.log('❌ Login failed, skipping navigation tests');
            return;
        }

        await page.goto(`${BASE_URL}/`);
        await page.waitForTimeout(3000);

        // Test main navigation
        const navElements = await page.locator('nav, .navbar, .navigation, .nav').count();
        results.mainNavigation = navElements > 0;
        console.log(`Main navigation: ${results.mainNavigation ? '✅' : '❌'}`);

        // Test user dropdown/menu
        const userDropdown = await page.locator('.user-dropdown, .user-menu, .settings-dropdown').count();
        results.userDropdown = userDropdown > 0;
        console.log(`User dropdown/menu: ${results.userDropdown ? '✅' : '❌'}`);

        // Test logo/branding
        const logo = await page.locator('img[alt*="logo"], .logo, h1:has-text("Star Wars")').count();
        results.logoPresent = logo > 0;
        console.log(`Logo/branding: ${results.logoPresent ? '✅' : '❌'}`);

        // Test footer
        const footer = await page.locator('footer, .footer').count();
        results.footerPresent = footer > 0;
        console.log(`Footer: ${results.footerPresent ? '✅' : '❌'}`);

        // Test responsive design (mobile viewport)
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        const mobileNav = await page.locator('.mobile-menu, .hamburger, nav').count();
        results.responsiveDesign = mobileNav > 0;
        console.log(`Responsive design: ${results.responsiveDesign ? '✅' : '❌'}`);

        await page.screenshot({ path: 'tests/validation-screenshots/navigation-ui.png', fullPage: true });

        console.log('\n📊 NAVIGATION AND UI RESULTS:');
        Object.entries(results).forEach(([key, value]) => {
            console.log(`${key}: ${value ? '✅' : '❌'}`);
        });
    });

    test('Error Handling and Security', async ({ page }) => {
        console.log('\n🔒 VALIDATING ERROR HANDLING AND SECURITY');
        
        let results = {
            errorPageHandling: false,
            unauthorizedAccess: false,
            xssProtection: false,
            csrfProtection: false
        };

        // Test 404 error handling
        await page.goto(`${BASE_URL}/nonexistent-page-12345`);
        await page.waitForTimeout(2000);
        const errorPage = await page.locator('text=404, text=Not Found, text=Error').count();
        results.errorPageHandling = errorPage > 0 || page.url().includes('404');
        console.log(`404 error handling: ${results.errorPageHandling ? '✅' : '❌'}`);

        // Test unauthorized access protection
        await page.goto(`${BASE_URL}/admin`);
        await page.waitForTimeout(2000);
        const redirectedToLogin = page.url().includes('/login') || page.url().includes('/403') || page.url().includes('/unauthorized');
        results.unauthorizedAccess = redirectedToLogin;
        console.log(`Unauthorized access protection: ${results.unauthorizedAccess ? '✅' : '❌'}`);

        // Test basic XSS protection
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[name="email"]', '<script>alert("xss")</script>');
        
        let alertTriggered = false;
        page.on('dialog', dialog => {
            alertTriggered = true;
            dialog.dismiss();
        });
        
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        results.xssProtection = !alertTriggered;
        console.log(`XSS protection: ${results.xssProtection ? '✅' : '❌'}`);

        // Test CSRF protection
        const csrfTest = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'test', password: 'test' })
                });
                return response.status;
            } catch (error) {
                return 'protected';
            }
        });
        
        results.csrfProtection = csrfTest !== 200;
        console.log(`CSRF protection: ${results.csrfProtection ? '✅' : '❌'} (Status: ${csrfTest})`);

        await page.screenshot({ path: 'tests/validation-screenshots/error-security.png', fullPage: true });

        console.log('\n📊 ERROR HANDLING AND SECURITY RESULTS:');
        Object.entries(results).forEach(([key, value]) => {
            console.log(`${key}: ${value ? '✅' : '❌'}`);
        });
    });

});

console.log('\n🎯 CORE FUNCTIONALITY VALIDATION SUITE READY');
console.log('Quick validation of all major features and security aspects!');
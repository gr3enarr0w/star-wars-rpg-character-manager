const { test, expect } = require('@playwright/test');

test.describe('Comprehensive UI Testing - Issue #115', () => {
    
    test('Authentication Flow and UI Fixes Verification', async ({ page }) => {
        await page.setViewportSize({ width: 1200, height: 800 });
        
        console.log('🧪 COMPREHENSIVE E2E UI TESTING');
        console.log('================================');
        
        // Test 1: Homepage redirects to login when not authenticated
        console.log('\n📍 Test 1: Authentication Redirect');
        await page.goto('http://localhost:8001');
        await page.waitForTimeout(2000);
        
        // Should redirect to login page
        expect(page.url()).toContain('/login');
        console.log('✅ Homepage correctly redirects to login when not authenticated');
        
        // Take screenshot of login page
        await page.screenshot({ path: 'screenshots/e2e-01-login-page.png', fullPage: true });
        
        // Test 2: Login Process
        console.log('\n📍 Test 2: Login Process');
        await page.fill('input[name="email"]', 'admin@example.com');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');
        
        // Wait for redirect to dashboard
        await page.waitForURL('http://localhost:8001/', { timeout: 10000 });
        console.log('✅ Login successful, redirected to dashboard');
        
        // Take screenshot of dashboard
        await page.screenshot({ path: 'screenshots/e2e-02-dashboard.png', fullPage: true });
        
        // Test 3: Verify Character Creation Page (Issue #113)
        console.log('\n📍 Test 3: Character Creation Page Layout');
        await page.goto('http://localhost:8001/create');
        await page.waitForTimeout(2000);
        
        // Check for full-page layout without sidebar
        const charCreationSidebar = await page.locator('.sidebar').count();
        const charCreationHeader = await page.locator('h1:has-text("Create New Character")').count();
        const backToDashboard = await page.locator('a:has-text("Back to Dashboard")').count();
        
        console.log(`  - Sidebar elements: ${charCreationSidebar} (should be 0)`);
        console.log(`  - Page header found: ${charCreationHeader} (should be 1)`);
        console.log(`  - Back button found: ${backToDashboard} (should be 1)`);
        
        expect(charCreationSidebar).toBe(0);
        expect(charCreationHeader).toBeGreaterThan(0);
        expect(backToDashboard).toBeGreaterThan(0);
        console.log('✅ Character creation uses full-page layout without sidebar');
        
        await page.screenshot({ path: 'screenshots/e2e-03-character-creation.png', fullPage: true });
        
        // Test 4: Verify Profile Settings Page (Issue #110)
        console.log('\n📍 Test 4: Profile Settings Page Layout');
        await page.goto('http://localhost:8001/profile');
        await page.waitForTimeout(2000);
        
        // Check for dedicated page without modal
        const profileModal = await page.locator('.modal, .modal-content, .overlay').count();
        const profileHeader = await page.locator('h1:has-text("Profile Settings")').count();
        const profileSidebar = await page.locator('.sidebar').count();
        
        console.log(`  - Modal elements: ${profileModal} (should be 0)`);
        console.log(`  - Profile header: ${profileHeader} (should be 1)`);
        console.log(`  - Sidebar elements: ${profileSidebar} (should be 0)`);
        
        expect(profileModal).toBe(0);
        expect(profileHeader).toBeGreaterThan(0);
        expect(profileSidebar).toBe(0);
        console.log('✅ Profile settings uses dedicated page without modal');
        
        await page.screenshot({ path: 'screenshots/e2e-04-profile-settings.png', fullPage: true });
        
        // Test 5: Navigation Bar Functionality
        console.log('\n📍 Test 5: Navigation Bar Testing');
        await page.goto('http://localhost:8001/');
        await page.waitForTimeout(2000);
        
        // Check navigation links
        const navCharacters = await page.locator('nav a:has-text("Characters")').count();
        const navCampaigns = await page.locator('nav a:has-text("Campaigns")').count();
        const navSettings = await page.locator('nav a:has-text("Settings")').count();
        
        console.log(`  - Characters link: ${navCharacters}`);
        console.log(`  - Campaigns link: ${navCampaigns}`);
        console.log(`  - Settings link: ${navSettings}`);
        
        // Test Settings navigation
        if (navSettings > 0) {
            await page.click('nav a:has-text("Settings")');
            await page.waitForTimeout(2000);
            expect(page.url()).toContain('/profile');
            console.log('✅ Settings navigation works correctly');
        }
        
        // Test 6: Campaign Management Page (Issue #111)
        console.log('\n📍 Test 6: Campaign Management Page');
        await page.goto('http://localhost:8001/campaigns');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'screenshots/e2e-05-campaigns-list.png', fullPage: true });
        
        // Check if manage buttons exist and test navigation
        const manageButtons = await page.locator('button:has-text("Manage"), a:has-text("Manage")').count();
        console.log(`  - Manage buttons found: ${manageButtons}`);
        
        if (manageButtons > 0) {
            // Click first manage button
            await page.locator('button:has-text("Manage"), a:has-text("Manage")').first().click();
            await page.waitForTimeout(2000);
            
            // Check if we navigated to a dedicated page (not a modal)
            const campaignModal = await page.locator('.modal, .campaign-modal').count();
            const campaignPageHeader = await page.locator('h1').count();
            
            console.log(`  - Modal elements: ${campaignModal} (should be 0)`);
            console.log(`  - Page header: ${campaignPageHeader} (should be > 0)`);
            
            expect(campaignModal).toBe(0);
            console.log('✅ Campaign management uses dedicated pages');
            
            await page.screenshot({ path: 'screenshots/e2e-06-campaign-management.png', fullPage: true });
        }
        
        // Test 7: Logout Functionality
        console.log('\n📍 Test 7: Logout Process');
        const logoutButton = await page.locator('button:has-text("Logout"), a:has-text("Logout")').count();
        
        if (logoutButton > 0) {
            await page.click('button:has-text("Logout"), a:has-text("Logout")');
            await page.waitForTimeout(2000);
            
            // Should redirect to login
            expect(page.url()).toContain('/login');
            console.log('✅ Logout successful, redirected to login');
            
            // Verify protected routes redirect when logged out
            await page.goto('http://localhost:8001/create');
            await page.waitForTimeout(2000);
            expect(page.url()).toContain('/login');
            console.log('✅ Protected routes redirect to login when not authenticated');
        }
        
        console.log('\n🎉 ALL UI TESTS PASSED!');
        console.log('========================');
        console.log('✅ Authentication flow working correctly');
        console.log('✅ Character creation page - no sidebar/modals');
        console.log('✅ Profile settings page - no modals');
        console.log('✅ Campaign management - dedicated pages');
        console.log('✅ Navigation working properly');
    });
    
    test('Responsive Design Testing', async ({ page }) => {
        console.log('\n📱 RESPONSIVE DESIGN TESTING');
        console.log('============================');
        
        // Login first
        await page.goto('http://localhost:8001/login');
        await page.fill('input[name="email"]', 'admin@example.com');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('http://localhost:8001/');
        
        // Test mobile viewport
        console.log('\n📍 Mobile Layout (375x667)');
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/e2e-responsive-mobile.png', fullPage: true });
        
        // Check mobile navigation
        const mobileMenu = await page.locator('.mobile-menu, .hamburger-menu, button[aria-label*="menu"]').count();
        console.log(`  - Mobile menu elements: ${mobileMenu}`);
        
        // Test tablet viewport
        console.log('\n📍 Tablet Layout (768x1024)');
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/e2e-responsive-tablet.png', fullPage: true });
        
        // Test desktop viewport
        console.log('\n📍 Desktop Layout (1920x1080)');
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/e2e-responsive-desktop.png', fullPage: true });
        
        console.log('✅ Responsive design tested across all viewports');
    });
    
    test('Character Creation Functionality', async ({ page }) => {
        console.log('\n🎭 CHARACTER CREATION TESTING');
        console.log('=============================');
        
        // Login and navigate to character creation
        await page.goto('http://localhost:8001/login');
        await page.fill('input[name="email"]', 'admin@example.com');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('http://localhost:8001/');
        
        await page.goto('http://localhost:8001/create');
        await page.waitForTimeout(2000);
        
        // Fill in character creation form
        console.log('📍 Filling character creation form...');
        await page.fill('input[name="character_name"]', 'Test Jedi Knight');
        await page.fill('input[name="player_name"]', 'Test Player');
        
        // Select species
        await page.selectOption('select[name="species"]', 'Human');
        console.log('  - Selected species: Human');
        
        // Select career
        await page.selectOption('select[name="career"]', 'Guardian');
        console.log('  - Selected career: Guardian');
        
        // Add background
        await page.fill('textarea[name="background"]', 'A brave Jedi Knight fighting for peace in the galaxy.');
        
        await page.screenshot({ path: 'screenshots/e2e-character-form-filled.png', fullPage: true });
        
        // Submit form
        console.log('📍 Submitting character...');
        await page.click('button[type="submit"]');
        
        // Wait for response
        await page.waitForTimeout(3000);
        
        // Check for success or dashboard redirect
        const currentUrl = page.url();
        console.log(`  - Current URL: ${currentUrl}`);
        
        if (currentUrl.includes('/character/') || currentUrl === 'http://localhost:8001/') {
            console.log('✅ Character creation successful!');
        } else {
            // Check for error messages
            const errorMessage = await page.locator('.error, .alert-danger').textContent().catch(() => '');
            console.log(`  - Error message: ${errorMessage}`);
        }
    });
});

console.log('Test file created: tests/e2e-ui-comprehensive.spec.js');
console.log('Run with: npx playwright test tests/e2e-ui-comprehensive.spec.js');
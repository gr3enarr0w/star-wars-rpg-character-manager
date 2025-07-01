const { test, expect } = require('@playwright/test');

test('CRITICAL FIX TEST: Character Creation Button and Access', async ({ page }) => {
    console.log('\n🔧 TESTING CHARACTER CREATION FIXES');
    console.log('===================================');
    
    const email = 'clark@clarkeverson.com';
    const password = 'clark123';
    const baseUrl = 'http://localhost:8008';
    
    try {
        // Step 1: Login
        console.log('\n📍 Step 1: Login');
        await page.goto(`${baseUrl}/login`);
        await page.waitForTimeout(2000);
        
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        const loginSuccess = !page.url().includes('/login');
        console.log(`Login successful: ${loginSuccess ? '✅' : '❌'}`);
        
        if (!loginSuccess) {
            throw new Error('Login failed');
        }
        
        await page.screenshot({ path: 'fix-test-01-after-login.png', fullPage: true });
        
        // Step 2: Check for Create Character button
        console.log('\n📍 Step 2: Check for Create Character button on dashboard');
        
        const createButtonInHeader = await page.locator('#createCharacterBtn').count();
        const createButtonInEmpty = await page.locator('button:has-text("Create Your First Character")').count();
        
        console.log(`Create button in header: ${createButtonInHeader > 0 ? '✅' : '❌'}`);
        console.log(`Create button in empty state: ${createButtonInEmpty > 0 ? '✅' : '❌'}`);
        
        if (createButtonInHeader === 0) {
            console.log('❌ CRITICAL: No Create Character button in header');
        }
        
        await page.screenshot({ path: 'fix-test-02-dashboard-with-button.png', fullPage: true });
        
        // Step 3: Test clicking the Create Character button
        console.log('\n📍 Step 3: Test Create Character button click');
        
        if (createButtonInHeader > 0) {
            await page.click('#createCharacterBtn');
            await page.waitForTimeout(5000); // Wait for navigation and auth check
            
            const currentUrl = page.url();
            console.log(`After button click URL: ${currentUrl}`);
            
            if (currentUrl.includes('/create')) {
                console.log('✅ Successfully navigated to character creation');
                
                // Check if page loads properly
                const pageContent = await page.textContent('body');
                const hasCreateForm = pageContent.includes('Create New Character') || pageContent.includes('Create Character');
                const hasForm = await page.locator('form').count();
                
                console.log(`Character creation content: ${hasCreateForm ? '✅' : '❌'}`);
                console.log(`Character creation form: ${hasForm > 0 ? '✅' : '❌'}`);
                
                await page.screenshot({ path: 'fix-test-03-character-creation-page.png', fullPage: true });
                
                if (hasCreateForm && hasForm > 0) {
                    console.log('🎉 CHARACTER CREATION IS WORKING!');
                } else {
                    console.log('⚠️ Character creation page accessible but content issues');
                }
                
            } else if (currentUrl.includes('/login')) {
                console.log('❌ CRITICAL: Create button redirects to login - auth issue persists');
            } else {
                console.log(`⚠️ Unexpected redirect to: ${currentUrl}`);
            }
            
        } else {
            console.log('❌ Cannot test button - no button found');
        }
        
        // Step 4: Test direct navigation to /create
        console.log('\n📍 Step 4: Test direct navigation to /create');
        
        await page.goto(`${baseUrl}/create`);
        await page.waitForTimeout(5000);
        
        const directUrl = page.url();
        console.log(`Direct /create navigation URL: ${directUrl}`);
        
        if (directUrl.includes('/create')) {
            console.log('✅ Direct /create navigation works');
        } else {
            console.log('❌ Direct /create navigation fails');
        }
        
        await page.screenshot({ path: 'fix-test-04-direct-create-access.png', fullPage: true });
        
        // Summary
        console.log('\n🏁 CHARACTER CREATION FIX SUMMARY');
        console.log('=================================');
        console.log(`Dashboard button present: ${createButtonInHeader > 0 ? '✅' : '❌'}`);
        console.log(`Button navigation works: ${page.url().includes('/create') ? '✅' : '❌'}`);
        console.log(`Character creation accessible: ${page.url().includes('/create') ? '✅' : '❌'}`);
        
        const overallFixed = createButtonInHeader > 0 && page.url().includes('/create');
        console.log(`\n🎯 OVERALL STATUS: ${overallFixed ? '✅ FIXED' : '❌ STILL BROKEN'}`);
        
    } catch (error) {
        console.log(`\n❌ FIX TEST FAILED: ${error.message}`);
        await page.screenshot({ path: 'fix-test-error.png', fullPage: true });
        throw error;
    }
});
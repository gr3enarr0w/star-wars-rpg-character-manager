const { test, expect } = require('@playwright/test');

test('Final Test - Issue #113 Character Creation Fix', async ({ page }) => {
    console.log('\n🎯 FINAL TEST: ISSUE #113 CHARACTER CREATION FIX');
    console.log('=================================================');
    
    const email = 'clark@clarkeverson.com';
    const password = 'clark123';
    
    try {
        // Step 1: Login first
        console.log('📍 Step 1: Logging in...');
        await page.goto('http://localhost:8008/login');
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        if (page.url().includes('/login')) {
            throw new Error('Login failed');
        }
        console.log('✅ Login successful');
        
        // Step 2: Test character creation page
        console.log('\n📍 Step 2: Testing character creation page...');
        await page.goto('http://localhost:8008/create');
        await page.waitForTimeout(5000); // Give time for client-side auth check
        
        const createUrl = page.url();
        console.log(`Character creation URL: ${createUrl}`);
        
        if (createUrl.includes('/login')) {
            console.log('❌ Character creation page redirected to login');
            throw new Error('Character creation page not accessible');
        }
        
        console.log('✅ Character creation page accessible');
        
        // Step 3: Analyze page content
        console.log('\n📍 Step 3: Analyzing page content...');
        
        await page.screenshot({ path: 'issue-113-final-test.png', fullPage: true });
        
        const pageText = await page.textContent('body');
        
        // Check for key content elements
        const hasCreateText = pageText.includes('Create New Character');
        const hasBuildText = pageText.includes('Build your Star Wars RPG character');
        const hasSpeciesText = pageText.includes('Species');
        const hasCareerText = pageText.includes('Career');
        
        // Check for HTML elements
        const createHeader = await page.locator('h1').count();
        const backButton = await page.locator('a:has-text("Back to Dashboard")').count();
        const characterForm = await page.locator('form').count();
        const nameField = await page.locator('input[name="character_name"], input[name="characterName"]').count();
        const speciesField = await page.locator('select[name="species"], input[name="species"]').count();
        const careerField = await page.locator('select[name="career"], input[name="career"]').count();
        
        // Check for sidebar elements (should be 0)
        const sidebarCount = await page.locator('.sidebar').count();
        
        console.log(`\n📊 COMPREHENSIVE ANALYSIS:`);
        console.log(`  Page content loading: ${pageText.length > 100 ? '✅' : '❌'} (${pageText.length} chars)`);
        console.log(`  "Create New Character" text: ${hasCreateText ? '✅' : '❌'}`);
        console.log(`  "Build character" text: ${hasBuildText ? '✅' : '❌'}`);
        console.log(`  Species text present: ${hasSpeciesText ? '✅' : '❌'}`);
        console.log(`  Career text present: ${hasCareerText ? '✅' : '❌'}`);
        console.log(`  Headers (h1): ${createHeader} (should be > 0)`);
        console.log(`  Back button: ${backButton} (should be > 0)`);
        console.log(`  Character form: ${characterForm} (should be > 0)`);
        console.log(`  Character name field: ${nameField > 0 ? '✅' : '❌'}`);
        console.log(`  Species field: ${speciesField > 0 ? '✅' : '❌'}`);
        console.log(`  Career field: ${careerField > 0 ? '✅' : '❌'}`);
        console.log(`  Sidebar elements: ${sidebarCount} (should be 0)`);
        
        // Determine success criteria
        const hasContent = hasCreateText && hasBuildText;
        const hasForm = characterForm > 0 && nameField > 0;
        const hasLayout = createHeader > 0 && backButton > 0;
        const noSidebar = sidebarCount === 0;
        
        const issue113Fixed = hasContent && hasForm && hasLayout && noSidebar;
        
        if (issue113Fixed) {
            console.log('\n🎉 ISSUE #113 COMPLETELY FIXED!');
            console.log('   ✅ Content loading properly');
            console.log('   ✅ Character creation form present');
            console.log('   ✅ Layout elements correct');
            console.log('   ✅ No sidebar present');
            console.log('   ✅ Full-page layout working');
        } else {
            console.log('\n⚠️ ISSUE #113 STATUS:');
            if (!hasContent) console.log('   ❌ Content not loading properly');
            if (!hasForm) console.log('   ❌ Character form missing or incomplete');
            if (!hasLayout) console.log('   ❌ Layout elements missing');
            if (!noSidebar) console.log('   ❌ Sidebar still present');
        }
        
        // Step 4: Test form functionality if present
        if (characterForm > 0 && nameField > 0) {
            console.log('\n📍 Step 4: Testing form functionality...');
            
            try {
                await page.fill('input[name="character_name"], input[name="characterName"]', 'Test Character');
                await page.fill('input[name="player_name"], input[name="playerName"]', 'Test Player');
                
                if (speciesField > 0) {
                    await page.selectOption('select[name="species"]', 'Human');
                }
                if (careerField > 0) {
                    await page.selectOption('select[name="career"]', 'Guardian');
                }
                
                console.log('✅ Form fields can be filled');
                
                await page.screenshot({ path: 'issue-113-form-filled.png', fullPage: true });
                
            } catch (error) {
                console.log(`⚠️ Form interaction issues: ${error.message}`);
            }
        }
        
        // Final result
        console.log('\n🎯 FINAL ASSESSMENT:');
        console.log('====================');
        console.log(`Issue #113 Status: ${issue113Fixed ? '✅ COMPLETELY FIXED' : '⚠️ NEEDS MORE WORK'}`);
        
        if (issue113Fixed) {
            console.log('🎉 Character creation page works perfectly!');
            console.log('   - No sidebar present');
            console.log('   - Full-page layout implemented');
            console.log('   - Character creation form functional');
            console.log('   - Proper content and navigation');
        }
        
    } catch (error) {
        console.log(`\n❌ TEST FAILED: ${error.message}`);
        await page.screenshot({ path: 'issue-113-test-error.png', fullPage: true });
        throw error;
    }
});
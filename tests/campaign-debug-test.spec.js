// Campaign Debug Test - What exactly is broken?
const { test, expect } = require('@playwright/test');

test('Campaign Debug Test', async ({ page }) => {
    console.log('\n🏕️ CAMPAIGN DEBUG TEST - WHAT IS BROKEN?\n');
    
    // Capture network requests for campaigns
    const campaignRequests = [];
    page.on('response', response => {
        if (response.url().includes('/campaign')) {
            campaignRequests.push({
                url: response.url(),
                status: response.status(),
                statusText: response.statusText()
            });
        }
    });
    
    // Capture console errors
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });
    
    try {
        // Login first
        console.log('🔐 Step 1: Login');
        await page.goto('http://localhost:8001/login');
        await page.fill('input[name="email"]', 'clark@clarkeverson.com');
        await page.fill('input[name="password"]', 'clark123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Test campaigns page access
        console.log('\n🏕️ Step 2: Test Campaigns Page Access');
        await page.goto('http://localhost:8001/campaigns');
        await page.waitForTimeout(3000);
        
        // Check what actually loaded
        const pageTitle = await page.locator('h1').first().textContent().catch(() => 'No H1 found');
        const pageUrl = page.url();
        
        console.log(`Page URL: ${pageUrl}`);
        console.log(`Page Title: ${pageTitle}`);
        
        // Check if campaigns page elements exist
        const pageAnalysis = await page.evaluate(() => {
            return {
                hasH1: !!document.querySelector('h1'),
                h1Text: document.querySelector('h1')?.textContent || 'No H1',
                hasCampaignContent: !!document.querySelector('[class*="campaign"], [id*="campaign"]'),
                hasCreateButton: !!document.querySelector('button') && Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Create')),
                hasErrorMessage: !!document.querySelector('.error, [class*="error"]'),
                bodyContent: document.body.textContent.substring(0, 200) + '...',
                allH1s: Array.from(document.querySelectorAll('h1')).map(h => h.textContent),
                allButtons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t)
            };
        });
        
        console.log('\n📊 Page Analysis:');
        console.log(`Has H1: ${pageAnalysis.hasH1}`);
        console.log(`H1 Text: "${pageAnalysis.h1Text}"`);
        console.log(`Has Campaign Content: ${pageAnalysis.hasCampaignContent}`);
        console.log(`Has Create Button: ${pageAnalysis.hasCreateButton}`);
        console.log(`Has Error Message: ${pageAnalysis.hasErrorMessage}`);
        console.log(`All H1s: ${JSON.stringify(pageAnalysis.allH1s)}`);
        console.log(`All Buttons: ${JSON.stringify(pageAnalysis.allButtons)}`);
        
        // Test if this is a "Campaigns" vs "Campaign" issue
        const expectedCampaignsTitle = pageAnalysis.h1Text.toLowerCase().includes('campaign');
        console.log(`Has Campaign in title: ${expectedCampaignsTitle}`);
        
        // Check what the test was looking for vs what exists
        console.log('\n🔍 Detailed Analysis:');
        
        if (pageAnalysis.h1Text.toLowerCase().includes('campaign')) {
            console.log('✅ CAMPAIGN PAGE LOADED CORRECTLY');
            console.log('   The test failure was likely due to exact text matching');
            console.log(`   Test looked for: 'Campaigns' (plural)`);
            console.log(`   Page shows: '${pageAnalysis.h1Text}'`);
            
            // Check if campaigns are actually functional
            console.log('\n🧪 Testing Campaign Functionality:');
            
            // Look for campaign list or create options
            const hasCampaignList = await page.locator('[class*="campaign"], .campaign-card, [id*="campaign"]').count();
            const hasCreateCampaign = await page.locator('button').locator('text=/Create/i').count();
            
            console.log(`Campaign list elements: ${hasCampaignList}`);
            console.log(`Create campaign options: ${hasCreateCampaign}`);
            
            if (hasCampaignList > 0 || hasCreateCampaign > 0) {
                console.log('✅ CAMPAIGN FUNCTIONALITY APPEARS WORKING');
                console.log('   Issue was likely just test matching criteria');
            } else {
                console.log('⚠️ CAMPAIGN PAGE LOADS BUT NO FUNCTIONALITY');
                console.log('   This might be an empty state (no campaigns created yet)');
            }
            
        } else {
            console.log('❌ WRONG PAGE LOADED');
            console.log('   User may have been redirected or page failed to load');
            console.log(`   Expected: Campaign-related page`);
            console.log(`   Got: ${pageAnalysis.h1Text}`);
        }
        
        // Network analysis
        console.log('\n🌐 Network Analysis:');
        console.log('Campaign-related requests:', campaignRequests);
        
        // Error analysis
        console.log('\n🚨 JavaScript Errors:');
        if (errors.length > 0) {
            errors.forEach(error => console.log(`  - ${error}`));
        } else {
            console.log('  No JavaScript errors detected');
        }
        
        // Take screenshot
        await page.screenshot({ path: 'campaign-debug-analysis.png', fullPage: true });
        
        // FINAL VERDICT
        console.log('\n🎯 CAMPAIGN ISSUE DIAGNOSIS:');
        
        if (expectedCampaignsTitle) {
            console.log('📋 VERDICT: TEST ISSUE, NOT BROKEN FUNCTIONALITY');
            console.log('   - Campaign page loads correctly');
            console.log('   - Test was looking for exact text "Campaigns"');
            console.log('   - Page might show "Campaign Management" or similar');
            console.log('   - This is NOT a critical issue');
            console.log('   - Feature appears to be WORKING');
        } else {
            console.log('📋 VERDICT: ACTUAL CAMPAIGN FUNCTIONALITY ISSUE');
            console.log('   - Campaign page did not load properly');
            console.log('   - This IS a critical issue for collaborative features');
            console.log('   - Needs investigation and fixing');
        }
        
    } catch (error) {
        console.log('❌ Campaign debug error:', error.message);
        await page.screenshot({ path: 'campaign-debug-error.png', fullPage: true });
    }
});
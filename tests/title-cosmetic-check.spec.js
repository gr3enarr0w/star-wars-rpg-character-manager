// Title and Cosmetic Issues Check
const { test, expect } = require('@playwright/test');

test('Title and Cosmetic Issues Check', async ({ page }) => {
    console.log('\n✨ TITLE AND COSMETIC ISSUES CHECK\n');
    
    const issues = [];
    
    try {
        // Login first
        console.log('🔐 Step 1: Login');
        await page.goto('http://localhost:8001/login');
        await page.fill('input[name="email"]', 'clark@clarkeverson.com');
        await page.fill('input[name="password"]', 'clark123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // ========================================
        // CHECK DASHBOARD/HOME PAGE
        // ========================================
        console.log('\n🏠 Checking Dashboard/Home Page...');
        await page.goto('http://localhost:8001/');
        await page.waitForTimeout(2000);
        
        const homeH1s = await page.locator('h1').allTextContents();
        console.log(`Home H1s: ${JSON.stringify(homeH1s)}`);
        
        // ========================================
        // CHECK CAMPAIGNS PAGE
        // ========================================
        console.log('\n🏕️ Checking Campaigns Page...');
        await page.goto('http://localhost:8001/campaigns');
        await page.waitForTimeout(2000);
        
        const campaignH1s = await page.locator('h1').allTextContents();
        const campaignTitle = await page.title();
        console.log(`Campaigns H1s: ${JSON.stringify(campaignH1s)}`);
        console.log(`Campaigns Page Title: "${campaignTitle}"`);
        
        // Check if main H1 is appropriate for campaigns page
        const hasCorrectCampaignTitle = campaignH1s.some(h1 => 
            h1.toLowerCase().includes('campaign') && 
            !h1.includes('Character Manager')
        );
        
        if (!hasCorrectCampaignTitle) {
            issues.push({
                page: 'Campaigns',
                issue: 'Main H1 shows site title instead of page-specific title',
                current: campaignH1s[0] || 'No H1',
                expected: 'Something like "Campaign Management" or "My Campaigns"'
            });
        }
        
        // ========================================
        // CHECK CHARACTER CREATION PAGE
        // ========================================
        console.log('\n⭐ Checking Character Creation Page...');
        await page.goto('http://localhost:8001/create-character');
        await page.waitForTimeout(2000);
        
        const characterH1s = await page.locator('h1').allTextContents();
        const characterTitle = await page.title();
        const pageContent = await page.locator('body').textContent();
        
        console.log(`Character Creation H1s: ${JSON.stringify(characterH1s)}`);
        console.log(`Character Creation Page Title: "${characterTitle}"`);
        
        // Check for template placeholders
        const templateIssues = [];
        if (pageContent.toLowerCase().includes('new template')) {
            templateIssues.push('Contains "new template" text');
        }
        if (pageContent.toLowerCase().includes('template')) {
            templateIssues.push('Contains "template" references');
        }
        if (pageContent.toLowerCase().includes('placeholder')) {
            templateIssues.push('Contains "placeholder" text');
        }
        if (pageContent.toLowerCase().includes('todo')) {
            templateIssues.push('Contains "todo" text');
        }
        if (pageContent.toLowerCase().includes('fixme')) {
            templateIssues.push('Contains "fixme" text');
        }
        
        if (templateIssues.length > 0) {
            issues.push({
                page: 'Character Creation',
                issue: 'Contains template/development placeholders',
                problems: templateIssues
            });
        }
        
        // Check if character creation has proper title
        const hasCorrectCharacterTitle = characterH1s.some(h1 => 
            h1.toLowerCase().includes('create') && 
            h1.toLowerCase().includes('character')
        );
        
        if (!hasCorrectCharacterTitle) {
            issues.push({
                page: 'Character Creation',
                issue: 'Missing proper character creation title',
                current: characterH1s[0] || 'No H1',
                expected: 'Something like "Create New Character"'
            });
        }
        
        // ========================================
        // CHECK PROFILE PAGE
        // ========================================
        console.log('\n👤 Checking Profile Page...');
        await page.goto('http://localhost:8001/profile');
        await page.waitForTimeout(2000);
        
        const profileH1s = await page.locator('h1').allTextContents();
        const profileTitle = await page.title();
        console.log(`Profile H1s: ${JSON.stringify(profileH1s)}`);
        console.log(`Profile Page Title: "${profileTitle}"`);
        
        // ========================================
        // CHECK ADMIN PAGE (if accessible)
        // ========================================
        console.log('\n👑 Checking Admin Page...');
        await page.goto('http://localhost:8001/admin');
        await page.waitForTimeout(2000);
        
        const adminH1s = await page.locator('h1').allTextContents();
        const adminTitle = await page.title();
        console.log(`Admin H1s: ${JSON.stringify(adminH1s)}`);
        console.log(`Admin Page Title: "${adminTitle}"`);
        
        // ========================================
        // RESULTS SUMMARY
        // ========================================
        console.log('\n📊 COSMETIC ISSUES FOUND:');
        
        if (issues.length === 0) {
            console.log('✅ NO COSMETIC TITLE ISSUES FOUND!');
            console.log('All pages have appropriate titles and no template placeholders.');
        } else {
            console.log(`❌ FOUND ${issues.length} COSMETIC ISSUES:`);
            issues.forEach((issue, index) => {
                console.log(`\n${index + 1}. 📋 ${issue.page} Page:`);
                console.log(`   Problem: ${issue.issue}`);
                if (issue.current) {
                    console.log(`   Current: "${issue.current}"`);
                    console.log(`   Expected: "${issue.expected}"`);
                }
                if (issue.problems) {
                    console.log(`   Problems: ${issue.problems.join(', ')}`);
                }
            });
        }
        
        // Take screenshot for visual review
        await page.screenshot({ path: 'cosmetic-issues-check.png', fullPage: true });
        console.log('\n📸 Screenshot saved: cosmetic-issues-check.png');
        
        console.log('\n🎯 PRIORITY FOR FIXES:');
        const highPriorityIssues = issues.filter(issue => 
            issue.page === 'Campaigns' || 
            issue.issue.includes('template') ||
            issue.issue.includes('placeholder')
        );
        
        if (highPriorityIssues.length > 0) {
            console.log('🚨 HIGH PRIORITY (affects professional appearance):');
            highPriorityIssues.forEach(issue => {
                console.log(`   - ${issue.page}: ${issue.issue}`);
            });
        }
        
        const mediumPriorityIssues = issues.filter(issue => 
            !highPriorityIssues.includes(issue)
        );
        
        if (mediumPriorityIssues.length > 0) {
            console.log('⚠️ MEDIUM PRIORITY (minor polish):');
            mediumPriorityIssues.forEach(issue => {
                console.log(`   - ${issue.page}: ${issue.issue}`);
            });
        }
        
    } catch (error) {
        console.log('❌ Cosmetic check error:', error.message);
        await page.screenshot({ path: 'cosmetic-check-error.png', fullPage: true });
    }
});
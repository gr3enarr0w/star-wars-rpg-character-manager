const { test, expect } = require('@playwright/test');

test.describe('Race Condition Investigation', () => {
    test('Multiple rapid requests to identify pattern', async ({ page }) => {
        console.log('🔍 Testing for race conditions with rapid requests...');
        
        const results = [];
        
        // Make 10 rapid requests
        for (let i = 0; i < 10; i++) {
            console.log(`\n📍 Request ${i + 1}/10:`);
            
            try {
                await page.goto('http://localhost:8001/login', { 
                    waitUntil: 'domcontentloaded',
                    timeout: 5000
                });
                
                const content = await page.content();
                const length = content.length;
                
                // Check for problematic terms
                const hasProblems = content.toLowerCase().includes('passkey') || 
                                   content.toLowerCase().includes('2fa');
                
                results.push({ request: i + 1, length, hasProblems });
                console.log(`   Length: ${length}, Problems: ${hasProblems ? 'YES' : 'NO'}`);
                
                // Small delay between requests
                await page.waitForTimeout(100);
                
            } catch (error) {
                console.log(`   ERROR: ${error.message}`);
                results.push({ request: i + 1, error: error.message });
            }
        }
        
        // Analyze patterns
        console.log('\n📊 PATTERN ANALYSIS:');
        
        const cleanRequests = results.filter(r => !r.error && !r.hasProblems);
        const problematicRequests = results.filter(r => !r.error && r.hasProblems);
        const errorRequests = results.filter(r => r.error);
        
        console.log(`✅ Clean responses: ${cleanRequests.length}/10`);
        console.log(`❌ Problematic responses: ${problematicRequests.length}/10`);
        console.log(`🚫 Error responses: ${errorRequests.length}/10`);
        
        if (cleanRequests.length > 0 && problematicRequests.length > 0) {
            console.log('\n🔍 MIXED RESULTS DETECTED - Confirms inconsistent behavior!');
            console.log(`Clean size: ${cleanRequests[0].length} chars`);
            console.log(`Problematic size: ${problematicRequests[0].length} chars`);
        }
        
        // Check for length patterns
        const uniqueLengths = [...new Set(results.filter(r => !r.error).map(r => r.length))];
        console.log(`\n📏 Unique content lengths: ${uniqueLengths.join(', ')}`);
        
        if (uniqueLengths.length > 1) {
            console.log('⚠️  INCONSISTENT CONTENT LENGTHS - Confirms race condition theory!');
        }
    });
    
    test('Session state investigation', async ({ browser }) => {
        console.log('\n🔍 Testing session state influence...');
        
        // Test with fresh context (no session)
        const freshContext = await browser.newContext();
        const freshPage = await freshContext.newPage();
        
        await freshPage.goto('http://localhost:8001/login');
        const freshContent = await freshPage.content();
        console.log(`🆕 Fresh session: ${freshContent.length} chars, Problems: ${freshContent.toLowerCase().includes('passkey') ? 'YES' : 'NO'}`);
        
        await freshContext.close();
        
        // Test with navigation history
        const historyContext = await browser.newContext();
        const historyPage = await historyContext.newPage();
        
        // Navigate to root first, then login
        await historyPage.goto('http://localhost:8001/');
        await historyPage.waitForTimeout(500);
        await historyPage.goto('http://localhost:8001/login');
        
        const historyContent = await historyPage.content();
        console.log(`🗂️  After navigation: ${historyContent.length} chars, Problems: ${historyContent.toLowerCase().includes('passkey') ? 'YES' : 'NO'}`);
        
        await historyContext.close();
        
        // Compare results
        if (freshContent.length !== historyContent.length) {
            console.log('⚠️  Navigation history affects content - confirms state-dependent behavior!');
        } else {
            console.log('✅ Navigation history doesn\'t affect content');
        }
    });
});
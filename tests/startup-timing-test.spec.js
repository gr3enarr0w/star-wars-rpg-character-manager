const { test, expect } = require('@playwright/test');

test.describe('Startup Timing Investigation', () => {
    test('Test content immediately after container restart', async ({ page }) => {
        console.log('🔍 Testing content immediately after container restart...');
        
        // Wait for container to be ready
        console.log('⏳ Waiting for container to be ready...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test multiple requests in quick succession after startup
        for (let i = 0; i < 5; i++) {
            console.log(`\n📍 Startup Request ${i + 1}/5:`);
            
            try {
                await page.goto('http://localhost:8001/login', { 
                    waitUntil: 'domcontentloaded',
                    timeout: 10000
                });
                
                const content = await page.content();
                const length = content.length;
                
                // Check for problematic terms
                const hasProblems = content.toLowerCase().includes('passkey') || 
                                   content.toLowerCase().includes('2fa');
                
                console.log(`   Length: ${length}, Problems: ${hasProblems ? 'YES' : 'NO'}`);
                
                // Save first startup content for analysis
                if (i === 0) {
                    const fs = require('fs');
                    fs.writeFileSync('/tmp/startup_content.html', content);
                    console.log('   💾 Saved startup content to /tmp/startup_content.html');
                }
                
                // Small delay between requests
                await page.waitForTimeout(200);
                
            } catch (error) {
                console.log(`   ERROR: ${error.message}`);
            }
        }
        
        console.log('\n🔄 Testing after app warmup...');
        
        // Wait for app to fully warm up
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test again after warmup
        for (let i = 0; i < 3; i++) {
            console.log(`\n📍 Warmup Request ${i + 1}/3:`);
            
            try {
                await page.goto('http://localhost:8001/login', { 
                    waitUntil: 'domcontentloaded',
                    timeout: 10000
                });
                
                const content = await page.content();
                const length = content.length;
                
                const hasProblems = content.toLowerCase().includes('passkey') || 
                                   content.toLowerCase().includes('2fa');
                
                console.log(`   Length: ${length}, Problems: ${hasProblems ? 'YES' : 'NO'}`);
                
            } catch (error) {
                console.log(`   ERROR: ${error.message}`);
            }
        }
    });
    
    test('Direct curl comparison after restart', async () => {
        console.log('\n🔍 Comparing curl vs browser after restart...');
        
        const { exec } = require('child_process');
        
        // Get curl response
        const curlPromise = new Promise((resolve) => {
            exec('curl -s http://localhost:8001/login | wc -c', (error, stdout) => {
                resolve(stdout.trim());
            });
        });
        
        const curlSize = await curlPromise;
        console.log(`📡 curl response size: ${curlSize} chars`);
        
        // Compare with browser size from previous test
        console.log('📊 This helps identify if the issue is browser-specific vs server-side');
    });
});
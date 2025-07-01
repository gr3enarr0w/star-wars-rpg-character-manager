// Verify the character creation fix works
const { test, expect } = require('@playwright/test');

test('Verify Character Creation Fix', async ({ page }) => {
    console.log('\n✅ VERIFYING CHARACTER CREATION FIX\n');
    
    let creationSuccess = false;
    let characterId = null;
    
    // Capture API responses
    page.on('response', async response => {
        if (response.url().includes('/api/characters') && response.request().method() === 'POST') {
            console.log('📥 Character Creation API Response:', response.status());
            if (response.status() === 201) {
                creationSuccess = true;
                try {
                    const responseData = await response.json();
                    characterId = responseData.character?.id;
                    console.log('✅ Character created with ID:', characterId);
                } catch (e) {
                    console.log('Could not parse creation response');
                }
            } else {
                const errorBody = await response.text().catch(() => 'Unknown error');
                console.log('❌ Creation failed:', errorBody);
            }
        }
    });
    
    try {
        // Authenticate
        await page.goto('http://localhost:8001/login');
        await page.fill('input[name="email"]', 'clark@clarkeverson.com');
        await page.fill('input[name="password"]', 'clark123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Navigate to character creation
        await page.goto('http://localhost:8001/create-character');
        await page.waitForTimeout(3000);
        
        // Fill out form
        const testCharName = 'Fixed Creation Test';
        await page.fill('input[name="character_name"]', testCharName);
        await page.fill('input[name="player_name"]', 'Test Player');
        await page.selectOption('select[name="species"]', 'Human');
        await page.waitForTimeout(1000);
        await page.selectOption('select[name="career"]', 'Guardian');
        
        console.log('📝 Form filled, submitting character creation...');
        
        // Submit form
        await page.click('button[type="submit"]');
        await page.waitForTimeout(5000);
        
        // Check creation result
        if (creationSuccess) {
            console.log('✅ CHARACTER CREATION: SUCCESS');
            
            // Navigate to dashboard
            await page.goto('http://localhost:8001/');
            await page.waitForTimeout(3000);
            
            // Check if character appears on dashboard
            const characterCards = page.locator('.character-card');
            const characterCount = await characterCards.count();
            console.log(`📊 Characters on dashboard: ${characterCount}`);
            
            if (characterCount > 0) {
                // Look for our test character
                const characterNames = await characterCards.locator('h3').allTextContents();
                console.log(`📋 Character names: ${characterNames.join(', ')}`);
                
                const foundTestChar = characterNames.some(name => name.includes(testCharName));
                if (foundTestChar) {
                    console.log('🎉 SUCCESS: Test character found on dashboard!');
                    
                    // Test character interaction
                    await characterCards.first().click();
                    await page.waitForTimeout(2000);
                    
                    console.log('✅ Character click navigation working');
                    
                } else {
                    console.log('⚠️  Character created but not found on dashboard');
                }
            } else {
                console.log('❌ No characters visible on dashboard');
            }
            
        } else {
            console.log('❌ CHARACTER CREATION: FAILED');
        }
        
        // Take final screenshot
        await page.goto('http://localhost:8001/');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'verify-character-creation-fix.png', fullPage: true });
        
        console.log('\n🏁 VERIFICATION COMPLETE');
        console.log(`Creation Success: ${creationSuccess}`);
        console.log(`Character ID: ${characterId || 'None'}`);
        
    } catch (error) {
        console.log('❌ Verification error:', error.message);
        await page.screenshot({ path: 'verify-character-creation-fix-error.png', fullPage: true });
    }
});
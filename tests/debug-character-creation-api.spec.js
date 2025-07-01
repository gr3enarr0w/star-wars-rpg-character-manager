// Debug test to check character creation API field mismatch
const { test, expect } = require('@playwright/test');

test('Debug Character Creation API Field Mismatch', async ({ page }) => {
    console.log('\n🔍 DEBUGGING CHARACTER CREATION API FIELD MISMATCH\n');
    
    const apiRequests = [];
    const apiResponses = [];
    
    // Capture API requests and responses
    page.on('request', request => {
        if (request.url().includes('/api/characters') && request.method() === 'POST') {
            apiRequests.push({
                url: request.url(),
                method: request.method(),
                headers: request.headers(),
                body: request.postData()
            });
            console.log('📤 API REQUEST CAPTURED:');
            console.log('URL:', request.url());
            console.log('Method:', request.method());
            console.log('Body:', request.postData());
        }
    });
    
    page.on('response', async response => {
        if (response.url().includes('/api/characters') && response.request().method() === 'POST') {
            const responseBody = await response.text().catch(() => 'Could not read response');
            apiResponses.push({
                status: response.status(),
                statusText: response.statusText(),
                url: response.url(),
                body: responseBody
            });
            console.log('📥 API RESPONSE CAPTURED:');
            console.log('Status:', response.status(), response.statusText());
            console.log('Body:', responseBody);
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
        await page.fill('input[name="character_name"]', 'Debug Test Character');
        await page.fill('input[name="player_name"]', 'Debug Test Player');
        await page.selectOption('select[name="species"]', 'Human');
        await page.waitForTimeout(1000);
        await page.selectOption('select[name="career"]', 'Guardian');
        
        console.log('✅ Form filled out, submitting...');
        
        // Submit form and wait for API call
        await page.click('button[type="submit"]');
        await page.waitForTimeout(5000);
        
        // Analyze API interaction
        console.log('\n📊 API INTERACTION ANALYSIS:');
        console.log(`Requests captured: ${apiRequests.length}`);
        console.log(`Responses captured: ${apiResponses.length}`);
        
        if (apiRequests.length > 0) {
            const request = apiRequests[0];
            console.log('\n🔍 REQUEST BODY ANALYSIS:');
            if (request.body) {
                try {
                    const requestData = JSON.parse(request.body);
                    console.log('Parsed request data:', requestData);
                    
                    // Check field names
                    const hasCharacterName = 'character_name' in requestData;
                    const hasName = 'name' in requestData;
                    const hasPlayerName = 'player_name' in requestData;
                    const hasPlayerNameCamel = 'playerName' in requestData;
                    
                    console.log('\n🏷️  FIELD NAME ANALYSIS:');
                    console.log(`Frontend sends 'character_name': ${hasCharacterName}`);
                    console.log(`Frontend sends 'name': ${hasName}`);
                    console.log(`Frontend sends 'player_name': ${hasPlayerName}`);
                    console.log(`Frontend sends 'playerName': ${hasPlayerNameCamel}`);
                    
                    if (hasCharacterName && !hasName) {
                        console.log('🐛 FIELD MISMATCH DETECTED: Frontend sends character_name but backend expects name');
                    }
                    if (hasPlayerName && !hasPlayerNameCamel) {
                        console.log('🐛 FIELD MISMATCH DETECTED: Frontend sends player_name but backend expects playerName');
                    }
                    
                } catch (parseError) {
                    console.log('❌ Could not parse request body as JSON:', parseError.message);
                }
            }
        }
        
        if (apiResponses.length > 0) {
            const response = apiResponses[0];
            console.log('\n📥 RESPONSE ANALYSIS:');
            console.log(`Status: ${response.status}`);
            
            if (response.status === 400) {
                console.log('🐛 BAD REQUEST - likely missing required fields');
                try {
                    const responseData = JSON.parse(response.body);
                    console.log('Error details:', responseData);
                } catch (e) {
                    console.log('Could not parse error response');
                }
            } else if (response.status === 201) {
                console.log('✅ Character created successfully');
            }
        }
        
        // Check if character appears on dashboard
        console.log('\n🔍 CHECKING DASHBOARD...');
        await page.goto('http://localhost:8001/');
        await page.waitForTimeout(3000);
        
        const characterCards = page.locator('.character-card');
        const characterCount = await characterCards.count();
        console.log(`Characters visible on dashboard: ${characterCount}`);
        
        if (characterCount === 0) {
            console.log('🐛 CONFIRMED: Characters not appearing on dashboard');
        } else {
            console.log('✅ Characters are appearing on dashboard');
        }
        
        // Take screenshot
        await page.screenshot({ path: 'debug-character-creation-api.png', fullPage: true });
        
    } catch (error) {
        console.log('❌ Debug test error:', error.message);
    }
});
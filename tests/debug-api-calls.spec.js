// Debug test to check API calls and JavaScript errors in character creation
const { test, expect } = require('@playwright/test');

test('Debug: API Calls and JavaScript Errors', async ({ page }) => {
    console.log('\n🔍 DEBUGGING API CALLS AND JAVASCRIPT ERRORS...\n');
    
    // Capture all console messages and errors
    const consoleMessages = [];
    const jsErrors = [];
    
    page.on('console', msg => {
        const message = `[${msg.type().toUpperCase()}] ${msg.text()}`;
        consoleMessages.push(message);
        console.log(message);
    });
    
    page.on('pageerror', error => {
        const errorMessage = `❌ JS ERROR: ${error.message}`;
        jsErrors.push(errorMessage);
        console.log(errorMessage);
    });
    
    // Capture network requests
    const networkRequests = [];
    page.on('request', request => {
        if (request.url().includes('/api/character-data/') || request.url().includes('/api/auth/')) {
            networkRequests.push({
                url: request.url(),
                method: request.method(),
                headers: request.headers()
            });
            console.log(`🌐 REQUEST: ${request.method()} ${request.url()}`);
        }
    });
    
    page.on('response', response => {
        if (response.url().includes('/api/character-data/') || response.url().includes('/api/auth/')) {
            console.log(`📡 RESPONSE: ${response.status()} ${response.url()}`);
        }
    });
    
    try {
        // Authenticate
        await page.goto('http://localhost:8001/login');
        await page.fill('input[name="email"]', 'clark@clarkeverson.com');
        await page.fill('input[name="password"]', 'clark123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        console.log('✅ Authentication complete');
        
        // Navigate to character creation
        await page.goto('http://localhost:8001/create-character');
        await page.waitForTimeout(5000); // Wait longer for API calls
        
        console.log('✅ Character creation page loaded');
        
        // Check for any JavaScript errors
        console.log(`\n📋 JavaScript Errors Found: ${jsErrors.length}`);
        jsErrors.forEach(error => console.log(error));
        
        // Check API requests
        console.log(`\n📋 API Requests Made: ${networkRequests.length}`);
        networkRequests.forEach(req => {
            console.log(`  - ${req.method} ${req.url}`);
        });
        
        // Check if species data loaded
        const speciesSelect = page.locator('select[name="species"]');
        const speciesOptions = await speciesSelect.locator('option').allTextContents();
        
        console.log(`\n📋 Species Dropdown Status:`);
        console.log(`  - Total options: ${speciesOptions.length}`);
        console.log(`  - First option: "${speciesOptions[0]}"`);
        console.log(`  - Contains Human: ${speciesOptions.some(opt => opt.includes('Human'))}`);
        
        if (speciesOptions[0] === 'Loading species...') {
            console.log('❌ Species data failed to load from API');
        } else if (speciesOptions[0] === 'Select Species') {
            console.log('✅ Species data loaded successfully');
        }
        
        // Test manual API call
        console.log('\n🔬 Testing Manual API Call...');
        const apiResult = await page.evaluate(async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch('/api/character-data/species', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                return {
                    status: response.status,
                    ok: response.ok,
                    hasData: response.ok ? !!(await response.json()).species : false
                };
            } catch (error) {
                return { error: error.message };
            }
        });
        
        console.log('📡 Manual API Call Result:', apiResult);
        
        // Check if loadCharacterData function exists and works
        const loadDataResult = await page.evaluate(async () => {
            if (typeof loadCharacterData === 'function') {
                try {
                    await loadCharacterData();
                    return { success: true, message: 'loadCharacterData executed' };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            } else {
                return { success: false, error: 'loadCharacterData function not found' };
            }
        });
        
        console.log('🔧 loadCharacterData Test:', loadDataResult);
        
        await page.screenshot({ path: 'debug-api-calls.png', fullPage: true });
        console.log('📸 Debug screenshot saved');
        
    } catch (error) {
        console.log('❌ Test error:', error.message);
    }
});
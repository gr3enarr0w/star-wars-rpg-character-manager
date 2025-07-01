// Comprehensive UI Testing for Enhanced Character Creation with XP System
// Tests the new characteristic allocation and XP management features

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Create test results directory
const testResultsDir = path.join(__dirname, '..', '..', 'character-creation-test-results');
const screenshotsDir = path.join(testResultsDir, 'screenshots');

// Ensure directories exist
[testResultsDir, screenshotsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Test results tracking
let testResults = {
    admin: { working: [], bugs: [], screenshots: [] },
    player: { working: [], bugs: [], screenshots: [] },
    gm: { working: [], bugs: [], screenshots: [] }
};

// Helper function to save screenshots
async function saveTestScreenshot(page, persona, feature, step, testNumber) {
    const timestamp = Date.now();
    const filename = `${persona}_${feature}_${step}_${timestamp}.png`;
    const filepath = path.join(screenshotsDir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 [${persona.toUpperCase()}] Screenshot: ${filename}`);
    testResults[persona].screenshots.push({ feature, step, filename, timestamp });
    return filename;
}

// Helper function to record working features
function recordWorking(persona, feature, description, screenshot = null) {
    const record = {
        feature,
        description,
        timestamp: new Date().toISOString(),
        screenshot,
        status: 'WORKING'
    };
    testResults[persona].working.push(record);
    console.log(`✅ [${persona.toUpperCase()}] WORKING: ${feature} - ${description}`);
}

// Helper function to record bugs
function recordBug(persona, feature, description, error = null, screenshot = null) {
    const record = {
        feature,
        description,
        error: error ? error.message : null,
        timestamp: new Date().toISOString(),
        screenshot,
        status: 'BUG',
        severity: 'medium'
    };
    testResults[persona].bugs.push(record);
    console.log(`🐛 [${persona.toUpperCase()}] BUG: ${feature} - ${description}`);
}

// Authentication helper
async function authenticateAs(page, persona, testNumber) {
    const credentials = {
        admin: { email: 'clark@clarkeverson.com', password: 'clark123', role: 'admin' },
        player: { email: 'clark@clarkeverson.com', password: 'clark123', role: 'user' },
        gm: { email: 'clark@clarkeverson.com', password: 'clark123', role: 'user' }
    };

    const creds = credentials[persona];
    console.log(`\n🔐 [${persona.toUpperCase()}] Authenticating as ${creds.role}...`);

    try {
        await page.goto('http://localhost:8001/login');
        await saveTestScreenshot(page, persona, 'authentication', 'login-page', testNumber);
        
        await page.fill('input[name="email"]', creds.email);
        await page.fill('input[name="password"]', creds.password);
        await saveTestScreenshot(page, persona, 'authentication', 'credentials-entered', testNumber);
        
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
            throw new Error('Authentication failed - still on login page');
        }
        
        await saveTestScreenshot(page, persona, 'authentication', 'success', testNumber);
        recordWorking(persona, 'Authentication', `Successfully logged in as ${persona}`);
        return true;
    } catch (error) {
        recordBug(persona, 'Authentication', `Failed to authenticate as ${persona}`, error);
        return false;
    }
}

// Test Character Creation XP System for Admin
test('Admin: Character Creation with XP Allocation', async ({ page }) => {
    const persona = 'admin';
    const testNumber = 1;
    
    if (!await authenticateAs(page, persona, testNumber)) return;
    
    console.log(`\n🎭 [${persona.toUpperCase()}] Testing Enhanced Character Creation...`);
    
    try {
        // Navigate to character creation
        await page.goto('http://localhost:8001/create-character');
        await page.waitForTimeout(2000);
        await saveTestScreenshot(page, persona, 'character-creation', 'page-loaded', testNumber);
        
        // Test 1: Basic form elements
        const characterNameInput = page.locator('input[name="character_name"]');
        const playerNameInput = page.locator('input[name="player_name"]');
        const speciesSelect = page.locator('select[name="species"]');
        const careerSelect = page.locator('select[name="career"]');
        
        if (await characterNameInput.count() > 0) {
            recordWorking(persona, 'Character Creation', 'Character name input field present');
        } else {
            recordBug(persona, 'Character Creation', 'Character name input field missing');
        }
        
        if (await playerNameInput.count() > 0) {
            recordWorking(persona, 'Character Creation', 'Player name input field present');
        } else {
            recordBug(persona, 'Character Creation', 'Player name input field missing');
        }
        
        // Test 2: Fill basic information
        await characterNameInput.fill('Test Jedi');
        await playerNameInput.fill('Test Player');
        recordWorking(persona, 'Character Creation', 'Basic character info can be entered');
        await saveTestScreenshot(page, persona, 'character-creation', 'basic-info-filled', testNumber);
        
        // Test 3: Species selection and XP system
        console.log('   Testing species selection and XP system...');
        
        // Wait for species to load
        await page.waitForTimeout(2000);
        
        // Select Human (should have 110 starting XP)
        await speciesSelect.selectOption('Human');
        await page.waitForTimeout(1000);
        await saveTestScreenshot(page, persona, 'character-creation', 'species-selected', testNumber);
        
        // Check if characteristic allocation section appears
        const charAllocationSection = page.locator('#characteristic-allocation');
        if (await charAllocationSection.isVisible()) {
            recordWorking(persona, 'XP System', 'Characteristic allocation section appears after species selection');
            
            // Check XP display
            const startingXPElement = page.locator('#starting-xp');
            const remainingXPElement = page.locator('#remaining-xp');
            
            if (await startingXPElement.count() > 0) {
                const startingXP = await startingXPElement.textContent();
                recordWorking(persona, 'XP System', `Starting XP displayed: ${startingXP}`);
                
                if (startingXP === '110') {
                    recordWorking(persona, 'XP System', 'Human species shows correct 110 starting XP');
                } else {
                    recordBug(persona, 'XP System', `Human species shows incorrect XP: ${startingXP}, expected 110`);
                }
            } else {
                recordBug(persona, 'XP System', 'Starting XP not displayed');
            }
            
            // Test characteristic adjustment
            console.log('   Testing characteristic adjustment...');
            const brawnPlusButton = page.locator('button').filter({ hasText: '+' }).first();
            const brawnValue = page.locator('#brawn-value');
            
            if (await brawnPlusButton.count() > 0) {
                const initialValue = await brawnValue.textContent();
                await brawnPlusButton.click();
                await page.waitForTimeout(500);
                const newValue = await brawnValue.textContent();
                
                if (parseInt(newValue) > parseInt(initialValue)) {
                    recordWorking(persona, 'XP System', 'Characteristic increase works correctly');
                    
                    // Check XP cost calculation
                    const remainingXP = await remainingXPElement.textContent();
                    if (parseInt(remainingXP) < 110) {
                        recordWorking(persona, 'XP System', 'XP cost deducted correctly from remaining XP');
                    } else {
                        recordBug(persona, 'XP System', 'XP cost not deducted from remaining XP');
                    }
                } else {
                    recordBug(persona, 'XP System', 'Characteristic increase button not working');
                }
                
                await saveTestScreenshot(page, persona, 'character-creation', 'characteristic-adjusted', testNumber);
            } else {
                recordBug(persona, 'XP System', 'Characteristic adjustment buttons not found');
            }
        } else {
            recordBug(persona, 'XP System', 'Characteristic allocation section does not appear after species selection');
        }
        
        // Test 4: Career selection
        console.log('   Testing career selection...');
        await careerSelect.selectOption('Guardian');
        await page.waitForTimeout(500);
        recordWorking(persona, 'Character Creation', 'Career can be selected');
        await saveTestScreenshot(page, persona, 'character-creation', 'career-selected', testNumber);
        
        // Test 5: Full character creation submission
        console.log('   Testing character creation submission...');
        const submitButton = page.locator('button[type="submit"]');
        
        if (await submitButton.count() > 0) {
            await submitButton.click();
            await page.waitForTimeout(3000);
            
            // Check for success or error messages
            const successMessage = page.locator('.success, .alert-success, [style*="background"][style*="green"]');
            const errorMessage = page.locator('.error, .alert-error, [style*="background"][style*="red"]');
            
            if (await successMessage.count() > 0) {
                recordWorking(persona, 'Character Creation', 'Character creation succeeds with success message');
            } else if (await errorMessage.count() > 0) {
                const errorText = await errorMessage.textContent();
                recordBug(persona, 'Character Creation', `Character creation fails with error: ${errorText}`);
            } else {
                // Check if redirected (indicates success)
                const currentUrl = page.url();
                if (currentUrl.includes('/create-character')) {
                    recordBug(persona, 'Character Creation', 'Character creation appears to fail (still on creation page)');
                } else {
                    recordWorking(persona, 'Character Creation', 'Character creation appears successful (redirected)');
                }
            }
            
            await saveTestScreenshot(page, persona, 'character-creation', 'submission-result', testNumber);
        } else {
            recordBug(persona, 'Character Creation', 'Submit button not found');
        }
        
    } catch (error) {
        recordBug(persona, 'Character Creation', 'Unexpected error during testing', error);
    }
});

// Test Character Creation for Player
test('Player: Enhanced Character Creation Flow', async ({ page }) => {
    const persona = 'player';
    const testNumber = 2;
    
    if (!await authenticateAs(page, persona, testNumber)) return;
    
    console.log(`\n🎭 [${persona.toUpperCase()}] Testing Enhanced Character Creation...`);
    
    try {
        // Navigate to character creation
        await page.goto('http://localhost:8001/create-character');
        await page.waitForTimeout(2000);
        await saveTestScreenshot(page, persona, 'character-creation', 'page-loaded', testNumber);
        
        // Test different species with different XP amounts
        const speciesSelect = page.locator('select[name="species"]');
        
        // Test Wookiee (should have 90 XP)
        await speciesSelect.selectOption('Wookiee');
        await page.waitForTimeout(1000);
        
        const startingXPElement = page.locator('#starting-xp');
        if (await startingXPElement.count() > 0) {
            const wookieeXP = await startingXPElement.textContent();
            if (wookieeXP === '90') {
                recordWorking(persona, 'XP System', 'Wookiee species shows correct 90 starting XP');
            } else {
                recordBug(persona, 'XP System', `Wookiee species shows incorrect XP: ${wookieeXP}, expected 90`);
            }
        }
        
        await saveTestScreenshot(page, persona, 'character-creation', 'wookiee-selected', testNumber);
        
        // Test characteristic limits (should not go above 5 or below species base)
        const brawnValue = page.locator('#brawn-value');
        const brawnPlusButton = page.locator('button[onclick*="brawn"][onclick*="1"]');
        const brawnMinusButton = page.locator('button[onclick*="brawn"][onclick*="-1"]');
        
        // Wookiee should start with Brawn 3
        const initialBrawn = await brawnValue.textContent();
        if (initialBrawn === '3') {
            recordWorking(persona, 'XP System', 'Wookiee species applies +1 Brawn modifier correctly');
        } else {
            recordBug(persona, 'XP System', `Wookiee Brawn should be 3, but shows ${initialBrawn}`);
        }
        
        // Test reducing below species base (should not work)
        if (await brawnMinusButton.count() > 0) {
            await brawnMinusButton.click();
            await page.waitForTimeout(500);
            const newBrawn = await brawnValue.textContent();
            
            if (newBrawn === initialBrawn) {
                recordWorking(persona, 'XP System', 'Cannot reduce characteristic below species base value');
            } else {
                recordBug(persona, 'XP System', 'Characteristic can be reduced below species base value');
            }
        }
        
        await saveTestScreenshot(page, persona, 'character-creation', 'characteristic-limits-tested', testNumber);
        
    } catch (error) {
        recordBug(persona, 'Character Creation', 'Unexpected error during player testing', error);
    }
});

// Test Character Creation for GM
test('GM: XP System and Character Management', async ({ page }) => {
    const persona = 'gm';
    const testNumber = 3;
    
    if (!await authenticateAs(page, persona, testNumber)) return;
    
    console.log(`\n🎭 [${persona.toUpperCase()}] Testing GM Character Creation...`);
    
    try {
        // Test creating NPC with different species
        await page.goto('http://localhost:8001/create-character');
        await page.waitForTimeout(2000);
        
        // Fill NPC information
        await page.fill('input[name="character_name"]', 'NPC Bounty Hunter');
        await page.fill('input[name="player_name"]', 'Game Master');
        
        // Test Twi'lek species (should have 100 XP)
        const speciesSelect = page.locator('select[name="species"]');
        await speciesSelect.selectOption('Twi\'lek');
        await page.waitForTimeout(1000);
        
        const startingXPElement = page.locator('#starting-xp');
        if (await startingXPElement.count() > 0) {
            const twilekXP = await startingXPElement.textContent();
            if (twilekXP === '100') {
                recordWorking(persona, 'XP System', 'Twi\'lek species shows correct 100 starting XP');
            } else {
                recordBug(persona, 'XP System', `Twi'lek species shows incorrect XP: ${twilekXP}, expected 100`);
            }
        }
        
        // Test allocating multiple characteristics
        const characteristicButtons = page.locator('button[onclick*="adjustCharacteristic"]');
        const buttonCount = await characteristicButtons.count();
        
        if (buttonCount >= 12) { // 6 characteristics × 2 buttons each
            recordWorking(persona, 'XP System', 'All characteristic adjustment buttons present');
        } else {
            recordBug(persona, 'XP System', `Only ${buttonCount} characteristic buttons found, expected 12`);
        }
        
        await saveTestScreenshot(page, persona, 'character-creation', 'npc-creation', testNumber);
        
    } catch (error) {
        recordBug(persona, 'Character Creation', 'Unexpected error during GM testing', error);
    }
});

// Generate summary report
test.afterAll(async () => {
    console.log('\n📊 GENERATING TEST SUMMARY REPORT...\n');
    
    const totalWorking = Object.values(testResults).reduce((sum, persona) => sum + persona.working.length, 0);
    const totalBugs = Object.values(testResults).reduce((sum, persona) => sum + persona.bugs.length, 0);
    const totalScreenshots = Object.values(testResults).reduce((sum, persona) => sum + persona.screenshots.length, 0);
    
    const summary = {
        testType: 'Enhanced Character Creation with XP System',
        timestamp: new Date().toISOString(),
        totalWorking,
        totalBugs,
        totalScreenshots,
        personas: testResults
    };
    
    // Save detailed results
    fs.writeFileSync(path.join(testResultsDir, 'character-creation-test-results.json'), JSON.stringify(summary, null, 2));
    
    console.log(`✅ Working Features: ${totalWorking}`);
    console.log(`🐛 Bugs Found: ${totalBugs}`);
    console.log(`📸 Screenshots Captured: ${totalScreenshots}`);
    console.log(`📁 Results saved to: ${testResultsDir}/character-creation-test-results.json`);
    
    // Print summary by persona
    Object.entries(testResults).forEach(([persona, results]) => {
        console.log(`\n${persona.toUpperCase()}:`);
        console.log(`  ✅ ${results.working.length} working features`);
        console.log(`  🐛 ${results.bugs.length} bugs found`);
        console.log(`  📸 ${results.screenshots.length} screenshots`);
    });
});
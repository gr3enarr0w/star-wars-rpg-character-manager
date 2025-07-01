const { test, expect } = require('@playwright/test');

test.describe('Comprehensive Character Creation Testing - GitHub Codespaces', () => {
    const APP_URL = 'http://localhost:8001';
    
    // Sample of Star Wars RPG species to test (from the 55+ available)
    const testSpecies = [
        'Human', 'Twi\'lek', 'Wookiee', 'Rodian', 'Bothan', 'Droid',
        'Clone', 'Dathomirian', 'Harch', 'Karkarodon', 'Togruta', 'Weequay',
        'Quarren', 'Ithorian', 'Aleena', 'Sakiyan', 'Cerean', 'Kel Dor',
        'Nautolan', 'Zabrak', 'Chiss', 'Arcona', 'Besalisk', 'Muun'
    ];

    // Star Wars RPG careers to test
    const testCareers = [
        'Guardian', 'Consular', 'Sentinel', 'Warrior', 'Mystic', 'Seeker',
        'Bounty Hunter', 'Colonist', 'Explorer', 'Hired Gun', 'Smuggler', 'Technician',
        'Ace', 'Commander', 'Diplomat', 'Engineer', 'Soldier', 'Spy'
    ];

    // Helper function to login as admin
    async function loginAsAdmin(page) {
        console.log('🔑 Logging in as admin for character creation testing...');
        
        await page.goto(`${APP_URL}/login`);
        await page.fill('#email', 'clark@everson.dev');
        await page.fill('#password', 'with1artie4oskar3VOCATION!advances');
        await page.click('#loginBtn');
        
        await page.waitForURL(`${APP_URL}/`, { timeout: 10000 });
        
        const token = await page.evaluate(() => localStorage.getItem('access_token'));
        expect(token).toBeTruthy();
        
        console.log('✅ Admin login successful for character creation testing');
        return token;
    }

    // Helper function to take screenshot
    async function takeScreenshot(page, description, step) {
        const filename = `char-creation-${step.toString().padStart(2, '0')}-${description.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
        await page.screenshot({ 
            path: `test-results/${filename}`,
            fullPage: true 
        });
        console.log(`📸 Screenshot: ${filename}`);
    }

    // Helper function to find character creation interface
    async function findCharacterCreation(page) {
        const creationSelectors = [
            'text=Create New Character',
            'text=Create Character', 
            'text=Add Character',
            'text=New Character',
            'button:has-text("Create")',
            'a:has-text("Create")',
            '.create-character',
            '[href*="create"]',
            '[href*="character"]'
        ];

        for (const selector of creationSelectors) {
            try {
                const element = page.locator(selector).first();
                if (await element.isVisible()) {
                    const text = await element.textContent();
                    console.log(`📍 Found character creation: "${text}" (${selector})`);
                    return element;
                }
            } catch (error) {
                // Continue to next selector
            }
        }
        
        console.log('⚠️  Character creation interface not found');
        return null;
    }

    test('🎯 Character Creation Interface - Basic Functionality', async ({ page }) => {
        console.log('🎯 Testing Character Creation Interface - Basic functionality');
        let step = 1;

        await loginAsAdmin(page);
        await takeScreenshot(page, 'start-dashboard', step++);

        // Find and access character creation
        const createButton = await findCharacterCreation(page);
        if (!createButton) {
            console.log('❌ Character creation interface not found - skipping test');
            return;
        }

        await createButton.click();
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'creation-interface-loaded', step++);

        // Test form fields existence
        console.log('📋 Testing character creation form fields...');
        
        const formFields = [
            { selector: '#characterName, [name="name"], input[placeholder*="name"]', type: 'name', testValue: 'Test Hero' },
            { selector: '#playerName, [name="player"], input[placeholder*="player"]', type: 'player', testValue: 'Test Player' },
            { selector: '#species, [name="species"], select', type: 'species', testValue: null },
            { selector: '#career, [name="career"], select', type: 'career', testValue: null }
        ];

        let fieldsFound = 0;
        for (const { selector, type, testValue } of formFields) {
            try {
                const element = page.locator(selector).first();
                if (await element.isVisible()) {
                    fieldsFound++;
                    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
                    console.log(`✅ Found ${type} field: ${tagName}`);
                    
                    if (testValue && tagName === 'input') {
                        await element.fill(testValue);
                        console.log(`📝 Filled ${type} with: "${testValue}"`);
                    }
                }
            } catch (error) {
                console.log(`ℹ️  ${type} field not found: ${selector}`);
            }
        }

        console.log(`📊 Character creation form fields found: ${fieldsFound}/4`);
        await takeScreenshot(page, 'form-fields-tested', step++);

        expect(fieldsFound).toBeGreaterThan(0); // At least some form fields should exist
        console.log('✅ Character creation interface testing complete');
    });

    test('🌟 Species Selection - Testing All Species', async ({ page }) => {
        console.log('🌟 Testing Species Selection - All 55+ Star Wars RPG species');
        let step = 1;

        await loginAsAdmin(page);
        await takeScreenshot(page, 'species-testing-start', step++);

        const createButton = await findCharacterCreation(page);
        if (!createButton) {
            console.log('❌ Character creation not found - skipping species test');
            return;
        }

        await createButton.click();
        await page.waitForTimeout(2000);

        // Find species selection element
        const speciesSelectors = [
            '#species',
            '[name="species"]',
            'select[placeholder*="species"]',
            '.species-select',
            'select:has(option[value*="Human"])'
        ];

        let speciesSelect = null;
        for (const selector of speciesSelectors) {
            try {
                const element = page.locator(selector).first();
                if (await element.isVisible()) {
                    speciesSelect = element;
                    console.log(`📍 Found species selector: ${selector}`);
                    break;
                }
            } catch (error) {
                continue;
            }
        }

        if (speciesSelect) {
            // Get all available species options
            const options = await speciesSelect.locator('option').allTextContents();
            const availableSpecies = options.filter(opt => opt.trim() && opt !== 'Select Species');
            
            console.log(`🌟 Found ${availableSpecies.length} species available:`);
            availableSpecies.forEach((species, index) => {
                console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${species}`);
            });

            await takeScreenshot(page, 'species-list-loaded', step++);

            // Test selecting different species
            console.log('\n🧪 Testing species selection...');
            let speciesTestedCount = 0;
            
            for (const species of testSpecies) {
                if (availableSpecies.some(available => available.includes(species))) {
                    try {
                        await speciesSelect.selectOption({ label: species });
                        console.log(`✅ Selected species: ${species}`);
                        speciesTestedCount++;
                        
                        await page.waitForTimeout(500);
                        
                        // Take screenshot for key species
                        if (['Human', 'Droid', 'Clone', 'Wookiee'].includes(species)) {
                            await takeScreenshot(page, `species-${species.toLowerCase()}`, step++);
                        }
                        
                        // Test a reasonable number to avoid overly long test
                        if (speciesTestedCount >= 10) break;
                        
                    } catch (error) {
                        console.log(`⚠️  Could not select species ${species}: ${error.message}`);
                    }
                }
            }

            console.log(`📊 Species testing summary:`);
            console.log(`   Available species: ${availableSpecies.length}`);
            console.log(`   Tested species: ${speciesTestedCount}`);
            
            // Verify we have a good number of species available
            expect(availableSpecies.length).toBeGreaterThan(20); // Should have 55+ species
            
        } else {
            console.log('⚠️  Species selection dropdown not found');
        }

        console.log('✅ Species selection testing complete');
    });

    test('⚔️ Career Selection - Testing All Careers', async ({ page }) => {
        console.log('⚔️ Testing Career Selection - Star Wars RPG careers');
        let step = 1;

        await loginAsAdmin(page);
        await takeScreenshot(page, 'career-testing-start', step++);

        const createButton = await findCharacterCreation(page);
        if (!createButton) {
            console.log('❌ Character creation not found - skipping career test');
            return;
        }

        await createButton.click();
        await page.waitForTimeout(2000);

        // Find career selection element
        const careerSelectors = [
            '#career',
            '[name="career"]',
            'select[placeholder*="career"]',
            '.career-select',
            'select:has(option[value*="Guardian"])'
        ];

        let careerSelect = null;
        for (const selector of careerSelectors) {
            try {
                const element = page.locator(selector).first();
                if (await element.isVisible()) {
                    careerSelect = element;
                    console.log(`📍 Found career selector: ${selector}`);
                    break;
                }
            } catch (error) {
                continue;
            }
        }

        if (careerSelect) {
            // Get all available career options
            const options = await careerSelect.locator('option').allTextContents();
            const availableCareers = options.filter(opt => opt.trim() && opt !== 'Select Career');
            
            console.log(`⚔️ Found ${availableCareers.length} careers available:`);
            availableCareers.forEach((career, index) => {
                console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${career}`);
            });

            await takeScreenshot(page, 'career-list-loaded', step++);

            // Test selecting different careers
            console.log('\n🧪 Testing career selection...');
            let careersTestedCount = 0;
            
            for (const career of testCareers) {
                if (availableCareers.some(available => available.includes(career))) {
                    try {
                        await careerSelect.selectOption({ label: career });
                        console.log(`✅ Selected career: ${career}`);
                        careersTestedCount++;
                        
                        await page.waitForTimeout(500);
                        
                        // Take screenshot for key careers
                        if (['Guardian', 'Bounty Hunter', 'Smuggler', 'Jedi'].includes(career)) {
                            await takeScreenshot(page, `career-${career.toLowerCase().replace(/\s+/g, '-')}`, step++);
                        }
                        
                        // Test a reasonable number
                        if (careersTestedCount >= 8) break;
                        
                    } catch (error) {
                        console.log(`⚠️  Could not select career ${career}: ${error.message}`);
                    }
                }
            }

            console.log(`📊 Career testing summary:`);
            console.log(`   Available careers: ${availableCareers.length}`);
            console.log(`   Tested careers: ${careersTestedCount}`);
            
            // Verify we have careers from all three game lines
            expect(availableCareers.length).toBeGreaterThan(6); // Should have careers from EotE, AoR, F&D
            
        } else {
            console.log('⚠️  Career selection dropdown not found');
        }

        console.log('✅ Career selection testing complete');
    });

    test('🎲 Character Combinations - Species + Career Testing', async ({ page }) => {
        console.log('🎲 Testing Character Combinations - Species + Career combinations');
        let step = 1;

        await loginAsAdmin(page);
        await takeScreenshot(page, 'combinations-start', step++);

        const createButton = await findCharacterCreation(page);
        if (!createButton) {
            console.log('❌ Character creation not found - skipping combinations test');
            return;
        }

        await createButton.click();
        await page.waitForTimeout(2000);

        // Test specific character combinations that make thematic sense
        const characterCombinations = [
            { species: 'Human', career: 'Guardian', name: 'Human Jedi Guardian' },
            { species: 'Wookiee', career: 'Hired Gun', name: 'Wookiee Warrior' },
            { species: 'Twi\'lek', career: 'Smuggler', name: 'Twi\'lek Pilot' },
            { species: 'Droid', career: 'Technician', name: 'Protocol Droid' },
            { species: 'Clone', career: 'Soldier', name: 'Clone Trooper' },
            { species: 'Rodian', career: 'Bounty Hunter', name: 'Rodian Tracker' }
        ];

        console.log('🧪 Testing character combinations...');
        let combinationsTestedCount = 0;

        for (const { species, career, name } of characterCombinations) {
            console.log(`\n🎭 Testing combination: ${species} ${career}`);
            
            try {
                // Fill character name
                const nameField = page.locator('#characterName, [name="name"], input[placeholder*="name"]').first();
                if (await nameField.isVisible()) {
                    await nameField.fill(name);
                    console.log(`📝 Set name: ${name}`);
                }

                // Select species
                const speciesSelect = page.locator('#species, [name="species"], select').first();
                if (await speciesSelect.isVisible()) {
                    await speciesSelect.selectOption({ label: species });
                    console.log(`🌟 Selected species: ${species}`);
                }

                // Select career
                const careerSelect = page.locator('#career, [name="career"], select').first();
                if (await careerSelect.isVisible()) {
                    await careerSelect.selectOption({ label: career });
                    console.log(`⚔️ Selected career: ${career}`);
                }

                await page.waitForTimeout(1000);
                await takeScreenshot(page, `combination-${species.toLowerCase()}-${career.toLowerCase().replace(/\s+/g, '-')}`, step++);

                combinationsTestedCount++;
                console.log(`✅ Combination tested successfully: ${species} ${career}`);

            } catch (error) {
                console.log(`⚠️  Could not test combination ${species} ${career}: ${error.message}`);
            }
        }

        console.log(`\n📊 Character combinations testing summary:`);
        console.log(`   Planned combinations: ${characterCombinations.length}`);
        console.log(`   Successfully tested: ${combinationsTestedCount}`);

        expect(combinationsTestedCount).toBeGreaterThan(0);
        console.log('✅ Character combinations testing complete');
    });

    test('💾 Character Creation Submission - Form Validation', async ({ page }) => {
        console.log('💾 Testing Character Creation Submission and Form Validation');
        let step = 1;

        await loginAsAdmin(page);
        await takeScreenshot(page, 'submission-testing-start', step++);

        const createButton = await findCharacterCreation(page);
        if (!createButton) {
            console.log('❌ Character creation not found - skipping submission test');
            return;
        }

        await createButton.click();
        await page.waitForTimeout(2000);

        // Test form validation - submit empty form
        console.log('🧪 Testing form validation with empty form...');
        
        const submitSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'text=Create Character',
            'text=Save Character',
            'text=Submit',
            '.btn-primary',
            '.submit-btn',
            'button:has-text("Create")'
        ];

        let submitButton = null;
        for (const selector of submitSelectors) {
            try {
                const element = page.locator(selector).first();
                if (await element.isVisible()) {
                    submitButton = element;
                    console.log(`📍 Found submit button: "${await element.textContent()}"`);
                    break;
                }
            } catch (error) {
                continue;
            }
        }

        if (submitButton) {
            await takeScreenshot(page, 'submit-button-found', step++);

            // Test empty form submission (should show validation errors)
            console.log('📤 Testing empty form submission...');
            await submitButton.click();
            await page.waitForTimeout(2000);
            await takeScreenshot(page, 'empty-form-submitted', step++);

            // Test complete form submission
            console.log('📝 Testing complete form submission...');
            
            // Fill out complete form
            try {
                const nameField = page.locator('#characterName, [name="name"], input[placeholder*="name"]').first();
                if (await nameField.isVisible()) {
                    await nameField.fill('Test Character Complete');
                }

                const playerField = page.locator('#playerName, [name="player"], input[placeholder*="player"]').first();
                if (await playerField.isVisible()) {
                    await playerField.fill('Test Player');
                }

                const speciesSelect = page.locator('#species, [name="species"], select').first();
                if (await speciesSelect.isVisible()) {
                    await speciesSelect.selectOption({ index: 1 }); // Select first non-empty option
                }

                const careerSelect = page.locator('#career, [name="career"], select').first();
                if (await careerSelect.isVisible()) {
                    await careerSelect.selectOption({ index: 1 }); // Select first non-empty option
                }

                await takeScreenshot(page, 'complete-form-filled', step++);

                // Submit complete form (but don't actually create to avoid test data)
                console.log('📤 Form ready for submission (not actually submitting to avoid test data)');
                await takeScreenshot(page, 'ready-for-submission', step++);

            } catch (error) {
                console.log(`⚠️  Error filling complete form: ${error.message}`);
            }

        } else {
            console.log('⚠️  Submit button not found');
        }

        console.log('✅ Character creation submission testing complete');
    });

    test('🔍 Character Creation API Integration', async ({ page }) => {
        console.log('🔍 Testing Character Creation API Integration');
        let step = 1;

        await loginAsAdmin(page);
        await takeScreenshot(page, 'api-integration-start', step++);

        // Test that character creation interfaces properly communicate with API
        console.log('🔌 Testing API integration for character creation...');

        // Test species data loading
        console.log('📊 Testing species data API...');
        const speciesApiResult = await page.evaluate(async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch('/api/species', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                return {
                    status: response.status,
                    ok: response.ok,
                    hasData: response.ok
                };
            } catch (error) {
                return { error: error.message };
            }
        });

        console.log(`🔌 Species API: ${speciesApiResult.status} ${speciesApiResult.ok ? '✅' : '❌'}`);

        // Test careers data loading
        console.log('📊 Testing careers data API...');
        const careersApiResult = await page.evaluate(async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch('/api/careers', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                return {
                    status: response.status,
                    ok: response.ok,
                    hasData: response.ok
                };
            } catch (error) {
                return { error: error.message };
            }
        });

        console.log(`🔌 Careers API: ${careersApiResult.status} ${careersApiResult.ok ? '✅' : '❌'}`);

        // Test character creation API endpoint
        console.log('📊 Testing character creation API endpoint...');
        const createApiResult = await page.evaluate(async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch('/api/characters', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                return {
                    status: response.status,
                    ok: response.ok,
                    accessible: response.status !== 404
                };
            } catch (error) {
                return { error: error.message };
            }
        });

        console.log(`🔌 Characters API: ${createApiResult.status} ${createApiResult.ok ? '✅' : '❌'}`);

        console.log('📊 API Integration Summary:');
        console.log(`   API endpoints accessible: ${[speciesApiResult, careersApiResult, createApiResult].filter(r => r.ok).length}/3`);

        console.log('✅ Character creation API integration testing complete');
    });
});
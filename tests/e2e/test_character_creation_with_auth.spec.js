// Test character creation with authentication
const { test, expect } = require('@playwright/test');

test('Character Creation - Full Species and Careers with Authentication', async ({ page }) => {
    console.log('🎯 Testing authenticated character creation with all species and careers...');
    
    // First login with admin credentials
    await page.goto('http://localhost:8001/login');
    await page.fill('input[name="email"]', 'clark@clarkeverson.com');
    await page.fill('input[name="password"]', 'clark123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('http://localhost:8001/', { timeout: 10000 });
    console.log('✅ Successfully logged in');
    
    // Navigate to character creation
    await page.goto('http://localhost:8001/create');
    console.log('✅ Navigated to character creation page');
    
    // Wait for page content to load
    await page.waitForSelector('form#character-creation-form', { timeout: 10000 });
    console.log('✅ Character creation form found');
    
    // Wait for dynamic loading to complete
    await page.waitForTimeout(3000);
    
    // Check species dropdown
    const speciesSelect = page.locator('select[name="species"]');
    await expect(speciesSelect).toBeVisible();
    console.log('✅ Species dropdown is visible');
    
    // Get all species options
    const speciesOptions = await speciesSelect.locator('option').all();
    const speciesCount = speciesOptions.length;
    console.log(`📊 Found ${speciesCount} species options`);
    
    // Check for specific species
    const speciesTexts = [];
    for (const option of speciesOptions.slice(0, 10)) { // First 10 to avoid timeout
        const text = await option.textContent();
        if (text && !text.includes('Loading')) {
            speciesTexts.push(text);
        }
    }
    console.log('📋 Species examples:', speciesTexts.slice(0, 5));
    
    // Verify we have more than just loading option
    expect(speciesCount).toBeGreaterThan(10);
    console.log('✅ Species count validation passed');
    
    // Check careers dropdown
    const careerSelect = page.locator('select[name="career"]');
    await expect(careerSelect).toBeVisible();
    console.log('✅ Career dropdown is visible');
    
    // Get all career options
    const careerOptions = await careerSelect.locator('option').all();
    const careerCount = careerOptions.length;
    console.log(`📊 Found ${careerCount} career options`);
    
    // Verify we have all careers
    expect(careerCount).toBeGreaterThan(10);
    console.log('✅ Career count validation passed');
    
    // Test selecting a new species/career combination
    await page.fill('input[name="character_name"]', 'Test Complete Character');
    await page.fill('input[name="player_name"]', 'Test Player');
    
    // Try to select Human (should have 110 XP)
    await speciesSelect.selectOption('Human');
    console.log('✅ Selected Human species');
    
    // Try to select Guardian career
    await careerSelect.selectOption('Guardian');
    console.log('✅ Selected Guardian career');
    
    await page.fill('textarea[name="background"]', 'Testing complete character creation');
    console.log('✅ Filled all form fields');
    
    // Take screenshot of completed form
    await page.screenshot({ 
        path: 'character-creation-complete-authenticated.png',
        fullPage: true 
    });
    console.log('📸 Screenshot saved: character-creation-complete-authenticated.png');
    
    console.log('🎉 Character creation test completed successfully!');
    console.log(`📊 Results: ${speciesCount} species, ${careerCount} careers available`);
});

test('Verify Species API Data Loading', async ({ page }) => {
    console.log('🎯 Testing species API data directly...');
    
    // Test the API endpoint directly
    const response = await page.request.get('http://localhost:8001/api/character-data/species');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    console.log(`📊 API returned ${data.count} species`);
    
    // Check for specific species
    expect(data.species.Human).toBeDefined();
    expect(data.species.Human.starting_xp).toBe(110);
    console.log('✅ Human species: 110 XP confirmed');
    
    expect(data.species.Wookiee).toBeDefined();
    expect(data.species.Wookiee.starting_xp).toBe(90);
    console.log('✅ Wookiee species: 90 XP confirmed');
    
    // Check for extended universe species
    expect(data.species.Clone).toBeDefined();
    expect(data.species.Clone.starting_xp).toBe(100);
    console.log('✅ Clone species: 100 XP confirmed');
    
    expect(data.species.Togruta).toBeDefined();
    console.log('✅ Togruta species confirmed');
    
    console.log('🎉 Species API validation passed!');
});

test('Verify Careers API Data Loading', async ({ page }) => {
    console.log('🎯 Testing careers API data directly...');
    
    // Test the API endpoint directly
    const response = await page.request.get('http://localhost:8001/api/character-data/careers');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    console.log(`📊 API returned ${data.count} careers`);
    
    // Check for specific careers from each game line
    expect(data.careers['Guardian']).toBeDefined();
    expect(data.careers['Guardian'].game_line).toBe('Force and Destiny');
    console.log('✅ Guardian career (Force and Destiny) confirmed');
    
    expect(data.careers['Smuggler']).toBeDefined();
    expect(data.careers['Smuggler'].game_line).toBe('Edge of the Empire');
    console.log('✅ Smuggler career (Edge of the Empire) confirmed');
    
    expect(data.careers['Ace']).toBeDefined();
    expect(data.careers['Ace'].game_line).toBe('Age of Rebellion');
    console.log('✅ Ace career (Age of Rebellion) confirmed');
    
    // Verify career skills
    expect(data.careers['Guardian'].career_skills).toContain('Discipline');
    console.log('✅ Guardian career skills confirmed');
    
    console.log('🎉 Careers API validation passed!');
});
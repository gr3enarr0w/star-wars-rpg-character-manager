// Test script to verify character creation with all species and careers
const { test, expect } = require('@playwright/test');

test('Character Creation - Complete Species and Careers Loading', async ({ page }) => {
    console.log('🎯 Testing complete character creation with all species and careers...');
    
    // Navigate to character creation
    await page.goto('http://localhost:8001/create');
    console.log('✅ Navigated to character creation page');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if species dropdown loads dynamically
    await page.waitForSelector('select[name="species"]', { timeout: 10000 });
    console.log('✅ Species dropdown found');
    
    // Get species options count
    const speciesOptions = await page.$$('select[name="species"] option');
    const speciesCount = speciesOptions.length;
    console.log(`📊 Species dropdown has ${speciesCount} options`);
    
    // Should have more than the basic 4 species (including loading placeholder)
    expect(speciesCount).toBeGreaterThan(10);
    console.log('✅ Species count validation passed');
    
    // Check for specific species that should be available
    const speciesSelect = page.locator('select[name="species"]');
    
    // Check for core species
    const humanOption = await speciesSelect.locator('option[value="Human"]').count();
    expect(humanOption).toBe(1);
    console.log('✅ Human species available');
    
    // Check for extended universe species
    const cloneOption = await speciesSelect.locator('option[value="Clone"]').count();
    expect(cloneOption).toBe(1);
    console.log('✅ Clone species available');
    
    const togrutaOption = await speciesSelect.locator('option[value="Togruta"]').count();
    expect(togrutaOption).toBe(1);
    console.log('✅ Togruta species available');
    
    // Check careers dropdown
    await page.waitForSelector('select[name="career"]', { timeout: 10000 });
    const careersOptions = await page.$$('select[name="career"] option');
    const careersCount = careersOptions.length;
    console.log(`📊 Careers dropdown has ${careersCount} options`);
    
    // Should have all 15 careers plus loading placeholder
    expect(careersCount).toBeGreaterThan(10);
    console.log('✅ Careers count validation passed');
    
    // Check for specific careers from different game lines
    const careerSelect = page.locator('select[name="career"]');
    
    const guardianOption = await careerSelect.locator('option[value="Guardian"]').count();
    expect(guardianOption).toBe(1);
    console.log('✅ Guardian career available');
    
    const aceOption = await careerSelect.locator('option[value="Ace"]').count();
    expect(aceOption).toBe(1);
    console.log('✅ Ace career available');
    
    const mysticOption = await careerSelect.locator('option[value="Mystic"]').count();
    expect(mysticOption).toBe(1);
    console.log('✅ Mystic career available');
    
    // Test form submission with new species/career combination
    await page.fill('input[name="character_name"]', 'Test Togruta Mystic');
    await page.fill('input[name="player_name"]', 'Test Player');
    await speciesSelect.selectOption('Togruta');
    await careerSelect.selectOption('Mystic');
    await page.fill('textarea[name="background"]', 'A Force-sensitive Togruta seeking balance');
    
    console.log('✅ Filled form with Togruta Mystic character');
    
    // Take screenshot of completed form
    await page.screenshot({ 
        path: 'character-creation-complete-test.png',
        fullPage: true 
    });
    console.log('📸 Screenshot saved: character-creation-complete-test.png');
    
    console.log('🎉 All character creation tests passed!');
    console.log(`📊 Final counts: ${speciesCount} species, ${careersCount} careers`);
});

test('Character Creation - Species Descriptions and XP Values', async ({ page }) => {
    console.log('🎯 Testing species descriptions and XP values...');
    
    await page.goto('http://localhost:8001/create');
    await page.waitForTimeout(2000);
    
    // Check that species have XP values in descriptions
    const speciesSelect = page.locator('select[name="species"]');
    
    // Human should show 110 XP
    const humanText = await speciesSelect.locator('option[value="Human"]').textContent();
    expect(humanText).toContain('110');
    console.log(`✅ Human option text: ${humanText}`);
    
    // Wookiee should show 90 XP  
    const wookieeText = await speciesSelect.locator('option[value="Wookiee"]').textContent();
    expect(wookieeText).toContain('90');
    console.log(`✅ Wookiee option text: ${wookieeText}`);
    
    // Clone should show 100 XP
    const cloneText = await speciesSelect.locator('option[value="Clone"]').textContent();
    expect(cloneText).toContain('100');
    console.log(`✅ Clone option text: ${cloneText}`);
    
    console.log('🎉 Species descriptions and XP validation passed!');
});
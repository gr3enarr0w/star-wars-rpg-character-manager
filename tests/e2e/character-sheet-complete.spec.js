const { test, expect } = require('@playwright/test');

test.describe('Character Sheet Complete Testing', () => {
  let characterId;

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForSelector('h1');
    
    // Create a test character first
    await page.click('button:has-text("Create New Character")');
    await page.waitForSelector('h2:has-text("Character Creation")');
    
    // Fill character creation form
    await page.fill('input[name="name"]', 'Sheet Test Character');
    await page.fill('input[name="playerName"]', 'Test Player');
    await page.selectOption('select[name="species"]', 'Human');
    await page.selectOption('select[name="career"]', 'Guardian');
    await page.fill('textarea[name="background"]', 'A test character for sheet testing');
    
    // Submit character creation
    await page.click('button:has-text("Create Character")');
    
    // Wait for success and get character ID
    await page.waitForSelector('.character-card');
    
    // Click on the character to view sheet
    await page.click('.character-card');
    
    // Should now be on character sheet
    await page.waitForSelector('#character-sheet');
    await page.waitForSelector('#character-content');
  });

  test('should display complete character sheet with all sections', async ({ page }) => {
    // Check main character information
    await expect(page.locator('#character-name')).not.toHaveText('Character Name');
    await expect(page.locator('#character-subtitle')).toContainText('Human');
    await expect(page.locator('#character-subtitle')).toContainText('Guardian');
    
    // Check all required sections are present
    const sections = [
      'Character Information',
      'Characteristics',
      'Derived Attributes', 
      'Skills',
      'Talents & Abilities',
      'Equipment',
      'Obligations & Duties',
      'Credits & Resources'
    ];
    
    for (const section of sections) {
      await expect(page.locator(`h3:has-text("${section}")`)).toBeVisible();
    }
    
    // Check characteristics display
    const characteristics = ['Brawn', 'Agility', 'Intellect', 'Cunning', 'Willpower', 'Presence'];
    for (const char of characteristics) {
      await expect(page.locator(`.characteristic-name:has-text("${char}")`)).toBeVisible();
      await expect(page.locator(`.characteristic-value`)).toBeVisible();
    }
    
    // Check derived attributes
    await expect(page.locator('#wound-threshold')).toBeVisible();
    await expect(page.locator('#strain-threshold')).toBeVisible();
    await expect(page.locator('#soak-value')).toBeVisible();
    
    // Check skills are displayed by category
    await expect(page.locator('.skills-category-title:has-text("Brawn")')).toBeVisible();
    await expect(page.locator('.skills-category-title:has-text("Agility")')).toBeVisible();
    await expect(page.locator('.skills-category-title:has-text("Intellect")')).toBeVisible();
  });

  test('should support XP history modal functionality', async ({ page }) => {
    // Click XP History button in sidebar
    await page.click('button:has-text("XP History")');
    
    // Check modal appears
    await expect(page.locator('h3:has-text("Experience Points History")')).toBeVisible();
    
    // Should show either history entries or empty state
    const hasEntries = await page.locator('.xp-history-item').count() > 0;
    const hasEmptyState = await page.locator('text=No XP history available').isVisible();
    
    expect(hasEntries || hasEmptyState).toBeTruthy();
    
    // Close modal
    await page.click('button:has-text("Close")');
    await expect(page.locator('h3:has-text("Experience Points History")')).not.toBeVisible();
  });

  test('should support adding talents with modal', async ({ page }) => {
    // Click Add Talent button
    await page.click('button:has-text("Add Talent")');
    
    // Check talent modal appears
    await expect(page.locator('h3:has-text("Add Talent")')).toBeVisible();
    
    // Fill out talent form
    await page.fill('input[name="name"]', 'Test Talent');
    await page.fill('textarea[name="description"]', 'A test talent for verification');
    await page.selectOption('select[name="activation"]', 'Active (Maneuver)');
    await page.selectOption('select[name="ranked"]', 'true');
    
    // Submit talent
    await page.click('button:has-text("Add Talent")');
    
    // Should show success (or handle appropriately based on backend)
    await page.waitForTimeout(1000); // Allow for processing
    
    // Modal should close
    await expect(page.locator('h3:has-text("Add Talent")')).not.toBeVisible();
  });

  test('should support adding equipment with modal', async ({ page }) => {
    // Click Add Equipment button
    await page.click('button:has-text("Add Equipment")');
    
    // Check equipment modal appears
    await expect(page.locator('h3:has-text("Add Equipment")')).toBeVisible();
    
    // Fill out equipment form
    await page.fill('input[name="name"]', 'Test Blaster');
    await page.fill('textarea[name="description"]', 'A reliable sidearm for testing');
    await page.selectOption('select[name="type"]', 'weapon');
    await page.fill('input[name="encumbrance"]', '1');
    await page.fill('input[name="price"]', '400');
    
    // Submit equipment
    await page.click('button:has-text("Add Equipment")');
    
    // Should show success
    await expect(page.locator('text=Equipment added successfully!')).toBeVisible();
  });

  test('should support adding obligations with modal', async ({ page }) => {
    // Find and click Add obligation button (next to Obligations & Duties header)
    const obligationSection = page.locator('h3:has-text("Obligations & Duties")').locator('..');
    await obligationSection.locator('button:has-text("Add")').click();
    
    // Check obligation modal appears
    await expect(page.locator('h3:has-text("Add Obligation/Duty")')).toBeVisible();
    
    // Fill out obligation form
    await page.selectOption('select[name="type"]', 'Debt');
    await page.fill('input[name="magnitude"]', '15');
    await page.fill('textarea[name="description"]', 'Owes credits to a crime syndicate after a deal gone wrong');
    
    // Submit obligation
    await page.click('button:has-text("Add Obligation")');
    
    // Should show success
    await expect(page.locator('text=Obligation added successfully!')).toBeVisible();
  });

  test('should support editing resources', async ({ page }) => {
    // Click Edit Resources button
    await page.click('button:has-text("Edit Resources")');
    
    // Check resources modal appears
    await expect(page.locator('h3:has-text("Edit Resources")')).toBeVisible();
    
    // Update resources
    await page.fill('input[name="credits"]', '1500');
    await page.fill('input[name="wounds"]', '3');
    await page.fill('input[name="strain"]', '2');
    
    // Submit changes
    await page.click('button:has-text("Save Changes")');
    
    // Should show success
    await expect(page.locator('text=Resources updated successfully!')).toBeVisible();
    
    // Check credits updated in display
    await expect(page.locator('#display-credits')).toHaveText('1500');
  });

  test('should support character advancement with XP costs', async ({ page }) => {
    // Check that advancement buttons are present
    const characteristicButtons = page.locator('.characteristic-display button:has-text("+")');
    const skillButtons = page.locator('.skill-display button:has-text("+")');
    
    expect(await characteristicButtons.count()).toBeGreaterThan(0);
    expect(await skillButtons.count()).toBeGreaterThan(0);
    
    // Check XP costs are displayed
    await expect(page.locator('text=XP)')).toBeVisible();
    
    // Test advancing a characteristic (if available XP)
    const firstCharButton = characteristicButtons.first();
    if (await firstCharButton.isVisible()) {
      await firstCharButton.click();
      // Should show confirmation dialog or process advancement
      await page.waitForTimeout(500);
    }
  });

  test('should display dice pools for skills', async ({ page }) => {
    // Check that skills show dice pools
    const dicePoolElements = page.locator('.skill-dice');
    expect(await dicePoolElements.count()).toBeGreaterThan(0);
    
    // Check dice pool format (should be like "2A", "1P+1A", etc.)
    const firstDicePool = await dicePoolElements.first().textContent();
    expect(firstDicePool).toMatch(/\d+[AP]|\d+[AP]\+\d+[AP]/);
  });

  test('should support awarding XP with modal', async ({ page }) => {
    // Click Award XP button
    await page.click('button:has-text("Award XP")');
    
    // Check XP award modal appears
    await expect(page.locator('h3:has-text("Award Experience Points")')).toBeVisible();
    
    // Fill out XP form
    await page.fill('input[name="amount"]', '20');
    await page.fill('input[name="reason"]', 'Completed adventure successfully');
    
    // Submit XP award
    await page.click('button:has-text("Award XP")');
    
    // Should show success and close modal
    await page.waitForTimeout(1000);
    await expect(page.locator('h3:has-text("Award Experience Points")')).not.toBeVisible();
  });

  test('should display talents and equipment sections properly', async ({ page }) => {
    // Check talents section
    const talentsSection = page.locator('#talents-display');
    await expect(talentsSection).toBeVisible();
    
    // Should show either talents or empty state
    const hasTalents = await page.locator('.talent-item').count() > 0;
    const hasEmptyTalents = await page.locator('text=No talents acquired yet').isVisible();
    expect(hasTalents || hasEmptyTalents).toBeTruthy();
    
    // Check equipment section  
    const equipmentSection = page.locator('#equipment-display');
    await expect(equipmentSection).toBeVisible();
    
    // Should show either equipment or empty state
    const hasEquipment = await page.locator('.equipment-item').count() > 0;
    const hasEmptyEquipment = await page.locator('text=No equipment listed').isVisible();
    expect(hasEquipment || hasEmptyEquipment).toBeTruthy();
  });

  test('should show obligations section properly', async ({ page }) => {
    // Check obligations section
    const obligationsSection = page.locator('#obligations-display');
    await expect(obligationsSection).toBeVisible();
    
    // Should show either obligations or empty state
    const hasObligations = await page.locator('.obligation-item').count() > 0;
    const hasEmptyObligations = await page.locator('text=No obligations or duties recorded').isVisible();
    expect(hasObligations || hasEmptyObligations).toBeTruthy();
  });

  test('should display wound and strain tracks', async ({ page }) => {
    // Check wound track
    await expect(page.locator('#wound-track')).toBeVisible();
    const woundBoxes = page.locator('#wound-track .track-box');
    expect(await woundBoxes.count()).toBeGreaterThan(0);
    
    // Check strain track
    await expect(page.locator('#strain-track')).toBeVisible();
    const strainBoxes = page.locator('#strain-track .track-box');
    expect(await strainBoxes.count()).toBeGreaterThan(0);
  });

  test('should support modal interactions and closing', async ({ page }) => {
    // Test XP History modal
    await page.click('button:has-text("XP History")');
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    // Close by clicking X
    await page.click('.modal-close, button[onclick="closeModal()"]');
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
    
    // Test Add Talent modal
    await page.click('button:has-text("Add Talent")');
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    // Close by clicking Cancel
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });

  test('should be responsive on mobile viewports', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // All sections should still be visible
    await expect(page.locator('h3:has-text("Character Information")')).toBeVisible();
    await expect(page.locator('h3:has-text("Characteristics")')).toBeVisible();
    await expect(page.locator('h3:has-text("Skills")')).toBeVisible();
    
    // Character sheet should adapt to mobile layout
    const characterSheet = page.locator('#character-sheet');
    await expect(characterSheet).toBeVisible();
    
    // Test that buttons are touch-friendly (min 44px)
    const buttons = page.locator('.btn');
    const firstButton = buttons.first();
    if (await firstButton.isVisible()) {
      const boundingBox = await firstButton.boundingBox();
      expect(boundingBox.height).toBeGreaterThanOrEqual(44);
    }
  });
});
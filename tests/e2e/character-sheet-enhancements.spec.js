const { test, expect } = require('@playwright/test');

test.describe('Character Sheet Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    
    // Wait for page to load
    await page.waitForSelector('h1');
    
    // Click "Get Started" to access the app if needed
    const getStartedButton = page.locator('button:has-text("Get Started")');
    if (await getStartedButton.isVisible()) {
      await getStartedButton.click();
    }
    
    // Navigate to dashboard to find a character
    await page.goto('http://localhost:8080');
    await page.waitForSelector('h1:has-text("Star Wars RPG Character Manager")');
    
    // Look for an existing character or create one
    const characterCards = page.locator('.character-card');
    const firstCard = characterCards.first();
    
    if (await firstCard.isVisible()) {
      await firstCard.click();
    } else {
      // Create a test character first
      await page.click('button:has-text("Create New Character")');
      await page.waitForSelector('input[name="name"]');
      
      await page.fill('input[name="name"]', 'Test Character for Sheet');
      await page.fill('input[name="playerName"]', 'Test Player');
      await page.selectOption('select[name="species"]', 'Human');
      await page.selectOption('select[name="career"]', 'Guardian');
      
      await page.click('button:has-text("Create Character")');
      await page.waitForSelector('.character-card');
      
      // Click on the new character
      await page.click('.character-card');
    }
    
    // Should now be on character sheet
    await page.waitForSelector('#character-sheet');
  });

  test('should display enhanced character sheet with all sections', async ({ page }) => {
    // Wait for character content to load
    await page.waitForSelector('#character-content');
    
    // Check for main character sheet sections
    await expect(page.locator('h3:has-text("Character Information")')).toBeVisible();
    await expect(page.locator('h3:has-text("Characteristics")')).toBeVisible();
    await expect(page.locator('h3:has-text("Derived Attributes")')).toBeVisible();
    await expect(page.locator('h3:has-text("Skills")')).toBeVisible();
    
    // Check for enhanced sections
    await expect(page.locator('h3:has-text("Talents & Abilities")')).toBeVisible();
    await expect(page.locator('h3:has-text("Equipment")')).toBeVisible();
    await expect(page.locator('h3:has-text("Obligations & Duties")')).toBeVisible();
    await expect(page.locator('h3:has-text("Credits & Resources")')).toBeVisible();
    
    // Check for add buttons
    await expect(page.locator('button:has-text("Add Talent")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Equipment")')).toBeVisible();
    await expect(page.locator('button:has-text("Add")')).toBeVisible(); // Add obligation button
  });

  test('should support XP history functionality', async ({ page }) => {
    await page.waitForSelector('#character-content');
    
    // Click XP History button
    await page.click('button:has-text("XP History")');
    
    // Check for XP history modal
    await expect(page.locator('h3:has-text("Experience Points History")')).toBeVisible();
    
    // Should show XP history entries or empty state
    await expect(page.locator('.xp-history-item, text=No XP history available')).toBeVisible();
    
    // Close modal
    await page.click('button:has-text("Close")');
    await expect(page.locator('h3:has-text("Experience Points History")')).not.toBeVisible();
  });

  test('should support adding talents', async ({ page }) => {
    await page.waitForSelector('#character-content');
    
    // Click Add Talent button
    await page.click('button:has-text("Add Talent")');
    
    // Check for talent modal
    await expect(page.locator('h3:has-text("Add Talent")')).toBeVisible();
    
    // Fill out talent form
    await page.fill('input[name="name"]', 'Test Talent');
    await page.fill('textarea[name="description"]', 'This is a test talent for demonstration purposes.');
    await page.selectOption('select[name="activation"]', 'Active (Maneuver)');
    await page.selectOption('select[name="ranked"]', 'true');
    
    // Submit form
    await page.click('button:has-text("Add Talent")');
    
    // Should show success message
    await expect(page.locator('text=Talent added successfully!')).toBeVisible();
  });

  test('should support adding equipment', async ({ page }) => {
    await page.waitForSelector('#character-content');
    
    // Click Add Equipment button
    await page.click('button:has-text("Add Equipment")');
    
    // Check for equipment modal
    await expect(page.locator('h3:has-text("Add Equipment")')).toBeVisible();
    
    // Fill out equipment form
    await page.fill('input[name="name"]', 'Test Blaster');
    await page.fill('textarea[name="description"]', 'A reliable sidearm for any adventurer.');
    await page.selectOption('select[name="type"]', 'weapon');
    await page.fill('input[name="encumbrance"]', '1');
    await page.fill('input[name="price"]', '400');
    
    // Submit form
    await page.click('button:has-text("Add Equipment")');
    
    // Should show success message
    await expect(page.locator('text=Equipment added successfully!')).toBeVisible();
  });

  test('should support adding obligations', async ({ page }) => {
    await page.waitForSelector('#character-content');
    
    // Look for the Add button in the obligations section
    const obligationsSection = page.locator('h3:has-text("Obligations & Duties")').locator('..').locator('button:has-text("Add")');
    await obligationsSection.click();
    
    // Check for obligation modal
    await expect(page.locator('h3:has-text("Add Obligation/Duty")')).toBeVisible();
    
    // Fill out obligation form
    await page.selectOption('select[name="type"]', 'Debt');
    await page.fill('input[name="magnitude"]', '15');
    await page.fill('textarea[name="description"]', 'Owes money to a crime syndicate after a smuggling deal gone wrong.');
    
    // Submit form
    await page.click('button:has-text("Add Obligation")');
    
    // Should show success message
    await expect(page.locator('text=Obligation added successfully!')).toBeVisible();
  });

  test('should support editing resources', async ({ page }) => {
    await page.waitForSelector('#character-content');
    
    // Click Edit Resources button
    await page.click('button:has-text("Edit Resources")');
    
    // Check for resources modal
    await expect(page.locator('h3:has-text("Edit Resources")')).toBeVisible();
    
    // Update resources
    await page.fill('input[name="credits"]', '1000');
    await page.fill('input[name="wounds"]', '2');
    await page.fill('input[name="strain"]', '1');
    
    // Submit form
    await page.click('button:has-text("Save Changes")');
    
    // Should show success message
    await expect(page.locator('text=Resources updated successfully!')).toBeVisible();
    
    // Verify credits updated in display
    await expect(page.locator('#display-credits')).toHaveText('1000');
  });

  test('should display character advancement options', async ({ page }) => {
    await page.waitForSelector('#character-content');
    
    // Check that advancement buttons are present for characteristics
    const characteristicButtons = page.locator('.characteristic-display button');
    expect(await characteristicButtons.count()).toBeGreaterThan(0);
    
    // Check that advancement buttons are present for skills
    const skillButtons = page.locator('.skill-display button');
    expect(await skillButtons.count()).toBeGreaterThan(0);
    
    // Check for XP cost indicators
    await expect(page.locator('text=XP')).toBeVisible();
  });

  test('should show actual character data', async ({ page }) => {
    await page.waitForSelector('#character-content');
    
    // Check that character information is displayed
    await expect(page.locator('#character-name')).not.toHaveText('Character Name');
    await expect(page.locator('#character-subtitle')).toContain('text');
    
    // Check that characteristics have values
    const characteristicValues = page.locator('.characteristic-value');
    expect(await characteristicValues.count()).toBe(6);
    
    // Check that skills are displayed
    await expect(page.locator('.skill-display')).toBeVisible();
    
    // Check that dice pools are calculated
    await expect(page.locator('.skill-dice')).toBeVisible();
  });
});
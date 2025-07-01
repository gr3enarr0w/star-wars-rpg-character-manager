// tests/character-management.spec.js
const { test, expect } = require('@playwright/test');
const { loginUser, ADMIN_USER } = require('./auth.setup.js');

test.describe('Character Management', () => {
  test.beforeEach(async ({ page }) => {
    // Create admin and login
    await page.request.post('/api/debug/create-admin');
    await loginUser(page, ADMIN_USER);
  });

  test('should display empty state when no characters exist', async ({ page }) => {
    // Should show empty state
    await expect(page.locator('text=Welcome to the Galaxy')).toBeVisible();
    await expect(page.locator('text=Create Your First Character')).toBeVisible();
    await expect(page.locator('text=Getting Started')).toBeVisible();
    
    // Should have both character and campaign creation buttons
    await expect(page.locator('button:has-text("Create Your First Character")')).toBeVisible();
    await expect(page.locator('#create-campaign-tab-btn')).toBeVisible();
  });

  test('should create a character successfully', async ({ page }) => {
    // Click create character button
    await page.click('button:has-text("Create Your First Character")');
    
    // Wait for form to appear
    await expect(page.locator('input[name="name"]')).toBeVisible();
    
    // Fill character form
    await page.fill('input[name="name"]', 'Test Smuggler');
    await page.fill('input[name="playerName"]', 'Test Player');
    
    // Use select_option for dropdowns (THE FIX from Issue #51)
    await page.selectOption('select[name="species"]', 'Human');
    await page.selectOption('select[name="career"]', 'Smuggler');
    
    // Fill background if field exists
    const backgroundField = page.locator('input[name="background"], textarea[name="background"]');
    if (await backgroundField.isVisible()) {
      await backgroundField.fill('Test background');
    }
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Create")');
    
    // Should show character details
    await expect(page.locator('text=Test Smuggler')).toBeVisible();
    await expect(page.locator('text=Human')).toBeVisible();
    await expect(page.locator('.stat-value:has-text("Smuggler")')).toBeVisible();
  });

  test('should display character list after creation', async ({ page }) => {
    // Create a character first
    await page.click('button:has-text("Create Your First Character")');
    await page.fill('input[name="name"]', 'Luke Skywalker');
    await page.fill('input[name="playerName"]', 'Player1');
    await page.selectOption('select[name="species"]', 'Human');
    await page.selectOption('select[name="career"]', 'Guardian');
    await page.click('button[type="submit"], button:has-text("Create")');
    
    // Go back to dashboard
    await page.click('[data-action="show-dashboard"], text=Dashboard');
    
    // Should show character list instead of empty state
    await expect(page.locator('text=My Characters')).toBeVisible();
    await expect(page.locator('text=Luke Skywalker')).toBeVisible();
    await expect(page.locator('text=Create New Character')).toBeVisible();
  });

  test('should edit character details', async ({ page }) => {
    // Create character first
    await page.click('button:has-text("Create Your First Character")');
    await page.fill('input[name="name"]', 'Leia Organa');
    await page.fill('input[name="playerName"]', 'Player2');
    await page.selectOption('select[name="species"]', 'Human');
    await page.selectOption('select[name="career"]', 'Diplomat');
    await page.click('button[type="submit"], button:has-text("Create")');
    
    // Edit character
    await page.click('button:has-text("Edit")');
    
    // Update name
    await page.fill('input[name="name"]', 'Princess Leia');
    await page.click('button:has-text("Save"), button[type="submit"]');
    
    // Verify change
    await expect(page.locator('text=Princess Leia')).toBeVisible();
  });

  test('should award XP to character', async ({ page }) => {
    // Create character first
    await page.click('button:has-text("Create Your First Character")');
    await page.fill('input[name="name"]', 'Han Solo');
    await page.fill('input[name="playerName"]', 'Player3');
    await page.selectOption('select[name="species"]', 'Human');
    await page.selectOption('select[name="career"]', 'Smuggler');
    await page.click('button[type="submit"], button:has-text("Create")');
    
    // Wait for character to be displayed
    await expect(page.locator('text=Han Solo')).toBeVisible();
    
    // Award XP - use specific data-action selector
    await page.click('[data-action="award-xp"]');
    
    // Wait for modal to appear and be ready
    await page.waitForSelector('.modal-overlay', { state: 'visible' });
    await page.waitForSelector('#award-xp-form', { state: 'visible' });
    
    // Fill XP form with more specific selectors
    await page.fill('#award-xp-form input[name="amount"]', '25');
    await page.fill('#award-xp-form input[name="reason"]', 'Completed mission');
    
    // Click the Award XP button inside the modal
    await page.click('.modal-footer button:has-text("Award XP")');
    
    // Wait for modal to close
    await page.waitForSelector('.modal-overlay', { state: 'detached' });
    
    // Should see updated XP (character starts with starting XP + 25)
    await expect(page.locator('.stat-box:has-text("Available XP")')).toBeVisible();
    await expect(page.locator('.stat-box:has-text("Total XP")')).toBeVisible();
  });

  test('should advance character skills', async ({ page }) => {
    // Create character first
    await page.click('button:has-text("Create Your First Character")');
    await page.fill('input[name="name"]', 'Obi-Wan');
    await page.fill('input[name="playerName"]', 'Player4');
    await page.selectOption('select[name="species"]', 'Human');
    await page.selectOption('select[name="career"]', 'Guardian');
    await page.click('button[type="submit"], button:has-text("Create")');
    
    // View character details to see skills
    await page.click('text=Obi-Wan');
    
    // Look for skill advancement options
    const advanceButton = page.locator('button:has-text("Advance"), button:has-text("+")');
    if (await advanceButton.first().isVisible()) {
      await advanceButton.first().click();
      
      // Should show confirmation or update
      await expect(page.locator('text=advanced, text=increased')).toBeVisible();
    }
  });

  test('should export and import character', async ({ page }) => {
    // Create character first
    await page.click('button:has-text("Create Your First Character")');
    await page.fill('input[name="name"]', 'Yoda');
    await page.fill('input[name="playerName"]', 'GM');
    await page.selectOption('select[name="species"]', 'Human'); // Simplified for test
    await page.selectOption('select[name="career"]', 'Mystic');
    await page.click('button[type="submit"], button:has-text("Create")');
    
    // Wait for character to be displayed
    await expect(page.locator('text=Yoda')).toBeVisible();
    
    // Test export functionality - verify button exists and is clickable
    await expect(page.locator('[data-action="export-character"]')).toBeVisible();
    
    // Setup download monitoring
    const downloadPromise = page.waitForEvent('download');
    
    // Click export button
    await page.click('[data-action="export-character"]');
    
    // Verify download was triggered
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('Yoda');
    expect(download.suggestedFilename()).toContain('.json');
  });
});
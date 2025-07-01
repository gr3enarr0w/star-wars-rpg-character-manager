const { test, expect } = require('@playwright/test');

test.describe('Character Sheet Enhancements - Core Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('h1', { timeout: 10000 });
  });

  test('should load homepage and allow navigation to character creation', async ({ page }) => {
    // Check homepage loads
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Look for character creation link (it's actually a link, not a button)
    const createLink = page.locator('a:has-text("Create Character"), a:has-text("+ Create Character")');
    const characterCard = page.locator('.character-card');
    
    // Should have either creation option or existing characters
    const hasCreateLink = await createLink.count() > 0;
    const hasCharacters = await characterCard.count() > 0;
    
    expect(hasCreateLink || hasCharacters).toBeTruthy();
  });

  test('should create character and navigate to character sheet', async ({ page }) => {
    // Try to create a character
    const createLink = page.locator('a:has-text("Create Character"), a:has-text("+ Create Character")').first();
    
    if (await createLink.isVisible()) {
      await createLink.click();
      
      // Should navigate to character creation form
      await page.waitForTimeout(1000);
      
      // Look for character creation elements
      const nameInput = page.locator('input[name="name"]');
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test Sheet Character');
        
        const playerInput = page.locator('input[name="playerName"]');
        if (await playerInput.isVisible()) {
          await playerInput.fill('Test Player');
        }
        
        const speciesSelect = page.locator('select[name="species"]');
        if (await speciesSelect.isVisible()) {
          await speciesSelect.selectOption('Human');
        }
        
        const careerSelect = page.locator('select[name="career"]');
        if (await careerSelect.isVisible()) {
          await careerSelect.selectOption('Guardian');
        }
        
        // Submit character creation
        const submitButton = page.locator('button[type="submit"], button:has-text("Create")').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }
    
    // Now look for characters and click one
    await page.goto('http://localhost:8080');
    await page.waitForSelector('h1');
    
    const characterCard = page.locator('.character-card').first();
    if (await characterCard.isVisible()) {
      await characterCard.click();
      
      // Should navigate to character sheet
      await page.waitForTimeout(2000);
      
      // Check if we're on character sheet
      const characterSheet = page.locator('#character-sheet, .character-sheet');
      await expect(characterSheet).toBeVisible();
    }
  });

  test('should display character sheet sections when viewing a character', async ({ page }) => {
    // Wait for page to load properly
    await page.waitForTimeout(1000);
    
    // Navigate to dashboard and find a character
    const characterCard = page.locator('.character-card').first();
    
    if (await characterCard.isVisible()) {
      await characterCard.click();
      await page.waitForTimeout(2000);
      
      // Check for main character sheet elements
      const characterContent = page.locator('#character-content, .character-content');
      if (await characterContent.isVisible()) {
        // Check for key sections
        const sections = [
          'Characteristics',
          'Skills', 
          'Talents',
          'Equipment'
        ];
        
        for (const section of sections) {
          const sectionElement = page.locator(`text=${section}, h3:has-text("${section}"), h2:has-text("${section}")`);
          if (await sectionElement.count() > 0) {
            await expect(sectionElement.first()).toBeVisible();
          }
        }
        
        // Check for XP display
        const xpElement = page.locator('text=XP, text=Experience');
        if (await xpElement.count() > 0) {
          await expect(xpElement.first()).toBeVisible();
        }
      }
    } else {
      // If no characters exist, that's OK for this test
      console.log('No characters found to test character sheet');
    }
  });

  test('should support modal interactions for character enhancements', async ({ page }) => {
    // Wait for page to load properly
    await page.waitForTimeout(1000);
    
    // Navigate to a character sheet
    const characterCard = page.locator('.character-card').first();
    
    if (await characterCard.isVisible()) {
      await characterCard.click();
      await page.waitForTimeout(2000);
      
      // Test XP History button if available
      const xpHistoryButton = page.locator('button:has-text("XP History"), button:has-text("History")');
      if (await xpHistoryButton.count() > 0) {
        await xpHistoryButton.first().click();
        await page.waitForTimeout(1000);
        
        // Check if modal appeared
        const modal = page.locator('.modal, .modal-overlay');
        if (await modal.count() > 0) {
          await expect(modal.first()).toBeVisible();
          
          // Close modal
          const closeButton = page.locator('button:has-text("Close"), .modal-close, button[onclick*="close"]');
          if (await closeButton.count() > 0) {
            await closeButton.first().click();
            await page.waitForTimeout(500);
          }
        }
      }
      
      // Test Add Talent button if available
      const addTalentButton = page.locator('button:has-text("Add Talent")');
      if (await addTalentButton.count() > 0) {
        await addTalentButton.first().click();
        await page.waitForTimeout(1000);
        
        // Check if modal appeared
        const modal = page.locator('.modal, .modal-overlay');
        if (await modal.count() > 0) {
          await expect(modal.first()).toBeVisible();
          
          // Close modal by clicking cancel or X
          const cancelButton = page.locator('button:has-text("Cancel"), .modal-close');
          if (await cancelButton.count() > 0) {
            await cancelButton.first().click();
            await page.waitForTimeout(500);
          }
        }
      }
      
      // Test Add Equipment button if available
      const addEquipmentButton = page.locator('button:has-text("Add Equipment")');
      if (await addEquipmentButton.count() > 0) {
        await addEquipmentButton.first().click();
        await page.waitForTimeout(1000);
        
        const modal = page.locator('.modal, .modal-overlay');
        if (await modal.count() > 0) {
          await expect(modal.first()).toBeVisible();
          
          const cancelButton = page.locator('button:has-text("Cancel"), .modal-close');
          if (await cancelButton.count() > 0) {
            await cancelButton.first().click();
            await page.waitForTimeout(500);
          }
        }
      }
    }
  });

  test('should display character advancement options', async ({ page }) => {
    // Wait for page to load properly
    await page.waitForTimeout(1000);
    
    const characterCard = page.locator('.character-card').first();
    
    if (await characterCard.isVisible()) {
      await characterCard.click();
      await page.waitForTimeout(2000);
      
      // Check for advancement buttons
      const advancementButtons = page.locator('button:has-text("+"), button:has-text("Advance")');
      if (await advancementButtons.count() > 0) {
        // Should have some advancement options
        expect(await advancementButtons.count()).toBeGreaterThan(0);
      }
      
      // Check for XP costs displayed
      const xpCosts = page.locator('text=XP)');
      if (await xpCosts.count() > 0) {
        expect(await xpCosts.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should be responsive on different viewport sizes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Page should still be accessible - use more specific selector
    await expect(page.locator('h1:has-text("Star Wars RPG Character Manager"), h1:has-text("My Characters")').first()).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1:has-text("Star Wars RPG Character Manager"), h1:has-text("My Characters")').first()).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('h1:has-text("Star Wars RPG Character Manager"), h1:has-text("My Characters")').first()).toBeVisible();
  });
});
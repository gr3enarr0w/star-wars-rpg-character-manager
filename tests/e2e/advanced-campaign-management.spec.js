const { test, expect } = require('@playwright/test');

test.describe('Advanced Campaign Management Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    
    // Wait for page to load
    await page.waitForSelector('h1');
    
    // Click "Get Started" to access the app
    const getStartedButton = page.locator('button:has-text("Get Started")');
    if (await getStartedButton.isVisible()) {
      await getStartedButton.click();
    }
    
    // Navigate to campaigns
    await page.goto('http://localhost:8000/campaigns');
    await page.waitForSelector('h1:has-text("Campaign Management")');
  });

  test('should display campaign management interface with advanced features', async ({ page }) => {
    // Check for main campaign tabs
    await expect(page.locator('button:has-text("My Campaigns")')).toBeVisible();
    await expect(page.locator('#create-campaign-tab-btn')).toBeVisible();
    await expect(page.locator('#join-campaign-tab-btn')).toBeVisible();
    
    // Check for campaign cards with advanced actions
    const campaignCards = page.locator('.campaign-card');
    const firstCard = campaignCards.first();
    
    if (await firstCard.isVisible()) {
      // Check for Session Tracker button (GM feature)
      await expect(firstCard.locator('button:has-text("Session Tracker"), button:has-text("Session History")')).toBeVisible();
      
      // Check for Manage Players button (GM feature)
      const managePlayersButton = firstCard.locator('button:has-text("Manage Players")');
      if (await managePlayersButton.isVisible()) {
        await managePlayersButton.click();
        
        // Check for enhanced player management modal
        await expect(page.locator('h3:has-text("Manage Players")')).toBeVisible();
        
        // Check for player list with additional info
        await expect(page.locator('.player-item')).toBeVisible();
        await expect(page.locator('button:has-text("Message")')).toBeVisible();
        
        // Check for invitation management
        await expect(page.locator('h4:has-text("Player Invitations")')).toBeVisible();
        await expect(page.locator('button:has-text("Copy Code")')).toBeVisible();
        
        // Check for enhanced campaign settings
        await expect(page.locator('input#max-players-input')).toBeVisible();
        await expect(page.locator('select#campaign-visibility')).toBeVisible();
        await expect(page.locator('select#session-frequency')).toBeVisible();
        
        // Close modal
        await page.locator('.modal-close').click();
      }
    }
  });

  test('should support session tracking functionality', async ({ page }) => {
    const campaignCards = page.locator('.campaign-card');
    const firstCard = campaignCards.first();
    
    if (await firstCard.isVisible()) {
      const sessionButton = firstCard.locator('button:has-text("Session Tracker"), button:has-text("Session History")');
      if (await sessionButton.isVisible()) {
        await sessionButton.click();
        
        // Check for session tracking modal
        await expect(page.locator('h3:has-text("Session Tracker"), h3:has-text("Session History")')).toBeVisible();
        
        // Check for create new session button (GM only)
        const createSessionButton = page.locator('button:has-text("Create New Session")');
        if (await createSessionButton.isVisible()) {
          await createSessionButton.click();
          
          // Check for session creation form
          await expect(page.locator('h3:has-text("Create New Session")')).toBeVisible();
          await expect(page.locator('input#session-name')).toBeVisible();
          await expect(page.locator('input#session-date')).toBeVisible();
          await expect(page.locator('input#session-duration')).toBeVisible();
          await expect(page.locator('input#session-players')).toBeVisible();
          await expect(page.locator('input#session-xp')).toBeVisible();
          await expect(page.locator('textarea#session-notes')).toBeVisible();
          
          // Test creating a session
          await page.fill('input#session-name', 'Test Session: Escape from Tatooine');
          await page.fill('input#session-duration', '150');
          await page.fill('input#session-players', '4');
          await page.fill('input#session-xp', '20');
          await page.fill('textarea#session-notes', 'Great session with epic lightsaber battle!');
          
          await page.click('button:has-text("Create Session")');
          
          // Should show success message
          await expect(page.locator('text=Session created successfully!')).toBeVisible();
        }
        
        // Check for session history display
        await expect(page.locator('.session-item, text=No sessions recorded yet')).toBeVisible();
        
        // Close modal
        await page.locator('.modal-close').click();
      }
    }
  });

  test('should support enhanced player management features', async ({ page }) => {
    const campaignCards = page.locator('.campaign-card');
    const firstCard = campaignCards.first();
    
    if (await firstCard.isVisible()) {
      const manageButton = firstCard.locator('button:has-text("Manage Players")');
      if (await manageButton.isVisible()) {
        await manageButton.click();
        
        // Test messaging functionality
        const messageButton = page.locator('button:has-text("Message")').first();
        if (await messageButton.isVisible()) {
          await messageButton.click();
          
          await expect(page.locator('h3:has-text("Send Message to Player")')).toBeVisible();
          await expect(page.locator('textarea#player-message')).toBeVisible();
          
          // Test sending a message
          await page.fill('textarea#player-message', 'Hey! Ready for next session?');
          await page.click('button:has-text("Send Message")');
          
          await expect(page.locator('text=Message sent successfully!')).toBeVisible();
        }
        
        // Test invite code copying
        const copyButton = page.locator('button:has-text("Copy Code")');
        if (await copyButton.isVisible()) {
          await copyButton.click();
          await expect(page.locator('text=copied to clipboard')).toBeVisible();
        }
        
        // Close modal
        await page.locator('.modal-close').click();
      }
    }
  });

  test('should create campaign with advanced options', async ({ page }) => {
    // Click Create Campaign tab
    await page.click('#create-campaign-tab-btn');
    
    // Fill out enhanced campaign form
    await page.fill('input[name="name"]', 'Advanced Test Campaign');
    await page.selectOption('select[name="game_system"]', 'Edge of the Empire');
    await page.fill('input[name="max_players"]', '6');
    await page.fill('textarea[name="description"]', 'A comprehensive test of advanced campaign features including session tracking and enhanced player management.');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show success and redirect to My Campaigns
    await expect(page.locator('text=Campaign created successfully!')).toBeVisible();
    
    // Verify we're back on My Campaigns tab
    await expect(page.locator('.tab-button.active:has-text("My Campaigns")')).toBeVisible();
  });

  test('should support campaign joining with invite codes', async ({ page }) => {
    // Click Join Campaign tab
    await page.click('#join-campaign-tab-btn');
    
    // Check for invite code instructions
    await expect(page.locator('h4:has-text("How to Join a Campaign")')).toBeVisible();
    await expect(page.locator('li:has-text("Ask your Game Master")')).toBeVisible();
    
    // Test joining with invite code
    await page.fill('input[name="invite_code"]', 'SWRPG-TEST-1234');
    await page.click('#join-campaign-submit-btn');
    
    // Should show success message
    await expect(page.locator('text=Successfully joined campaign!')).toBeVisible();
  });
});
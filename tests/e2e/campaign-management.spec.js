// tests/campaign-management.spec.js
const { test, expect } = require('@playwright/test');
const { loginUser, ADMIN_USER } = require('./auth.setup.js');

test.describe('Campaign Management', () => {
  test.beforeEach(async ({ page }) => {
    // Create admin and login
    await page.request.post('/api/debug/create-admin');
    await loginUser(page, ADMIN_USER);
  });

  test('should access campaign management from user menu', async ({ page }) => {
    // Open user menu
    await page.click('#userMenuToggle');
    await expect(page.locator('#userMenuDropdown')).toHaveClass(/show/);
    
    // Click Campaign Management
    await page.click('text=Campaign Management');
    
    // Should open campaign modal
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-title:has-text("Campaign Management")')).toBeVisible();
    
    // Should have tabs
    await expect(page.locator('button:has-text("My Campaigns")')).toBeVisible();
    await expect(page.locator('#create-campaign-tab-btn')).toBeVisible();
    await expect(page.locator('#join-campaign-tab-btn')).toBeVisible();
  });

  test('should access campaign management from dashboard button', async ({ page }) => {
    // Create a character first to see the dashboard buttons
    await page.click('button:has-text("Create Your First Character")');
    await page.fill('input[name="name"]', 'Test GM');
    await page.fill('input[name="playerName"]', 'GM');
    await page.selectOption('select[name="species"]', 'Human');
    await page.selectOption('select[name="career"]', 'Smuggler');
    await page.click('button[type="submit"], button:has-text("Create")');
    
    // Go back to dashboard
    await page.click('[data-action="show-dashboard"], text=Dashboard');
    
    // Should see dashboard campaign button
    await expect(page.locator('button:has-text("Manage Campaigns")')).toBeVisible();
    
    // Click it
    await page.click('button:has-text("Manage Campaigns")');
    
    // Should open campaign modal
    await expect(page.locator('.modal-overlay')).toBeVisible();
  });

  test('should create a campaign successfully', async ({ page }) => {
    // Open campaign management
    await page.click('#userMenuToggle');
    await page.click('text=Campaign Management');
    
    // Switch to Create Campaign tab
    await page.click('#create-campaign-tab-btn');
    
    // Fill campaign form
    await page.fill('input[name="name"]', 'Test Campaign');
    await page.fill('textarea[name="description"]', 'A test campaign for E2E testing');
    await page.selectOption('select[name="game_system"]', 'Edge of the Empire');
    await page.fill('input[name="max_players"]', '6');
    
    // Submit form
    await page.click('#create-campaign-submit-btn');
    
    // Should show success or redirect to campaigns list
    await expect(page.locator('text=Test Campaign, text=created, text=success')).toBeVisible();
  });

  test('should validate campaign creation form', async ({ page }) => {
    // Open campaign management and create tab
    await page.click('#userMenuToggle');
    await page.click('text=Campaign Management');
    await page.click('#create-campaign-tab-btn');
    
    // Try to submit empty form
    await page.click('#create-campaign-submit-btn');
    
    // Should show validation errors
    await expect(page.locator('input[name="name"]:invalid')).toBeVisible();
    await expect(page.locator('select[name="game_system"]:invalid')).toBeVisible();
  });

  test('should join a campaign with invite code', async ({ page }) => {
    // Open campaign management
    await page.click('#userMenuToggle');
    await page.click('text=Campaign Management');
    
    // Switch to Join Campaign tab
    await page.click('#join-campaign-tab-btn');
    
    // Should see invite code form
    await expect(page.locator('input[name="invite_code"]')).toBeVisible();
    
    // Test with invalid code
    await page.fill('input[name="invite_code"]', 'INVALID123');
    await page.click('button:has-text("Join"), button[type="submit"]');
    
    // Should show error for invalid code
    await expect(page.locator('text=invalid, text=not found, text=error')).toBeVisible();
  });

  test('should display my campaigns list', async ({ page }) => {
    // Open campaign management
    await page.click('#userMenuToggle');
    await page.click('text=Campaign Management');
    
    // Should be on My Campaigns tab by default
    await expect(page.locator('#my-campaigns-tab')).toHaveClass(/active/);
    
    // Should show campaigns list (even if empty)
    await expect(page.locator('#campaigns-list')).toBeVisible();
  });

  test('should close campaign modal', async ({ page }) => {
    // Open campaign management
    await page.click('#userMenuToggle');
    await page.click('text=Campaign Management');
    
    // Verify modal is open
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    // Close modal using X button
    await page.click('button:has-text("×")');
    
    // Modal should be closed
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });

  test('should handle campaign tabs switching', async ({ page }) => {
    // Open campaign management
    await page.click('#userMenuToggle');
    await page.click('text=Campaign Management');
    
    // Test switching between tabs
    await page.click('#create-campaign-tab-btn');
    await expect(page.locator('#create-campaign-tab')).toBeVisible();
    
    await page.click('#join-campaign-tab-btn');
    await expect(page.locator('#join-campaign-tab')).toBeVisible();
    
    await page.click('button:has-text("My Campaigns")');
    await expect(page.locator('#my-campaigns-tab')).toBeVisible();
  });
});
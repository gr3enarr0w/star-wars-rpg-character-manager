// tests/ui-ux-responsive.spec.js
const { test, expect } = require('@playwright/test');
const { loginUser, ADMIN_USER } = require('./auth.setup.js');

test.describe('UI/UX & Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    // Create admin and login
    await page.request.post('/api/debug/create-admin');
    await loginUser(page, ADMIN_USER);
  });

  test('should display loading states during initial load', async ({ page }) => {
    // Navigate to fresh page to see loading
    await page.goto('/');
    
    // Should show loading state initially
    await expect(page.locator('.loading-state, .loading:has-text("Loading")')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForTimeout(3000);
    
    // Loading should be replaced with content
    await expect(page.locator('.loading-state, .loading:has-text("Loading")')).not.toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that header is still visible and functional
    await expect(page.locator('.auth-header')).toBeVisible();
    await expect(page.locator('#userMenuToggle')).toBeVisible();
    
    // Check that main content adapts
    await expect(page.locator('#mainContent')).toBeVisible();
    
    // Test user menu on mobile
    await page.click('#userMenuToggle');
    await expect(page.locator('#userMenuDropdown')).toHaveClass(/show/);
  });

  test('should be responsive on tablet devices', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check dashboard grid adapts
    await expect(page.locator('.dashboard-grid')).toBeVisible();
    
    // Should show both sidebar and main content
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('#mainContent')).toBeVisible();
  });

  test('should be responsive on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Check full layout is visible
    await expect(page.locator('.auth-header')).toBeVisible();
    await expect(page.locator('.dashboard-grid')).toBeVisible();
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('#mainContent')).toBeVisible();
  });

  test('should maintain theme consistency', async ({ page }) => {
    // Check Star Wars theme colors are applied
    const authHeader = page.locator('.auth-header');
    await expect(authHeader).toHaveCSS('background', /linear-gradient/);
    
    // Check gold accent color
    const userDisplay = page.locator('#userDisplay');
    await expect(userDisplay).toBeVisible();
    
    // Check main content styling
    const mainContent = page.locator('#mainContent');
    await expect(mainContent).toHaveCSS('background', /linear-gradient/);
  });

  test('should handle character grid responsiveness', async ({ page }) => {
    // Create a character first to see the grid
    await page.click('button:has-text("Create Your First Character")');
    await page.fill('input[name="name"]', 'Test Character');
    await page.fill('input[name="playerName"]', 'Test Player');
    await page.selectOption('select[name="species"]', 'Human');
    await page.selectOption('select[name="career"]', 'Smuggler');
    await page.click('button[type="submit"], button:has-text("Create")');
    
    // Go back to dashboard
    await page.click('[data-action="show-dashboard"], text=Dashboard');
    
    // Test responsive character grid
    await expect(page.locator('.character-grid')).toBeVisible();
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.character-grid')).toBeVisible();
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.character-grid')).toBeVisible();
  });

  test('should show proper loading spinners', async ({ page }) => {
    // Trigger character loading
    await page.goto('/');
    
    // Look for spinner elements
    await expect(page.locator('.spinner, .loading')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForTimeout(3000);
    
    // Spinner should be gone
    await expect(page.locator('.spinner:visible')).toHaveCount(0);
  });

  test('should handle modal responsiveness', async ({ page }) => {
    // Test profile modal on different screen sizes
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    // Modal should be visible on desktop
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal')).toBeVisible();
    
    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.modal')).toBeVisible();
    
    // Modal should adapt to mobile viewport
    const modal = page.locator('.modal');
    const modalWidth = await modal.evaluate(el => window.getComputedStyle(el).maxWidth);
    expect(modalWidth).toBe('90vw');
    
    // Close modal
    await page.click('button:has-text("×")');
    
    // Test campaign modal responsiveness
    await page.click('#userMenuToggle');
    await page.click('text=Campaign Management');
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    // Close modal
    await page.click('button:has-text("×")');
  });

  test('should handle navigation responsiveness', async ({ page }) => {
    // Test sidebar navigation on different screen sizes
    await expect(page.locator('.nav')).toBeVisible();
    
    // Test mobile - sidebar should still be accessible
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.nav')).toBeVisible();
    
    // Test navigation clicks work on mobile
    await page.click('[data-action="show-documentation"]');
    
    // Should update nav active state
    await expect(page.locator('[data-action="show-documentation"]')).toHaveClass(/active/);
  });

  test('should handle button and form element sizing', async ({ page }) => {
    // Create character to see form elements
    await page.click('button:has-text("Create Your First Character")');
    
    // Test form responsiveness
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('select[name="species"]')).toBeVisible();
    
    // Test mobile form layout
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Form elements should still be usable
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await page.fill('input[name="name"]', 'Mobile Test');
    
    // Buttons should be properly sized
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should handle error states properly', async ({ page }) => {
    // Mock API error to test error display
    await page.route('/api/characters', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Trigger character loading
    await page.reload();
    
    // Should show error state
    await expect(page.locator('.error-state, .error')).toBeVisible();
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
  });

  test('should handle empty states properly', async ({ page }) => {
    // Mock empty character response
    await page.route('/api/characters', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ characters: [] })
      });
    });
    
    // Reload to trigger empty state
    await page.reload();
    
    // Should show empty state
    await expect(page.locator('.empty-state')).toBeVisible();
    await expect(page.locator('text=Welcome to the Galaxy')).toBeVisible();
    await expect(page.locator('button:has-text("Create Your First Character")')).toBeVisible();
  });

  test('should maintain focus and accessibility', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    // Should focus on user menu toggle
    await expect(page.locator('#userMenuToggle')).toBeFocused();
    
    // Test modal accessibility
    await page.click('#userMenuToggle');
    await page.click('text=Profile Settings');
    
    // Modal should trap focus
    await expect(page.locator('.modal input, .modal button').first()).toBeFocused();
    
    // Test escape key closes modal
    await page.keyboard.press('Escape');
    // Note: This depends on modal implementation
  });

  test('should handle campaign selector responsiveness', async ({ page }) => {
    // Test campaign selector on different screen sizes
    await expect(page.locator('.campaign-selector')).toBeVisible();
    await expect(page.locator('.campaign-list')).toBeVisible();
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.campaign-selector')).toBeVisible();
    
    // Campaign tags should be responsive
    await expect(page.locator('.campaign-tag')).toBeVisible();
    
    // Test clicking campaign tag on mobile
    await page.click('.campaign-tag[data-campaign=""]');
    await expect(page.locator('.campaign-tag.active')).toBeVisible();
  });

  test('should handle long text content properly', async ({ page }) => {
    // Test with long character name
    await page.click('button:has-text("Create Your First Character")');
    await page.fill('input[name="name"]', 'A Very Long Character Name That Should Test Text Wrapping');
    await page.fill('input[name="playerName"]', 'A Very Long Player Name');
    await page.selectOption('select[name="species"]', 'Human');
    await page.selectOption('select[name="career"]', 'Smuggler');
    await page.fill('textarea[name="background"]', 'This is a very long background story that should test how well the application handles long text content and whether it wraps properly in the UI without breaking the layout.');
    
    // Form should handle long content without breaking
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="background"]')).toBeVisible();
  });

  test('should maintain consistent spacing and layout', async ({ page }) => {
    // Check consistent spacing in main layout
    await expect(page.locator('.dashboard-grid')).toHaveCSS('gap', '1rem');
    
    // Check consistent margins and padding
    await expect(page.locator('.main-content')).toHaveCSS('padding', '1rem');
    await expect(page.locator('.sidebar')).toHaveCSS('padding', '1rem');
    
    // Check form spacing
    await page.click('button:has-text("Create Your First Character")');
    await expect(page.locator('.form-group')).toHaveCSS('margin-bottom', '1rem');
  });
});
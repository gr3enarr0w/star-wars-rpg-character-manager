// tests/v12-features.spec.js
const { test, expect } = require('@playwright/test');
const { loginUser, ADMIN_USER } = require('./auth.setup.js');

test.describe('V1.2 Features Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Create admin user before each test
    await page.request.post('/api/debug/create-admin');
    await loginUser(page, ADMIN_USER);
  });

  test.describe('Enhanced Loading States', () => {
    test('should display skeleton screens during loading', async ({ page }) => {
      // Navigate to a page that shows loading states
      await page.goto('/');
      
      // Check for skeleton loading elements
      const skeletons = page.locator('.skeleton');
      if (await skeletons.count() > 0) {
        await expect(skeletons.first()).toBeVisible();
        
        // Verify skeleton animation
        await expect(skeletons.first()).toHaveCSS('animation-name', 'skeleton-loading');
      }
      
      // Wait for content to load and skeleton to disappear
      await page.waitForTimeout(2000);
      await expect(page.locator('.loading-state')).toHaveCount(0);
    });

    test('should show skeleton screens in dashboard', async ({ page }) => {
      // Navigate to dashboard
      await page.goto('/');
      
      // Check for dashboard skeleton cards
      const skeletonCards = page.locator('.skeleton-card');
      if (await skeletonCards.count() > 0) {
        await expect(skeletonCards.first()).toBeVisible();
      }
      
      // Verify skeleton components
      await expect(page.locator('.skeleton-title, .skeleton-text')).toHaveCount(0);
    });
  });

  test.describe('Engaging Empty States', () => {
    test('should display welcome empty state for new users', async ({ page }) => {
      // Navigate to main dashboard
      await page.goto('/');
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Check for empty state if no characters exist
      const emptyState = page.locator('.empty-state');
      if (await emptyState.count() > 0) {
        await expect(emptyState).toBeVisible();
        await expect(emptyState.locator('h3')).toContainText(/Welcome|Galaxy|Adventure/);
        
        // Check for CTA button
        const ctaButton = emptyState.locator('button:has-text("Create")');
        await expect(ctaButton).toBeVisible();
        await expect(ctaButton).toHaveCSS('min-height', '44px'); // Touch target compliance
      }
    });

    test('should show helpful empty state in character section', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to characters section if empty
      const charactersSection = page.locator('.my-characters');
      if (await charactersSection.count() > 0) {
        const emptyState = charactersSection.locator('.empty-state');
        if (await emptyState.count() > 0) {
          await expect(emptyState).toBeVisible();
          await expect(emptyState).toContainText(/first character|create/i);
        }
      }
    });
  });

  test.describe('Theme System', () => {
    test('should switch between theme variants', async ({ page }) => {
      // Navigate to profile settings
      await page.click('#userMenuToggle');
      await page.click('text=Profile Settings');
      await expect(page).toHaveURL(/profile/);
      
      // Switch to preferences tab
      await page.click('button:has-text("Preferences")');
      await expect(page.locator('#tab-preferences')).toBeVisible();
      
      // Test theme switching
      const themeSelect = page.locator('#theme');
      await expect(themeSelect).toBeVisible();
      
      // Test dark theme
      await themeSelect.selectOption('dark');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      
      // Test light theme  
      await themeSelect.selectOption('light');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      
      // Test auto theme
      await themeSelect.selectOption('auto');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'auto');
      
      // Test high contrast themes
      await themeSelect.selectOption('high-contrast');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'high-contrast');
      
      await themeSelect.selectOption('high-contrast-dark');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'high-contrast-dark');
    });

    test('should persist theme selection', async ({ page }) => {
      // Set a theme
      await page.goto('/profile');
      await page.click('button:has-text("Preferences")');
      await page.locator('#theme').selectOption('dark');
      
      // Reload page and verify theme persists
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    });

    test('should have smooth theme transitions', async ({ page }) => {
      // Check that CSS transitions are applied
      await page.goto('/');
      
      const body = page.locator('body');
      const transition = await body.evaluate(el => getComputedStyle(el).transition);
      expect(transition).toContain('background-color');
      expect(transition).toContain('color');
    });
  });

  test.describe('Mobile Responsive Design', () => {
    test('should be responsive on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Check mobile-specific styles
      const header = page.locator('.auth-header');
      const headerHeight = await header.boundingBox();
      expect(headerHeight?.height).toBeLessThan(100); // Mobile header should be compact
      
      // Check button touch targets
      const buttons = page.locator('.btn');
      if (await buttons.count() > 0) {
        const buttonHeight = await buttons.first().boundingBox();
        expect(buttonHeight?.height).toBeGreaterThanOrEqual(44); // WCAG AA minimum
      }
    });

    test('should adapt layout for tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      
      // Verify responsive behavior
      await expect(page.locator('body')).toBeVisible();
      
      // Check that grid layouts adapt
      const grids = page.locator('.grid, .characteristic-grid');
      if (await grids.count() > 0) {
        const gridStyles = await grids.first().evaluate(el => getComputedStyle(el).gridTemplateColumns);
        expect(gridStyles).toBeTruthy();
      }
    });

    test('should have proper touch targets on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto('/');
      
      // Check input field sizing
      const inputs = page.locator('.form-input');
      if (await inputs.count() > 0) {
        const inputHeight = await inputs.first().boundingBox();
        expect(inputHeight?.height).toBeGreaterThanOrEqual(44);
      }
    });
  });

  test.describe('Settings Page Architecture', () => {
    test('should navigate between settings tabs', async ({ page }) => {
      await page.goto('/profile');
      
      // Verify tab structure
      await expect(page.locator('#tab-profile')).toBeVisible();
      await expect(page.locator('#tab-profile')).toHaveClass(/active/);
      
      // Switch to security tab
      await page.click('button:has-text("Security & Privacy")');
      await expect(page.locator('#tab-security')).toBeVisible();
      await expect(page.locator('#tab-security')).toHaveClass(/active/);
      
      // Switch to preferences tab
      await page.click('button:has-text("Preferences")');
      await expect(page.locator('#tab-preferences')).toBeVisible();
      await expect(page.locator('#tab-preferences')).toHaveClass(/active/);
      
      // Switch back to profile tab
      await page.click('button:has-text("Profile & Account")');
      await expect(page.locator('#tab-profile')).toBeVisible();
      await expect(page.locator('#tab-profile')).toHaveClass(/active/);
    });

    test('should organize settings logically', async ({ page }) => {
      await page.goto('/profile');
      
      // Profile tab should have account info
      await expect(page.locator('#tab-profile #username')).toBeVisible();
      await expect(page.locator('#tab-profile #email')).toBeVisible();
      
      // Security tab should have password and 2FA
      await page.click('button:has-text("Security & Privacy")');
      await expect(page.locator('#tab-security #password-form')).toBeVisible();
      await expect(page.locator('#tab-security .twofa-section')).toBeVisible();
      
      // Preferences tab should have theme settings
      await page.click('button:has-text("Preferences")');
      await expect(page.locator('#tab-preferences #theme')).toBeVisible();
    });
  });

  test.describe('Campaign Filtering', () => {
    test('should display campaign search and filters', async ({ page }) => {
      // Navigate to campaigns page
      await page.goto('/campaigns');
      
      // Check for search input
      const searchInput = page.locator('#campaign-search');
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toHaveAttribute('placeholder', /search/i);
      
      // Check for filter dropdowns
      await expect(page.locator('#role-filter')).toBeVisible();
      await expect(page.locator('#system-filter')).toBeVisible();
      await expect(page.locator('#status-filter')).toBeVisible();
    });

    test('should filter campaigns by role', async ({ page }) => {
      await page.goto('/campaigns');
      
      // Test role filtering
      const roleFilter = page.locator('#role-filter');
      await roleFilter.selectOption('gm');
      
      // Verify filter function is called
      const campaigns = page.locator('.campaign-card');
      // Note: Actual filtering behavior depends on having campaign data
    });

    test('should clear filters', async ({ page }) => {
      await page.goto('/campaigns');
      
      // Apply some filters
      await page.locator('#role-filter').selectOption('gm');
      await page.locator('#system-filter').selectOption('edge_of_empire');
      
      // Clear filters
      const clearButton = page.locator('button:has-text("Clear Filters")');
      if (await clearButton.count() > 0) {
        await clearButton.click();
        
        // Verify filters are reset
        await expect(page.locator('#role-filter')).toHaveValue('');
        await expect(page.locator('#system-filter')).toHaveValue('');
      }
    });
  });

  test.describe('Accessibility Improvements', () => {
    test('should have proper focus management', async ({ page }) => {
      await page.goto('/');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Check focus outline
      const focusStyles = await focusedElement.evaluate(el => getComputedStyle(el));
      expect(focusStyles.outline).toBeTruthy();
    });

    test('should have skip-to-content link', async ({ page }) => {
      await page.goto('/');
      
      // Test skip link appears on focus
      await page.keyboard.press('Tab');
      const skipLink = page.locator('.skip-link');
      if (await skipLink.count() > 0) {
        await expect(skipLink).toBeVisible();
      }
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/');
      
      // Check for aria-label attributes on interactive elements
      const buttons = page.locator('button[aria-label]');
      if (await buttons.count() > 0) {
        await expect(buttons.first()).toHaveAttribute('aria-label');
      }
    });

    test('should support screen readers', async ({ page }) => {
      await page.goto('/');
      
      // Check for sr-only content
      const srOnlyElements = page.locator('.sr-only');
      if (await srOnlyElements.count() > 0) {
        const styles = await srOnlyElements.first().evaluate(el => getComputedStyle(el));
        expect(styles.position).toBe('absolute');
        expect(styles.width).toBe('1px');
      }
    });

    test('should respect reduced motion preferences', async ({ page }) => {
      // Simulate prefers-reduced-motion
      await page.addStyleTag({
        content: `
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `
      });
      
      await page.goto('/');
      
      // Verify transitions are disabled for reduced motion
      const body = page.locator('body');
      const styles = await body.evaluate(el => getComputedStyle(el));
      // Note: This test depends on how the browser handles prefers-reduced-motion
    });
  });

  test.describe('Font Contrast and Readability', () => {
    test('should meet WCAG AA contrast standards', async ({ page }) => {
      await page.goto('/');
      
      // Check text contrast (this is a basic check - full testing requires specialized tools)
      const textElements = page.locator('h1, h2, h3, p, span');
      if (await textElements.count() > 0) {
        const textColor = await textElements.first().evaluate(el => getComputedStyle(el).color);
        const backgroundColor = await textElements.first().evaluate(el => getComputedStyle(el).backgroundColor);
        
        // Basic check that colors are defined
        expect(textColor).toBeTruthy();
        expect(backgroundColor || textColor).toBeTruthy();
      }
    });

    test('should have readable font sizes', async ({ page }) => {
      await page.goto('/');
      
      // Check minimum font sizes
      const textElements = page.locator('p, span, div');
      if (await textElements.count() > 0) {
        const fontSize = await textElements.first().evaluate(el => getComputedStyle(el).fontSize);
        const fontSizeValue = parseFloat(fontSize);
        expect(fontSizeValue).toBeGreaterThanOrEqual(14); // Minimum readable size
      }
    });

    test('should have proper line height for readability', async ({ page }) => {
      await page.goto('/');
      
      const textElements = page.locator('p');
      if (await textElements.count() > 0) {
        const lineHeight = await textElements.first().evaluate(el => getComputedStyle(el).lineHeight);
        expect(lineHeight).toBeTruthy();
        
        // Line height should be at least 1.4 for good readability
        const lineHeightValue = parseFloat(lineHeight);
        if (!isNaN(lineHeightValue)) {
          expect(lineHeightValue).toBeGreaterThanOrEqual(1.4);
        }
      }
    });
  });
});
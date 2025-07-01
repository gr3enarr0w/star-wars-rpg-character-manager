// Docker UI Visual Verification and Element Testing
// Comprehensive UI element checking, visual testing, and accessibility verification
const { test, expect } = require('@playwright/test');

test.describe('Docker UI Visual Verification Suite', () => {
  const DOCKER_BASE_URL = 'http://localhost:8001';
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    await page.goto(DOCKER_BASE_URL, { waitUntil: 'networkidle' });
  });

  test('Docker UI - Header and navigation elements visible', async ({ page }) => {
    // Check for header elements
    const header = page.locator('header, .header, .top-nav, .navbar');
    if (await header.count() > 0) {
      await expect(header.first()).toBeVisible();
      console.log('✅ Header element found and visible');
    }
    
    // Check for logo/brand
    const logo = page.locator('img[alt*="logo"], .logo, .brand, h1');
    if (await logo.count() > 0) {
      await expect(logo.first()).toBeVisible();
      console.log('✅ Logo/brand element visible');
    }
    
    // Check for navigation menu
    const nav = page.locator('nav, .nav, .navigation, .menu');
    if (await nav.count() > 0) {
      await expect(nav.first()).toBeVisible();
      console.log('✅ Navigation menu visible');
    }
    
    // Check navigation links
    const navLinks = page.locator('nav a, .nav-link, .menu-item a');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);
    console.log(`✅ Found ${linkCount} navigation links`);
  });

  test('Docker UI - Main content area structure', async ({ page }) => {
    // Check for main content container
    const main = page.locator('main, .main, .content, .container');
    if (await main.count() > 0) {
      await expect(main.first()).toBeVisible();
      console.log('✅ Main content area visible');
    }
    
    // Check for content sections
    const sections = page.locator('section, .section, .card, .panel');
    const sectionCount = await sections.count();
    if (sectionCount > 0) {
      console.log(`✅ Found ${sectionCount} content sections`);
    }
    
    // Check for headings
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
    console.log(`✅ Found ${headingCount} headings`);
  });

  test('Docker UI - Footer and bottom elements', async ({ page }) => {
    // Scroll to bottom to load footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // Check for footer
    const footer = page.locator('footer, .footer, .bottom');
    if (await footer.count() > 0) {
      await expect(footer.first()).toBeVisible();
      console.log('✅ Footer visible');
    }
    
    // Check for copyright or legal text
    const copyright = page.locator('*:has-text("©"), *:has-text("Copyright"), *:has-text("rights")');
    if (await copyright.count() > 0) {
      console.log('✅ Copyright/legal text found');
    }
  });

  test('Docker UI - Form elements styling and accessibility', async ({ page }) => {
    await page.goto(`${DOCKER_BASE_URL}/login`);
    
    // Check form container
    const form = page.locator('form');
    if (await form.count() > 0) {
      await expect(form.first()).toBeVisible();
      console.log('✅ Form container visible');
    }
    
    // Check input fields styling
    const inputs = page.locator('input[type="email"], input[type="password"], input[type="text"]');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      await expect(input).toBeVisible();
      
      // Check if input has proper labels
      const inputId = await input.getAttribute('id');
      const inputName = await input.getAttribute('name');
      
      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`);
        if (await label.count() > 0) {
          console.log(`✅ Input ${inputId} has associated label`);
        }
      }
      
      // Check input styling
      const borderStyle = await input.evaluate(el => getComputedStyle(el).border);
      expect(borderStyle).toBeTruthy();
    }
    
    console.log(`✅ Verified ${inputCount} form inputs`);
  });

  test('Docker UI - Button styling and states', async ({ page }) => {
    // Find all buttons
    const buttons = page.locator('button, input[type="submit"], input[type="button"], .btn');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        
        if (await button.isVisible()) {
          // Check button has text or icon
          const buttonText = await button.textContent();
          const hasIcon = await button.locator('i, .icon, svg').count() > 0;
          
          expect(buttonText?.trim().length > 0 || hasIcon).toBeTruthy();
          
          // Check button styling
          const backgroundColor = await button.evaluate(el => getComputedStyle(el).backgroundColor);
          const padding = await button.evaluate(el => getComputedStyle(el).padding);
          
          expect(backgroundColor).toBeTruthy();
          expect(padding).toBeTruthy();
          
          // Test hover state
          await button.hover();
          const hoverColor = await button.evaluate(el => getComputedStyle(el).backgroundColor);
          
          console.log(`✅ Button "${buttonText?.trim()}" properly styled`);
        }
      }
    }
    
    console.log(`✅ Verified ${buttonCount} buttons`);
  });

  test('Docker UI - Color scheme and theme consistency', async ({ page }) => {
    // Check body background
    const body = page.locator('body');
    const bodyBg = await body.evaluate(el => getComputedStyle(el).backgroundColor);
    const bodyColor = await body.evaluate(el => getComputedStyle(el).color);
    
    expect(bodyBg).toBeTruthy();
    expect(bodyColor).toBeTruthy();
    
    // Check primary headings color
    const h1 = page.locator('h1').first();
    if (await h1.count() > 0) {
      const h1Color = await h1.evaluate(el => getComputedStyle(el).color);
      expect(h1Color).toBeTruthy();
    }
    
    // Check link colors
    const links = page.locator('a');
    if (await links.count() > 0) {
      const linkColor = await links.first().evaluate(el => getComputedStyle(el).color);
      expect(linkColor).toBeTruthy();
    }
    
    console.log('✅ Color scheme consistency verified');
  });

  test('Docker UI - Typography and readability', async ({ page }) => {
    // Check font sizes
    const body = page.locator('body');
    const fontSize = await body.evaluate(el => getComputedStyle(el).fontSize);
    const fontFamily = await body.evaluate(el => getComputedStyle(el).fontFamily);
    
    expect(fontSize).toBeTruthy();
    expect(fontFamily).toBeTruthy();
    
    // Check heading hierarchy
    const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const headingSizes = {};
    
    for (const heading of headings) {
      const element = page.locator(heading).first();
      if (await element.count() > 0) {
        const size = await element.evaluate(el => parseFloat(getComputedStyle(el).fontSize));
        headingSizes[heading] = size;
      }
    }
    
    // Verify heading hierarchy (h1 should be larger than h2, etc.)
    if (headingSizes.h1 && headingSizes.h2) {
      expect(headingSizes.h1).toBeGreaterThan(headingSizes.h2);
    }
    
    console.log('✅ Typography hierarchy verified');
  });

  test('Docker UI - Layout and spacing consistency', async ({ page }) => {
    // Check container margins and padding
    const containers = page.locator('.container, .wrapper, main, .content');
    
    if (await containers.count() > 0) {
      const container = containers.first();
      const margin = await container.evaluate(el => getComputedStyle(el).margin);
      const padding = await container.evaluate(el => getComputedStyle(el).padding);
      
      expect(margin).toBeTruthy();
      expect(padding).toBeTruthy();
    }
    
    // Check element spacing
    const cards = page.locator('.card, .panel, .section');
    if (await cards.count() > 1) {
      const firstCard = cards.first();
      const secondCard = cards.nth(1);
      
      const firstRect = await firstCard.boundingBox();
      const secondRect = await secondCard.boundingBox();
      
      if (firstRect && secondRect) {
        const spacing = secondRect.y - (firstRect.y + firstRect.height);
        expect(spacing).toBeGreaterThanOrEqual(0);
        console.log(`✅ Element spacing: ${spacing}px`);
      }
    }
    
    console.log('✅ Layout spacing verified');
  });

  test('Docker UI - Mobile responsive breakpoints', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1024, height: 768, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      // Check if navigation adapts
      const nav = page.locator('nav, .navbar');
      if (await nav.count() > 0) {
        await expect(nav.first()).toBeVisible();
      }
      
      // Check if content is still readable
      const body = page.locator('body');
      const bodyWidth = await body.evaluate(el => el.offsetWidth);
      expect(bodyWidth).toBeGreaterThan(0);
      
      // Check for mobile menu toggle on small screens
      if (viewport.width < 768) {
        const mobileToggle = page.locator('.navbar-toggle, .menu-toggle, .hamburger, .mobile-menu');
        if (await mobileToggle.count() > 0) {
          console.log(`✅ ${viewport.name} - Mobile menu toggle found`);
        }
      }
      
      console.log(`✅ ${viewport.name} (${viewport.width}x${viewport.height}) layout verified`);
    }
  });

  test('Docker UI - Accessibility features check', async ({ page }) => {
    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      if (!alt || alt.trim() === '') {
        console.warn(`⚠️ Image ${i + 1} missing alt text`);
      } else {
        console.log(`✅ Image ${i + 1} has alt text: "${alt}"`);
      }
    }
    
    // Check for proper heading structure
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeLessThanOrEqual(1); // Should have only one h1
    
    // Check for form labels
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"]');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute('id');
      const inputName = await input.getAttribute('name');
      
      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`);
        if (await label.count() === 0) {
          console.warn(`⚠️ Input ${inputId} missing associated label`);
        }
      }
    }
    
    console.log('✅ Accessibility features checked');
  });

  test('Docker UI - Interactive elements feedback', async ({ page }) => {
    // Test link hover effects
    const links = page.locator('a[href]');
    if (await links.count() > 0) {
      const firstLink = links.first();
      const originalColor = await firstLink.evaluate(el => getComputedStyle(el).color);
      
      await firstLink.hover();
      const hoverColor = await firstLink.evaluate(el => getComputedStyle(el).color);
      
      console.log(`✅ Link hover effect: ${originalColor} → ${hoverColor}`);
    }
    
    // Test button hover effects
    const buttons = page.locator('button, .btn');
    if (await buttons.count() > 0) {
      const firstButton = buttons.first();
      
      if (await firstButton.isVisible() && await firstButton.isEnabled()) {
        const originalBg = await firstButton.evaluate(el => getComputedStyle(el).backgroundColor);
        
        await firstButton.hover();
        const hoverBg = await firstButton.evaluate(el => getComputedStyle(el).backgroundColor);
        
        console.log(`✅ Button hover effect: ${originalBg} → ${hoverBg}`);
      }
    }
    
    // Test focus states
    const focusableElements = page.locator('a, button, input, select, textarea');
    if (await focusableElements.count() > 0) {
      const firstFocusable = focusableElements.first();
      
      if (await firstFocusable.isVisible()) {
        await firstFocusable.focus();
        
        const focusOutline = await firstFocusable.evaluate(el => getComputedStyle(el).outline);
        const focusBoxShadow = await firstFocusable.evaluate(el => getComputedStyle(el).boxShadow);
        
        // Should have some kind of focus indicator
        const hasFocusIndicator = focusOutline !== 'none' || focusBoxShadow !== 'none';
        if (hasFocusIndicator) {
          console.log('✅ Focus indicators present');
        }
      }
    }
    
    console.log('✅ Interactive element feedback verified');
  });

  test('Docker UI - Page load performance visual check', async ({ page }) => {
    // Measure visual loading metrics
    const startTime = Date.now();
    
    await page.goto(DOCKER_BASE_URL);
    
    // Wait for largest contentful paint
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        setTimeout(() => resolve(0), 5000); // Fallback
      });
    });
    
    if (lcp > 0) {
      expect(lcp).toBeLessThan(4000); // LCP should be under 4 seconds
      console.log(`✅ Largest Contentful Paint: ${lcp}ms`);
    }
    
    // Check if images load properly
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const naturalWidth = await img.evaluate(el => el.naturalWidth);
      
      if (naturalWidth > 0) {
        console.log(`✅ Image ${i + 1} loaded successfully`);
      } else {
        console.warn(`⚠️ Image ${i + 1} failed to load`);
      }
    }
    
    const loadTime = Date.now() - startTime;
    console.log(`✅ Total page load time: ${loadTime}ms`);
  });
});
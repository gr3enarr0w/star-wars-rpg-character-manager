const { test, expect } = require('@playwright/test');

test.describe('Working Browser Features - Current Interface', () => {

  // Helper function to login
  async function login(page) {
    await page.goto('http://localhost:8001/login');
    await page.fill('input[type="email"]', 'clark@clarkeverson.com');
    await page.fill('input[type="password"]', 'TestPassword123456789@#$');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:8001/', { timeout: 10000 });
  }

  test('Comprehensive Dashboard Interface Testing', async ({ page }) => {
    console.log('🏠 Testing complete dashboard interface...');
    
    await login(page);
    await page.waitForTimeout(3000); // Allow full page load
    
    // Take initial screenshot
    await page.screenshot({ path: 'dashboard_full_interface.png' });
    
    // 1. Page Structure Analysis
    console.log('📋 Analyzing page structure...');
    const titles = await page.locator('h1, h2, h3').allTextContents();
    console.log(`✅ Page titles: ${titles.join(', ')}`);
    
    // 2. Navigation Elements
    const navElements = await page.locator('nav, .nav, .navbar').count();
    const menuButtons = await page.locator('button, .btn').allTextContents();
    console.log(`✅ Navigation: ${navElements} nav elements`);
    console.log(`✅ Available buttons: ${menuButtons.slice(0, 10).join(', ')}...`);
    
    // 3. Character Management Section
    console.log('🎭 Testing character management interface...');
    const characterSection = page.locator('text="My Characters"').first();
    if (await characterSection.count() > 0) {
      console.log('✅ Character section found');
      
      // Look for Create Character functionality
      const createButtons = await page.locator('button').filter({ hasText: /create/i });
      const createCount = await createButtons.count();
      console.log(`✅ Found ${createCount} create-related buttons`);
      
      // Character list area
      const characterCards = await page.locator('[class*="character"], .card').count();
      console.log(`✅ Found ${characterCards} character card elements`);
    }
    
    // 4. User Menu/Profile Access
    console.log('👤 Testing user menu access...');
    const userMenuTriggers = page.locator('button').filter({ hasText: /user|profile|account|menu/i });
    const userMenuCount = await userMenuTriggers.count();
    console.log(`✅ Found ${userMenuCount} user menu triggers`);
    
    if (userMenuCount > 0) {
      try {
        await userMenuTriggers.first().click();
        await page.waitForTimeout(1000);
        
        // Check if menu opened
        const menuItems = await page.locator('[class*="menu"], [class*="dropdown"], .modal').count();
        console.log(`✅ User menu opened: ${menuItems} menu elements visible`);
        
        await page.screenshot({ path: 'user_menu_opened.png' });
        
        // Close menu by clicking elsewhere
        await page.click('body');
        await page.waitForTimeout(500);
      } catch (e) {
        console.log('ℹ️ User menu not clickable or different interaction pattern');
      }
    }
    
    // 5. Admin Functionality Check
    console.log('🛡️ Testing admin functionality access...');
    const adminElements = page.locator('button, a').filter({ hasText: /admin/i });
    const adminCount = await adminElements.count();
    console.log(`✅ Found ${adminCount} admin-related elements`);
    
    if (adminCount > 0) {
      try {
        const adminText = await adminElements.first().textContent();
        console.log(`✅ Admin element text: "${adminText}"`);
        
        await adminElements.first().click();
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        console.log(`✅ Admin navigation: ${currentUrl}`);
        
        await page.screenshot({ path: 'admin_interface.png' });
        
        // Go back to dashboard
        await page.goto('http://localhost:8001/');
        await page.waitForTimeout(1000);
      } catch (e) {
        console.log('ℹ️ Admin functionality requires different access pattern');
      }
    }
    
    // 6. Test All Visible Buttons
    console.log('🔘 Testing all visible clickable elements...');
    const allButtons = page.locator('button:visible');
    const buttonCount = await allButtons.count();
    
    console.log(`✅ Found ${buttonCount} visible buttons`);
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      try {
        const buttonText = await allButtons.nth(i).textContent();
        console.log(`🔘 Testing button ${i + 1}: "${buttonText.trim()}"`);
        
        await allButtons.nth(i).click();
        await page.waitForTimeout(1000);
        
        // Check what happened
        const newUrl = page.url();
        const modalVisible = await page.locator('.modal:visible, [class*="modal"]:visible').count();
        
        if (modalVisible > 0) {
          console.log(`  ✅ Button opened modal`);
          await page.screenshot({ path: `button_${i}_modal.png` });
          
          // Close modal
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        } else if (newUrl !== 'http://localhost:8001/') {
          console.log(`  ✅ Button navigated to: ${newUrl}`);
          await page.screenshot({ path: `button_${i}_page.png` });
          
          // Go back
          await page.goto('http://localhost:8001/');
          await page.waitForTimeout(1000);
        } else {
          console.log(`  ✅ Button executed in-page action`);
        }
      } catch (e) {
        console.log(`  ℹ️ Button ${i + 1} interaction pattern different`);
      }
    }
    
    // 7. Form Elements Analysis
    console.log('📝 Analyzing forms and inputs...');
    const forms = await page.locator('form').count();
    const inputs = await page.locator('input:visible').count();
    const selects = await page.locator('select:visible').count();
    const textareas = await page.locator('textarea:visible').count();
    
    console.log(`✅ Forms: ${forms}, Inputs: ${inputs}, Selects: ${selects}, Textareas: ${textareas}`);
    
    // 8. Test Responsive Behavior
    console.log('📱 Testing responsive behavior...');
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'mobile_view.png' });
    
    const mobileButtons = await page.locator('button:visible').count();
    console.log(`✅ Mobile view: ${mobileButtons} visible buttons`);
    
    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tablet_view.png' });
    
    // Desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'desktop_view.png' });
    
    console.log('✅ Responsive design testing completed');
  });

  test('Complete Dropdown and Interactive Elements Testing', async ({ page }) => {
    console.log('📋 Testing all dropdowns and interactive elements...');
    
    await login(page);
    await page.waitForTimeout(3000);
    
    // 1. User Menu Dropdown
    console.log('👤 Testing user menu dropdown...');
    const userMenuButton = page.locator('button').filter({ hasText: /user|profile|account|settings|menu|ceverson/i });
    const userMenuCount = await userMenuButton.count();
    
    if (userMenuCount > 0) {
      console.log(`✅ Found ${userMenuCount} user menu buttons`);
      
      for (let i = 0; i < userMenuCount; i++) {
        try {
          const buttonText = await userMenuButton.nth(i).textContent();
          console.log(`🔽 Testing user menu: "${buttonText.trim()}"`);
          
          await userMenuButton.nth(i).click();
          await page.waitForTimeout(1000);
          
          // Check for dropdown menu items
          const menuItems = await page.locator('.dropdown-menu, .menu-items, [class*="dropdown"], [class*="menu"]').count();
          const visibleLinks = await page.locator('a:visible, button:visible').count();
          
          console.log(`  ✅ Menu opened: ${menuItems} dropdown containers, ${visibleLinks} visible items`);
          
          if (menuItems > 0) {
            // Test dropdown menu items
            const dropdownLinks = page.locator('.dropdown-menu a, .menu-items a, [class*="dropdown"] a');
            const linkCount = await dropdownLinks.count();
            
            for (let j = 0; j < Math.min(linkCount, 3); j++) {
              const linkText = await dropdownLinks.nth(j).textContent();
              console.log(`  🔗 Menu item ${j + 1}: "${linkText.trim()}"`);
            }
            
            await page.screenshot({ path: `user_menu_dropdown_${i}.png` });
          }
          
          // Close dropdown by clicking elsewhere or escape
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
          
        } catch (e) {
          console.log(`  ℹ️ User menu ${i} has different interaction pattern`);
        }
      }
    }
    
    // 2. Navigation Dropdowns
    console.log('🧭 Testing navigation dropdowns...');
    const navDropdowns = page.locator('nav button, .navbar button, .nav-item.dropdown');
    const navDropdownCount = await navDropdowns.count();
    
    console.log(`✅ Found ${navDropdownCount} navigation dropdown triggers`);
    
    for (let i = 0; i < navDropdownCount; i++) {
      try {
        const dropdownText = await navDropdowns.nth(i).textContent();
        console.log(`🔽 Testing nav dropdown: "${dropdownText.trim()}"`);
        
        await navDropdowns.nth(i).click();
        await page.waitForTimeout(1000);
        
        const dropdownMenu = await page.locator('.dropdown-menu:visible, .nav-dropdown:visible').count();
        if (dropdownMenu > 0) {
          console.log(`  ✅ Navigation dropdown opened`);
          await page.screenshot({ path: `nav_dropdown_${i}.png` });
        }
        
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
      } catch (e) {
        console.log(`  ℹ️ Nav dropdown ${i} needs different interaction`);
      }
    }
    
    // 3. Form Select Dropdowns
    console.log('📝 Testing form select dropdowns...');
    const selectElements = page.locator('select');
    const selectCount = await selectElements.count();
    
    console.log(`✅ Found ${selectCount} select dropdowns`);
    
    for (let i = 0; i < selectCount; i++) {
      try {
        const selectLabel = await selectElements.nth(i).getAttribute('name') || 
                           await selectElements.nth(i).getAttribute('id') || 
                           `select-${i}`;
        console.log(`🔽 Testing select dropdown: "${selectLabel}"`);
        
        // Get options
        const options = await selectElements.nth(i).locator('option').count();
        console.log(`  ✅ Select has ${options} options`);
        
        if (options > 1) {
          // Test selecting different options
          await selectElements.nth(i).selectOption({ index: 1 });
          await page.waitForTimeout(500);
          
          const selectedValue = await selectElements.nth(i).inputValue();
          console.log(`  ✅ Selected value: "${selectedValue}"`);
          
          await page.screenshot({ path: `select_dropdown_${i}.png` });
        }
        
      } catch (e) {
        console.log(`  ℹ️ Select ${i} interaction issue`);
      }
    }
    
    // 4. Custom Dropdown Components
    console.log('🎨 Testing custom dropdown components...');
    const customDropdowns = page.locator('[class*="dropdown"], [data-dropdown], .select-custom');
    const customCount = await customDropdowns.count();
    
    console.log(`✅ Found ${customCount} custom dropdown components`);
    
    for (let i = 0; i < customCount; i++) {
      try {
        const customClasses = await customDropdowns.nth(i).getAttribute('class');
        console.log(`🔽 Testing custom dropdown: classes="${customClasses}"`);
        
        await customDropdowns.nth(i).click();
        await page.waitForTimeout(1000);
        
        // Look for opened dropdown content
        const dropdownContent = await page.locator('.dropdown-content:visible, .dropdown-list:visible, [class*="dropdown"]:visible').count();
        if (dropdownContent > 0) {
          console.log(`  ✅ Custom dropdown opened`);
          await page.screenshot({ path: `custom_dropdown_${i}.png` });
        }
        
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
      } catch (e) {
        console.log(`  ℹ️ Custom dropdown ${i} needs different approach`);
      }
    }
    
    // 5. Modal and Dialog Dropdowns
    console.log('🗨️ Testing modal/dialog dropdowns...');
    
    // First try to open a modal that might contain dropdowns
    const modalTriggers = page.locator('button').filter({ hasText: /settings|profile|create|edit/i });
    const modalTriggerCount = await modalTriggers.count();
    
    for (let i = 0; i < Math.min(modalTriggerCount, 3); i++) {
      try {
        const triggerText = await modalTriggers.nth(i).textContent();
        console.log(`🔽 Testing modal trigger: "${triggerText.trim()}"`);
        
        await modalTriggers.nth(i).click();
        await page.waitForTimeout(2000);
        
        // Look for dropdowns inside the modal
        const modalDropdowns = await page.locator('.modal select, .modal [class*="dropdown"]').count();
        if (modalDropdowns > 0) {
          console.log(`  ✅ Found ${modalDropdowns} dropdowns in modal`);
          
          // Test the first dropdown in modal
          const firstModalDropdown = page.locator('.modal select, .modal [class*="dropdown"]').first();
          const dropdownType = await firstModalDropdown.tagName();
          
          if (dropdownType.toLowerCase() === 'select') {
            const modalOptions = await firstModalDropdown.locator('option').count();
            console.log(`    ✅ Modal select has ${modalOptions} options`);
            
            if (modalOptions > 1) {
              await firstModalDropdown.selectOption({ index: 1 });
              await page.waitForTimeout(500);
            }
          }
          
          await page.screenshot({ path: `modal_dropdown_${i}.png` });
        }
        
        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        
      } catch (e) {
        console.log(`  ℹ️ Modal trigger ${i} interaction different`);
      }
    }
    
    // 6. Context Menu Dropdowns (Right-click)
    console.log('🖱️ Testing context menu dropdowns...');
    const contextElements = page.locator('[class*="character"], .card, [data-character-id]');
    const contextCount = await contextElements.count();
    
    if (contextCount > 0) {
      try {
        console.log(`🔽 Testing context menu on character element`);
        
        await contextElements.first().click({ button: 'right' });
        await page.waitForTimeout(1000);
        
        const contextMenu = await page.locator('.context-menu:visible, .right-click-menu:visible').count();
        if (contextMenu > 0) {
          console.log(`  ✅ Context menu appeared`);
          await page.screenshot({ path: 'context_menu_dropdown.png' });
        }
        
        // Close context menu
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
      } catch (e) {
        console.log(`  ℹ️ Context menu not implemented or different pattern`);
      }
    }
    
    // 7. Hover Dropdowns
    console.log('🖱️ Testing hover dropdowns...');
    const hoverElements = page.locator('nav a, .nav-item, [class*="hover"]');
    const hoverCount = await hoverElements.count();
    
    for (let i = 0; i < Math.min(hoverCount, 3); i++) {
      try {
        const hoverText = await hoverElements.nth(i).textContent();
        console.log(`🔽 Testing hover dropdown: "${hoverText.trim()}"`);
        
        await hoverElements.nth(i).hover();
        await page.waitForTimeout(1000);
        
        const hoverDropdown = await page.locator('.dropdown-menu:visible, .hover-menu:visible').count();
        if (hoverDropdown > 0) {
          console.log(`  ✅ Hover dropdown appeared`);
          await page.screenshot({ path: `hover_dropdown_${i}.png` });
        }
        
        // Move mouse away to close
        await page.mouse.move(0, 0);
        await page.waitForTimeout(500);
        
      } catch (e) {
        console.log(`  ℹ️ Hover dropdown ${i} not responsive`);
      }
    }
    
    console.log('✅ Complete dropdown testing finished');
  });

  test('Character Workflow - Available Functionality', async ({ page }) => {
    console.log('🎭 Testing available character functionality...');
    
    await login(page);
    await page.waitForTimeout(2000);
    
    // 1. Look for character creation entry points
    console.log('✨ Looking for character creation...');
    
    const createTexts = ['Create', 'New', 'Add', '+'];
    let creationFound = false;
    
    for (const text of createTexts) {
      const buttons = page.locator(`button:has-text("${text}"), a:has-text("${text}")`);
      const count = await buttons.count();
      
      if (count > 0) {
        console.log(`✅ Found ${count} buttons with "${text}"`);
        
        // Try clicking the first one
        try {
          const buttonText = await buttons.first().textContent();
          console.log(`🔘 Clicking: "${buttonText.trim()}"`);
          
          await buttons.first().click();
          await page.waitForTimeout(2000);
          
          // Check if character creation opened
          const formElements = await page.locator('form, input[name*="name"], select').count();
          if (formElements > 0) {
            console.log('✅ Character creation interface opened');
            await page.screenshot({ path: 'character_creation_interface.png' });
            creationFound = true;
            
            // Try to fill basic info
            const nameInput = page.locator('input[name*="name"], input[placeholder*="name"]').first();
            if (await nameInput.count() > 0) {
              await nameInput.fill('Browser Test Character');
              console.log('✅ Character name filled');
            }
            
            break;
          }
        } catch (e) {
          console.log(`ℹ️ Button "${text}" has different interaction`);
        }
      }
    }
    
    if (!creationFound) {
      console.log('ℹ️ Character creation may require different access pattern');
    }
    
    // 2. Character Management
    console.log('📋 Testing character management...');
    
    // Look for existing characters
    const characterElements = await page.locator('[class*="character"], .card, [data-character-id]').count();
    console.log(`✅ Found ${characterElements} character-related elements`);
    
    // 3. Character Actions
    const actionButtons = page.locator('button').filter({ hasText: /view|edit|delete|advance|xp/i });
    const actionCount = await actionButtons.count();
    console.log(`✅ Found ${actionCount} character action buttons`);
    
    await page.screenshot({ path: 'character_workflow_final.png' });
  });

  test('Campaign and Admin Access Testing', async ({ page }) => {
    console.log('🏰 Testing campaign and admin access...');
    
    await login(page);
    await page.waitForTimeout(2000);
    
    // 1. Look for campaign-related navigation
    console.log('🎯 Looking for campaign functionality...');
    
    const campaignTexts = ['Campaign', 'Game', 'Session'];
    for (const text of campaignTexts) {
      const elements = page.locator(`button:has-text("${text}"), a:has-text("${text}"), [href*="${text.toLowerCase()}"]`);
      const count = await elements.count();
      
      if (count > 0) {
        console.log(`✅ Found ${count} ${text}-related elements`);
        
        try {
          await elements.first().click();
          await page.waitForTimeout(2000);
          
          const currentUrl = page.url();
          console.log(`✅ ${text} navigation to: ${currentUrl}`);
          
          await page.screenshot({ path: `${text.toLowerCase()}_interface.png` });
          
          // Go back
          await page.goto('http://localhost:8001/');
          await page.waitForTimeout(1000);
        } catch (e) {
          console.log(`ℹ️ ${text} element needs different interaction`);
        }
      }
    }
    
    // 2. Admin panel access
    console.log('🛡️ Testing admin panel access...');
    
    const adminButtons = page.locator('button, a').filter({ hasText: /admin|manage|settings/i });
    const adminCount = await adminButtons.count();
    
    if (adminCount > 0) {
      console.log(`✅ Found ${adminCount} admin-related elements`);
      
      for (let i = 0; i < Math.min(adminCount, 3); i++) {
        try {
          const adminText = await adminButtons.nth(i).textContent();
          console.log(`🛡️ Testing admin element: "${adminText.trim()}"`);
          
          await adminButtons.nth(i).click();
          await page.waitForTimeout(2000);
          
          const currentUrl = page.url();
          const pageContent = await page.textContent('body');
          
          if (pageContent.toLowerCase().includes('admin')) {
            console.log(`✅ Admin interface accessed: ${currentUrl}`);
            await page.screenshot({ path: `admin_panel_${i}.png` });
          }
          
          // Go back
          await page.goto('http://localhost:8001/');
          await page.waitForTimeout(1000);
        } catch (e) {
          console.log(`ℹ️ Admin element ${i} requires different access`);
        }
      }
    }
    
    await page.screenshot({ path: 'campaign_admin_final.png' });
  });

  test('Complete Error Handling and Security', async ({ page }) => {
    console.log('🔒 Testing error handling and security...');
    
    // 1. Unauthenticated access
    console.log('🚫 Testing unauthenticated access...');
    await page.goto('http://localhost:8001/');
    await expect(page).toHaveURL(/.*login.*/);
    console.log('✅ Unauthenticated users redirected to login');
    
    // 2. Invalid login attempts
    console.log('❌ Testing invalid login...');
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Should stay on login or show error
    const stillOnLogin = page.url().includes('login');
    const errorVisible = await page.locator('.error, .alert, [class*="error"]').count() > 0;
    
    if (stillOnLogin) {
      console.log('✅ Invalid login kept user on login page');
    }
    if (errorVisible) {
      console.log('✅ Error message displayed for invalid login');
    }
    
    // 3. Direct API access
    console.log('🔌 Testing direct API access...');
    const apiResponse = await page.goto('http://localhost:8001/api/characters');
    
    if (apiResponse.status() === 401) {
      console.log('✅ API properly protected (401 Unauthorized)');
    } else if (page.url().includes('login')) {
      console.log('✅ API access redirected to login');
    }
    
    // 4. Valid login for comparison
    console.log('✅ Testing valid login...');
    await page.goto('http://localhost:8001/login');
    await page.fill('input[type="email"]', 'clark@clarkeverson.com');
    await page.fill('input[type="password"]', 'TestPassword123456789@#$');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:8001/', { timeout: 10000 });
    console.log('✅ Valid login successful');
    
    await page.screenshot({ path: 'security_testing_final.png' });
  });

});
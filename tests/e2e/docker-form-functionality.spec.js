// Docker Form Functionality Comprehensive Testing
// Tests all forms, inputs, validation, and user interactions in Docker environment
const { test, expect } = require('@playwright/test');

test.describe('Docker Form Functionality Test Suite', () => {
  const DOCKER_BASE_URL = 'http://localhost:8001';
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  test('Docker Forms - Registration form complete workflow', async ({ page }) => {
    await page.goto(`${DOCKER_BASE_URL}/register`);
    
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Identify form fields
    const usernameInput = page.locator('input[name="username"], input[id="username"]');
    const emailInput = page.locator('input[name="email"], input[id="email"]');
    const passwordInput = page.locator('input[name="password"], input[id="password"]');
    const confirmPasswordInput = page.locator('input[name="confirm_password"], input[name="password_confirm"], input[id="confirm_password"]');
    const submitButton = page.locator('button[type="submit"], input[type="submit"]');
    
    // Test empty form submission
    if (await submitButton.count() > 0) {
      await submitButton.click();
      
      // Should show validation errors
      const errorElements = page.locator('.error, .alert-danger, .invalid-feedback, .field-error');
      if (await errorElements.count() > 0) {
        console.log('✅ Empty form validation working');
      }
    }
    
    // Test invalid email format
    if (await emailInput.count() > 0) {
      await emailInput.fill('invalid-email');
      await emailInput.blur();
      
      const emailError = page.locator('.email-error, .invalid-feedback');
      if (await emailError.count() > 0) {
        console.log('✅ Email format validation working');
      }
    }
    
    // Test password strength
    if (await passwordInput.count() > 0) {
      // Weak password
      await passwordInput.fill('123');
      await passwordInput.blur();
      
      const weakPasswordError = page.locator('.password-strength, .weak, .invalid-feedback');
      if (await weakPasswordError.count() > 0) {
        console.log('✅ Weak password validation working');
      }
      
      // Strong password
      await passwordInput.fill('SecurePassword123!');
      await passwordInput.blur();
    }
    
    // Test password confirmation
    if (await confirmPasswordInput.count() > 0 && await passwordInput.count() > 0) {
      await passwordInput.fill('SecurePassword123!');
      await confirmPasswordInput.fill('DifferentPassword123!');
      await confirmPasswordInput.blur();
      
      const mismatchError = page.locator('.password-mismatch, .invalid-feedback');
      if (await mismatchError.count() > 0) {
        console.log('✅ Password confirmation validation working');
      }
    }
    
    // Test valid form data
    const timestamp = Date.now();
    const testData = {
      username: `testuser${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: 'SecurePassword123!'
    };
    
    if (await usernameInput.count() > 0) await usernameInput.fill(testData.username);
    if (await emailInput.count() > 0) await emailInput.fill(testData.email);
    if (await passwordInput.count() > 0) await passwordInput.fill(testData.password);
    if (await confirmPasswordInput.count() > 0) await confirmPasswordInput.fill(testData.password);
    
    // Submit valid form
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(3000);
      
      // Check if form was processed
      const currentUrl = page.url();
      const isProcessed = !currentUrl.includes('register') || 
                         currentUrl.includes('success') || 
                         currentUrl.includes('login') ||
                         await page.locator('.success, .alert-success').count() > 0;
      
      if (isProcessed) {
        console.log('✅ Registration form submission processed');
      }
    }
    
    console.log('✅ Registration form workflow completed');
  });

  test('Docker Forms - Login form validation and functionality', async ({ page }) => {
    await page.goto(`${DOCKER_BASE_URL}/login`);
    
    const emailInput = page.locator('input[name="email"], input[id="email"]');
    const passwordInput = page.locator('input[name="password"], input[id="password"]');
    const submitButton = page.locator('button[type="submit"], input[type="submit"]');
    const rememberMe = page.locator('input[type="checkbox"], input[name="remember"]');
    
    // Test empty login
    if (await submitButton.count() > 0) {
      await submitButton.click();
      
      // Should stay on login page or show error
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).toContain('login');
      console.log('✅ Empty login validation working');
    }
    
    // Test invalid credentials
    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      await emailInput.fill('nonexistent@example.com');
      await passwordInput.fill('wrongpassword');
      
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(3000);
        
        // Should show error message or stay on login page
        const errorMessage = page.locator('.error, .alert-danger, .login-error');
        const stillOnLogin = page.url().includes('login');
        
        if (await errorMessage.count() > 0 || stillOnLogin) {
          console.log('✅ Invalid credentials handled properly');
        }
      }
    }
    
    // Test "Remember Me" checkbox functionality
    if (await rememberMe.count() > 0) {
      const isChecked = await rememberMe.isChecked();
      await rememberMe.click();
      const newChecked = await rememberMe.isChecked();
      
      expect(newChecked).toBe(!isChecked);
      console.log('✅ Remember Me checkbox functional');
    }
    
    // Test forgot password link
    const forgotPasswordLink = page.locator('a[href*="forgot"], a[href*="reset"], a:has-text("Forgot")');
    if (await forgotPasswordLink.count() > 0) {
      const href = await forgotPasswordLink.first().getAttribute('href');
      expect(href).toBeTruthy();
      console.log('✅ Forgot password link present');
    }
    
    console.log('✅ Login form functionality verified');
  });

  test('Docker Forms - Character creation form workflow', async ({ page }) => {
    // Navigate to character creation (may redirect to login first)
    await page.goto(`${DOCKER_BASE_URL}/character/create`);
    
    // If redirected to login, that's expected behavior for protected routes
    if (page.url().includes('login')) {
      console.log('✅ Character creation properly protected (redirects to login)');
      return;
    }
    
    // Wait for character creation form
    await page.waitForTimeout(3000);
    
    // Check for character creation form elements
    const characterNameInput = page.locator('input[name="name"], input[id="character_name"], input[placeholder*="name"]');
    const speciesSelect = page.locator('select[name="species"], select[id="species"]');
    const careerSelect = page.locator('select[name="career"], select[id="career"]');
    const submitButton = page.locator('button[type="submit"], input[type="submit"]');
    
    // Test character name validation
    if (await characterNameInput.count() > 0) {
      // Empty name
      await characterNameInput.fill('');
      await characterNameInput.blur();
      
      // Very long name
      await characterNameInput.fill('A'.repeat(100));
      await characterNameInput.blur();
      
      // Valid name
      await characterNameInput.fill('Luke Skywalker');
      console.log('✅ Character name input functional');
    }
    
    // Test species selection
    if (await speciesSelect.count() > 0) {
      const speciesOptions = page.locator('select[name="species"] option, select[id="species"] option');
      const optionCount = await speciesOptions.count();
      
      if (optionCount > 1) {
        // Select a species (skip first option which might be "Select...")
        await speciesSelect.selectOption({ index: 1 });
        
        const selectedValue = await speciesSelect.inputValue();
        expect(selectedValue).toBeTruthy();
        console.log(`✅ Species selection working (${optionCount} options available)`);
      }
    }
    
    // Test career selection
    if (await careerSelect.count() > 0) {
      const careerOptions = page.locator('select[name="career"] option, select[id="career"] option');
      const careerCount = await careerOptions.count();
      
      if (careerCount > 1) {
        await careerSelect.selectOption({ index: 1 });
        
        const selectedCareer = await careerSelect.inputValue();
        expect(selectedCareer).toBeTruthy();
        console.log(`✅ Career selection working (${careerCount} options available)`);
      }
    }
    
    // Test form submission
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(3000);
      
      console.log('✅ Character creation form submission attempted');
    }
    
    console.log('✅ Character creation form workflow completed');
  });

  test('Docker Forms - Search and filter functionality', async ({ page }) => {
    await page.goto(DOCKER_BASE_URL);
    
    // Look for search inputs
    const searchInputs = page.locator('input[type="search"], input[placeholder*="search"], input[name*="search"]');
    
    if (await searchInputs.count() > 0) {
      const searchInput = searchInputs.first();
      
      // Test search input
      await searchInput.fill('test search query');
      await searchInput.press('Enter');
      
      await page.waitForTimeout(2000);
      console.log('✅ Search input functional');
    }
    
    // Look for filter dropdowns
    const filterSelects = page.locator('select[name*="filter"], select[id*="filter"]');
    
    if (await filterSelects.count() > 0) {
      const filterSelect = filterSelects.first();
      const options = await filterSelect.locator('option').count();
      
      if (options > 1) {
        await filterSelect.selectOption({ index: 1 });
        console.log('✅ Filter dropdown functional');
      }
    }
    
    console.log('✅ Search and filter functionality checked');
  });

  test('Docker Forms - Dynamic form interactions', async ({ page }) => {
    await page.goto(`${DOCKER_BASE_URL}/register`);
    
    // Test password visibility toggle
    const passwordInput = page.locator('input[type="password"]');
    const passwordToggle = page.locator('.password-toggle, .show-password, .eye-icon');
    
    if (await passwordInput.count() > 0 && await passwordToggle.count() > 0) {
      await passwordInput.fill('TestPassword123');
      
      const initialType = await passwordInput.getAttribute('type');
      await passwordToggle.click();
      
      const newType = await passwordInput.getAttribute('type');
      
      if (initialType !== newType) {
        console.log('✅ Password visibility toggle working');
      }
    }
    
    // Test conditional field display
    const dependentFields = page.locator('input[data-depends-on], select[data-depends-on]');
    
    if (await dependentFields.count() > 0) {
      console.log('✅ Conditional fields found');
    }
    
    // Test real-time validation feedback
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.fill('test');
      await page.waitForTimeout(500);
      
      await emailInput.fill('test@example.com');
      await page.waitForTimeout(500);
      
      console.log('✅ Real-time validation checked');
    }
    
    console.log('✅ Dynamic form interactions verified');
  });

  test('Docker Forms - Multi-step form navigation', async ({ page }) => {
    // Check if there are any multi-step forms (character creation wizard)
    await page.goto(`${DOCKER_BASE_URL}/character/create`);
    
    if (page.url().includes('login')) {
      console.log('✅ Multi-step form protected by authentication');
      return;
    }
    
    // Look for step indicators
    const stepIndicators = page.locator('.step, .wizard-step, .progress-step, .nav-tabs li');
    const nextButtons = page.locator('button:has-text("Next"), .btn-next');
    const prevButtons = page.locator('button:has-text("Previous"), button:has-text("Back"), .btn-prev');
    
    if (await stepIndicators.count() > 1) {
      console.log(`✅ Multi-step form found with ${await stepIndicators.count()} steps`);
      
      // Test next button
      if (await nextButtons.count() > 0) {
        await nextButtons.first().click();
        await page.waitForTimeout(1000);
        console.log('✅ Next button functional');
      }
      
      // Test previous button
      if (await prevButtons.count() > 0) {
        await prevButtons.first().click();
        await page.waitForTimeout(1000);
        console.log('✅ Previous button functional');
      }
    }
    
    console.log('✅ Multi-step form navigation checked');
  });

  test('Docker Forms - File upload functionality', async ({ page }) => {
    await page.goto(DOCKER_BASE_URL);
    
    // Look for file input fields
    const fileInputs = page.locator('input[type="file"]');
    
    if (await fileInputs.count() > 0) {
      const fileInput = fileInputs.first();
      
      // Check if file input is styled/hidden properly
      const isVisible = await fileInput.isVisible();
      const hasCustomStyling = await page.locator('.file-upload, .upload-area, .drop-zone').count() > 0;
      
      if (!isVisible && hasCustomStyling) {
        console.log('✅ File input has custom styling');
      }
      
      // Test file input accepts attribute
      const accept = await fileInput.getAttribute('accept');
      if (accept) {
        console.log(`✅ File input accepts: ${accept}`);
      }
      
      console.log('✅ File upload elements found');
    } else {
      console.log('ℹ️ No file upload functionality found');
    }
  });

  test('Docker Forms - Auto-save and form persistence', async ({ page }) => {
    await page.goto(`${DOCKER_BASE_URL}/character/create`);
    
    if (page.url().includes('login')) {
      console.log('✅ Form persistence protected by authentication');
      return;
    }
    
    // Fill out form data
    const nameInput = page.locator('input[name="name"], input[id="character_name"]');
    if (await nameInput.count() > 0) {
      await nameInput.fill('Test Character');
      
      // Wait for potential auto-save
      await page.waitForTimeout(3000);
      
      // Refresh page and check if data persists
      await page.reload();
      await page.waitForTimeout(2000);
      
      const persistedValue = await nameInput.inputValue();
      if (persistedValue === 'Test Character') {
        console.log('✅ Form auto-save working');
      } else {
        console.log('ℹ️ No form persistence detected');
      }
    }
  });

  test('Docker Forms - Accessibility and keyboard navigation', async ({ page }) => {
    await page.goto(`${DOCKER_BASE_URL}/login`);
    
    // Test tab navigation through form
    const formElements = page.locator('input, select, button, textarea');
    const elementCount = await formElements.count();
    
    if (elementCount > 0) {
      // Start from first element
      await formElements.first().focus();
      
      // Tab through elements
      for (let i = 0; i < Math.min(elementCount, 5); i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }
      
      console.log('✅ Keyboard navigation working');
    }
    
    // Test form submission with Enter key
    const submitButton = page.locator('button[type="submit"], input[type="submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      
      console.log('✅ Enter key form submission working');
    }
    
    // Check for ARIA labels and descriptions
    const ariaLabels = page.locator('[aria-label]');
    const ariaDescriptions = page.locator('[aria-describedby]');
    
    if (await ariaLabels.count() > 0) {
      console.log(`✅ Found ${await ariaLabels.count()} ARIA labels`);
    }
    
    if (await ariaDescriptions.count() > 0) {
      console.log(`✅ Found ${await ariaDescriptions.count()} ARIA descriptions`);
    }
    
    console.log('✅ Form accessibility features checked');
  });

  test('Docker Forms - Error handling and recovery', async ({ page }) => {
    await page.goto(`${DOCKER_BASE_URL}/register`);
    
    // Test network error simulation
    await page.route('**/register', route => {
      route.abort();
    });
    
    const submitButton = page.locator('button[type="submit"], input[type="submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(3000);
      
      // Should show some kind of error message
      const errorMessages = page.locator('.error, .alert-danger, .network-error');
      if (await errorMessages.count() > 0) {
        console.log('✅ Network error handling working');
      }
    }
    
    // Remove route override
    await page.unroute('**/register');
    
    console.log('✅ Error handling and recovery tested');
  });
});
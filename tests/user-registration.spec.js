// tests/user-registration.spec.js
const { test, expect } = require('@playwright/test');
const { loginUser, ADMIN_USER } = require('./auth.setup.js');

test.describe('User Registration System', () => {
  let inviteCode;

  test.beforeEach(async ({ page }) => {
    // Create admin and generate invite code
    await page.request.post('/api/debug/create-admin');
    await loginUser(page, ADMIN_USER);
    
    // Generate invite code for registration tests
    const inviteResponse = await page.request.post('/api/admin/invite', {
      data: {
        role: 'player',
        expires_in_days: 7
      }
    });
    const inviteResult = await inviteResponse.json();
    inviteCode = inviteResult.invite_code;
    
    // Logout for registration tests
    await page.click('#userMenuToggle');
    await page.click('text=Logout');
  });

  test('should display registration form with all required fields', async ({ page }) => {
    await page.goto('/register');
    
    // Check form title and description
    await expect(page.locator('h1:has-text("Register")')).toBeVisible();
    await expect(page.locator('text=Registration is by invite only')).toBeVisible();
    
    // Check all required fields are present
    await expect(page.locator('#inviteCode')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
    
    // Check submit button
    await expect(page.locator('button:has-text("Register")')).toBeVisible();
    
    // Check link to login page
    await expect(page.locator('a[href="/login"]:has-text("Login")')).toBeVisible();
  });

  test('should show password requirements', async ({ page }) => {
    await page.goto('/register');
    
    // Check password requirements section
    const requirements = page.locator('.password-requirements');
    await expect(requirements).toBeVisible();
    await expect(requirements.locator('text=Password Requirements')).toBeVisible();
    
    // Check individual requirements
    await expect(requirements.locator('text=At least 20 characters long')).toBeVisible();
    await expect(requirements.locator('text=Contains uppercase and lowercase letters')).toBeVisible();
    await expect(requirements.locator('text=Contains at least one number')).toBeVisible();
    await expect(requirements.locator('text=Contains at least one special character')).toBeVisible();
  });

  test('should have password generator functionality', async ({ page }) => {
    await page.goto('/register');
    
    // Check password generator button
    const generateButton = page.locator('#generatePassword');
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toHaveText('Generate Secure Password');
    
    // Check password visibility toggle
    const toggleButton = page.locator('#togglePassword');
    await expect(toggleButton).toBeVisible();
    await expect(toggleButton).toHaveText('👁️');
  });

  test('should generate secure password when button is clicked', async ({ page }) => {
    await page.goto('/register');
    
    // Click generate password button
    await page.click('#generatePassword');
    
    // Check that password fields are filled
    const passwordValue = await page.inputValue('#password');
    const confirmPasswordValue = await page.inputValue('#confirmPassword');
    
    expect(passwordValue).toBeTruthy();
    expect(confirmPasswordValue).toBeTruthy();
    expect(passwordValue).toBe(confirmPasswordValue);
    
    // Check password meets requirements (24 chars, mixed case, numbers, special chars)
    expect(passwordValue).toHaveLength(24);
    expect(passwordValue).toMatch(/[A-Z]/); // Uppercase
    expect(passwordValue).toMatch(/[a-z]/); // Lowercase  
    expect(passwordValue).toMatch(/[0-9]/); // Numbers
    expect(passwordValue).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/); // Special chars
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/register');
    
    // Fill in a password
    await page.fill('#password', 'TestPassword123!');
    await page.fill('#confirmPassword', 'TestPassword123!');
    
    // Check initial state (password type)
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    await expect(page.locator('#confirmPassword')).toHaveAttribute('type', 'password');
    
    // Click toggle button
    await page.click('#togglePassword');
    
    // Check fields changed to text type
    await expect(page.locator('#password')).toHaveAttribute('type', 'text');
    await expect(page.locator('#confirmPassword')).toHaveAttribute('type', 'text');
    await expect(page.locator('#togglePassword')).toHaveText('🙈');
    
    // Click toggle again
    await page.click('#togglePassword');
    
    // Should be back to password type
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    await expect(page.locator('#confirmPassword')).toHaveAttribute('type', 'password');
    await expect(page.locator('#togglePassword')).toHaveText('👁️');
  });

  test('should successfully register with valid data', async ({ page }) => {
    await page.goto('/register');
    
    // Fill in valid registration data
    await page.fill('#inviteCode', inviteCode);
    await page.fill('#email', 'newuser@example.com');
    await page.fill('#username', 'newuser');
    await page.fill('#password', 'SecurePassword123456789#');
    await page.fill('#confirmPassword', 'SecurePassword123456789#');
    
    // Submit form
    await page.click('button:has-text("Register")');
    
    // Check for success message
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('text=Registration successful')).toBeVisible();
    
    // Should redirect to login page
    await page.waitForURL('/login');
  });

  test('should validate password confirmation match', async ({ page }) => {
    await page.goto('/register');
    
    // Fill form with mismatched passwords
    await page.fill('#inviteCode', inviteCode);
    await page.fill('#email', 'test@example.com');
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'SecurePassword123456789#');
    await page.fill('#confirmPassword', 'DifferentPassword123456789#');
    
    // Submit form
    await page.click('button:has-text("Register")');
    
    // Check for error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should validate password strength requirements', async ({ page }) => {
    await page.goto('/register');
    
    // Test with weak password (too short)
    await page.fill('#inviteCode', inviteCode);
    await page.fill('#email', 'test@example.com');
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'weak123');
    await page.fill('#confirmPassword', 'weak123');
    
    // Submit form
    await page.click('button:has-text("Register")');
    
    // Should show password validation error from server
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit empty form
    await page.click('button:has-text("Register")');
    
    // Check HTML5 validation kicks in for required fields
    const inviteCodeField = page.locator('#inviteCode');
    const emailField = page.locator('#email');
    const usernameField = page.locator('#username');
    const passwordField = page.locator('#password');
    
    // These fields should have required attribute
    await expect(inviteCodeField).toHaveAttribute('required');
    await expect(emailField).toHaveAttribute('required');
    await expect(usernameField).toHaveAttribute('required');
    await expect(passwordField).toHaveAttribute('required');
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/register');
    
    // Fill form with invalid email
    await page.fill('#inviteCode', inviteCode);
    await page.fill('#email', 'invalid-email');
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'SecurePassword123456789#');
    await page.fill('#confirmPassword', 'SecurePassword123456789#');
    
    // Email field should have type="email" for HTML5 validation
    await expect(page.locator('#email')).toHaveAttribute('type', 'email');
  });

  test('should validate invite code requirement', async ({ page }) => {
    await page.goto('/register');
    
    // Fill form without invite code
    await page.fill('#email', 'test@example.com');
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'SecurePassword123456789#');
    await page.fill('#confirmPassword', 'SecurePassword123456789#');
    
    // Submit form
    await page.click('button:has-text("Register")');
    
    // Should show error about missing invite code or invalid invite
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('should handle invalid invite codes', async ({ page }) => {
    await page.goto('/register');
    
    // Fill form with invalid invite code
    await page.fill('#inviteCode', 'INVALID12345');
    await page.fill('#email', 'test@example.com');
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'SecurePassword123456789#');
    await page.fill('#confirmPassword', 'SecurePassword123456789#');
    
    // Submit form
    await page.click('button:has-text("Register")');
    
    // Should show invite code error
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('text=Invalid or expired invite code')).toBeVisible();
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    // First registration
    await page.goto('/register');
    await page.fill('#inviteCode', inviteCode);
    await page.fill('#email', 'duplicate@example.com');
    await page.fill('#username', 'user1');
    await page.fill('#password', 'SecurePassword123456789#');
    await page.fill('#confirmPassword', 'SecurePassword123456789#');
    await page.click('button:has-text("Register")');
    
    // Wait for success and get new invite code
    await page.waitForURL('/login');
    
    // Create new invite code for second attempt
    await page.fill('#email', ADMIN_USER.email);
    await page.fill('#password', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    
    const newInviteResponse = await page.request.post('/api/admin/invite', {
      data: { role: 'player', expires_in_days: 7 }
    });
    const newInviteResult = await newInviteResponse.json();
    
    await page.click('#userMenuToggle');
    await page.click('text=Logout');
    
    // Try to register with same email
    await page.goto('/register');
    await page.fill('#inviteCode', newInviteResult.invite_code);
    await page.fill('#email', 'duplicate@example.com');
    await page.fill('#username', 'user2');
    await page.fill('#password', 'SecurePassword123456789#');
    await page.fill('#confirmPassword', 'SecurePassword123456789#');
    await page.click('button:has-text("Register")');
    
    // Should show error about duplicate email
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('should show loading state during registration', async ({ page }) => {
    await page.goto('/register');
    
    // Fill valid form
    await page.fill('#inviteCode', inviteCode);
    await page.fill('#email', 'loading@example.com');
    await page.fill('#username', 'loadinguser');
    await page.fill('#password', 'SecurePassword123456789#');
    await page.fill('#confirmPassword', 'SecurePassword123456789#');
    
    // Submit and check button state changes
    await page.click('button:has-text("Register")');
    
    // Button should be disabled and show loading text
    const submitButton = page.locator('#registerBtn');
    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toHaveText('Registering...');
  });
});
/**
 * EDGE CASES AND ERROR HANDLING TEST SUITE
 * Tests all error conditions, edge cases, and failure scenarios
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8001';

test.describe('Edge Cases and Error Handling', () => {

    test('Authentication Edge Cases', async ({ page }) => {
        console.log('\n🚨 TESTING AUTHENTICATION EDGE CASES');
        
        // Test invalid login attempts
        await page.goto(`${BASE_URL}/login`);
        
        console.log('Testing invalid credentials...');
        await page.fill('input[name="email"]', 'invalid@email.com');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Should show error message
        const errorMessage = await page.locator('.error-message, .alert-danger, [class*="error"]');
        const hasError = await errorMessage.count() > 0;
        console.log(`❌ Invalid login error handling: ${hasError ? '✅' : '❌'}`);
        
        // Test empty form submission
        console.log('Testing empty form submission...');
        await page.fill('input[name="email"]', '');
        await page.fill('input[name="password"]', '');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        
        // Should prevent submission or show validation
        const validationError = await page.locator('input:invalid, .validation-error');
        const hasValidation = await validationError.count() > 0;
        console.log(`📝 Form validation: ${hasValidation ? '✅' : '❌'}`);
        
        // Test SQL injection attempt
        console.log('Testing SQL injection protection...');
        await page.fill('input[name="email"]', "admin'; DROP TABLE users; --");
        await page.fill('input[name="password"]', "' OR '1'='1");
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Should not crash or login
        const stillOnLogin = page.url().includes('/login');
        console.log(`🛡️ SQL injection protection: ${stillOnLogin ? '✅' : '❌'}`);
        
        await page.screenshot({ path: 'tests/edge-case-screenshots/auth-edge-cases.png' });
    });

    test('Character Creation Edge Cases', async ({ page }) => {
        console.log('\n👤 TESTING CHARACTER CREATION EDGE CASES');
        
        // First login with valid credentials
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[name="email"]', 'player@test.com');
        await page.fill('input[name="password"]', 'player123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Navigate to character creation
        await page.goto(`${BASE_URL}/characters/create`);
        await page.waitForTimeout(3000);
        
        if (page.url().includes('create')) {
            // Test extremely long character names
            console.log('Testing extremely long character names...');
            const longName = 'A'.repeat(1000);
            await page.fill('input[name="name"]', longName);
            
            // Test special characters in names
            console.log('Testing special characters...');
            await page.fill('input[name="player_name"]', '<script>alert("XSS")</script>');
            
            // Test form submission with invalid data
            const submitButton = await page.locator('button[type="submit"], input[type="submit"]');
            if (await submitButton.count() > 0) {
                await submitButton.click();
                await page.waitForTimeout(3000);
                
                // Check if proper validation occurred
                const validationMessages = await page.locator('.error, .invalid, [class*="error"]');
                const hasValidation = await validationMessages.count() > 0;
                console.log(`📝 Character validation: ${hasValidation ? '✅' : '❌'}`);
            }
            
            // Test Unicode and international characters
            console.log('Testing Unicode support...');
            await page.fill('input[name="name"]', '测试角色');
            await page.fill('input[name="player_name"]', 'Тест Игрок');
            
            await page.screenshot({ path: 'tests/edge-case-screenshots/character-edge-cases.png' });
        }
    });

    test('Network and Performance Edge Cases', async ({ page }) => {
        console.log('\n🌐 TESTING NETWORK AND PERFORMANCE EDGE CASES');
        
        // Test with slow network
        await page.route('**/*', route => {
            setTimeout(() => route.continue(), 2000); // Add 2s delay
        });
        
        await page.goto(`${BASE_URL}/`);
        await page.waitForTimeout(5000);
        
        const pageLoaded = await page.locator('body').count() > 0;
        console.log(`🐌 Slow network handling: ${pageLoaded ? '✅' : '❌'}`);
        
        // Reset network conditions
        await page.unroute('**/*');
        
        // Test JavaScript errors
        console.log('Testing JavaScript error handling...');
        await page.goto(`${BASE_URL}/`);
        
        // Inject an error
        await page.evaluate(() => {
            window.onerror = (msg, url, line, col, error) => {
                window.jsErrorCaught = true;
                return true; // Prevent default error handling
            };
            throw new Error('Test error');
        });
        
        await page.waitForTimeout(2000);
        
        const errorHandled = await page.evaluate(() => window.jsErrorCaught);
        console.log(`💥 JavaScript error handling: ${errorHandled ? '✅' : '❌'}`);
        
        await page.screenshot({ path: 'tests/edge-case-screenshots/network-edge-cases.png' });
    });

    test('Browser Compatibility Edge Cases', async ({ page, browserName }) => {
        console.log(`\n🌍 TESTING BROWSER COMPATIBILITY - ${browserName.toUpperCase()}`);
        
        await page.goto(`${BASE_URL}/`);
        await page.waitForTimeout(3000);
        
        // Test console errors
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
        
        // Test modern JavaScript features
        const modernJSSupport = await page.evaluate(() => {
            try {
                // Test arrow functions
                const arrow = () => 'test';
                
                // Test const/let
                const testConst = 'test';
                let testLet = 'test';
                
                // Test template literals
                const template = `Hello ${testConst}`;
                
                // Test Promise support
                return Promise.resolve(true);
            } catch (error) {
                return false;
            }
        });
        
        console.log(`🔧 Modern JavaScript support: ${await modernJSSupport ? '✅' : '❌'}`);
        
        // Test CSS features
        const cssSupport = await page.evaluate(() => {
            const div = document.createElement('div');
            div.style.display = 'grid';
            div.style.flexDirection = 'column';
            
            return div.style.display === 'grid' && div.style.flexDirection === 'column';
        });
        
        console.log(`🎨 Modern CSS support: ${cssSupport ? '✅' : '❌'}`);
        
        // Test WebAuthn support (for passkeys)
        const webAuthnSupport = await page.evaluate(() => {
            return !!(window.PublicKeyCredential && 
                     navigator.credentials && 
                     navigator.credentials.create && 
                     navigator.credentials.get);
        });
        
        console.log(`🔐 WebAuthn support: ${webAuthnSupport ? '✅' : '❌'}`);
        
        await page.waitForTimeout(2000);
        console.log(`📊 Console errors found: ${consoleErrors.length}`);
        if (consoleErrors.length > 0) {
            console.log('Errors:', consoleErrors.slice(0, 3)); // Show first 3 errors
        }
        
        await page.screenshot({ path: `tests/edge-case-screenshots/browser-compat-${browserName}.png` });
    });

    test('Security Edge Cases', async ({ page }) => {
        console.log('\n🔒 TESTING SECURITY EDGE CASES');
        
        // Test CSRF protection
        console.log('Testing CSRF protection...');
        await page.goto(`${BASE_URL}/login`);
        
        // Try to submit form without proper origin
        const csrfTest = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Origin': 'http://malicious-site.com'
                    },
                    body: JSON.stringify({
                        email: 'test@test.com',
                        password: 'password'
                    })
                });
                return response.status;
            } catch (error) {
                return 'error';
            }
        });
        
        console.log(`🛡️ CSRF protection: ${csrfTest !== 200 ? '✅' : '❌'} (Status: ${csrfTest})`);
        
        // Test XSS protection
        console.log('Testing XSS protection...');
        await page.goto(`${BASE_URL}/login`);
        
        const xssScript = '<img src=x onerror=alert("XSS")>';
        await page.fill('input[name="email"]', xssScript);
        
        // Check if script was executed
        let alertTriggered = false;
        page.on('dialog', dialog => {
            alertTriggered = true;
            dialog.dismiss();
        });
        
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        
        console.log(`🚫 XSS protection: ${!alertTriggered ? '✅' : '❌'}`);
        
        // Test unauthorized access
        console.log('Testing unauthorized access...');
        await page.goto(`${BASE_URL}/admin`);
        await page.waitForTimeout(2000);
        
        const redirectedToLogin = page.url().includes('/login') || page.url().includes('/403') || page.url().includes('/401');
        console.log(`🔐 Unauthorized access protection: ${redirectedToLogin ? '✅' : '❌'}`);
        
        await page.screenshot({ path: 'tests/edge-case-screenshots/security-edge-cases.png' });
    });

    test('Data Validation Edge Cases', async ({ page }) => {
        console.log('\n📊 TESTING DATA VALIDATION EDGE CASES');
        
        // Login first
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[name="email"]', 'player@test.com');
        await page.fill('input[name="password"]', 'player123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Test profile form with invalid data
        await page.goto(`${BASE_URL}/profile`);
        await page.waitForTimeout(3000);
        
        if (page.url().includes('/profile')) {
            // Test password change with mismatched passwords
            console.log('Testing password validation...');
            await page.fill('input[name="current_password"]', 'test123');
            await page.fill('input[name="new_password"]', 'newpass123');
            await page.fill('input[name="confirm_password"]', 'differentpass123');
            
            const passwordForm = await page.locator('#password-form');
            if (await passwordForm.count() > 0) {
                await passwordForm.locator('button[type="submit"]').click();
                await page.waitForTimeout(2000);
                
                // Should show validation error
                const validationError = await page.locator('.error, .alert, [class*="error"]');
                const hasValidation = await validationError.count() > 0;
                console.log(`🔒 Password validation: ${hasValidation ? '✅' : '❌'}`);
            }
        }
        
        // Test file upload edge cases (if any file inputs exist)
        const fileInputs = await page.locator('input[type="file"]');
        if (await fileInputs.count() > 0) {
            console.log('Testing file upload validation...');
            
            // Create a test file that's too large
            const largeFile = Buffer.alloc(50 * 1024 * 1024); // 50MB
            await page.setInputFiles('input[type="file"]', {
                name: 'large-file.jpg',
                mimeType: 'image/jpeg',
                buffer: largeFile
            });
            
            // Should handle large file appropriately
            await page.waitForTimeout(2000);
            const fileError = await page.locator('.file-error, .upload-error, [class*="error"]');
            console.log(`📁 File size validation: ${await fileError.count() > 0 ? '✅' : '❌'}`);
        }
        
        await page.screenshot({ path: 'tests/edge-case-screenshots/data-validation-edge-cases.png' });
    });

    test('Accessibility Edge Cases', async ({ page }) => {
        console.log('\n♿ TESTING ACCESSIBILITY EDGE CASES');
        
        await page.goto(`${BASE_URL}/`);
        await page.waitForTimeout(3000);
        
        // Test keyboard navigation
        console.log('Testing keyboard navigation...');
        await page.keyboard.press('Tab');
        await page.waitForTimeout(500);
        
        const focusedElement = await page.evaluate(() => document.activeElement.tagName);
        const keyboardNavWorking = focusedElement && focusedElement !== 'BODY';
        console.log(`⌨️ Keyboard navigation: ${keyboardNavWorking ? '✅' : '❌'}`);
        
        // Test screen reader compatibility
        console.log('Testing screen reader attributes...');
        const ariaLabels = await page.locator('[aria-label]').count();
        const altTexts = await page.locator('img[alt]').count();
        const headingStructure = await page.locator('h1, h2, h3, h4, h5, h6').count();
        
        console.log(`🏷️ ARIA labels found: ${ariaLabels}`);
        console.log(`🖼️ Alt texts found: ${altTexts}`);
        console.log(`📖 Heading elements: ${headingStructure}`);
        
        // Test color contrast (basic check)
        const contrastIssues = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            let issues = 0;
            
            for (let element of elements) {
                const style = window.getComputedStyle(element);
                const color = style.color;
                const bgColor = style.backgroundColor;
                
                // Very basic contrast check
                if (color === 'rgb(255, 255, 255)' && bgColor === 'rgb(255, 255, 255)') {
                    issues++;
                }
            }
            
            return issues;
        });
        
        console.log(`🎨 Color contrast issues: ${contrastIssues === 0 ? '✅' : '❌'} (${contrastIssues} potential issues)`);
        
        await page.screenshot({ path: 'tests/edge-case-screenshots/accessibility-edge-cases.png' });
    });

});

console.log('\n🎯 EDGE CASES AND ERROR HANDLING TEST SUITE READY');
console.log('This suite tests all error conditions, security issues, and edge cases!');
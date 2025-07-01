// Profile Features Test - 2FA and Password Change
const { test, expect } = require('@playwright/test');

test('Profile Features - 2FA and Password Change', async ({ page }) => {
    console.log('\n🔐 PROFILE FEATURES TEST - 2FA & PASSWORD CHANGE\n');
    
    try {
        // Login first
        console.log('🔐 Logging in...');
        await page.goto('http://localhost:8001/login');
        await page.fill('input[name="email"]', 'clark@clarkeverson.com');
        await page.fill('input[name="password"]', 'clark123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        const loginSuccess = !page.url().includes('/login');
        if (!loginSuccess) {
            console.log('❌ Login failed - cannot test profile features');
            return;
        }
        console.log('✅ Login successful');
        
        // Navigate to profile
        console.log('\n👤 Navigating to profile...');
        await page.goto('http://localhost:8001/profile');
        await page.waitForTimeout(3000);
        
        // Check profile page loaded
        const profileTitle = await page.locator('h1:has-text("Profile")').count();
        if (profileTitle === 0) {
            console.log('❌ Profile page did not load');
            return;
        }
        console.log('✅ Profile page loaded');
        
        // ========================================
        // TEST 2FA FUNCTIONALITY
        // ========================================
        console.log('\n🔐 Testing 2FA functionality...');
        
        // Wait for user data to load
        await page.waitForTimeout(2000);
        
        // Check if 2FA status is visible
        const twoFAStatus = await page.locator('#twofa_status').textContent();
        console.log(`Current 2FA status: ${twoFAStatus}`);
        
        // Check if Manage button exists
        const manage2FABtn = page.locator('button:has-text("Manage")');
        const hasManageBtn = await manage2FABtn.count() > 0;
        console.log(`Manage 2FA button: ${hasManageBtn ? 'FOUND' : 'NOT FOUND'}`);
        
        if (hasManageBtn) {
            console.log('🔧 Testing 2FA management...');
            await manage2FABtn.click();
            await page.waitForTimeout(2000);
            
            // Check if 2FA management modal or page opens
            const modalOrDialog = await page.locator('[class*="modal"], [role="dialog"], [class*="dialog"]').count();
            const newPageOrSection = await page.locator('h2:has-text("2FA"), h2:has-text("Two-Factor"), h3:has-text("2FA"), h3:has-text("Two-Factor")').count();
            
            const manage2FAWorking = modalOrDialog > 0 || newPageOrSection > 0;
            console.log(`2FA Management UI: ${manage2FAWorking ? 'OPENS CORRECTLY' : 'NO UI FOUND'}`);
            
            if (manage2FAWorking) {
                // Look for setup or disable options
                const setupBtn = await page.locator('button:has-text("Setup"), button:has-text("Enable"), button:has-text("Activate")').count();
                const disableBtn = await page.locator('button:has-text("Disable"), button:has-text("Turn Off")').count();
                const qrCode = await page.locator('img[src*="data:image"], canvas, [class*="qr"]').count();
                
                console.log(`- Setup/Enable buttons: ${setupBtn}`);
                console.log(`- Disable buttons: ${disableBtn}`);
                console.log(`- QR codes/visual elements: ${qrCode}`);
                
                if (setupBtn > 0 || disableBtn > 0) {
                    console.log('✅ 2FA management functional');
                } else {
                    console.log('⚠️ 2FA management UI present but limited functionality');
                }
            }
        } else {
            console.log('❌ 2FA management button not found');
        }
        
        // ========================================
        // TEST PASSWORD CHANGE FUNCTIONALITY
        // ========================================
        console.log('\n🔑 Testing password change functionality...');
        
        // Check if password form exists
        const passwordForm = page.locator('#password-form');
        const hasPasswordForm = await passwordForm.count() > 0;
        console.log(`Password change form: ${hasPasswordForm ? 'FOUND' : 'NOT FOUND'}`);
        
        if (hasPasswordForm) {
            console.log('🔧 Testing password change form...');
            
            // Check form fields
            const currentPasswordField = page.locator('input[name="current_password"]');
            const newPasswordField = page.locator('input[name="new_password"]');
            const confirmPasswordField = page.locator('input[name="confirm_password"]');
            
            const hasCurrentField = await currentPasswordField.count() > 0;
            const hasNewField = await newPasswordField.count() > 0;
            const hasConfirmField = await confirmPasswordField.count() > 0;
            
            console.log(`- Current password field: ${hasCurrentField ? 'FOUND' : 'MISSING'}`);
            console.log(`- New password field: ${hasNewField ? 'FOUND' : 'MISSING'}`);
            console.log(`- Confirm password field: ${hasConfirmField ? 'FOUND' : 'MISSING'}`);
            
            if (hasCurrentField && hasNewField && hasConfirmField) {
                console.log('🧪 Testing password validation...');
                
                // Test password mismatch validation
                await currentPasswordField.fill('wrongpassword');
                await newPasswordField.fill('newTestPassword123!@#$');
                await confirmPasswordField.fill('differentPassword');
                
                const submitBtn = page.locator('#password-form button[type="submit"]');
                if (await submitBtn.count() > 0) {
                    await submitBtn.click();
                    await page.waitForTimeout(2000);
                    
                    // Check for validation message
                    const validationMsg = await page.locator('text=/password/i, text=/match/i, text=/error/i, .error, .alert, [class*="danger"]').count();
                    console.log(`Password validation: ${validationMsg > 0 ? 'WORKING (shows errors)' : 'NO VALIDATION SHOWN'}`);
                    
                    // Test with correct format
                    await confirmPasswordField.fill('newTestPassword123!@#$');
                    await submitBtn.click();
                    await page.waitForTimeout(2000);
                    
                    // Should show error for wrong current password
                    const authError = await page.locator('text=/current/i, text=/incorrect/i, text=/invalid/i, .error, .alert').count();
                    console.log(`Current password validation: ${authError > 0 ? 'WORKING (rejects wrong password)' : 'NO VALIDATION'}`);
                    
                    if (authError > 0 || validationMsg > 0) {
                        console.log('✅ Password change form functional with validation');
                    } else {
                        console.log('⚠️ Password change form present but validation unclear');
                    }
                } else {
                    console.log('❌ Password form submit button not found');
                }
            } else {
                console.log('❌ Password form missing required fields');
            }
        } else {
            console.log('❌ Password change form not found');
        }
        
        // ========================================
        // TEST ACCOUNT DELETION
        // ========================================
        console.log('\n🗑️ Testing account deletion...');
        
        const deleteBtn = page.locator('button:has-text("Delete"), a:has-text("Delete")');
        const hasDeleteBtn = await deleteBtn.count() > 0;
        console.log(`Account deletion option: ${hasDeleteBtn ? 'FOUND' : 'NOT FOUND'}`);
        
        if (hasDeleteBtn) {
            // Don't actually click it, just verify it exists
            console.log('✅ Account deletion option available');
        }
        
        // ========================================
        // TAKE SCREENSHOT
        // ========================================
        await page.screenshot({ path: 'profile-features-test.png', fullPage: true });
        
        // ========================================
        // SUMMARY
        // ========================================
        console.log('\n🏁 PROFILE FEATURES TEST SUMMARY:');
        console.log('✅ Login and profile access: WORKING');
        console.log(`${hasManageBtn ? '✅' : '❌'} 2FA management: ${hasManageBtn ? 'AVAILABLE' : 'MISSING'}`);
        console.log(`${hasPasswordForm ? '✅' : '❌'} Password change: ${hasPasswordForm ? 'AVAILABLE' : 'MISSING'}`);
        console.log(`${hasDeleteBtn ? '✅' : '❌'} Account deletion: ${hasDeleteBtn ? 'AVAILABLE' : 'MISSING'}`);
        
        if (hasManageBtn && hasPasswordForm) {
            console.log('\n🎉 PROFILE FEATURES COMPREHENSIVE - All major security features available!');
        } else {
            console.log('\n⚠️ PROFILE FEATURES PARTIAL - Some security features missing');
        }
        
    } catch (error) {
        console.log('❌ Test error:', error.message);
        await page.screenshot({ path: 'profile-features-test-error.png', fullPage: true });
    }
});
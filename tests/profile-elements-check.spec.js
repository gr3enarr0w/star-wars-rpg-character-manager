// Check Profile Elements Properly
const { test, expect } = require('@playwright/test');

test('Profile Elements Check', async ({ page }) => {
    console.log('\n🔍 PROFILE ELEMENTS CHECK\n');
    
    // Monitor console messages
    page.on('console', msg => {
        if (msg.text().includes('Profile page:')) {
            console.log('📄', msg.text());
        }
    });
    
    try {
        // Login
        await page.goto('http://localhost:8001/login');
        await page.fill('input[name="email"]', 'clark@clarkeverson.com');
        await page.fill('input[name="password"]', 'clark123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // Navigate to profile
        await page.goto('http://localhost:8001/profile');
        await page.waitForTimeout(3000);
        
        // Check profile elements properly
        const profileElements = await page.evaluate(() => {
            return {
                hasUsernameField: !!document.getElementById('username'),
                hasEmailField: !!document.getElementById('email'),
                hasManageButton: !!document.querySelector('button[onclick="manage2FA()"]'),
                hasProfileScript: document.documentElement.outerHTML.includes('currentUser = null'),
                hasAuthenticatedFetch: typeof window.authenticatedFetch === 'function',
                hasSetup2FA: typeof window.setup2FA === 'function',
                hasShow2FAModal: typeof window.show2FASetupModal === 'function',
                currentUserValue: window.currentUser,
                documentReady: document.readyState
            };
        });
        
        console.log('📍 Profile Elements:', JSON.stringify(profileElements, null, 2));
        
        // Wait for user data to load
        console.log('📍 Waiting for user data to load...');
        await page.waitForTimeout(5000);
        
        // Check again
        const afterWait = await page.evaluate(() => {
            return {
                currentUser: window.currentUser,
                userDataLoaded: !!window.currentUser
            };
        });
        
        console.log('📍 After Wait:', JSON.stringify(afterWait, null, 2));
        
        if (afterWait.userDataLoaded) {
            console.log('✅ User data loaded! Now testing 2FA button...');
            
            // Test the manage button
            const manageButton = await page.locator('button:has-text("Manage")');
            await manageButton.click();
            await page.waitForTimeout(3000);
            
            // Check for modal
            const modalCheck = await page.evaluate(() => {
                return {
                    modalExists: !!document.getElementById('twofa-setup-modal'),
                    modalCount: document.querySelectorAll('[id*="twofa"]').length,
                    bodyContainsModal: document.body.innerHTML.includes('twofa-setup-modal')
                };
            });
            
            console.log('📍 Modal Check:', JSON.stringify(modalCheck, null, 2));
            
            if (modalCheck.modalExists) {
                console.log('🎉 SUCCESS! 2FA modal is working!');
            } else {
                console.log('❌ 2FA modal not appearing - additional debug...');
                
                // Try direct function call
                const directCall = await page.evaluate(() => {
                    try {
                        if (window.currentUser && typeof window.setup2FA === 'function') {
                            window.setup2FA();
                            return { result: 'setup2FA called directly' };
                        } else {
                            return { 
                                error: 'Missing requirements',
                                hasCurrentUser: !!window.currentUser,
                                hasSetup2FA: typeof window.setup2FA === 'function'
                            };
                        }
                    } catch (error) {
                        return { error: error.message };
                    }
                });
                
                console.log('📍 Direct Call Result:', JSON.stringify(directCall, null, 2));
            }
        } else {
            console.log('❌ User data still not loaded after wait');
            
            // Manual load attempt
            const manualLoad = await page.evaluate(async () => {
                try {
                    const token = localStorage.getItem('access_token');
                    const response = await fetch('/api/auth/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const userData = await response.json();
                    window.currentUser = userData;
                    
                    // Try to populate fields
                    if (document.getElementById('username')) {
                        document.getElementById('username').value = userData.username;
                    }
                    if (document.getElementById('email')) {
                        document.getElementById('email').value = userData.email;
                    }
                    
                    return { success: true, userData };
                } catch (error) {
                    return { error: error.message };
                }
            });
            
            console.log('📍 Manual Load:', JSON.stringify(manualLoad, null, 2));
        }
        
    } catch (error) {
        console.log('❌ Test error:', error.message);
    }
});
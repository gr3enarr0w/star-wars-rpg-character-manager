#!/usr/bin/env python3
"""
Comprehensive End-to-End Testing Suite for Star Wars RPG Character Manager

This test suite covers all major user flows and admin functionality to identify
bugs and missing features systematically.

Test Coverage:
- Admin functionality (login, user management, invite codes, password resets)
- User registration (email/password, Discord, Google, invite codes)
- Authentication (login, MFA, password changes, passkeys)
- Campaign management (create, join, GM roles, user roles)
- Character management (create, edit, XP, campaign association)
- Permission and role-based access control
"""

import os
import sys
import time
import json
import asyncio
from datetime import datetime
from playwright.async_api import async_playwright, Page, Browser, BrowserContext
from typing import Dict, List, Any

# Test configuration
TEST_CONFIG = {
    'base_url': 'http://localhost:8080',  # Use port 8080 to avoid AirPlay conflict
    'admin_email': 'admin@swrpg.local',
    'admin_password': 'TestAdmin123!',
    'test_users': [
        {
            'email': 'player1@test.com',
            'username': 'player1',
            'password': 'TestPlayer123!',
            'role': 'player'
        },
        {
            'email': 'gm1@test.com', 
            'username': 'gm1',
            'password': 'TestGM123!',
            'role': 'gm'
        },
        {
            'email': 'user2@test.com',
            'username': 'user2', 
            'password': 'TestUser123!',
            'role': 'player'
        }
    ],
    'test_campaigns': [
        {
            'name': 'Test Campaign Alpha',
            'description': 'First test campaign for E2E testing',
            'system': 'Edge of the Empire'
        },
        {
            'name': 'Test Campaign Beta',
            'description': 'Second test campaign for role testing',
            'system': 'Age of Rebellion'
        }
    ],
    'test_characters': [
        {
            'name': 'Test Smuggler',
            'species': 'Human',
            'career': 'Smuggler',
            'specialization': 'Pilot'
        },
        {
            'name': 'Test Rebel',
            'species': 'Twi\'lek',
            'career': 'Ace',
            'specialization': 'Pilot'
        }
    ],
    'screenshot_dir': 'test_screenshots_e2e_comprehensive',
    'timeout': 30000,  # 30 seconds
    'headless': False  # Set to True for CI/CD
}

class E2ETestResults:
    """Track test results and generate bug reports"""
    
    def __init__(self):
        self.results = {
            'passed': [],
            'failed': [],
            'bugs_found': [],
            'missing_features': [],
            'timestamp': datetime.now().isoformat()
        }
    
    def add_test_result(self, test_name: str, status: str, details: str = None, screenshot: str = None):
        result = {
            'test': test_name,
            'status': status,
            'details': details,
            'screenshot': screenshot,
            'timestamp': datetime.now().isoformat()
        }
        
        if status == 'PASS':
            self.results['passed'].append(result)
        elif status == 'FAIL':
            self.results['failed'].append(result)
        elif status == 'BUG':
            self.results['bugs_found'].append(result)
        elif status == 'MISSING':
            self.results['missing_features'].append(result)
    
    def generate_bug_report(self):
        """Generate detailed bug report"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = f"BUG_REPORT_{timestamp}.md"
        
        with open(report_file, 'w') as f:
            f.write("# End-to-End Testing Bug Report\n\n")
            f.write(f"**Generated:** {self.results['timestamp']}\n")
            f.write(f"**Total Tests:** {len(self.results['passed']) + len(self.results['failed'])}\n")
            f.write(f"**Passed:** {len(self.results['passed'])}\n")
            f.write(f"**Failed:** {len(self.results['failed'])}\n")
            f.write(f"**Bugs Found:** {len(self.results['bugs_found'])}\n")
            f.write(f"**Missing Features:** {len(self.results['missing_features'])}\n\n")
            
            if self.results['bugs_found']:
                f.write("## 🐛 Bugs Found\n\n")
                for i, bug in enumerate(self.results['bugs_found'], 1):
                    f.write(f"### Bug #{i}: {bug['test']}\n")
                    f.write(f"**Details:** {bug['details']}\n")
                    if bug['screenshot']:
                        f.write(f"**Screenshot:** {bug['screenshot']}\n")
                    f.write(f"**Timestamp:** {bug['timestamp']}\n\n")
            
            if self.results['missing_features']:
                f.write("## ❌ Missing Features\n\n")
                for i, missing in enumerate(self.results['missing_features'], 1):
                    f.write(f"### Missing #{i}: {missing['test']}\n")
                    f.write(f"**Details:** {missing['details']}\n")
                    f.write(f"**Timestamp:** {missing['timestamp']}\n\n")
            
            if self.results['failed']:
                f.write("## ❌ Failed Tests\n\n")
                for i, failed in enumerate(self.results['failed'], 1):
                    f.write(f"### Failed #{i}: {failed['test']}\n")
                    f.write(f"**Details:** {failed['details']}\n")
                    if failed['screenshot']:
                        f.write(f"**Screenshot:** {failed['screenshot']}\n")
                    f.write(f"**Timestamp:** {failed['timestamp']}\n\n")
        
        return report_file

class E2ETestSuite:
    """Comprehensive End-to-End Test Suite"""
    
    def __init__(self):
        self.results = E2ETestResults()
        self.browser = None
        self.context = None
        self.page = None
        
        # Create screenshot directory
        os.makedirs(TEST_CONFIG['screenshot_dir'], exist_ok=True)
    
    async def setup(self):
        """Setup browser and initial page"""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(headless=TEST_CONFIG['headless'])
        self.context = await self.browser.new_context()
        self.page = await self.context.new_page()
        
        # Set default timeout
        self.page.set_default_timeout(TEST_CONFIG['timeout'])
    
    async def teardown(self):
        """Cleanup browser resources"""
        if self.browser:
            await self.browser.close()
    
    async def screenshot(self, name: str) -> str:
        """Take screenshot with timestamp"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{TEST_CONFIG['screenshot_dir']}/{name}_{timestamp}.png"
        await self.page.screenshot(path=filename)
        return filename
    
    async def navigate_to_app(self):
        """Navigate to the application"""
        try:
            print(f"📡 Attempting to connect to {TEST_CONFIG['base_url']}")
            await self.page.goto(TEST_CONFIG['base_url'], wait_until='networkidle', timeout=60000)
            
            # Check if page loaded
            title = await self.page.title()
            print(f"📄 Page title: {title}")
            
            screenshot = await self.screenshot("01_app_loaded")
            self.results.add_test_result("App Navigation", "PASS", f"Application loaded successfully - Title: {title}", screenshot)
            return True
        except Exception as e:
            print(f"❌ Navigation error: {str(e)}")
            screenshot = await self.screenshot("01_app_load_failed")
            self.results.add_test_result("App Navigation", "FAIL", f"Failed to load app: {str(e)}", screenshot)
            return False
    
    # =======================
    # ADMIN FUNCTIONALITY TESTS
    # =======================
    
    async def test_admin_login(self):
        """Test admin login functionality"""
        try:
            # Look for login form or button
            login_button = self.page.locator("text=Login").first
            if await login_button.is_visible():
                await login_button.click()
            
            # Fill admin credentials
            email_field = self.page.locator("input[type='email'], input[name='email'], input[placeholder*='email']").first
            password_field = self.page.locator("input[type='password'], input[name='password']").first
            
            if not await email_field.is_visible() or not await password_field.is_visible():
                screenshot = await self.screenshot("admin_login_form_missing")
                self.results.add_test_result("Admin Login Form", "MISSING", "Login form not found or not visible", screenshot)
                return False
            
            await email_field.fill(TEST_CONFIG['admin_email'])
            await password_field.fill(TEST_CONFIG['admin_password'])
            
            # Submit login
            submit_button = self.page.locator("button[type='submit'], input[type='submit'], button:has-text('Login')").first
            await submit_button.click()
            
            # Wait for login to complete
            await self.page.wait_for_timeout(3000)
            
            # Check if logged in (look for admin-specific elements)
            if await self.page.locator("text=Admin").first.is_visible() or await self.page.locator("text=Dashboard").first.is_visible():
                screenshot = await self.screenshot("admin_login_success")
                self.results.add_test_result("Admin Login", "PASS", "Admin login successful", screenshot)
                return True
            else:
                screenshot = await self.screenshot("admin_login_failed")
                self.results.add_test_result("Admin Login", "BUG", "Admin login failed - no admin interface visible", screenshot)
                return False
                
        except Exception as e:
            screenshot = await self.screenshot("admin_login_error")
            self.results.add_test_result("Admin Login", "FAIL", f"Admin login failed with error: {str(e)}", screenshot)
            return False
    
    async def test_admin_invite_codes(self):
        """Test admin ability to generate and manage invite codes"""
        try:
            # Look for admin panel or invite code management
            admin_nav = self.page.locator("text=Admin").first
            if await admin_nav.is_visible():
                await admin_nav.click()
            
            # Look for invite code section
            invite_section = self.page.locator("text=Invite").first
            if not await invite_section.is_visible():
                screenshot = await self.screenshot("admin_invite_missing")
                self.results.add_test_result("Admin Invite Codes", "MISSING", "Invite code management not found in admin panel", screenshot)
                return False
            
            await invite_section.click()
            await self.page.wait_for_timeout(2000)
            
            # Try to generate invite code
            generate_button = self.page.locator("button:has-text('Generate'), button:has-text('Create')").first
            if await generate_button.is_visible():
                await generate_button.click()
                await self.page.wait_for_timeout(2000)
                
                screenshot = await self.screenshot("admin_invite_generated")
                self.results.add_test_result("Admin Invite Codes", "PASS", "Admin can generate invite codes", screenshot)
                return True
            else:
                screenshot = await self.screenshot("admin_invite_no_generate")
                self.results.add_test_result("Admin Invite Codes", "BUG", "No generate invite code button found", screenshot)
                return False
                
        except Exception as e:
            screenshot = await self.screenshot("admin_invite_error")
            self.results.add_test_result("Admin Invite Codes", "FAIL", f"Admin invite code test failed: {str(e)}", screenshot)
            return False
    
    async def test_admin_password_reset(self):
        """Test admin ability to reset user passwords"""
        try:
            # Navigate to user management
            users_nav = self.page.locator("text=Users").first
            if not await users_nav.is_visible():
                screenshot = await self.screenshot("admin_users_missing")
                self.results.add_test_result("Admin Password Reset", "MISSING", "User management not found in admin panel", screenshot)
                return False
            
            await users_nav.click()
            await self.page.wait_for_timeout(2000)
            
            # Look for password reset functionality
            reset_button = self.page.locator("button:has-text('Reset'), text=Reset").first
            if await reset_button.is_visible():
                screenshot = await self.screenshot("admin_password_reset_found")
                self.results.add_test_result("Admin Password Reset", "PASS", "Admin password reset functionality found", screenshot)
                return True
            else:
                screenshot = await self.screenshot("admin_password_reset_missing")
                self.results.add_test_result("Admin Password Reset", "MISSING", "Admin password reset functionality not found", screenshot)
                return False
                
        except Exception as e:
            screenshot = await self.screenshot("admin_password_reset_error")
            self.results.add_test_result("Admin Password Reset", "FAIL", f"Admin password reset test failed: {str(e)}", screenshot)
            return False
    
    # =======================
    # USER REGISTRATION TESTS
    # =======================
    
    async def test_user_registration_email(self):
        """Test user registration with email/username/password"""
        try:
            # Navigate to registration
            await self.page.goto(TEST_CONFIG['base_url'])
            
            register_link = self.page.locator("text=Register, text=Sign Up").first
            if not await register_link.is_visible():
                screenshot = await self.screenshot("registration_link_missing")
                self.results.add_test_result("User Registration Link", "MISSING", "Registration link not found", screenshot)
                return False
            
            await register_link.click()
            await self.page.wait_for_timeout(2000)
            
            # Fill registration form
            email_field = self.page.locator("input[type='email'], input[name='email']").first
            username_field = self.page.locator("input[name='username'], input[placeholder*='username']").first
            password_field = self.page.locator("input[type='password'], input[name='password']").first
            
            if not all([await field.is_visible() for field in [email_field, username_field, password_field]]):
                screenshot = await self.screenshot("registration_form_incomplete")
                self.results.add_test_result("User Registration Form", "BUG", "Registration form missing required fields", screenshot)
                return False
            
            test_user = TEST_CONFIG['test_users'][0]
            await email_field.fill(test_user['email'])
            await username_field.fill(test_user['username'])
            await password_field.fill(test_user['password'])
            
            # Submit registration
            submit_button = self.page.locator("button[type='submit'], button:has-text('Register')").first
            await submit_button.click()
            
            await self.page.wait_for_timeout(3000)
            
            # Check for successful registration
            if "welcome" in await self.page.content().lower() or "success" in await self.page.content().lower():
                screenshot = await self.screenshot("user_registration_success")
                self.results.add_test_result("User Registration Email", "PASS", "User registration with email successful", screenshot)
                return True
            else:
                screenshot = await self.screenshot("user_registration_failed")
                self.results.add_test_result("User Registration Email", "BUG", "User registration failed or no success confirmation", screenshot)
                return False
                
        except Exception as e:
            screenshot = await self.screenshot("user_registration_error")
            self.results.add_test_result("User Registration Email", "FAIL", f"User registration test failed: {str(e)}", screenshot)
            return False
    
    async def test_social_login_google(self):
        """Test Google OAuth login"""
        try:
            # Look for Google login button
            google_button = self.page.locator("text=Google, button:has-text('Google')").first
            if not await google_button.is_visible():
                screenshot = await self.screenshot("google_login_missing")
                self.results.add_test_result("Google OAuth Login", "MISSING", "Google login button not found", screenshot)
                return False
            
            screenshot = await self.screenshot("google_login_found")
            self.results.add_test_result("Google OAuth Login", "PASS", "Google login button found (full OAuth test requires live credentials)", screenshot)
            return True
            
        except Exception as e:
            screenshot = await self.screenshot("google_login_error")
            self.results.add_test_result("Google OAuth Login", "FAIL", f"Google login test failed: {str(e)}", screenshot)
            return False
    
    async def test_social_login_discord(self):
        """Test Discord OAuth login"""
        try:
            # Look for Discord login button
            discord_button = self.page.locator("text=Discord, button:has-text('Discord')").first
            if not await discord_button.is_visible():
                screenshot = await self.screenshot("discord_login_missing")
                self.results.add_test_result("Discord OAuth Login", "MISSING", "Discord login button not found", screenshot)
                return False
            
            screenshot = await self.screenshot("discord_login_found")
            self.results.add_test_result("Discord OAuth Login", "PASS", "Discord login button found (full OAuth test requires live credentials)", screenshot)
            return True
            
        except Exception as e:
            screenshot = await self.screenshot("discord_login_error")
            self.results.add_test_result("Discord OAuth Login", "FAIL", f"Discord login test failed: {str(e)}", screenshot)
            return False
    
    # =======================
    # CAMPAIGN MANAGEMENT TESTS
    # =======================
    
    async def test_campaign_creation(self):
        """Test user ability to create campaigns and become GM"""
        try:
            # Look for campaign creation
            create_campaign_button = self.page.locator("text=Create Campaign, button:has-text('Create')").first
            if not await create_campaign_button.is_visible():
                screenshot = await self.screenshot("create_campaign_missing")
                self.results.add_test_result("Campaign Creation", "MISSING", "Create campaign button not found", screenshot)
                return False
            
            await create_campaign_button.click()
            await self.page.wait_for_timeout(2000)
            
            # Fill campaign form
            name_field = self.page.locator("input[name='name'], input[placeholder*='name']").first
            description_field = self.page.locator("textarea[name='description'], input[name='description']").first
            
            if not await name_field.is_visible():
                screenshot = await self.screenshot("campaign_form_missing")
                self.results.add_test_result("Campaign Creation Form", "BUG", "Campaign creation form missing required fields", screenshot)
                return False
            
            test_campaign = TEST_CONFIG['test_campaigns'][0]
            await name_field.fill(test_campaign['name'])
            
            if await description_field.is_visible():
                await description_field.fill(test_campaign['description'])
            
            # Submit campaign creation
            submit_button = self.page.locator("button[type='submit'], button:has-text('Create')").first
            await submit_button.click()
            
            await self.page.wait_for_timeout(3000)
            
            # Check if campaign was created
            if test_campaign['name'] in await self.page.content():
                screenshot = await self.screenshot("campaign_created")
                self.results.add_test_result("Campaign Creation", "PASS", "Campaign creation successful", screenshot)
                return True
            else:
                screenshot = await self.screenshot("campaign_creation_failed")
                self.results.add_test_result("Campaign Creation", "BUG", "Campaign creation failed or not visible", screenshot)
                return False
                
        except Exception as e:
            screenshot = await self.screenshot("campaign_creation_error")
            self.results.add_test_result("Campaign Creation", "FAIL", f"Campaign creation test failed: {str(e)}", screenshot)
            return False
    
    # =======================
    # CHARACTER MANAGEMENT TESTS  
    # =======================
    
    async def test_character_creation(self):
        """Test character creation functionality"""
        try:
            # Look for character creation
            create_character_button = self.page.locator("text=Create Character, button:has-text('Create')").first
            if not await create_character_button.is_visible():
                screenshot = await self.screenshot("create_character_missing")
                self.results.add_test_result("Character Creation Button", "BUG", "Create character button not found - this is the critical bug from Issue #1", screenshot)
                return False
            
            await create_character_button.click()
            await self.page.wait_for_timeout(3000)
            
            # Check if character creation form loaded
            char_name_field = self.page.locator("input[name='name'], input[placeholder*='name']").first
            if not await char_name_field.is_visible():
                screenshot = await self.screenshot("character_form_missing")
                self.results.add_test_result("Character Creation Form", "BUG", "Character creation form not loading after button click", screenshot)
                return False
            
            # Fill character form
            test_character = TEST_CONFIG['test_characters'][0]
            await char_name_field.fill(test_character['name'])
            
            # Try to select species and career
            species_select = self.page.locator("select[name='species'], input[name='species']").first
            if await species_select.is_visible():
                if await species_select.get_attribute("tagName") == "SELECT":
                    await species_select.select_option(test_character['species'])
                else:
                    await species_select.fill(test_character['species'])
            
            # Submit character creation
            submit_button = self.page.locator("button[type='submit'], button:has-text('Create')").first
            await submit_button.click()
            
            await self.page.wait_for_timeout(3000)
            
            # Check if character was created
            if test_character['name'] in await self.page.content():
                screenshot = await self.screenshot("character_created")
                self.results.add_test_result("Character Creation", "PASS", "Character creation successful", screenshot)
                return True
            else:
                screenshot = await self.screenshot("character_creation_failed")
                self.results.add_test_result("Character Creation", "BUG", "Character creation failed or character not visible after creation", screenshot)
                return False
                
        except Exception as e:
            screenshot = await self.screenshot("character_creation_error")
            self.results.add_test_result("Character Creation", "FAIL", f"Character creation test failed: {str(e)}", screenshot)
            return False
    
    async def test_character_list_empty_state(self):
        """Test empty state when no characters exist"""
        try:
            # Navigate to characters section
            characters_nav = self.page.locator("text=Characters").first
            if await characters_nav.is_visible():
                await characters_nav.click()
                await self.page.wait_for_timeout(2000)
            
            # Check for empty state messaging
            empty_message = self.page.locator("text=create your first, text=no characters, text=Time to create").first
            if await empty_message.is_visible():
                screenshot = await self.screenshot("character_empty_state_good")
                self.results.add_test_result("Character Empty State", "PASS", "Good empty state messaging found", screenshot)
                return True
            else:
                screenshot = await self.screenshot("character_empty_state_missing")
                self.results.add_test_result("Character Empty State", "BUG", "Missing empty state when no characters exist - should show 'Time to create first character'", screenshot)
                return False
                
        except Exception as e:
            screenshot = await self.screenshot("character_empty_state_error")
            self.results.add_test_result("Character Empty State", "FAIL", f"Character empty state test failed: {str(e)}", screenshot)
            return False
    
    async def test_all_characters_view(self):
        """Test All Characters view functionality"""
        try:
            # Look for All Characters navigation
            all_chars_nav = self.page.locator("text=All Characters").first
            if not await all_chars_nav.is_visible():
                screenshot = await self.screenshot("all_characters_nav_missing")
                self.results.add_test_result("All Characters Navigation", "MISSING", "All Characters navigation not found", screenshot)
                return False
            
            await all_chars_nav.click()
            await self.page.wait_for_timeout(2000)
            
            # Check if content loads (should show characters or empty state)
            content_area = self.page.locator("main, .content, .characters-list").first
            if await content_area.is_visible():
                content_text = await content_area.inner_text()
                if content_text.strip() and "loading" not in content_text.lower():
                    screenshot = await self.screenshot("all_characters_loaded")
                    self.results.add_test_result("All Characters View", "PASS", "All Characters view loaded with content", screenshot)
                    return True
                else:
                    screenshot = await self.screenshot("all_characters_empty_content")
                    self.results.add_test_result("All Characters View", "BUG", "All Characters view shows empty content - bug from Issue #18", screenshot)
                    return False
            else:
                screenshot = await self.screenshot("all_characters_no_content")
                self.results.add_test_result("All Characters View", "BUG", "All Characters view has no content area", screenshot)
                return False
                
        except Exception as e:
            screenshot = await self.screenshot("all_characters_error")
            self.results.add_test_result("All Characters View", "FAIL", f"All Characters view test failed: {str(e)}", screenshot)
            return False
    
    # =======================
    # AUTHENTICATION TESTS
    # =======================
    
    async def test_mfa_setup(self):
        """Test MFA setup functionality"""
        try:
            # Look for MFA or security settings
            settings_nav = self.page.locator("text=Settings").first
            if await settings_nav.is_visible():
                await settings_nav.click()
                await self.page.wait_for_timeout(2000)
            
            mfa_section = self.page.locator("text=MFA, text=Two-Factor, text=2FA").first
            if not await mfa_section.is_visible():
                screenshot = await self.screenshot("mfa_settings_missing")
                self.results.add_test_result("MFA Setup", "MISSING", "MFA settings not found", screenshot)
                return False
            
            await mfa_section.click()
            await self.page.wait_for_timeout(2000)
            
            # Check if MFA setup is available
            enable_mfa_button = self.page.locator("button:has-text('Enable'), text=Enable").first
            if await enable_mfa_button.is_visible():
                screenshot = await self.screenshot("mfa_setup_found")
                self.results.add_test_result("MFA Setup", "PASS", "MFA setup functionality found", screenshot)
                return True
            else:
                screenshot = await self.screenshot("mfa_setup_incomplete")
                self.results.add_test_result("MFA Setup", "BUG", "MFA settings found but setup functionality missing", screenshot)
                return False
                
        except Exception as e:
            screenshot = await self.screenshot("mfa_setup_error")
            self.results.add_test_result("MFA Setup", "FAIL", f"MFA setup test failed: {str(e)}", screenshot)
            return False
    
    async def test_password_change(self):
        """Test user password change functionality"""
        try:
            # Navigate to security settings
            settings_nav = self.page.locator("text=Settings").first
            if await settings_nav.is_visible():
                await settings_nav.click()
                await self.page.wait_for_timeout(2000)
            
            # Look for password change section
            password_section = self.page.locator("text=Password, text=Change Password").first
            if not await password_section.is_visible():
                screenshot = await self.screenshot("password_change_missing")
                self.results.add_test_result("Password Change", "MISSING", "Password change functionality not found", screenshot)
                return False
            
            await password_section.click()
            await self.page.wait_for_timeout(2000)
            
            # Check for password change form
            current_password_field = self.page.locator("input[name='current_password'], input[placeholder*='current']").first
            new_password_field = self.page.locator("input[name='new_password'], input[placeholder*='new']").first
            
            if await current_password_field.is_visible() and await new_password_field.is_visible():
                screenshot = await self.screenshot("password_change_form")
                self.results.add_test_result("Password Change", "PASS", "Password change form found", screenshot)
                return True
            else:
                screenshot = await self.screenshot("password_change_form_incomplete")
                self.results.add_test_result("Password Change", "BUG", "Password change form incomplete or missing fields", screenshot)
                return False
                
        except Exception as e:
            screenshot = await self.screenshot("password_change_error")
            self.results.add_test_result("Password Change", "FAIL", f"Password change test failed: {str(e)}", screenshot)
            return False
    
    # =======================
    # UI/UX AND THEME TESTS
    # =======================
    
    async def test_homepage_theme(self):
        """Test homepage color theme consistency"""
        try:
            await self.page.goto(TEST_CONFIG['base_url'])
            await self.page.wait_for_timeout(2000)
            
            # Check background color
            body_style = await self.page.evaluate("window.getComputedStyle(document.body).backgroundColor")
            
            if "255, 255, 0" in body_style or "yellow" in body_style.lower():
                screenshot = await self.screenshot("homepage_theme_inconsistent")
                self.results.add_test_result("Homepage Theme", "BUG", "Homepage shows black/yellow colors instead of Star Wars theme - bug from Issue #12", screenshot)
                return False
            else:
                screenshot = await self.screenshot("homepage_theme_consistent")
                self.results.add_test_result("Homepage Theme", "PASS", "Homepage theme appears consistent", screenshot)
                return True
                
        except Exception as e:
            screenshot = await self.screenshot("homepage_theme_error")
            self.results.add_test_result("Homepage Theme", "FAIL", f"Homepage theme test failed: {str(e)}", screenshot)
            return False
    
    async def test_loading_states(self):
        """Test for persistent loading states"""
        try:
            await self.page.goto(TEST_CONFIG['base_url'])
            await self.page.wait_for_timeout(5000)  # Wait longer to catch persistent loading
            
            # Check for stuck loading indicators
            loading_text = self.page.locator("text=Loading...").first
            if await loading_text.is_visible():
                screenshot = await self.screenshot("persistent_loading_found")
                self.results.add_test_result("Loading States", "BUG", "Persistent 'Loading...' state found - bug from Issue #14", screenshot)
                return False
            else:
                screenshot = await self.screenshot("loading_states_good")
                self.results.add_test_result("Loading States", "PASS", "No persistent loading states found", screenshot)
                return True
                
        except Exception as e:
            screenshot = await self.screenshot("loading_states_error")
            self.results.add_test_result("Loading States", "FAIL", f"Loading states test failed: {str(e)}", screenshot)
            return False
    
    # =======================
    # MAIN TEST RUNNER
    # =======================
    
    async def run_all_tests(self):
        """Run the complete test suite"""
        print("🚀 Starting comprehensive E2E test suite...")
        
        # Setup
        await self.setup()
        
        # Navigate to app
        if not await self.navigate_to_app():
            print("❌ Failed to load application - this is a critical deployment bug!")
            
            # Generate report even for setup failures
            bug_report = self.results.generate_bug_report()
            self.print_summary(bug_report)
            await self.teardown()
            return
        
        # Admin Tests
        print("\n🔑 Testing Admin Functionality...")
        await self.test_admin_login()
        await self.test_admin_invite_codes()
        await self.test_admin_password_reset()
        
        # User Registration Tests
        print("\n👤 Testing User Registration...")
        await self.test_user_registration_email()
        await self.test_social_login_google()
        await self.test_social_login_discord()
        
        # Authentication Tests
        print("\n🔐 Testing Authentication Features...")
        await self.test_mfa_setup()
        await self.test_password_change()
        
        # Campaign Tests
        print("\n🎮 Testing Campaign Management...")
        await self.test_campaign_creation()
        
        # Character Tests
        print("\n⚔️  Testing Character Management...")
        await self.test_character_creation()
        await self.test_character_list_empty_state()
        await self.test_all_characters_view()
        
        # UI/UX Tests
        print("\n🎨 Testing UI/UX and Themes...")
        await self.test_homepage_theme()
        await self.test_loading_states()
        
        # Generate results
        print("\n📊 Generating test results...")
        bug_report = self.results.generate_bug_report()
        
        # Cleanup
        await self.teardown()
        
        # Print summary
        self.print_summary(bug_report)
    
    def print_summary(self, bug_report: str):
        """Print test summary"""
        results = self.results.results
        
        print("\n" + "="*60)
        print("🧪 COMPREHENSIVE E2E TEST RESULTS")
        print("="*60)
        print(f"📊 Total Tests: {len(results['passed']) + len(results['failed'])}")
        print(f"✅ Passed: {len(results['passed'])}")
        print(f"❌ Failed: {len(results['failed'])}")
        print(f"🐛 Bugs Found: {len(results['bugs_found'])}")
        print(f"❓ Missing Features: {len(results['missing_features'])}")
        print(f"📄 Bug Report: {bug_report}")
        
        if results['bugs_found']:
            print(f"\n🐛 CRITICAL BUGS FOUND:")
            for bug in results['bugs_found']:
                print(f"   • {bug['test']}: {bug['details']}")
        
        if results['missing_features']:
            print(f"\n❓ MISSING FEATURES:")
            for missing in results['missing_features']:
                print(f"   • {missing['test']}: {missing['details']}")

async def main():
    """Main test runner"""
    test_suite = E2ETestSuite()
    await test_suite.run_all_tests()

if __name__ == "__main__":
    # Check if playwright is installed
    try:
        import playwright
    except ImportError:
        print("❌ Playwright not installed. Install with: pip install playwright")
        print("   Then run: playwright install")
        sys.exit(1)
    
    # Run tests
    asyncio.run(main())
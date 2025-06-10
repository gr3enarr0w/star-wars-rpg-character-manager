"""
Comprehensive Playwright test suite for Star Wars RPG Character Manager web application.

This test suite covers:
1. Initial Load Test - Page loads, theming, authentication prompts
2. Authentication Flow - Login with admin credentials
3. Character Management Features - Creation, forms, settings
4. UI/UX Testing - Responsive design, buttons, modals
5. Error Handling - Invalid credentials, error states

Tests are run across multiple browsers (Chrome, Firefox, Safari if available).
"""

import asyncio
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
from playwright.async_api import async_playwright, Browser, BrowserContext, Page, Playwright

# Test configuration
TEST_URL = "http://127.0.0.1:5000"
ADMIN_EMAIL = "admin@swrpg.local"
ADMIN_PASSWORD = "AdminPassword123!@#$"
INVALID_EMAIL = "invalid@test.com"
INVALID_PASSWORD = "wrongpassword"

# Browser configurations to test
BROWSERS_TO_TEST = ["chromium", "firefox"]  # Safari requires special setup on macOS

class StarWarsRPGTester:
    """Main test class for Star Wars RPG Character Manager."""
    
    def __init__(self):
        self.playwright: Optional[Playwright] = None
        self.browsers: Dict[str, Browser] = {}
        self.contexts: Dict[str, BrowserContext] = {}
        self.pages: Dict[str, Page] = {}
        self.test_results: List[Dict] = []
        self.screenshots_dir = Path("test_screenshots")
        self.screenshots_dir.mkdir(exist_ok=True)

    async def setup(self):
        """Initialize Playwright and browsers."""
        print("🚀 Initializing Playwright and browsers...")
        self.playwright = await async_playwright().start()
        
        for browser_name in BROWSERS_TO_TEST:
            try:
                if browser_name == "chromium":
                    browser = await self.playwright.chromium.launch(headless=False, slow_mo=1000)
                elif browser_name == "firefox":
                    browser = await self.playwright.firefox.launch(headless=False, slow_mo=1000)
                elif browser_name == "webkit":  # Safari
                    browser = await self.playwright.webkit.launch(headless=False, slow_mo=1000)
                
                self.browsers[browser_name] = browser
                context = await browser.new_context(
                    viewport={"width": 1920, "height": 1080},
                    user_agent=f"Star Wars RPG Tester - {browser_name}"
                )
                self.contexts[browser_name] = context
                page = await context.new_page()
                self.pages[browser_name] = page
                
                print(f"✅ {browser_name.capitalize()} browser initialized")
                
            except Exception as e:
                print(f"❌ Failed to initialize {browser_name}: {e}")
                self.test_results.append({
                    "test": f"{browser_name}_initialization",
                    "status": "FAILED",
                    "error": str(e),
                    "browser": browser_name
                })

    async def cleanup(self):
        """Clean up browsers and Playwright."""
        print("🧹 Cleaning up browsers...")
        for browser_name, browser in self.browsers.items():
            try:
                await browser.close()
                print(f"✅ {browser_name.capitalize()} browser closed")
            except Exception as e:
                print(f"❌ Error closing {browser_name}: {e}")
        
        if self.playwright:
            await self.playwright.stop()

    async def take_screenshot(self, browser_name: str, test_name: str, description: str = ""):
        """Take a screenshot for documentation."""
        try:
            page = self.pages.get(browser_name)
            if page:
                filename = f"{browser_name}_{test_name}_{description}.png".replace(" ", "_")
                filepath = self.screenshots_dir / filename
                await page.screenshot(path=str(filepath), full_page=True)
                print(f"📸 Screenshot saved: {filepath}")
                return str(filepath)
        except Exception as e:
            print(f"❌ Failed to take screenshot: {e}")
        return None

    async def test_initial_load(self, browser_name: str):
        """Test 1: Initial Load Test."""
        print(f"\n🧪 Testing initial load on {browser_name}...")
        page = self.pages[browser_name]
        test_result = {
            "test": "initial_load",
            "browser": browser_name,
            "status": "PENDING",
            "details": {}
        }
        
        try:
            # Navigate to the application
            response = await page.goto(TEST_URL, wait_until="networkidle")
            test_result["details"]["response_status"] = response.status if response else "No response"
            
            # Check if page loads without errors
            if response and response.status == 200:
                test_result["details"]["page_load"] = "SUCCESS"
                print(f"✅ Page loaded successfully on {browser_name}")
            else:
                test_result["details"]["page_load"] = f"FAILED - Status: {response.status if response else 'None'}"
                print(f"❌ Page failed to load on {browser_name}")
            
            # Check page title
            title = await page.title()
            test_result["details"]["title"] = title
            if "Star Wars RPG" in title:
                test_result["details"]["title_check"] = "SUCCESS"
                print(f"✅ Correct title found: {title}")
            else:
                test_result["details"]["title_check"] = f"FAILED - Got: {title}"
                print(f"❌ Incorrect title: {title}")
            
            # Check Star Wars theming (dark background, gold accents)
            body_styles = await page.evaluate("""
                () => {
                    const body = document.body;
                    const computedStyle = window.getComputedStyle(body);
                    return {
                        backgroundColor: computedStyle.backgroundColor,
                        background: computedStyle.background,
                        color: computedStyle.color
                    };
                }
            """)
            test_result["details"]["theming"] = body_styles
            
            # Look for Star Wars themed elements
            star_wars_elements = await page.evaluate("""
                () => {
                    const elements = [];
                    // Check for gold/yellow colors (#ffd700, gold, etc.)
                    const allElements = document.querySelectorAll('*');
                    let goldElements = 0;
                    let darkElements = 0;
                    
                    for (let el of allElements) {
                        const style = window.getComputedStyle(el);
                        if (style.color.includes('rgb(255, 215, 0)') || 
                            style.color.includes('#ffd700') || 
                            style.color.toLowerCase().includes('gold')) {
                            goldElements++;
                        }
                        if (style.backgroundColor.includes('rgb(0, 0, 0)') || 
                            style.backgroundColor.includes('#000') ||
                            style.background.includes('rgb(0, 0, 0)')) {
                            darkElements++;
                        }
                    }
                    
                    return {
                        goldElements,
                        darkElements,
                        hasStarWarsTitle: document.title.includes('Star Wars'),
                        hasAuthElements: !!document.querySelector('[data-testid="login"], .login, #login')
                    };
                }
            """)
            test_result["details"]["star_wars_theming"] = star_wars_elements
            
            # Check for login prompt for unauthenticated users
            login_elements = await page.query_selector_all("input[type='email'], input[type='password'], .login-form, [data-testid='login']")
            test_result["details"]["login_prompt"] = len(login_elements) > 0
            
            if len(login_elements) > 0:
                print(f"✅ Login elements found on {browser_name}")
                test_result["details"]["login_elements_count"] = len(login_elements)
            else:
                print(f"❌ No login elements found on {browser_name}")
                # Check if already authenticated
                authenticated_elements = await page.query_selector_all(".user-menu, [data-testid='user-menu'], .logout")
                if len(authenticated_elements) > 0:
                    test_result["details"]["already_authenticated"] = True
                    print(f"ℹ️ User appears to already be authenticated on {browser_name}")
            
            # Take screenshot
            await self.take_screenshot(browser_name, "initial_load", "main_page")
            
            test_result["status"] = "SUCCESS"
            
        except Exception as e:
            test_result["status"] = "FAILED"
            test_result["error"] = str(e)
            print(f"❌ Initial load test failed on {browser_name}: {e}")
        
        self.test_results.append(test_result)
        return test_result

    async def test_authentication_flow(self, browser_name: str):
        """Test 2: Authentication Flow."""
        print(f"\n🔐 Testing authentication flow on {browser_name}...")
        page = self.pages[browser_name]
        test_result = {
            "test": "authentication_flow",
            "browser": browser_name,
            "status": "PENDING",
            "details": {}
        }
        
        try:
            # Look for login form elements
            email_input = await page.query_selector("input[type='email'], input[name='email'], #email")
            password_input = await page.query_selector("input[type='password'], input[name='password'], #password")
            login_button = await page.query_selector("button[type='submit'], input[type='submit'], .login-btn, [data-testid='login-submit']")
            
            if not email_input or not password_input:
                # Try to find login page or login modal
                login_links = await page.query_selector_all("a[href*='login'], .login-link, [data-testid='login-link']")
                if login_links:
                    await login_links[0].click()
                    await page.wait_for_timeout(2000)
                    email_input = await page.query_selector("input[type='email'], input[name='email'], #email")
                    password_input = await page.query_selector("input[type='password'], input[name='password'], #password")
                    login_button = await page.query_selector("button[type='submit'], input[type='submit'], .login-btn")
            
            if email_input and password_input and login_button:
                test_result["details"]["login_form_found"] = True
                print(f"✅ Login form found on {browser_name}")
                
                # Fill in credentials
                await email_input.fill(ADMIN_EMAIL)
                await password_input.fill(ADMIN_PASSWORD)
                test_result["details"]["credentials_entered"] = True
                
                # Take screenshot before login
                await self.take_screenshot(browser_name, "auth_flow", "before_login")
                
                # Submit login
                await login_button.click()
                
                # Wait for navigation or response
                try:
                    await page.wait_for_load_state("networkidle", timeout=10000)
                    await page.wait_for_timeout(3000)  # Additional wait for any dynamic content
                except:
                    print(f"⚠️ Navigation wait timed out on {browser_name}")
                
                # Check for successful login indicators
                current_url = page.url
                test_result["details"]["post_login_url"] = current_url
                
                # Look for authenticated user indicators
                user_menu = await page.query_selector(".user-menu, [data-testid='user-menu'], .user-info")
                logout_button = await page.query_selector(".logout, [data-testid='logout'], a[href*='logout']")
                dashboard_elements = await page.query_selector_all(".dashboard, [data-testid='dashboard'], .character-dashboard")
                
                authenticated_indicators = bool(user_menu) + bool(logout_button) + len(dashboard_elements)
                test_result["details"]["authenticated_indicators"] = authenticated_indicators
                
                if authenticated_indicators > 0:
                    test_result["details"]["login_success"] = True
                    print(f"✅ Login successful on {browser_name}")
                    
                    # Check for user menu in top right
                    if user_menu:
                        user_menu_rect = await user_menu.bounding_box()
                        if user_menu_rect:
                            viewport_width = (await page.evaluate("window.innerWidth"))
                            if user_menu_rect["x"] > viewport_width * 0.7:  # Right side of screen
                                test_result["details"]["user_menu_position"] = "top_right"
                                print(f"✅ User menu found in top right on {browser_name}")
                            else:
                                test_result["details"]["user_menu_position"] = "other"
                else:
                    test_result["details"]["login_success"] = False
                    # Check for error messages
                    error_elements = await page.query_selector_all(".error, .alert-danger, [data-testid='error']")
                    if error_elements:
                        error_text = await error_elements[0].text_content()
                        test_result["details"]["error_message"] = error_text
                        print(f"❌ Login failed with error on {browser_name}: {error_text}")
                    else:
                        print(f"❌ Login failed on {browser_name} - no error message visible")
                
                # Take screenshot after login attempt
                await self.take_screenshot(browser_name, "auth_flow", "after_login")
                
            else:
                test_result["details"]["login_form_found"] = False
                print(f"❌ Login form not found on {browser_name}")
                # Take screenshot to see what's on the page
                await self.take_screenshot(browser_name, "auth_flow", "no_login_form")
            
            test_result["status"] = "SUCCESS"
            
        except Exception as e:
            test_result["status"] = "FAILED"
            test_result["error"] = str(e)
            print(f"❌ Authentication test failed on {browser_name}: {e}")
        
        self.test_results.append(test_result)
        return test_result

    async def test_character_management(self, browser_name: str):
        """Test 3: Character Management Features."""
        print(f"\n⚔️ Testing character management on {browser_name}...")
        page = self.pages[browser_name]
        test_result = {
            "test": "character_management",
            "browser": browser_name,
            "status": "PENDING",
            "details": {}
        }
        
        try:
            # Look for "Create New Character" button
            create_buttons = await page.query_selector_all("button:has-text('Create'), .create-character, [data-testid='create-character'], button:has-text('New Character')")
            test_result["details"]["create_button_found"] = len(create_buttons) > 0
            
            if create_buttons:
                print(f"✅ Create character button found on {browser_name}")
                
                # Click the create button
                await create_buttons[0].click()
                await page.wait_for_timeout(2000)
                
                # Check if character creation form loads
                form_elements = await page.query_selector_all("form, .character-form, [data-testid='character-form']")
                input_elements = await page.query_selector_all("input, select, textarea")
                
                test_result["details"]["form_elements"] = len(form_elements)
                test_result["details"]["input_elements"] = len(input_elements)
                
                if len(form_elements) > 0 or len(input_elements) > 3:
                    test_result["details"]["character_form_loads"] = True
                    print(f"✅ Character creation form loaded on {browser_name}")
                    
                    # Take screenshot of the form
                    await self.take_screenshot(browser_name, "character_mgmt", "creation_form")
                else:
                    test_result["details"]["character_form_loads"] = False
                    print(f"❌ Character creation form did not load on {browser_name}")
            else:
                print(f"❌ Create character button not found on {browser_name}")
            
            # Test settings menu
            settings_buttons = await page.query_selector_all(".settings, [data-testid='settings'], button:has-text('Settings'), .user-menu")
            test_result["details"]["settings_button_found"] = len(settings_buttons) > 0
            
            if settings_buttons:
                print(f"✅ Settings button found on {browser_name}")
                
                try:
                    await settings_buttons[0].click()
                    await page.wait_for_timeout(2000)
                    
                    # Check for JSON authentication errors
                    page_content = await page.content()
                    if "JSON" in page_content and ("error" in page_content.lower() or "authentication" in page_content.lower()):
                        test_result["details"]["json_auth_error"] = True
                        print(f"❌ JSON authentication error detected on {browser_name}")
                    else:
                        test_result["details"]["json_auth_error"] = False
                        print(f"✅ No JSON authentication errors on {browser_name}")
                    
                    # Take screenshot of settings
                    await self.take_screenshot(browser_name, "character_mgmt", "settings_menu")
                    
                except Exception as e:
                    test_result["details"]["settings_error"] = str(e)
                    print(f"⚠️ Settings menu interaction failed on {browser_name}: {e}")
            
            # Test campaign selector
            campaign_elements = await page.query_selector_all(".campaign, [data-testid='campaign'], select[name*='campaign']")
            test_result["details"]["campaign_selector_found"] = len(campaign_elements) > 0
            
            if campaign_elements:
                print(f"✅ Campaign selector found on {browser_name}")
                try:
                    # Try to interact with campaign selector
                    if await campaign_elements[0].get_attribute("tagName") == "SELECT":
                        options = await campaign_elements[0].query_selector_all("option")
                        test_result["details"]["campaign_options"] = len(options)
                    
                    await self.take_screenshot(browser_name, "character_mgmt", "campaign_selector")
                except Exception as e:
                    test_result["details"]["campaign_interaction_error"] = str(e)
            
            test_result["status"] = "SUCCESS"
            
        except Exception as e:
            test_result["status"] = "FAILED"
            test_result["error"] = str(e)
            print(f"❌ Character management test failed on {browser_name}: {e}")
        
        self.test_results.append(test_result)
        return test_result

    async def test_ui_ux(self, browser_name: str):
        """Test 4: UI/UX Testing."""
        print(f"\n🎨 Testing UI/UX on {browser_name}...")
        page = self.pages[browser_name]
        test_result = {
            "test": "ui_ux",
            "browser": browser_name,
            "status": "PENDING",
            "details": {}
        }
        
        try:
            # Test responsive design - different screen sizes
            screen_sizes = [
                {"width": 1920, "height": 1080, "name": "desktop"},
                {"width": 768, "height": 1024, "name": "tablet"},
                {"width": 375, "height": 667, "name": "mobile"}
            ]
            
            responsive_results = {}
            
            for size in screen_sizes:
                await page.set_viewport_size({"width": size["width"], "height": size["height"]})
                await page.wait_for_timeout(1000)
                
                # Check if content is visible and properly arranged
                visible_elements = await page.evaluate("""
                    () => {
                        const elements = document.querySelectorAll('*');
                        let visibleCount = 0;
                        let hiddenCount = 0;
                        
                        for (let el of elements) {
                            const style = window.getComputedStyle(el);
                            if (style.display !== 'none' && style.visibility !== 'hidden') {
                                visibleCount++;
                            } else {
                                hiddenCount++;
                            }
                        }
                        
                        return { visibleCount, hiddenCount, viewport: { width: window.innerWidth, height: window.innerHeight } };
                    }
                """)
                
                responsive_results[size["name"]] = visible_elements
                await self.take_screenshot(browser_name, "ui_ux", f"responsive_{size['name']}")
            
            test_result["details"]["responsive_design"] = responsive_results
            
            # Reset to desktop size
            await page.set_viewport_size({"width": 1920, "height": 1080})
            
            # Test button functionality
            all_buttons = await page.query_selector_all("button, input[type='submit'], input[type='button'], .btn")
            test_result["details"]["total_buttons"] = len(all_buttons)
            
            clickable_buttons = 0
            for button in all_buttons[:10]:  # Test first 10 buttons to avoid overwhelming
                try:
                    if await button.is_enabled() and await button.is_visible():
                        clickable_buttons += 1
                except:
                    pass
            
            test_result["details"]["clickable_buttons"] = clickable_buttons
            print(f"✅ Found {clickable_buttons} clickable buttons out of {len(all_buttons)} total on {browser_name}")
            
            # Test modal dialogs
            modal_triggers = await page.query_selector_all("[data-toggle='modal'], .modal-trigger, button:has-text('Profile'), button:has-text('2FA')")
            test_result["details"]["modal_triggers"] = len(modal_triggers)
            
            if modal_triggers:
                try:
                    await modal_triggers[0].click()
                    await page.wait_for_timeout(2000)
                    
                    modals = await page.query_selector_all(".modal, [role='dialog'], .popup")
                    test_result["details"]["modals_opened"] = len(modals)
                    
                    if modals:
                        print(f"✅ Modal dialog opened successfully on {browser_name}")
                        await self.take_screenshot(browser_name, "ui_ux", "modal_dialog")
                        
                        # Try to close modal
                        close_buttons = await page.query_selector_all(".modal .close, [data-dismiss='modal'], .modal-close")
                        if close_buttons:
                            await close_buttons[0].click()
                            await page.wait_for_timeout(1000)
                    
                except Exception as e:
                    test_result["details"]["modal_error"] = str(e)
            
            # Verify Star Wars theming throughout
            theme_check = await page.evaluate("""
                () => {
                    const elements = document.querySelectorAll('*');
                    let starWarsThemeScore = 0;
                    
                    // Check for gold/yellow colors
                    const goldRegex = /(#ffd700|rgb\\(255,\\s*215,\\s*0\\)|gold)/i;
                    // Check for dark backgrounds
                    const darkRegex = /(#000|rgb\\(0,\\s*0,\\s*0\\)|black)/i;
                    
                    for (let el of elements) {
                        const style = window.getComputedStyle(el);
                        if (goldRegex.test(style.color) || goldRegex.test(style.borderColor)) {
                            starWarsThemeScore += 2;
                        }
                        if (darkRegex.test(style.backgroundColor) || darkRegex.test(style.background)) {
                            starWarsThemeScore += 1;
                        }
                    }
                    
                    return {
                        themeScore: starWarsThemeScore,
                        title: document.title,
                        hasStarWarsInTitle: document.title.toLowerCase().includes('star wars')
                    };
                }
            """)
            
            test_result["details"]["star_wars_theming_score"] = theme_check
            
            if theme_check["themeScore"] > 10:
                print(f"✅ Strong Star Wars theming detected on {browser_name} (Score: {theme_check['themeScore']})")
            else:
                print(f"⚠️ Weak Star Wars theming on {browser_name} (Score: {theme_check['themeScore']})")
            
            test_result["status"] = "SUCCESS"
            
        except Exception as e:
            test_result["status"] = "FAILED"
            test_result["error"] = str(e)
            print(f"❌ UI/UX test failed on {browser_name}: {e}")
        
        self.test_results.append(test_result)
        return test_result

    async def test_error_handling(self, browser_name: str):
        """Test 5: Error Handling."""
        print(f"\n🚨 Testing error handling on {browser_name}...")
        page = self.pages[browser_name]
        test_result = {
            "test": "error_handling",
            "browser": browser_name,
            "status": "PENDING",
            "details": {}
        }
        
        try:
            # Navigate to login page if not already there
            await page.goto(TEST_URL)
            await page.wait_for_timeout(2000)
            
            # Test invalid login credentials
            email_input = await page.query_selector("input[type='email'], input[name='email'], #email")
            password_input = await page.query_selector("input[type='password'], input[name='password'], #password")
            login_button = await page.query_selector("button[type='submit'], input[type='submit'], .login-btn")
            
            if email_input and password_input and login_button:
                # Clear any existing values
                await email_input.fill("")
                await password_input.fill("")
                
                # Enter invalid credentials
                await email_input.fill(INVALID_EMAIL)
                await password_input.fill(INVALID_PASSWORD)
                
                await self.take_screenshot(browser_name, "error_handling", "invalid_credentials")
                
                # Submit login
                await login_button.click()
                await page.wait_for_timeout(3000)
                
                # Check for error messages
                error_elements = await page.query_selector_all(".error, .alert-danger, .invalid, [data-testid='error']")
                error_messages = []
                
                for element in error_elements:
                    if await element.is_visible():
                        text = await element.text_content()
                        if text and text.strip():
                            error_messages.append(text.strip())
                
                test_result["details"]["invalid_login_errors"] = error_messages
                
                if error_messages:
                    test_result["details"]["error_feedback"] = True
                    print(f"✅ Error feedback provided on {browser_name}: {error_messages}")
                else:
                    test_result["details"]["error_feedback"] = False
                    print(f"❌ No error feedback on invalid login on {browser_name}")
                
                await self.take_screenshot(browser_name, "error_handling", "after_invalid_login")
            
            # Test for loading states that don't resolve
            loading_elements = await page.query_selector_all(".loading, .spinner, [data-loading='true']")
            test_result["details"]["loading_elements"] = len(loading_elements)
            
            if loading_elements:
                print(f"⚠️ Found {len(loading_elements)} loading elements on {browser_name}")
                
                # Wait to see if they resolve
                await page.wait_for_timeout(5000)
                
                still_loading = []
                for element in loading_elements:
                    if await element.is_visible():
                        still_loading.append(await element.get_attribute("class") or "unknown")
                
                test_result["details"]["persistent_loading"] = still_loading
                
                if still_loading:
                    print(f"❌ Found persistent loading states on {browser_name}: {still_loading}")
                else:
                    print(f"✅ No persistent loading states on {browser_name}")
            
            # Check console for JavaScript errors
            console_messages = []
            
            def handle_console(msg):
                if msg.type in ["error", "warning"]:
                    console_messages.append({
                        "type": msg.type,
                        "text": msg.text
                    })
            
            page.on("console", handle_console)
            
            # Trigger some interactions to generate potential console errors
            await page.reload()
            await page.wait_for_timeout(3000)
            
            # Try clicking around to trigger potential errors
            clickable_elements = await page.query_selector_all("button, a, .clickable")
            if clickable_elements:
                for element in clickable_elements[:3]:  # Test first 3 elements
                    try:
                        if await element.is_visible() and await element.is_enabled():
                            await element.click()
                            await page.wait_for_timeout(1000)
                    except:
                        pass
            
            test_result["details"]["console_messages"] = console_messages
            
            if console_messages:
                error_count = len([msg for msg in console_messages if msg["type"] == "error"])
                warning_count = len([msg for msg in console_messages if msg["type"] == "warning"])
                print(f"⚠️ Console messages on {browser_name}: {error_count} errors, {warning_count} warnings")
            else:
                print(f"✅ No console errors or warnings on {browser_name}")
            
            test_result["status"] = "SUCCESS"
            
        except Exception as e:
            test_result["status"] = "FAILED"
            test_result["error"] = str(e)
            print(f"❌ Error handling test failed on {browser_name}: {e}")
        
        self.test_results.append(test_result)
        return test_result

    async def run_all_tests(self):
        """Run all tests across all browsers."""
        print("🌟 Starting comprehensive Star Wars RPG Character Manager tests...\n")
        
        await self.setup()
        
        for browser_name in self.browsers.keys():
            print(f"\n{'='*60}")
            print(f"🌌 TESTING ON {browser_name.upper()}")
            print(f"{'='*60}")
            
            # Run all tests for this browser
            await self.test_initial_load(browser_name)
            await self.test_authentication_flow(browser_name)
            await self.test_character_management(browser_name)
            await self.test_ui_ux(browser_name)
            await self.test_error_handling(browser_name)
        
        await self.cleanup()
        return self.generate_report()

    def generate_report(self):
        """Generate a comprehensive test report."""
        print(f"\n{'='*80}")
        print("📊 COMPREHENSIVE TEST REPORT")
        print(f"{'='*80}")
        
        browsers_tested = list(set([result["browser"] for result in self.test_results]))
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["status"] == "SUCCESS"])
        failed_tests = len([r for r in self.test_results if r["status"] == "FAILED"])
        
        print(f"🎯 SUMMARY:")
        print(f"   Browsers Tested: {', '.join(browsers_tested)}")
        print(f"   Total Tests: {total_tests}")
        print(f"   Passed: {passed_tests}")
        print(f"   Failed: {failed_tests}")
        print(f"   Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        print(f"\n📋 DETAILED RESULTS:")
        
        for browser in browsers_tested:
            browser_results = [r for r in self.test_results if r["browser"] == browser]
            print(f"\n🌐 {browser.upper()}:")
            
            for result in browser_results:
                status_emoji = "✅" if result["status"] == "SUCCESS" else "❌"
                print(f"   {status_emoji} {result['test']}: {result['status']}")
                
                if result.get("error"):
                    print(f"      Error: {result['error']}")
                
                # Print key findings
                if "details" in result:
                    details = result["details"]
                    if result["test"] == "initial_load":
                        if details.get("page_load") == "SUCCESS":
                            print(f"      ✓ Page loads successfully")
                        if details.get("title_check") == "SUCCESS":
                            print(f"      ✓ Correct title found")
                        if details.get("login_prompt"):
                            print(f"      ✓ Login prompt shown")
                        if details.get("star_wars_theming", {}).get("goldElements", 0) > 0:
                            print(f"      ✓ Star Wars theming detected")
                    
                    elif result["test"] == "authentication_flow":
                        if details.get("login_success"):
                            print(f"      ✓ Admin login successful")
                        if details.get("user_menu_position") == "top_right":
                            print(f"      ✓ User menu in top right")
                    
                    elif result["test"] == "character_management":
                        if details.get("create_button_found"):
                            print(f"      ✓ Create character button found")
                        if details.get("character_form_loads"):
                            print(f"      ✓ Character creation form loads")
                        if not details.get("json_auth_error", True):
                            print(f"      ✓ No JSON authentication errors")
                    
                    elif result["test"] == "ui_ux":
                        theme_score = details.get("star_wars_theming_score", {}).get("themeScore", 0)
                        if theme_score > 10:
                            print(f"      ✓ Strong Star Wars theming (Score: {theme_score})")
                    
                    elif result["test"] == "error_handling":
                        if details.get("error_feedback"):
                            print(f"      ✓ Error feedback provided")
                        if not details.get("persistent_loading"):
                            print(f"      ✓ No persistent loading states")
        
        print(f"\n🔍 KEY ISSUES IDENTIFIED:")
        issues = []
        
        for result in self.test_results:
            if result["status"] == "FAILED":
                issues.append(f"❌ {result['test']} failed on {result['browser']}: {result.get('error', 'Unknown error')}")
            
            if "details" in result:
                details = result["details"]
                
                # Check for specific issues mentioned in requirements
                if result["test"] == "character_management":
                    if not details.get("create_button_found"):
                        issues.append(f"⚠️ Create character button not found on {result['browser']}")
                    if not details.get("character_form_loads"):
                        issues.append(f"⚠️ Character creation form doesn't load on {result['browser']}")
                    if details.get("json_auth_error"):
                        issues.append(f"⚠️ JSON authentication error in settings on {result['browser']}")
                
                if result["test"] == "error_handling":
                    if details.get("persistent_loading"):
                        issues.append(f"⚠️ Persistent loading states found on {result['browser']}")
                    if not details.get("error_feedback"):
                        issues.append(f"⚠️ No error feedback for invalid login on {result['browser']}")
                
                if result["test"] == "ui_ux":
                    theme_score = details.get("star_wars_theming_score", {}).get("themeScore", 0)
                    if theme_score < 5:
                        issues.append(f"⚠️ Weak Star Wars theming on {result['browser']} (Score: {theme_score})")
        
        if issues:
            for issue in issues:
                print(f"   {issue}")
        else:
            print("   🎉 No major issues identified!")
        
        print(f"\n📸 Screenshots saved to: {self.screenshots_dir}")
        print(f"\n🏁 Test completed successfully!")
        
        return {
            "browsers_tested": browsers_tested,
            "total_tests": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": passed_tests/total_tests*100,
            "issues": issues,
            "detailed_results": self.test_results,
            "screenshots_dir": str(self.screenshots_dir)
        }


async def main():
    """Main function to run the test suite."""
    tester = StarWarsRPGTester()
    try:
        report = await tester.run_all_tests()
        return report
    except Exception as e:
        print(f"❌ Test suite failed: {e}")
        await tester.cleanup()
        raise


if __name__ == "__main__":
    # Check if the app is running
    import requests
    try:
        response = requests.get(TEST_URL, timeout=5)
        print(f"✅ Application is running at {TEST_URL}")
    except:
        print(f"❌ Application is not running at {TEST_URL}")
        print("   Please start the application first with: python app_with_auth.py")
        sys.exit(1)
    
    # Run the tests
    asyncio.run(main())
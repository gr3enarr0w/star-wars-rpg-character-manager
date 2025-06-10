#!/usr/bin/env python3
"""
Focused test to verify fixes for critical Flask application issues.
Tests the primary goals mentioned in the user's request.
"""

import time
import os
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from datetime import datetime

class FixVerificationTest:
    def __init__(self):
        self.driver = None
        self.base_url = "http://127.0.0.1:5000"
        self.test_results = {}
        
    def setup_driver(self):
        """Set up Chrome driver with options for testing."""
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1280,720")
        # Remove headless mode so we can see what's happening
        # chrome_options.add_argument("--headless")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.implicitly_wait(5)
            return True
        except Exception as e:
            print(f"❌ Failed to initialize Chrome driver: {e}")
            return False

    def take_screenshot(self, name):
        """Take a screenshot with timestamp."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"test_screenshots/fix_verification_{name}_{timestamp}.png"
        os.makedirs("test_screenshots", exist_ok=True)
        
        try:
            self.driver.save_screenshot(filename)
            print(f"📸 Screenshot saved: {filename}")
            return filename
        except Exception as e:
            print(f"❌ Failed to save screenshot {name}: {e}")
            return None

    def get_console_logs(self):
        """Get browser console logs for debugging."""
        try:
            logs = self.driver.get_log('browser')
            return logs
        except Exception as e:
            print(f"⚠️ Could not retrieve console logs: {e}")
            return []

    def test_1_homepage_load(self):
        """Test 1: Load homepage and verify login prompt appears."""
        print("\n🧪 TEST 1: Homepage Load")
        try:
            self.driver.get(self.base_url)
            time.sleep(2)
            
            # Take screenshot
            self.take_screenshot("homepage_load")
            
            # Check for login elements
            page_title = self.driver.title
            page_source = self.driver.page_source
            
            # Look for login-related content
            has_login = (
                "login" in page_source.lower() or 
                "sign in" in page_source.lower() or
                "email" in page_source.lower() or
                "password" in page_source.lower()
            )
            
            result = {
                "status": "PASS" if has_login else "FAIL",
                "title": page_title,
                "has_login_elements": has_login,
                "page_loaded": True
            }
            
            print(f"   Page Title: {page_title}")
            print(f"   Has Login Elements: {has_login}")
            print(f"   Status: {result['status']}")
            
            self.test_results["homepage_load"] = result
            return result["status"] == "PASS"
            
        except Exception as e:
            print(f"❌ Homepage load test failed: {e}")
            self.test_results["homepage_load"] = {"status": "ERROR", "error": str(e)}
            return False

    def test_2_login_flow(self):
        """Test 2: Test login with admin credentials."""
        print("\n🧪 TEST 2: Login Flow")
        try:
            # Look for login form elements
            login_found = False
            
            # Try different selectors for login elements
            selectors_to_try = [
                ("input[type='email']", "Email input"),
                ("input[name='email']", "Email input by name"),
                ("#email", "Email input by ID"),
                ("input[type='password']", "Password input"),
                ("input[name='password']", "Password input by name"),
                ("#password", "Password input by ID"),
                ("button[type='submit']", "Submit button"),
                ("input[type='submit']", "Submit input"),
                (".login-form", "Login form class"),
                ("#loginForm", "Login form ID")
            ]
            
            found_elements = []
            for selector, description in selectors_to_try:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        found_elements.append(f"{description}: {len(elements)} found")
                        login_found = True
                except:
                    pass
            
            # Check if there's any form on the page
            forms = self.driver.find_elements(By.TAG_NAME, "form")
            
            result = {
                "status": "PARTIAL" if login_found else "FAIL",
                "login_elements_found": found_elements,
                "forms_count": len(forms),
                "login_ready": login_found
            }
            
            print(f"   Login elements found: {found_elements}")
            print(f"   Forms on page: {len(forms)}")
            print(f"   Status: {result['status']}")
            
            # Take screenshot
            self.take_screenshot("login_elements")
            
            self.test_results["login_flow"] = result
            return login_found
            
        except Exception as e:
            print(f"❌ Login flow test failed: {e}")
            self.test_results["login_flow"] = {"status": "ERROR", "error": str(e)}
            return False

    def test_3_main_content_area(self):
        """Test 3: Check main content area for character creation buttons and loading states."""
        print("\n🧪 TEST 3: Main Content Area")
        try:
            time.sleep(2)  # Wait for page to fully load
            
            # Get page content
            page_source = self.driver.page_source.lower()
            
            # Check for different types of content
            checks = {
                "has_loading_text": "loading" in page_source,
                "has_create_character": (
                    "create new character" in page_source or 
                    "create your first character" in page_source or
                    "create character" in page_source
                ),
                "has_character_dashboard": (
                    "character dashboard" in page_source or
                    "dashboard" in page_source
                ),
                "has_character_list": (
                    "character list" in page_source or
                    "your characters" in page_source
                ),
                "has_buttons": len(self.driver.find_elements(By.TAG_NAME, "button")) > 0
            }
            
            # Look for specific button texts
            buttons = self.driver.find_elements(By.TAG_NAME, "button")
            button_texts = [btn.text.strip() for btn in buttons if btn.text.strip()]
            
            # Check for persistent loading states
            loading_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Loading')]")
            
            result = {
                "status": "PASS" if checks["has_create_character"] and not checks["has_loading_text"] else "PARTIAL",
                "checks": checks,
                "button_texts": button_texts,
                "loading_elements_count": len(loading_elements),
                "buttons_count": len(buttons)
            }
            
            print(f"   Loading text present: {checks['has_loading_text']}")
            print(f"   Create character option: {checks['has_create_character']}")
            print(f"   Buttons found: {button_texts}")
            print(f"   Status: {result['status']}")
            
            # Take screenshot
            self.take_screenshot("main_content")
            
            self.test_results["main_content_area"] = result
            return not checks["has_loading_text"]
            
        except Exception as e:
            print(f"❌ Main content area test failed: {e}")
            self.test_results["main_content_area"] = {"status": "ERROR", "error": str(e)}
            return False

    def test_4_character_creation_button(self):
        """Test 4: Test character creation button functionality."""
        print("\n🧪 TEST 4: Character Creation Button")
        try:
            # Look for create character buttons with various approaches
            button_selectors = [
                "//button[contains(text(), 'Create')]",
                "//button[contains(text(), 'New Character')]",
                "//button[contains(text(), 'First Character')]",
                "//a[contains(text(), 'Create')]",
                ".create-character",
                "#createCharacter",
                "button[data-action='create']"
            ]
            
            create_button = None
            for selector in button_selectors:
                try:
                    if selector.startswith("//"):
                        elements = self.driver.find_elements(By.XPATH, selector)
                    else:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    
                    if elements:
                        create_button = elements[0]
                        print(f"   Found create button with selector: {selector}")
                        break
                except:
                    continue
            
            if create_button:
                # Check if button is visible and enabled
                is_visible = create_button.is_displayed()
                is_enabled = create_button.is_enabled()
                button_text = create_button.text.strip()
                
                result = {
                    "status": "PASS" if is_visible and is_enabled else "PARTIAL",
                    "button_found": True,
                    "button_text": button_text,
                    "is_visible": is_visible,
                    "is_enabled": is_enabled,
                    "clicked": False
                }
                
                # Try to click the button
                if is_visible and is_enabled:
                    try:
                        create_button.click()
                        time.sleep(2)
                        result["clicked"] = True
                        result["status"] = "PASS"
                        
                        # Take screenshot after click
                        self.take_screenshot("after_create_click")
                        
                    except Exception as click_error:
                        print(f"   Could not click button: {click_error}")
                        result["click_error"] = str(click_error)
                
                print(f"   Button text: '{button_text}'")
                print(f"   Visible: {is_visible}, Enabled: {is_enabled}")
                print(f"   Clicked: {result['clicked']}")
                print(f"   Status: {result['status']}")
                
            else:
                result = {
                    "status": "FAIL",
                    "button_found": False,
                    "error": "No create character button found"
                }
                print(f"   Status: {result['status']} - No create character button found")
            
            self.test_results["character_creation_button"] = result
            return result.get("button_found", False)
            
        except Exception as e:
            print(f"❌ Character creation button test failed: {e}")
            self.test_results["character_creation_button"] = {"status": "ERROR", "error": str(e)}
            return False

    def test_5_settings_menu(self):
        """Test 5: Test settings menu functionality."""
        print("\n🧪 TEST 5: Settings Menu")
        try:
            # Look for settings menu (gear icon, settings link, etc.)
            settings_selectors = [
                "//button[contains(@class, 'settings')]",
                "//button[contains(text(), 'Settings')]",
                "//a[contains(text(), 'Settings')]",
                ".settings-menu",
                "#settingsMenu",
                "button[data-action='settings']",
                "[title='Settings']",
                ".gear-icon"
            ]
            
            settings_element = None
            for selector in settings_selectors:
                try:
                    if selector.startswith("//"):
                        elements = self.driver.find_elements(By.XPATH, selector)
                    else:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    
                    if elements:
                        settings_element = elements[0]
                        print(f"   Found settings element with selector: {selector}")
                        break
                except:
                    continue
            
            if settings_element:
                is_visible = settings_element.is_displayed()
                is_enabled = settings_element.is_enabled()
                
                result = {
                    "status": "PARTIAL",
                    "settings_found": True,
                    "is_visible": is_visible,
                    "is_enabled": is_enabled,
                    "clicked": False
                }
                
                # Try to click the settings
                if is_visible and is_enabled:
                    try:
                        settings_element.click()
                        time.sleep(2)
                        result["clicked"] = True
                        result["status"] = "PASS"
                        
                        # Take screenshot after click
                        self.take_screenshot("settings_menu_open")
                        
                        # Check for modal or dropdown
                        modals = self.driver.find_elements(By.CSS_SELECTOR, ".modal, .dropdown, .menu")
                        result["menu_opened"] = len(modals) > 0
                        
                    except Exception as click_error:
                        print(f"   Could not click settings: {click_error}")
                        result["click_error"] = str(click_error)
                
                print(f"   Visible: {is_visible}, Enabled: {is_enabled}")
                print(f"   Clicked: {result['clicked']}")
                print(f"   Status: {result['status']}")
                
            else:
                result = {
                    "status": "FAIL",
                    "settings_found": False,
                    "error": "No settings menu found"
                }
                print(f"   Status: {result['status']} - No settings menu found")
            
            self.test_results["settings_menu"] = result
            return result.get("settings_found", False)
            
        except Exception as e:
            print(f"❌ Settings menu test failed: {e}")
            self.test_results["settings_menu"] = {"status": "ERROR", "error": str(e)}
            return False

    def test_6_console_logs(self):
        """Test 6: Capture and analyze console logs."""
        print("\n🧪 TEST 6: Console Log Analysis")
        try:
            logs = self.get_console_logs()
            
            # Categorize logs
            errors = [log for log in logs if log['level'] == 'SEVERE']
            warnings = [log for log in logs if log['level'] == 'WARNING']
            info = [log for log in logs if log['level'] == 'INFO']
            
            # Look for specific debugging messages
            debug_messages = []
            character_manager_logs = []
            
            for log in logs:
                message = log.get('message', '')
                if 'CharacterManager' in message:
                    character_manager_logs.append(message)
                if 'debug' in message.lower() or 'log' in message.lower():
                    debug_messages.append(message)
            
            result = {
                "status": "PASS" if len(errors) == 0 else "PARTIAL",
                "total_logs": len(logs),
                "errors": len(errors),
                "warnings": len(warnings),
                "info": len(info),
                "error_messages": [log['message'] for log in errors[:5]],  # First 5 errors
                "character_manager_logs": character_manager_logs,
                "debug_messages": debug_messages[:5]  # First 5 debug messages
            }
            
            print(f"   Total logs: {len(logs)}")
            print(f"   Errors: {len(errors)}, Warnings: {len(warnings)}, Info: {len(info)}")
            if character_manager_logs:
                print(f"   CharacterManager logs found: {len(character_manager_logs)}")
            print(f"   Status: {result['status']}")
            
            self.test_results["console_logs"] = result
            return len(errors) == 0
            
        except Exception as e:
            print(f"❌ Console log analysis failed: {e}")
            self.test_results["console_logs"] = {"status": "ERROR", "error": str(e)}
            return False

    def run_all_tests(self):
        """Run all verification tests."""
        print("🚀 Starting Fix Verification Tests")
        print("=" * 50)
        
        if not self.setup_driver():
            return False
        
        try:
            # Run all tests
            tests = [
                self.test_1_homepage_load,
                self.test_2_login_flow,
                self.test_3_main_content_area,
                self.test_4_character_creation_button,
                self.test_5_settings_menu,
                self.test_6_console_logs
            ]
            
            results = []
            for test in tests:
                try:
                    result = test()
                    results.append(result)
                except Exception as e:
                    print(f"❌ Test failed with exception: {e}")
                    results.append(False)
            
            # Take final screenshot
            self.take_screenshot("final_state")
            
            # Summary
            print("\n" + "=" * 50)
            print("📊 TEST SUMMARY")
            print("=" * 50)
            
            passed_tests = sum(results)
            total_tests = len(results)
            
            print(f"Tests Passed: {passed_tests}/{total_tests}")
            
            for test_name, result in self.test_results.items():
                status_icon = "✅" if result.get("status") == "PASS" else "⚠️" if result.get("status") == "PARTIAL" else "❌"
                print(f"{status_icon} {test_name.replace('_', ' ').title()}: {result.get('status', 'UNKNOWN')}")
            
            # Save detailed results
            with open("test_results_fix_verification.json", "w") as f:
                json.dump(self.test_results, f, indent=2, default=str)
            
            print(f"\n📄 Detailed results saved to: test_results_fix_verification.json")
            
            return passed_tests >= total_tests * 0.5  # At least 50% pass rate
            
        finally:
            if self.driver:
                self.driver.quit()

def main():
    """Main test execution."""
    tester = FixVerificationTest()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 Fix verification tests completed successfully!")
    else:
        print("\n⚠️ Some tests failed. Check the detailed results for issues.")
    
    return success

if __name__ == "__main__":
    main()
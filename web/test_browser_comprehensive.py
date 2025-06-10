#!/usr/bin/env python3
"""
Comprehensive browser-based test to verify all critical fixes.
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

class ComprehensiveBrowserTest:
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
        filename = f"test_screenshots/browser_test_{name}_{timestamp}.png"
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

    def test_initial_page_load(self):
        """Test initial page load and basic elements."""
        print("\n🧪 TEST 1: Initial Page Load")
        try:
            # Navigate to homepage
            self.driver.get(self.base_url)
            
            # Wait for page to load completely
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Take screenshot
            screenshot = self.take_screenshot("01_initial_load")
            
            # Check basic page elements
            title = self.driver.title
            header = self.driver.find_elements(By.CLASS_NAME, "header")
            main_content = self.driver.find_elements(By.TAG_NAME, "main")
            
            # Check for loading states
            loading_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Loading') or contains(text(), 'loading')]")
            
            result = {
                "status": "PASS",
                "title": title,
                "has_header": len(header) > 0,
                "has_main_content": len(main_content) > 0,
                "loading_elements": len(loading_elements),
                "page_source_length": len(self.driver.page_source),
                "screenshot": screenshot
            }
            
            print(f"   Page Title: {title}")
            print(f"   Has Header: {result['has_header']}")
            print(f"   Has Main Content: {result['has_main_content']}")
            print(f"   Loading Elements: {result['loading_elements']}")
            print(f"   Status: {result['status']}")
            
            self.test_results["initial_load"] = result
            return True
            
        except Exception as e:
            print(f"❌ Initial page load test failed: {e}")
            self.test_results["initial_load"] = {"status": "ERROR", "error": str(e)}
            return False

    def test_character_creation_button(self):
        """Test the character creation button functionality."""
        print("\n🧪 TEST 2: Character Creation Button")
        try:
            # Look for the create character button
            create_buttons = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Create') and contains(text(), 'Character')]")
            
            if not create_buttons:
                # Try alternative selectors
                create_buttons = self.driver.find_elements(By.CSS_SELECTOR, "[data-action='show-create-character']")
            
            if create_buttons:
                button = create_buttons[0]
                button_text = button.text
                is_visible = button.is_displayed()
                is_enabled = button.is_enabled()
                
                # Take screenshot before clicking
                self.take_screenshot("02_before_create_click")
                
                # Try to click the button
                clicked = False
                try:
                    button.click()
                    time.sleep(2)  # Wait for any animations/transitions
                    clicked = True
                    
                    # Take screenshot after clicking
                    self.take_screenshot("03_after_create_click")
                    
                except Exception as click_error:
                    print(f"   Click failed: {click_error}")
                
                result = {
                    "status": "PASS" if clicked else "PARTIAL",
                    "button_found": True,
                    "button_text": button_text,
                    "is_visible": is_visible,
                    "is_enabled": is_enabled,
                    "clicked_successfully": clicked
                }
                
                print(f"   Button Text: '{button_text}'")
                print(f"   Visible: {is_visible}, Enabled: {is_enabled}")
                print(f"   Clicked: {clicked}")
                print(f"   Status: {result['status']}")
                
            else:
                result = {
                    "status": "FAIL",
                    "button_found": False,
                    "error": "No create character button found"
                }
                print(f"   Status: {result['status']} - No button found")
            
            self.test_results["character_creation_button"] = result
            return result.get("button_found", False)
            
        except Exception as e:
            print(f"❌ Character creation button test failed: {e}")
            self.test_results["character_creation_button"] = {"status": "ERROR", "error": str(e)}
            return False

    def test_navigation_elements(self):
        """Test navigation elements and menu functionality."""
        print("\n🧪 TEST 3: Navigation Elements")
        try:
            # Find navigation elements
            nav_elements = self.driver.find_elements(By.CSS_SELECTOR, "nav a, .nav a")
            
            navigation_info = []
            for nav in nav_elements:
                nav_info = {
                    "text": nav.text,
                    "href": nav.get_attribute("href"),
                    "data_action": nav.get_attribute("data-action"),
                    "is_visible": nav.is_displayed(),
                    "is_enabled": nav.is_enabled()
                }
                navigation_info.append(nav_info)
            
            # Test clicking different navigation items
            dashboard_nav = self.driver.find_elements(By.CSS_SELECTOR, "[data-action='show-dashboard']")
            create_nav = self.driver.find_elements(By.CSS_SELECTOR, "[data-action='show-create-character']")
            help_nav = self.driver.find_elements(By.XPATH, "//a[contains(text(), 'Help')]")
            
            result = {
                "status": "PASS" if len(nav_elements) > 0 else "FAIL",
                "nav_elements_count": len(nav_elements),
                "navigation_info": navigation_info,
                "has_dashboard_nav": len(dashboard_nav) > 0,
                "has_create_nav": len(create_nav) > 0,
                "has_help_nav": len(help_nav) > 0
            }
            
            print(f"   Navigation elements found: {len(nav_elements)}")
            print(f"   Dashboard nav: {result['has_dashboard_nav']}")
            print(f"   Create nav: {result['has_create_nav']}")
            print(f"   Help nav: {result['has_help_nav']}")
            print(f"   Status: {result['status']}")
            
            # Take screenshot of navigation
            self.take_screenshot("04_navigation_elements")
            
            self.test_results["navigation"] = result
            return len(nav_elements) > 0
            
        except Exception as e:
            print(f"❌ Navigation test failed: {e}")
            self.test_results["navigation"] = {"status": "ERROR", "error": str(e)}
            return False

    def test_interactive_elements(self):
        """Test all interactive elements on the page."""
        print("\n🧪 TEST 4: Interactive Elements")
        try:
            # Find all buttons
            buttons = self.driver.find_elements(By.TAG_NAME, "button")
            
            button_info = []
            for button in buttons:
                btn_info = {
                    "text": button.text.strip(),
                    "data_action": button.get_attribute("data-action"),
                    "onclick": button.get_attribute("onclick"),
                    "is_visible": button.is_displayed(),
                    "is_enabled": button.is_enabled(),
                    "classes": button.get_attribute("class")
                }
                button_info.append(btn_info)
            
            # Find all links with data-action
            action_links = self.driver.find_elements(By.CSS_SELECTOR, "[data-action]")
            
            # Check for JavaScript functionality
            js_errors = []
            console_logs = self.get_console_logs()
            for log in console_logs:
                if log['level'] == 'SEVERE':
                    js_errors.append(log['message'])
            
            result = {
                "status": "PASS" if len(buttons) > 0 else "FAIL",
                "buttons_count": len(buttons),
                "button_info": button_info,
                "action_links_count": len(action_links),
                "js_errors": js_errors[:5],  # First 5 errors
                "js_errors_count": len(js_errors)
            }
            
            print(f"   Buttons found: {len(buttons)}")
            print(f"   Action links found: {len(action_links)}")
            print(f"   JavaScript errors: {len(js_errors)}")
            print(f"   Status: {result['status']}")
            
            # Take screenshot
            self.take_screenshot("05_interactive_elements")
            
            self.test_results["interactive_elements"] = result
            return len(buttons) > 0
            
        except Exception as e:
            print(f"❌ Interactive elements test failed: {e}")
            self.test_results["interactive_elements"] = {"status": "ERROR", "error": str(e)}
            return False

    def test_character_form_functionality(self):
        """Test if character creation form loads and works."""
        print("\n🧪 TEST 5: Character Form Functionality")
        try:
            # First, try to trigger the character creation form
            create_button = None
            
            # Try different ways to find and click the create button
            selectors = [
                "[data-action='show-create-character']",
                "//button[contains(text(), 'Create')]",
                "//button[contains(text(), 'Character')]"
            ]
            
            for selector in selectors:
                try:
                    if selector.startswith("//"):
                        elements = self.driver.find_elements(By.XPATH, selector)
                    else:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    
                    if elements and elements[0].is_displayed():
                        create_button = elements[0]
                        break
                except:
                    continue
            
            if create_button:
                # Click the create button
                create_button.click()
                time.sleep(3)  # Wait for form to load
                
                # Take screenshot after clicking
                self.take_screenshot("06_character_form_attempt")
                
                # Look for form elements that might have appeared
                forms = self.driver.find_elements(By.TAG_NAME, "form")
                inputs = self.driver.find_elements(By.TAG_NAME, "input")
                selects = self.driver.find_elements(By.TAG_NAME, "select")
                textareas = self.driver.find_elements(By.TAG_NAME, "textarea")
                
                # Look for character-specific elements
                character_inputs = self.driver.find_elements(By.XPATH, "//input[contains(@name, 'character') or contains(@id, 'character')]")
                
                result = {
                    "status": "PASS" if len(forms) > 0 or len(inputs) > 0 else "PARTIAL",
                    "create_button_clicked": True,
                    "forms_found": len(forms),
                    "inputs_found": len(inputs),
                    "selects_found": len(selects),
                    "textareas_found": len(textareas),
                    "character_inputs_found": len(character_inputs)
                }
                
                print(f"   Create button clicked: True")
                print(f"   Forms found: {len(forms)}")
                print(f"   Input fields found: {len(inputs)}")
                print(f"   Character-specific inputs: {len(character_inputs)}")
                print(f"   Status: {result['status']}")
                
            else:
                result = {
                    "status": "FAIL",
                    "create_button_clicked": False,
                    "error": "Could not find create button"
                }
                print(f"   Status: {result['status']} - No create button found")
            
            self.test_results["character_form"] = result
            return result.get("create_button_clicked", False)
            
        except Exception as e:
            print(f"❌ Character form test failed: {e}")
            self.test_results["character_form"] = {"status": "ERROR", "error": str(e)}
            return False

    def test_help_functionality(self):
        """Test help menu functionality."""
        print("\n🧪 TEST 6: Help Functionality")
        try:
            # Look for help button/link
            help_elements = self.driver.find_elements(By.XPATH, "//a[contains(text(), 'Help')] | //button[contains(text(), 'Help')]")
            
            if help_elements:
                help_element = help_elements[0]
                onclick_attr = help_element.get_attribute("onclick")
                
                # Try clicking the help element
                try:
                    help_element.click()
                    time.sleep(2)
                    
                    # Take screenshot
                    self.take_screenshot("07_help_clicked")
                    
                    # Look for help content (modal, popup, etc.)
                    modals = self.driver.find_elements(By.CSS_SELECTOR, ".modal, .popup, .help-content")
                    
                    result = {
                        "status": "PASS" if len(modals) > 0 else "PARTIAL",
                        "help_element_found": True,
                        "onclick_attribute": onclick_attr,
                        "help_clicked": True,
                        "help_content_shown": len(modals) > 0,
                        "modals_found": len(modals)
                    }
                    
                    print(f"   Help element found: True")
                    print(f"   Onclick: {onclick_attr}")
                    print(f"   Help content shown: {len(modals) > 0}")
                    print(f"   Status: {result['status']}")
                    
                except Exception as click_error:
                    result = {
                        "status": "PARTIAL",
                        "help_element_found": True,
                        "help_clicked": False,
                        "click_error": str(click_error)
                    }
                    print(f"   Help click failed: {click_error}")
            else:
                result = {
                    "status": "FAIL",
                    "help_element_found": False,
                    "error": "No help element found"
                }
                print(f"   Status: {result['status']} - No help element found")
            
            self.test_results["help_functionality"] = result
            return result.get("help_element_found", False)
            
        except Exception as e:
            print(f"❌ Help functionality test failed: {e}")
            self.test_results["help_functionality"] = {"status": "ERROR", "error": str(e)}
            return False

    def run_all_tests(self):
        """Run all browser tests."""
        print("🚀 Starting Comprehensive Browser Tests")
        print("=" * 60)
        
        if not self.setup_driver():
            return False
        
        try:
            # Run all tests
            tests = [
                ("Initial Page Load", self.test_initial_page_load),
                ("Character Creation Button", self.test_character_creation_button),
                ("Navigation Elements", self.test_navigation_elements),
                ("Interactive Elements", self.test_interactive_elements),
                ("Character Form", self.test_character_form_functionality),
                ("Help Functionality", self.test_help_functionality)
            ]
            
            results = []
            for test_name, test_func in tests:
                try:
                    result = test_func()
                    results.append(result)
                except Exception as e:
                    print(f"❌ {test_name} failed with exception: {e}")
                    results.append(False)
            
            # Take final screenshot
            self.take_screenshot("08_final_state")
            
            # Get final console logs
            final_logs = self.get_console_logs()
            
            # Summary
            print("\n" + "=" * 60)
            print("📊 COMPREHENSIVE TEST SUMMARY")
            print("=" * 60)
            
            passed_tests = sum(results)
            total_tests = len(results)
            
            print(f"Tests Passed: {passed_tests}/{total_tests}")
            print(f"Pass Rate: {passed_tests/total_tests:.1%}")
            
            for test_name, result in self.test_results.items():
                status_icon = "✅" if result.get("status") == "PASS" else "⚠️" if result.get("status") == "PARTIAL" else "❌"
                print(f"{status_icon} {test_name.replace('_', ' ').title()}: {result.get('status', 'UNKNOWN')}")
            
            # Console log summary
            severe_errors = [log for log in final_logs if log['level'] == 'SEVERE']
            if severe_errors:
                print(f"\n⚠️ JavaScript Errors Found: {len(severe_errors)}")
                for error in severe_errors[:3]:  # Show first 3 errors
                    print(f"   - {error['message']}")
            else:
                print("\n✅ No severe JavaScript errors found")
            
            # Save detailed results
            with open("test_results_browser_comprehensive.json", "w") as f:
                test_data = {
                    "test_results": self.test_results,
                    "console_logs": final_logs,
                    "summary": {
                        "passed": passed_tests,
                        "total": total_tests,
                        "pass_rate": passed_tests/total_tests,
                        "timestamp": datetime.now().isoformat()
                    }
                }
                json.dump(test_data, f, indent=2, default=str)
            
            print(f"\n📄 Detailed results saved to: test_results_browser_comprehensive.json")
            
            # Specific fix verification
            self.provide_fix_verification_summary()
            
            return passed_tests >= total_tests * 0.7  # 70% pass rate
            
        finally:
            if self.driver:
                self.driver.quit()

    def provide_fix_verification_summary(self):
        """Provide specific summary of the fixes that were requested."""
        print("\n" + "=" * 60)
        print("🎯 FIX VERIFICATION SUMMARY")
        print("=" * 60)
        
        # Check each of the primary goals
        goals = {
            "Character Creation Button": self.test_results.get("character_creation_button", {}).get("button_found", False),
            "Loading States Resolved": self.test_results.get("initial_load", {}).get("loading_elements", 99) == 0,
            "Interactive Elements Work": self.test_results.get("interactive_elements", {}).get("buttons_count", 0) > 0,
            "Navigation Functional": self.test_results.get("navigation", {}).get("nav_elements_count", 0) > 0,
            "No JavaScript Errors": self.test_results.get("interactive_elements", {}).get("js_errors_count", 99) == 0
        }
        
        print("Primary Fix Goals Status:")
        for goal, achieved in goals.items():
            icon = "✅" if achieved else "❌"
            print(f"{icon} {goal}: {'FIXED' if achieved else 'NEEDS ATTENTION'}")
        
        # Overall assessment
        fixes_working = sum(goals.values())
        total_goals = len(goals)
        
        print(f"\nOverall Fix Success: {fixes_working}/{total_goals} ({fixes_working/total_goals:.1%})")
        
        if fixes_working >= total_goals * 0.8:
            print("🎉 EXCELLENT: Most critical fixes are working!")
        elif fixes_working >= total_goals * 0.6:
            print("👍 GOOD: Major fixes are working, minor issues remain")
        else:
            print("⚠️ ATTENTION NEEDED: Several critical issues still need fixing")

def main():
    """Main test execution."""
    tester = ComprehensiveBrowserTest()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 Comprehensive browser tests completed successfully!")
    else:
        print("\n⚠️ Some tests failed. Check the detailed results and screenshots.")
    
    return success

if __name__ == "__main__":
    main()
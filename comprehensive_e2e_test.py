#!/usr/bin/env python3
"""
Comprehensive End-to-End Test for SWRPG Character Manager
Tests all critical missing features reported by the user
"""

import time
import json
import os
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains

class ComprehensiveE2ETest:
    def __init__(self):
        self.base_url = "http://127.0.0.1:5000"
        self.admin_email = "admin@swrpg.local"
        self.admin_password = "AdminPassword123!@#$"
        self.driver = None
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "test_results": {},
            "screenshots": [],
            "errors": [],
            "summary": {}
        }
        self.screenshot_dir = "/Users/ceverson/Development/new_app_sheets/test_screenshots_e2e"
        
        # Create screenshot directory
        os.makedirs(self.screenshot_dir, exist_ok=True)
    
    def setup_driver(self):
        """Setup Chrome driver with appropriate options"""
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        # Remove headless mode to see what's happening
        # chrome_options.add_argument("--headless")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.implicitly_wait(10)
            return True
        except Exception as e:
            self.results["errors"].append(f"Failed to setup Chrome driver: {str(e)}")
            return False
    
    def take_screenshot(self, name, description=""):
        """Take screenshot and save to results"""
        if not self.driver:
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{name}_{timestamp}.png"
        filepath = os.path.join(self.screenshot_dir, filename)
        
        try:
            self.driver.save_screenshot(filepath)
            self.results["screenshots"].append({
                "name": name,
                "description": description,
                "filepath": filepath,
                "timestamp": timestamp
            })
            print(f"Screenshot saved: {filepath}")
        except Exception as e:
            self.results["errors"].append(f"Failed to take screenshot {name}: {str(e)}")
    
    def test_1_authentication_flow(self):
        """Test 1: Full Authentication Flow"""
        print("\\n=== TEST 1: Authentication Flow ===")
        test_name = "authentication_flow"
        
        try:
            # Load homepage
            print("Loading homepage...")
            self.driver.get(self.base_url)
            time.sleep(3)
            
            # Take screenshot of initial load
            self.take_screenshot("01_initial_load", "Homepage before authentication")
            
            # Check if login form is present (unauthenticated state)
            login_present = False
            try:
                login_form = self.driver.find_element(By.CSS_SELECTOR, "form, .login-form, #loginForm")
                login_present = True
                print("✓ Login form found for unauthenticated users")
            except NoSuchElementException:
                print("✗ No login form found - checking if already authenticated")
            
            # Check for authentication elements
            auth_elements = {}
            try:
                # Look for email input
                email_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='email'], input[name='email'], #email")
                auth_elements["email_input"] = True
                print("✓ Email input field found")
            except NoSuchElementException:
                auth_elements["email_input"] = False
                print("✗ Email input field not found")
            
            try:
                # Look for password input
                password_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='password'], input[name='password'], #password")
                auth_elements["password_input"] = True
                print("✓ Password input field found")
            except NoSuchElementException:
                auth_elements["password_input"] = False
                print("✗ Password input field not found")
            
            # If login form is present, attempt login
            if auth_elements["email_input"] and auth_elements["password_input"]:
                print("Attempting login...")
                
                # Enter credentials
                email_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='email'], input[name='email'], #email")
                password_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='password'], input[name='password'], #password")
                
                email_input.clear()
                email_input.send_keys(self.admin_email)
                password_input.clear()
                password_input.send_keys(self.admin_password)
                
                # Take screenshot before login
                self.take_screenshot("02_before_login", "Login form filled out")
                
                # Submit form
                try:
                    submit_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit'], input[type='submit'], .login-btn")
                    submit_button.click()
                    print("✓ Login form submitted")
                except NoSuchElementException:
                    # Try submitting the form directly
                    password_input.submit()
                    print("✓ Login form submitted via form submission")
                
                # Wait for redirect/page change
                time.sleep(3)
                
                # Take screenshot after login
                self.take_screenshot("03_after_login", "Page after login attempt")
            
            # Check for authenticated state indicators
            authenticated_elements = self.check_authenticated_elements()
            
            self.results["test_results"][test_name] = {
                "login_form_present": login_present,
                "auth_elements": auth_elements,
                "authenticated_elements": authenticated_elements,
                "status": "completed"
            }
            
            return True
            
        except Exception as e:
            self.results["test_results"][test_name] = {
                "status": "failed",
                "error": str(e)
            }
            self.results["errors"].append(f"Authentication flow test failed: {str(e)}")
            return False
    
    def check_authenticated_elements(self):
        """Check for elements that should be present when authenticated"""
        elements = {}
        
        # Check for gear icon
        try:
            gear_icon = self.driver.find_element(By.CSS_SELECTOR, ".gear-icon, .settings-icon, [class*='gear'], [class*='settings']")
            elements["gear_icon"] = True
            print("✓ Gear icon (settings) found")
        except NoSuchElementException:
            elements["gear_icon"] = False
            print("✗ Gear icon (settings) not found")
        
        # Check for user display
        try:
            user_display = self.driver.find_element(By.CSS_SELECTOR, ".user-info, .user-display, [class*='user']")
            elements["user_display"] = True
            user_text = user_display.text
            elements["user_display_text"] = user_text
            print(f"✓ User display found: {user_text}")
        except NoSuchElementException:
            elements["user_display"] = False
            print("✗ User display not found")
        
        # Check for logout option
        try:
            logout_element = self.driver.find_element(By.CSS_SELECTOR, ".logout, [href*='logout'], button[onclick*='logout']")
            elements["logout_option"] = True
            print("✓ Logout option found")
        except NoSuchElementException:
            elements["logout_option"] = False
            print("✗ Logout option not found")
        
        # Check for navigation elements
        try:
            nav_element = self.driver.find_element(By.CSS_SELECTOR, "nav, .navigation, .sidebar, [class*='nav']")
            elements["navigation"] = True
            print("✓ Navigation elements found")
        except NoSuchElementException:
            elements["navigation"] = False
            print("✗ Navigation elements not found")
        
        return elements
    
    def test_2_settings_menu_functionality(self):
        """Test 2: Settings Menu Functionality"""
        print("\\n=== TEST 2: Settings Menu Functionality ===")
        test_name = "settings_menu"
        
        try:
            # Look for gear icon and click it
            gear_found = False
            settings_menu_items = {}
            
            # Try different selectors for gear icon
            gear_selectors = [
                ".gear-icon", ".settings-icon", "[class*='gear']", "[class*='settings']",
                "i.fas.fa-cog", "i.fa-gear", ".fa-cog", ".fa-gear",
                "[title*='Settings']", "[aria-label*='Settings']"
            ]
            
            for selector in gear_selectors:
                try:
                    gear_icon = self.driver.find_element(By.CSS_SELECTOR, selector)
                    gear_found = True
                    print(f"✓ Gear icon found with selector: {selector}")
                    
                    # Click the gear icon
                    gear_icon.click()
                    time.sleep(2)
                    
                    # Take screenshot of settings menu
                    self.take_screenshot("04_settings_menu_open", "Settings menu after clicking gear icon")
                    
                    # Check for settings menu items
                    menu_items = [
                        ("Profile Settings", [".profile-settings", "[href*='profile']", "a:contains('Profile')"]),
                        ("Campaign Management", [".campaign-management", "[href*='campaign']", "a:contains('Campaign')"]),
                        ("Two-Factor Authentication", [".two-factor", "[href*='2fa']", "a:contains('Two-Factor')"]),
                        ("Admin Panel", [".admin-panel", "[href*='admin']", "a:contains('Admin')"]),
                        ("Logout", [".logout", "[href*='logout']", "a:contains('Logout')"])
                    ]
                    
                    for item_name, selectors in menu_items:
                        item_found = False
                        for sel in selectors:
                            try:
                                element = self.driver.find_element(By.CSS_SELECTOR, sel)
                                item_found = True
                                print(f"✓ {item_name} menu item found")
                                break
                            except NoSuchElementException:
                                continue
                        
                        settings_menu_items[item_name] = item_found
                        if not item_found:
                            print(f"✗ {item_name} menu item not found")
                    
                    break
                    
                except NoSuchElementException:
                    continue
            
            if not gear_found:
                print("✗ Gear icon not found with any selector")
            
            self.results["test_results"][test_name] = {
                "gear_icon_found": gear_found,
                "menu_items": settings_menu_items,
                "status": "completed"
            }
            
            return gear_found
            
        except Exception as e:
            self.results["test_results"][test_name] = {
                "status": "failed",
                "error": str(e)
            }
            self.results["errors"].append(f"Settings menu test failed: {str(e)}")
            return False
    
    def test_3_campaign_navigation(self):
        """Test 3: Campaign Navigation"""
        print("\\n=== TEST 3: Campaign Navigation ===")
        test_name = "campaign_navigation"
        
        try:
            campaign_elements = {}
            
            # Check for campaign selector in sidebar
            try:
                campaign_selector = self.driver.find_element(By.CSS_SELECTOR, ".campaign-selector, [class*='campaign'], .sidebar select")
                campaign_elements["campaign_selector"] = True
                print("✓ Campaign selector found")
            except NoSuchElementException:
                campaign_elements["campaign_selector"] = False
                print("✗ Campaign selector not found")
            
            # Check for "All Characters" option
            try:
                all_chars = self.driver.find_element(By.CSS_SELECTOR, "[value='all'], option:contains('All Characters'), .all-characters")
                campaign_elements["all_characters_option"] = True
                print("✓ 'All Characters' option found")
            except NoSuchElementException:
                campaign_elements["all_characters_option"] = False
                print("✗ 'All Characters' option not found")
            
            # Check for campaign list
            try:
                campaign_list = self.driver.find_elements(By.CSS_SELECTOR, ".campaign-list li, select option, .campaign-item")
                campaign_elements["campaign_list_count"] = len(campaign_list)
                print(f"✓ Found {len(campaign_list)} campaign list items")
            except NoSuchElementException:
                campaign_elements["campaign_list_count"] = 0
                print("✗ No campaign list items found")
            
            # Take screenshot of campaign navigation area
            self.take_screenshot("05_campaign_navigation", "Campaign navigation and selector")
            
            self.results["test_results"][test_name] = {
                "campaign_elements": campaign_elements,
                "status": "completed"
            }
            
            return True
            
        except Exception as e:
            self.results["test_results"][test_name] = {
                "status": "failed", 
                "error": str(e)
            }
            self.results["errors"].append(f"Campaign navigation test failed: {str(e)}")
            return False
    
    def test_4_complete_navigation_flow(self):
        """Test 4: Complete Navigation Flow"""
        print("\\n=== TEST 4: Complete Navigation Flow ===")
        test_name = "navigation_flow"
        
        try:
            navigation_elements = {}
            
            # Check for left sidebar navigation
            try:
                sidebar = self.driver.find_element(By.CSS_SELECTOR, ".sidebar, .left-nav, nav")
                navigation_elements["sidebar"] = True
                print("✓ Left sidebar found")
                
                # Check for navigation items
                nav_items = ["Create Character", "Documentation"]
                for item in nav_items:
                    try:
                        nav_link = self.driver.find_element(By.XPATH, f"//a[contains(text(), '{item}')]")
                        navigation_elements[f"{item.lower().replace(' ', '_')}_link"] = True
                        print(f"✓ {item} navigation link found")
                    except NoSuchElementException:
                        navigation_elements[f"{item.lower().replace(' ', '_')}_link"] = False
                        print(f"✗ {item} navigation link not found")
                
            except NoSuchElementException:
                navigation_elements["sidebar"] = False
                print("✗ Left sidebar not found")
            
            # Check for main content area
            try:
                main_content = self.driver.find_element(By.CSS_SELECTOR, ".main-content, main, .content-area")
                navigation_elements["main_content"] = True
                print("✓ Main content area found")
            except NoSuchElementException:
                navigation_elements["main_content"] = False
                print("✗ Main content area not found")
            
            # Take screenshot of full navigation layout
            self.take_screenshot("06_navigation_layout", "Complete navigation layout")
            
            self.results["test_results"][test_name] = {
                "navigation_elements": navigation_elements,
                "status": "completed"
            }
            
            return True
            
        except Exception as e:
            self.results["test_results"][test_name] = {
                "status": "failed",
                "error": str(e)
            }
            self.results["errors"].append(f"Navigation flow test failed: {str(e)}")
            return False
    
    def test_5_api_endpoints(self):
        """Test 5: API Endpoints"""
        print("\\n=== TEST 5: API Endpoints ===")
        test_name = "api_endpoints"
        
        try:
            # Test API endpoints using JavaScript execution
            api_results = {}
            
            # Test /api/campaigns endpoint
            campaigns_js = """
            return fetch('/api/campaigns')
                .then(response => response.status)
                .catch(error => 'error');
            """
            
            try:
                campaigns_status = self.driver.execute_async_script(f"""
                var callback = arguments[arguments.length - 1];
                {campaigns_js.replace('return ', '')}
                .then(callback);
                """)
                api_results["campaigns_endpoint"] = campaigns_status
                print(f"✓ /api/campaigns endpoint returned status: {campaigns_status}")
            except Exception as e:
                api_results["campaigns_endpoint"] = "error"
                print(f"✗ /api/campaigns endpoint failed: {str(e)}")
            
            # Test /api/characters endpoint
            try:
                characters_status = self.driver.execute_async_script("""
                var callback = arguments[arguments.length - 1];
                fetch('/api/characters')
                    .then(response => response.status)
                    .then(callback)
                    .catch(error => callback('error'));
                """)
                api_results["characters_endpoint"] = characters_status
                print(f"✓ /api/characters endpoint returned status: {characters_status}")
            except Exception as e:
                api_results["characters_endpoint"] = "error"
                print(f"✗ /api/characters endpoint failed: {str(e)}")
            
            self.results["test_results"][test_name] = {
                "api_results": api_results,
                "status": "completed"
            }
            
            return True
            
        except Exception as e:
            self.results["test_results"][test_name] = {
                "status": "failed",
                "error": str(e)
            }
            self.results["errors"].append(f"API endpoints test failed: {str(e)}")
            return False
    
    def check_browser_console_errors(self):
        """Check for JavaScript errors in browser console"""
        print("\\n=== CHECKING BROWSER CONSOLE ===")
        
        try:
            # Get browser logs
            logs = self.driver.get_log('browser')
            console_errors = []
            
            for log in logs:
                if log['level'] == 'SEVERE':
                    console_errors.append({
                        'level': log['level'],
                        'message': log['message'],
                        'timestamp': log['timestamp']
                    })
                    print(f"✗ Console Error: {log['message']}")
            
            if not console_errors:
                print("✓ No severe console errors found")
            
            self.results["console_errors"] = console_errors
            
        except Exception as e:
            print(f"Could not retrieve console logs: {str(e)}")
            self.results["console_errors"] = ["Could not retrieve logs"]
    
    def generate_summary(self):
        """Generate test summary"""
        print("\\n=== GENERATING SUMMARY ===")
        
        # Count test results
        passed_tests = 0
        failed_tests = 0
        total_tests = len(self.results["test_results"])
        
        missing_features = []
        working_features = []
        
        for test_name, test_result in self.results["test_results"].items():
            if test_result.get("status") == "completed":
                passed_tests += 1
            else:
                failed_tests += 1
        
        # Analyze specific missing features
        auth_test = self.results["test_results"].get("authentication_flow", {})
        if not auth_test.get("authenticated_elements", {}).get("gear_icon", False):
            missing_features.append("Gear icon (⚙️) in top-right corner")
        else:
            working_features.append("Gear icon (⚙️) in top-right corner")
        
        if not auth_test.get("authenticated_elements", {}).get("user_display", False):
            missing_features.append("User display showing admin info")
        else:
            working_features.append("User display showing admin info")
        
        settings_test = self.results["test_results"].get("settings_menu", {})
        if not settings_test.get("gear_icon_found", False):
            missing_features.append("Settings dropdown menu")
        else:
            working_features.append("Settings dropdown menu")
        
        campaign_test = self.results["test_results"].get("campaign_navigation", {})
        if not campaign_test.get("campaign_elements", {}).get("campaign_selector", False):
            missing_features.append("Campaign selector in left sidebar")
        else:
            working_features.append("Campaign selector in left sidebar")
        
        nav_test = self.results["test_results"].get("navigation_flow", {})
        if not nav_test.get("navigation_elements", {}).get("sidebar", False):
            missing_features.append("Left sidebar navigation")
        else:
            working_features.append("Left sidebar navigation")
        
        self.results["summary"] = {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "missing_features": missing_features,
            "working_features": working_features,
            "console_errors_count": len(self.results.get("console_errors", [])),
            "screenshots_taken": len(self.results["screenshots"])
        }
        
        # Print summary
        print(f"\\n{'='*50}")
        print("COMPREHENSIVE TEST RESULTS SUMMARY")
        print(f"{'='*50}")
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Screenshots: {len(self.results['screenshots'])}")
        print(f"Console Errors: {len(self.results.get('console_errors', []))}")
        
        print("\\n--- MISSING FEATURES ---")
        for feature in missing_features:
            print(f"✗ {feature}")
        
        print("\\n--- WORKING FEATURES ---")
        for feature in working_features:
            print(f"✓ {feature}")
    
    def run_all_tests(self):
        """Run all comprehensive tests"""
        print("Starting Comprehensive End-to-End Tests...")
        print(f"Testing application at: {self.base_url}")
        print(f"Admin credentials: {self.admin_email}")
        
        if not self.setup_driver():
            print("Failed to setup browser driver")
            return False
        
        try:
            # Run all tests
            self.test_1_authentication_flow()
            self.test_2_settings_menu_functionality()
            self.test_3_campaign_navigation()
            self.test_4_complete_navigation_flow()
            self.test_5_api_endpoints()
            
            # Check for console errors
            self.check_browser_console_errors()
            
            # Generate summary
            self.generate_summary()
            
            # Save results to file
            results_file = f"/Users/ceverson/Development/new_app_sheets/comprehensive_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(results_file, 'w') as f:
                json.dump(self.results, f, indent=2)
            
            print(f"\\nDetailed results saved to: {results_file}")
            print(f"Screenshots saved to: {self.screenshot_dir}")
            
            return True
            
        except Exception as e:
            print(f"Test execution failed: {str(e)}")
            return False
        
        finally:
            if self.driver:
                self.driver.quit()

def main():
    """Main execution function"""
    tester = ComprehensiveE2ETest()
    success = tester.run_all_tests()
    
    if success:
        print("\\n✓ Comprehensive testing completed successfully")
    else:
        print("\\n✗ Comprehensive testing failed")
    
    return success

if __name__ == "__main__":
    main()
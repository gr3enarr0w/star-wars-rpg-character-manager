#!/usr/bin/env python3
"""
Login Flow Test - Focus specifically on the authentication and post-login features
"""

import time
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

def test_login_flow():
    print("=== LOGIN FLOW TEST ===")
    
    chrome_options = Options()
    chrome_options.add_argument("--window-size=1920,1080")
    # Don't use headless mode so we can see what happens
    
    driver = None
    try:
        driver = webdriver.Chrome(options=chrome_options)
        wait = WebDriverWait(driver, 10)
        
        print("1. Loading homepage...")
        driver.get("http://127.0.0.1:5000")
        time.sleep(3)
        
        # Take screenshot of initial state
        driver.save_screenshot("/Users/ceverson/Development/new_app_sheets/test_screenshots_e2e/login_test_01_initial.png")
        print("   Screenshot saved: login_test_01_initial.png")
        
        # Check for login prompt vs authenticated state
        login_prompt = None
        authenticated_content = None
        
        try:
            login_prompt = driver.find_element(By.ID, "loginPrompt")
            print("   ✓ Login prompt found")
        except NoSuchElementException:
            print("   ✗ Login prompt not found")
        
        try:
            authenticated_content = driver.find_element(By.CSS_SELECTOR, ".auth-required")
            if authenticated_content.is_displayed():
                print("   ✓ Authenticated content is visible")
            else:
                print("   ✓ Authenticated content exists but hidden")
        except NoSuchElementException:
            print("   ✗ Authenticated content not found")
        
        # Look for Login button
        login_button = None
        try:
            # Try different ways to find the login button
            selectors = [
                "a[href='/login']",
                "a:contains('Login')",
                ".btn:contains('Login')",
                "//a[contains(text(), 'Login')]"
            ]
            
            for selector in selectors[:3]:  # CSS selectors
                try:
                    login_button = driver.find_element(By.CSS_SELECTOR, selector)
                    print(f"   ✓ Login button found with CSS selector: {selector}")
                    break
                except NoSuchElementException:
                    continue
            
            if not login_button:
                # Try XPath
                try:
                    login_button = driver.find_element(By.XPATH, "//a[contains(text(), 'Login')]")
                    print("   ✓ Login button found with XPath")
                except NoSuchElementException:
                    print("   ✗ Login button not found")
        except Exception as e:
            print(f"   ✗ Error finding login button: {e}")
        
        if login_button:
            print("2. Clicking login button...")
            try:
                # Scroll to button and click
                driver.execute_script("arguments[0].scrollIntoView();", login_button)
                time.sleep(1)
                login_button.click()
                time.sleep(3)
                
                # Take screenshot after clicking login
                driver.save_screenshot("/Users/ceverson/Development/new_app_sheets/test_screenshots_e2e/login_test_02_after_login_click.png")
                print("   Screenshot saved: login_test_02_after_login_click.png")
                
                # Check if we're on login page
                current_url = driver.current_url
                print(f"   Current URL: {current_url}")
                
                if "/login" in current_url:
                    print("   ✓ Redirected to login page")
                    
                    # Look for login form
                    try:
                        email_input = driver.find_element(By.CSS_SELECTOR, "input[type='email'], input[name='email'], #email")
                        password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password'], input[name='password'], #password")
                        print("   ✓ Login form found with email and password fields")
                        
                        print("3. Filling out login form...")
                        email_input.clear()
                        email_input.send_keys("admin@swrpg.local")
                        password_input.clear()
                        password_input.send_keys("AdminPassword123!@#$")
                        
                        # Take screenshot before submitting
                        driver.save_screenshot("/Users/ceverson/Development/new_app_sheets/test_screenshots_e2e/login_test_03_form_filled.png")
                        print("   Screenshot saved: login_test_03_form_filled.png")
                        
                        # Submit form
                        try:
                            submit_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit'], input[type='submit'], .btn-primary")
                            submit_button.click()
                        except NoSuchElementException:
                            # Try submitting the form directly
                            password_input.submit()
                        
                        print("   ✓ Login form submitted")
                        time.sleep(5)  # Wait for redirect/authentication
                        
                        # Take screenshot after login
                        driver.save_screenshot("/Users/ceverson/Development/new_app_sheets/test_screenshots_e2e/login_test_04_after_submit.png")
                        print("   Screenshot saved: login_test_04_after_submit.png")
                        
                        current_url = driver.current_url
                        print(f"   Current URL after login: {current_url}")
                        
                        # Check for authenticated elements
                        print("4. Checking for authenticated elements...")
                        
                        # Check for gear icon
                        gear_found = False
                        gear_selectors = [
                            "#userMenuToggle",
                            ".user-menu-toggle", 
                            ".gear-icon",
                            "[class*='gear']",
                            "button:contains('⚙️')",
                            "//button[contains(text(), '⚙')]"
                        ]
                        
                        for selector in gear_selectors[:5]:  # CSS first
                            try:
                                gear = driver.find_element(By.CSS_SELECTOR, selector)
                                if gear.is_displayed():
                                    gear_found = True
                                    print(f"   ✓ Gear icon found and visible: {selector}")
                                    break
                            except NoSuchElementException:
                                continue
                        
                        if not gear_found:
                            try:
                                gear = driver.find_element(By.XPATH, "//button[contains(text(), '⚙')]")
                                if gear.is_displayed():
                                    gear_found = True
                                    print("   ✓ Gear icon found with XPath")
                            except NoSuchElementException:
                                print("   ✗ Gear icon not found")
                        
                        # Check for user display
                        user_display_found = False
                        try:
                            user_display = driver.find_element(By.ID, "userDisplay")
                            if user_display.is_displayed():
                                user_text = user_display.text
                                user_display_found = True
                                print(f"   ✓ User display found: '{user_text}'")
                        except NoSuchElementException:
                            print("   ✗ User display not found")
                        
                        # Check for campaign selector
                        campaign_selector_found = False
                        try:
                            campaign_selector = driver.find_element(By.CSS_SELECTOR, ".campaign-selector, #campaignList")
                            if campaign_selector.is_displayed():
                                campaign_selector_found = True
                                print("   ✓ Campaign selector found")
                        except NoSuchElementException:
                            print("   ✗ Campaign selector not found")
                        
                        # Check for sidebar navigation
                        sidebar_found = False
                        try:
                            sidebar = driver.find_element(By.CSS_SELECTOR, ".sidebar, .nav")
                            if sidebar.is_displayed():
                                sidebar_found = True
                                print("   ✓ Sidebar navigation found")
                        except NoSuchElementException:
                            print("   ✗ Sidebar navigation not found")
                        
                        # If gear icon is found, test clicking it
                        if gear_found:
                            print("5. Testing gear icon click...")
                            try:
                                gear = driver.find_element(By.CSS_SELECTOR, "#userMenuToggle")
                                gear.click()
                                time.sleep(2)
                                
                                # Take screenshot with menu open
                                driver.save_screenshot("/Users/ceverson/Development/new_app_sheets/test_screenshots_e2e/login_test_05_gear_menu_open.png")
                                print("   Screenshot saved: login_test_05_gear_menu_open.png")
                                
                                # Check for menu items
                                menu_items = [
                                    ("Profile Settings", "showProfileSettings"),
                                    ("Campaign Management", "showCampaignManagement"),
                                    ("Admin Panel", "href='/admin'"),
                                    ("Two-Factor Authentication", "setup2FA"),
                                    ("Logout", "logout")
                                ]
                                
                                menu_found = {}
                                for item_name, item_identifier in menu_items:
                                    try:
                                        if "onclick" in item_identifier:
                                            element = driver.find_element(By.CSS_SELECTOR, f"[onclick*='{item_identifier.split('(')[0]}']")
                                        elif "href" in item_identifier:
                                            element = driver.find_element(By.CSS_SELECTOR, f"[{item_identifier}]")
                                        else:
                                            element = driver.find_element(By.XPATH, f"//a[contains(text(), '{item_name}')]")
                                        
                                        if element.is_displayed():
                                            menu_found[item_name] = True
                                            print(f"   ✓ Menu item found: {item_name}")
                                        else:
                                            menu_found[item_name] = False
                                            print(f"   ✗ Menu item hidden: {item_name}")
                                    except NoSuchElementException:
                                        menu_found[item_name] = False
                                        print(f"   ✗ Menu item not found: {item_name}")
                                
                                print("\\n--- TEST RESULTS SUMMARY ---")
                                print(f"✓ Authentication: {'SUCCESS' if user_display_found else 'FAILED'}")
                                print(f"✓ Gear Icon: {'FOUND' if gear_found else 'MISSING'}")
                                print(f"✓ User Display: {'FOUND' if user_display_found else 'MISSING'}")
                                print(f"✓ Campaign Selector: {'FOUND' if campaign_selector_found else 'MISSING'}")
                                print(f"✓ Sidebar Navigation: {'FOUND' if sidebar_found else 'MISSING'}")
                                print("\\n--- Settings Menu Items ---")
                                for item, found in menu_found.items():
                                    status = "✓" if found else "✗"
                                    print(f"{status} {item}")
                                
                                return {
                                    "authentication_success": user_display_found,
                                    "gear_icon": gear_found,
                                    "user_display": user_display_found,
                                    "campaign_selector": campaign_selector_found,
                                    "sidebar_navigation": sidebar_found,
                                    "menu_items": menu_found
                                }
                                
                            except Exception as e:
                                print(f"   ✗ Error testing gear icon: {e}")
                        
                    except NoSuchElementException:
                        print("   ✗ Login form not found on login page")
                else:
                    print("   ✗ Not redirected to login page")
            
            except Exception as e:
                print(f"   ✗ Error clicking login button: {e}")
        else:
            print("   ✗ Cannot proceed - login button not found")
        
        return {"error": "Login flow incomplete"}
        
    except Exception as e:
        print(f"✗ Test failed with error: {e}")
        return {"error": str(e)}
    
    finally:
        if driver:
            # Keep browser open for 10 seconds to see the final state
            print("\\nKeeping browser open for 10 seconds to observe final state...")
            time.sleep(10)
            driver.quit()

def main():
    print("Starting Login Flow Test")
    print("="*60)
    
    result = test_login_flow()
    
    print("\\n" + "="*60)
    print("LOGIN FLOW TEST COMPLETE")
    print("="*60)
    
    if "error" not in result:
        working_features = [k for k, v in result.items() if v and k != "menu_items"]
        missing_features = [k for k, v in result.items() if not v and k != "menu_items"]
        
        print(f"\\nWorking Features: {len(working_features)}")
        for feature in working_features:
            print(f"  ✓ {feature.replace('_', ' ').title()}")
        
        print(f"\\nMissing Features: {len(missing_features)}")
        for feature in missing_features:
            print(f"  ✗ {feature.replace('_', ' ').title()}")
        
        if "menu_items" in result:
            working_menu = [k for k, v in result["menu_items"].items() if v]
            missing_menu = [k for k, v in result["menu_items"].items() if not v]
            
            print(f"\\nWorking Menu Items: {len(working_menu)}")
            for item in working_menu:
                print(f"  ✓ {item}")
            
            print(f"\\nMissing Menu Items: {len(missing_menu)}")
            for item in missing_menu:
                print(f"  ✗ {item}")
    else:
        print(f"\\n✗ Test failed: {result['error']}")

if __name__ == "__main__":
    main()
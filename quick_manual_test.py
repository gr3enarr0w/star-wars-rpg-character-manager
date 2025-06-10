#!/usr/bin/env python3
"""
Quick Manual Test - Test key features manually to get immediate results
"""

import time
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_basic_functionality():
    print("=== QUICK MANUAL TEST ===")
    
    # Test 1: Check if homepage loads
    try:
        response = requests.get("http://127.0.0.1:5000")
        if response.status_code == 200:
            print("✓ Homepage loads successfully (status 200)")
            if "Star Wars RPG Character Manager" in response.text:
                print("✓ Homepage contains correct title")
            if "login" in response.text.lower():
                print("✓ Login interface is present")
        else:
            print(f"✗ Homepage failed to load (status {response.status_code})")
    except Exception as e:
        print(f"✗ Failed to access homepage: {e}")
    
    # Test 2: Test API endpoints
    print("\\n--- Testing API Endpoints ---")
    
    # Test campaigns endpoint (should require auth)
    try:
        response = requests.get("http://127.0.0.1:5000/api/campaigns")
        if response.status_code == 401:
            print("✓ /api/campaigns correctly requires authentication (401)")
        elif response.status_code == 200:
            print("✓ /api/campaigns is accessible")
        else:
            print(f"? /api/campaigns returned status {response.status_code}")
    except Exception as e:
        print(f"✗ /api/campaigns failed: {e}")
    
    # Test characters endpoint (should require auth)
    try:
        response = requests.get("http://127.0.0.1:5000/api/characters")
        if response.status_code == 401:
            print("✓ /api/characters correctly requires authentication (401)")
        elif response.status_code == 200:
            print("✓ /api/characters is accessible")
        else:
            print(f"? /api/characters returned status {response.status_code}")
    except Exception as e:
        print(f"✗ /api/characters failed: {e}")

def test_with_browser():
    print("\\n=== BROWSER TEST ===")
    
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    driver = None
    try:
        driver = webdriver.Chrome(options=chrome_options)
        driver.get("http://127.0.0.1:5000")
        
        # Check page title
        title = driver.title
        print(f"✓ Page title: {title}")
        
        # Look for key elements
        elements_found = {}
        
        # Check for login button
        try:
            login_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Login')]")
            elements_found["login_button"] = True
            print("✓ Login button found")
        except:
            elements_found["login_button"] = False
            print("✗ Login button not found")
        
        # Check for gear icon
        gear_selectors = [".gear-icon", "[class*='gear']", "i.fas.fa-cog", ".settings-icon"]
        gear_found = False
        for selector in gear_selectors:
            try:
                gear = driver.find_element(By.CSS_SELECTOR, selector)
                gear_found = True
                elements_found["gear_icon"] = True
                print(f"✓ Gear icon found with selector: {selector}")
                break
            except:
                continue
        
        if not gear_found:
            elements_found["gear_icon"] = False
            print("✗ Gear icon not found")
        
        # Check for navigation elements
        try:
            nav = driver.find_element(By.CSS_SELECTOR, "nav, .navigation, .sidebar")
            elements_found["navigation"] = True
            print("✓ Navigation elements found")
        except:
            elements_found["navigation"] = False
            print("✗ Navigation elements not found")
        
        # Try to click login button to see what happens
        if elements_found["login_button"]:
            print("\\n--- Attempting to access login form ---")
            try:
                login_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Login')]")
                login_btn.click()
                time.sleep(2)
                
                # Check if login form appeared
                try:
                    email_input = driver.find_element(By.CSS_SELECTOR, "input[type='email'], input[name='email']")
                    print("✓ Login form with email input appeared")
                    
                    # Try to login with admin credentials
                    print("--- Attempting admin login ---")
                    password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password'], input[name='password']")
                    
                    email_input.send_keys("admin@swrpg.local")
                    password_input.send_keys("AdminPassword123!@#$")
                    
                    # Submit form
                    try:
                        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit'], input[type='submit']")
                        submit_btn.click()
                        time.sleep(3)
                        
                        # Check if we're now authenticated
                        current_url = driver.current_url
                        page_source = driver.page_source
                        
                        print(f"✓ Login submitted, current URL: {current_url}")
                        
                        # Look for authenticated elements
                        if "admin" in page_source.lower():
                            print("✓ 'admin' text found in page - likely authenticated")
                        if "logout" in page_source.lower():
                            print("✓ 'logout' option found - authentication successful")
                        if "campaign" in page_source.lower():
                            print("✓ 'campaign' text found - main interface loaded")
                        
                    except Exception as e:
                        print(f"✗ Failed to submit login form: {e}")
                
                except Exception as e:
                    print(f"✗ Login form did not appear: {e}")
            
            except Exception as e:
                print(f"✗ Failed to click login button: {e}")
        
        return elements_found
        
    except Exception as e:
        print(f"✗ Browser test failed: {e}")
        return {}
    
    finally:
        if driver:
            driver.quit()

def main():
    print("Starting Quick Manual Test of SWRPG Character Manager")
    print("="*60)
    
    # Test basic functionality
    test_basic_functionality()
    
    # Test with browser  
    elements = test_with_browser()
    
    print("\\n" + "="*60)
    print("QUICK TEST SUMMARY")
    print("="*60)
    
    if elements:
        working_features = [k for k, v in elements.items() if v]
        missing_features = [k for k, v in elements.items() if not v]
        
        print(f"Working Features: {len(working_features)}")
        for feature in working_features:
            print(f"  ✓ {feature}")
        
        print(f"\\nMissing Features: {len(missing_features)}")
        for feature in missing_features:
            print(f"  ✗ {feature}")
    
    return True

if __name__ == "__main__":
    main()
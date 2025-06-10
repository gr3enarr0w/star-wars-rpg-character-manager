#!/usr/bin/env python3
"""
Automated testing script for Star Wars RPG Character Manager
Tests both API endpoints and frontend functionality
"""

import json
import requests
import time
import subprocess
import sys
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException

class StarWarsRPGTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.driver = None
        self.test_character_name = f"Test_Character_{int(time.time())}"
        
    def setup_selenium(self):
        """Setup Chrome WebDriver with appropriate options"""
        try:
            chrome_options = Options()
            chrome_options.add_argument("--headless")  # Remove for visual debugging
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.set_window_size(1920, 1080)
            return True
        except WebDriverException as e:
            print(f"❌ Failed to setup Chrome WebDriver: {e}")
            print("Make sure ChromeDriver is installed and in PATH")
            return False
    
    def test_api_endpoints(self):
        """Test API endpoints directly"""
        print("🧪 Testing API Endpoints...")
        
        tests = []
        
        # Test 1: Get characters (empty list initially)
        try:
            response = requests.get(f"{self.base_url}/api/characters")
            tests.append(("GET /api/characters", response.status_code == 200))
        except Exception as e:
            tests.append(("GET /api/characters", False, str(e)))
        
        # Test 2: Create character
        character_data = {
            "name": self.test_character_name,
            "playerName": "Test Player",
            "species": "Human",
            "career": "Smuggler",
            "background": "Test background"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/characters", 
                json=character_data,
                headers={'Content-Type': 'application/json'}
            )
            tests.append(("POST /api/characters", response.status_code == 200))
            
            if response.status_code == 200:
                character_id = response.json().get('character', {}).get('id')
                
                # Test 3: Award XP
                xp_data = {"amount": 25, "reason": "Test XP award"}
                xp_response = requests.post(
                    f"{self.base_url}/api/characters/{character_id}/award-xp",
                    json=xp_data,
                    headers={'Content-Type': 'application/json'}
                )
                tests.append(("POST award-xp", xp_response.status_code == 200))
                
                # Test 4: Advance characteristic
                char_data = {"characteristic": "Brawn"}
                char_response = requests.post(
                    f"{self.base_url}/api/characters/{character_id}/advance-characteristic",
                    json=char_data,
                    headers={'Content-Type': 'application/json'}
                )
                tests.append(("POST advance-characteristic", char_response.status_code == 200))
                
                # Test 5: Advance skill
                skill_data = {"skill": "Athletics"}
                skill_response = requests.post(
                    f"{self.base_url}/api/characters/{character_id}/advance-skill",
                    json=skill_data,
                    headers={'Content-Type': 'application/json'}
                )
                tests.append(("POST advance-skill", skill_response.status_code == 200))
                
        except Exception as e:
            tests.append(("POST /api/characters", False, str(e)))
        
        # Print results
        for test in tests:
            status = "✅" if test[1] else "❌"
            error = f" - {test[2]}" if len(test) > 2 and not test[1] else ""
            print(f"{status} {test[0]}{error}")
        
        return all(test[1] for test in tests)
    
    def test_frontend_functionality(self):
        """Test frontend functionality using Selenium"""
        if not self.driver:
            print("❌ WebDriver not initialized")
            return False
            
        print("🖥️  Testing Frontend Functionality...")
        
        try:
            # Load the main page
            self.driver.get(self.base_url)
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "container"))
            )
            print("✅ Page loaded successfully")
            
            # Check for JavaScript errors
            logs = self.driver.get_log('browser')
            js_errors = [log for log in logs if log['level'] == 'SEVERE']
            if js_errors:
                print("❌ JavaScript errors found:")
                for error in js_errors:
                    print(f"   {error['message']}")
                return False
            else:
                print("✅ No JavaScript errors found")
            
            # Test character creation
            create_btn = WebDriverWait(self.driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-action='show-create-character']"))
            )
            create_btn.click()
            print("✅ Create character button clicked")
            
            # Fill out character form
            name_input = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.NAME, "name"))
            )
            name_input.send_keys(f"Frontend_Test_{int(time.time())}")
            
            player_input = self.driver.find_element(By.NAME, "playerName")
            player_input.send_keys("Frontend Test Player")
            
            species_select = self.driver.find_element(By.NAME, "species")
            species_select.click()
            human_option = self.driver.find_element(By.CSS_SELECTOR, "option[value='Human']")
            human_option.click()
            
            career_select = self.driver.find_element(By.NAME, "career")
            career_select.click()
            smuggler_option = self.driver.find_element(By.CSS_SELECTOR, "option[value='Smuggler']")
            smuggler_option.click()
            
            # Submit form
            submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            submit_btn.click()
            print("✅ Character creation form submitted")
            
            # Wait for character sheet to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "characteristic-grid"))
            )
            print("✅ Character sheet loaded")
            
            # Test Award XP button
            award_xp_btn = self.driver.find_element(By.CSS_SELECTOR, "[data-action='award-xp']")
            award_xp_btn.click()
            
            # Fill XP form
            xp_input = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.NAME, "amount"))
            )
            xp_input.send_keys("15")
            
            award_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Award XP')]")
            award_btn.click()
            print("✅ XP awarded successfully")
            
            # Test characteristic advancement
            advance_btn = WebDriverWait(self.driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-action='advance-characteristic']"))
            )
            advance_btn.click()
            print("✅ Characteristic advancement clicked")
            
            return True
            
        except TimeoutException as e:
            print(f"❌ Timeout waiting for element: {e}")
            return False
        except Exception as e:
            print(f"❌ Frontend test failed: {e}")
            return False
    
    def check_console_errors(self):
        """Check browser console for errors"""
        if not self.driver:
            return []
            
        try:
            logs = self.driver.get_log('browser')
            errors = []
            for log in logs:
                if log['level'] in ['SEVERE', 'WARNING']:
                    errors.append({
                        'level': log['level'],
                        'message': log['message'],
                        'source': log.get('source', 'unknown')
                    })
            return errors
        except Exception as e:
            print(f"Failed to get console logs: {e}")
            return []
    
    def debug_current_state(self):
        """Debug current application state"""
        print("🔍 Debugging Current Application State...")
        
        if not self.driver:
            return
        
        try:
            self.driver.get(self.base_url)
            time.sleep(2)
            
            # Check if characterManager is loaded
            result = self.driver.execute_script("return typeof characterManager")
            print(f"CharacterManager type: {result}")
            
            # Check if characters are loaded
            result = self.driver.execute_script("return characterManager ? characterManager.characters.length : 'N/A'")
            print(f"Characters loaded: {result}")
            
            # Check current character
            result = self.driver.execute_script("return characterManager ? (characterManager.currentCharacter ? characterManager.currentCharacter.name : 'None') : 'N/A'")
            print(f"Current character: {result}")
            
            # Check for console errors
            errors = self.check_console_errors()
            if errors:
                print("🚨 Console Errors/Warnings:")
                for error in errors:
                    print(f"   [{error['level']}] {error['message']}")
            else:
                print("✅ No console errors found")
                
        except Exception as e:
            print(f"❌ Debug failed: {e}")
    
    def cleanup(self):
        """Cleanup resources"""
        if self.driver:
            self.driver.quit()
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Star Wars RPG Character Manager Tests")
        print("=" * 60)
        
        # Test API endpoints
        api_success = self.test_api_endpoints()
        print()
        
        # Setup Selenium
        if self.setup_selenium():
            # Debug current state
            self.debug_current_state()
            print()
            
            # Test frontend
            frontend_success = self.test_frontend_functionality()
            print()
            
            self.cleanup()
        else:
            frontend_success = False
        
        print("=" * 60)
        print("📊 Test Summary:")
        print(f"API Tests: {'✅ PASSED' if api_success else '❌ FAILED'}")
        print(f"Frontend Tests: {'✅ PASSED' if frontend_success else '❌ FAILED'}")
        
        return api_success and frontend_success

def install_selenium():
    """Install selenium if not available"""
    try:
        import selenium
        return True
    except ImportError:
        print("Installing selenium...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "selenium"])
        return True

if __name__ == "__main__":
    # Install selenium if needed
    if not install_selenium():
        print("Failed to install selenium")
        sys.exit(1)
    
    # Run tests
    tester = StarWarsRPGTester()
    success = tester.run_all_tests()
    
    if not success:
        print("\n🔧 Suggested fixes:")
        print("1. Check browser console for JavaScript errors")
        print("2. Verify API endpoints are working")
        print("3. Check Flask server logs")
        print("4. Ensure all JavaScript methods are properly bound")
        
    sys.exit(0 if success else 1)
#!/usr/bin/env python3
"""Comprehensive Selenium tests for Star Wars RPG Character Manager with authentication."""

import time
import sys
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class ComprehensiveTest:
    def __init__(self):
        self.driver = None
        self.wait = None
        self.base_url = "http://127.0.0.1:8001"
        self.issues = []
        
    def setup_driver(self):
        """Set up Chrome driver."""
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.wait = WebDriverWait(self.driver, 10)
            print("✅ Chrome driver initialized")
            return True
        except Exception as e:
            print(f"❌ Failed to initialize Chrome driver: {e}")
            return False
    
    def log_issue(self, test_name, error_msg):
        """Log a test issue."""
        issue = f"{test_name}: {error_msg}"
        self.issues.append(issue)
        print(f"❌ {issue}")
    
    def log_success(self, test_name):
        """Log a successful test."""
        print(f"✅ {test_name}")
    
    def test_login(self):
        """Test admin login functionality."""
        try:
            print("\n🧪 Testing admin login...")
            self.driver.get(f"{self.base_url}/login")
            
            # Fill login form
            email_field = self.wait.until(EC.presence_of_element_located((By.ID, "email")))
            email_field.send_keys("admin@swrpg.local")
            
            password_field = self.driver.find_element(By.ID, "password")
            password_field.send_keys("AdminPassword123!@#$")
            
            # Submit login
            login_btn = self.driver.find_element(By.ID, "loginBtn")
            login_btn.click()
            
            # Wait for redirect to main page
            self.wait.until(EC.url_contains(self.base_url))
            
            # Check if user info is displayed
            user_display = self.wait.until(EC.presence_of_element_located((By.ID, "userDisplay")))
            if "admin" in user_display.text.lower():
                self.log_success("Admin login")
                return True
            else:
                self.log_issue("Admin login", "User display doesn't show admin")
                return False
                
        except Exception as e:
            self.log_issue("Admin login", str(e))
            return False
    
    def test_character_creation(self):
        """Test character creation."""
        try:
            print("\n🧪 Testing character creation...")
            
            # Click Create Character link
            create_link = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, 'a[data-action="show-create-character"]')))
            create_link.click()
            
            time.sleep(1)
            
            # Fill character form
            name_field = self.wait.until(EC.presence_of_element_located((By.ID, "characterName")))
            name_field.send_keys("Test Character")
            
            player_name_field = self.driver.find_element(By.ID, "playerName")
            player_name_field.send_keys("Test Player")
            
            # Select species
            species_select = Select(self.driver.find_element(By.ID, "species"))
            species_select.select_by_value("Human")
            
            # Select career
            career_select = Select(self.driver.find_element(By.ID, "career"))
            career_select.select_by_value("Smuggler")
            
            # Submit form
            create_btn = self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
            create_btn.click()
            
            time.sleep(2)
            
            # Check if character was created (should redirect to character sheet)
            if "character" in self.driver.current_url or self.driver.find_elements(By.CLASS_NAME, "character-sheet"):
                self.log_success("Character creation")
                return True
            else:
                self.log_issue("Character creation", "Character not created or no redirect")
                return False
                
        except Exception as e:
            self.log_issue("Character creation", str(e))
            return False
    
    def test_character_xp_award(self):
        """Test XP award functionality."""
        try:
            print("\n🧪 Testing XP award functionality...")
            
            # Look for XP award button
            award_xp_btn = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Award XP')]")
            if not award_xp_btn:
                self.log_issue("XP award", "Award XP button not found")
                return False
            
            # Click award XP button
            award_xp_btn[0].click()
            time.sleep(0.5)
            
            # Check for error or success
            error_elements = self.driver.find_elements(By.CLASS_NAME, "error")
            if error_elements and any("failed" in elem.text.lower() for elem in error_elements):
                self.log_issue("XP award", "XP award failed with error message")
                return False
            
            self.log_success("XP award functionality found")
            return True
            
        except Exception as e:
            self.log_issue("XP award", str(e))
            return False
    
    def test_characteristic_modification(self):
        """Test characteristic increase/decrease."""
        try:
            print("\n🧪 Testing characteristic modification...")
            
            # Look for characteristic buttons
            increase_btns = self.driver.find_elements(By.XPATH, "//button[contains(@onclick, 'increaseCharacteristic')]")
            decrease_btns = self.driver.find_elements(By.XPATH, "//button[contains(@onclick, 'decreaseCharacteristic')]")
            
            if not increase_btns and not decrease_btns:
                self.log_issue("Characteristic modification", "No characteristic modification buttons found")
                return False
            
            # Test increase if available
            if increase_btns:
                increase_btns[0].click()
                time.sleep(0.5)
                
                error_elements = self.driver.find_elements(By.CLASS_NAME, "error")
                if error_elements and any("failed" in elem.text.lower() for elem in error_elements):
                    self.log_issue("Characteristic increase", "Characteristic increase failed")
                    return False
            
            # Test decrease if available
            if decrease_btns:
                decrease_btns[0].click()
                time.sleep(0.5)
                
                error_elements = self.driver.find_elements(By.CLASS_NAME, "error")
                if error_elements and any("failed" in elem.text.lower() for elem in error_elements):
                    self.log_issue("Characteristic decrease", "Characteristic decrease failed")
                    return False
            
            self.log_success("Characteristic modification")
            return True
            
        except Exception as e:
            self.log_issue("Characteristic modification", str(e))
            return False
    
    def test_skill_modification(self):
        """Test skill modification."""
        try:
            print("\n🧪 Testing skill modification...")
            
            # Look for skill buttons
            skill_btns = self.driver.find_elements(By.XPATH, "//button[contains(@onclick, 'increaseSkill') or contains(@onclick, 'decreaseSkill')]")
            
            if not skill_btns:
                self.log_issue("Skill modification", "No skill modification buttons found")
                return False
            
            # Test skill modification
            skill_btns[0].click()
            time.sleep(0.5)
            
            error_elements = self.driver.find_elements(By.CLASS_NAME, "error")
            if error_elements and any("failed" in elem.text.lower() for elem in error_elements):
                self.log_issue("Skill modification", "Skill modification failed")
                return False
            
            self.log_success("Skill modification")
            return True
            
        except Exception as e:
            self.log_issue("Skill modification", str(e))
            return False
    
    def test_character_deletion(self):
        """Test character deletion."""
        try:
            print("\n🧪 Testing character deletion...")
            
            # Go back to dashboard
            self.driver.get(self.base_url)
            time.sleep(2)
            
            # Look for delete button
            delete_btns = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Delete') or contains(@onclick, 'deleteCharacter')]")
            
            if not delete_btns:
                self.log_issue("Character deletion", "No delete button found")
                return False
            
            # Click delete (but don't confirm if there's a confirmation)
            delete_btns[0].click()
            time.sleep(0.5)
            
            # Check for confirmation dialog
            confirm_btns = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Yes') or contains(text(), 'Confirm')]")
            if confirm_btns:
                confirm_btns[0].click()
                time.sleep(1)
            
            # Check for error messages
            error_elements = self.driver.find_elements(By.CLASS_NAME, "error")
            if error_elements and any("failed" in elem.text.lower() for elem in error_elements):
                self.log_issue("Character deletion", "Character deletion failed with error")
                return False
            
            self.log_success("Character deletion")
            return True
            
        except Exception as e:
            self.log_issue("Character deletion", str(e))
            return False
    
    def test_admin_invite_creation(self):
        """Test admin invite code creation."""
        try:
            print("\n🧪 Testing admin invite code creation...")
            
            # Look for user menu or admin functions
            user_menu_btn = self.driver.find_elements(By.ID, "userMenuToggle")
            if user_menu_btn:
                user_menu_btn[0].click()
                time.sleep(0.5)
                
                # Look for admin or invite options
                admin_links = self.driver.find_elements(By.XPATH, "//a[contains(text(), 'Admin') or contains(text(), 'Invite')]")
                if not admin_links:
                    self.log_issue("Admin invite creation", "No admin invite creation option found")
                    return False
            else:
                self.log_issue("Admin invite creation", "User menu not found")
                return False
            
            self.log_success("Admin functionality accessible")
            return True
            
        except Exception as e:
            self.log_issue("Admin invite creation", str(e))
            return False
    
    def test_dashboard_button(self):
        """Test dashboard button functionality."""
        try:
            print("\n🧪 Testing dashboard button...")
            
            dashboard_btns = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Dashboard') or contains(@onclick, 'dashboard')]")
            
            if dashboard_btns:
                current_url = self.driver.current_url
                dashboard_btns[0].click()
                time.sleep(1)
                
                # Check if anything happened
                new_url = self.driver.current_url
                if current_url == new_url:
                    self.log_issue("Dashboard button", "Dashboard button does nothing (should be removed)")
                    return False
            
            self.log_success("Dashboard button check")
            return True
            
        except Exception as e:
            self.log_issue("Dashboard button", str(e))
            return False
    
    def run_all_tests(self):
        """Run comprehensive test suite."""
        print("🚀 Starting comprehensive Selenium tests...\n")
        
        if not self.setup_driver():
            return False
        
        try:
            # Test sequence
            tests = [
                self.test_login,
                self.test_character_creation,
                self.test_character_xp_award,
                self.test_characteristic_modification,
                self.test_skill_modification,
                self.test_character_deletion,
                self.test_admin_invite_creation,
                self.test_dashboard_button
            ]
            
            for test in tests:
                try:
                    test()
                    time.sleep(1)  # Brief pause between tests
                except Exception as e:
                    print(f"❌ Test {test.__name__} crashed: {e}")
            
            # Print summary
            print(f"\n📊 Test Summary:")
            print(f"Issues found: {len(self.issues)}")
            
            if self.issues:
                print("\n🔍 Issues to fix:")
                for i, issue in enumerate(self.issues, 1):
                    print(f"  {i}. {issue}")
            else:
                print("🎉 All tests passed!")
            
        finally:
            self.driver.quit()
        
        return len(self.issues) == 0

def main():
    """Run comprehensive tests."""
    tester = ComprehensiveTest()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
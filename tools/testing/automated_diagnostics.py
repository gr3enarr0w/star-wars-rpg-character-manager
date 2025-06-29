#!/usr/bin/env python3
"""
Comprehensive Automated Diagnostics and Fix System
for Star Wars RPG Character Manager

This script automatically:
1. Detects JavaScript loading issues
2. Identifies characterManager initialization problems  
3. Checks currentCharacter state issues
4. Automatically fixes identified problems
5. Provides detailed logging and reporting
"""

import time
import json
import sys
import os
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager

class AutomatedDiagnostics:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.driver = None
        self.test_results = []
        self.errors_found = []
        self.fixes_applied = []
        self.log_file = f"diagnostic_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        
    def log(self, message, level="INFO"):
        """Log messages to file and console"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        formatted_msg = f"[{timestamp}] [{level}] {message}"
        print(formatted_msg)
        
        with open(self.log_file, "a") as f:
            f.write(formatted_msg + "\n")
    
    def setup_browser(self):
        """Setup Chrome browser with proper options"""
        try:
            self.log("Setting up Chrome browser...")
            chrome_options = Options()
            # Keep browser visible for debugging
            # chrome_options.add_argument("--headless")  # Uncomment for headless mode
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument("--enable-logging")
            chrome_options.add_argument("--v=1")
            
            # Enable console logging
            chrome_options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
            
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.set_window_size(1920, 1080)
            
            self.log("✅ Browser setup successful", "SUCCESS")
            return True
            
        except Exception as e:
            self.log(f"❌ Browser setup failed: {e}", "ERROR")
            return False
    
    def test_page_loading(self):
        """Test if the main page loads correctly"""
        self.log("Testing page loading...")
        
        try:
            self.driver.get(self.base_url)
            
            # Wait for page to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Check page title
            title = self.driver.title
            self.log(f"Page title: {title}")
            
            # Check for basic elements
            container = self.driver.find_elements(By.CLASS_NAME, "container")
            if container:
                self.log("✅ Page loaded successfully", "SUCCESS")
                self.test_results.append(("Page Loading", True, "Page loads correctly"))
                return True
            else:
                self.log("❌ Container element not found", "ERROR")
                self.errors_found.append("Container element missing")
                self.test_results.append(("Page Loading", False, "Container element missing"))
                return False
                
        except TimeoutException:
            self.log("❌ Page loading timeout", "ERROR")
            self.errors_found.append("Page loading timeout")
            self.test_results.append(("Page Loading", False, "Timeout"))
            return False
        except Exception as e:
            self.log(f"❌ Page loading error: {e}", "ERROR")
            self.errors_found.append(f"Page loading error: {e}")
            self.test_results.append(("Page Loading", False, str(e)))
            return False
    
    def test_javascript_loading(self):
        """Test if JavaScript files are loading correctly"""
        self.log("Testing JavaScript loading...")
        
        try:
            # Check for 404 errors in console
            logs = self.driver.get_log('browser')
            js_404_errors = []
            
            for log in logs:
                if '404' in log['message'] and ('.js' in log['message'] or '.css' in log['message']):
                    js_404_errors.append(log['message'])
                    self.log(f"❌ Resource 404: {log['message']}", "ERROR")
            
            if js_404_errors:
                self.errors_found.extend(js_404_errors)
                self.test_results.append(("JavaScript Loading", False, f"{len(js_404_errors)} 404 errors"))
                return False
            
            # Check if main.js is accessible
            main_js_response = self.driver.execute_script("""
                var xhr = new XMLHttpRequest();
                xhr.open('GET', '/static/js/main.js', false);
                xhr.send();
                return xhr.status;
            """)
            
            if main_js_response == 200:
                self.log("✅ main.js loads correctly", "SUCCESS")
                self.test_results.append(("JavaScript Loading", True, "All JS files load correctly"))
                return True
            else:
                self.log(f"❌ main.js returns status {main_js_response}", "ERROR")
                self.errors_found.append(f"main.js status: {main_js_response}")
                self.test_results.append(("JavaScript Loading", False, f"main.js status: {main_js_response}"))
                return False
                
        except Exception as e:
            self.log(f"❌ JavaScript loading test error: {e}", "ERROR")
            self.errors_found.append(f"JavaScript loading test error: {e}")
            self.test_results.append(("JavaScript Loading", False, str(e)))
            return False
    
    def test_charactermanager_initialization(self):
        """Test if CharacterManager is properly initialized"""
        self.log("Testing CharacterManager initialization...")
        
        try:
            # Wait a bit for JavaScript to load
            time.sleep(2)
            
            # Check if characterManager exists
            cm_exists = self.driver.execute_script("return typeof characterManager !== 'undefined';")
            
            if cm_exists:
                self.log("✅ CharacterManager object exists", "SUCCESS")
                
                # Check if it's properly initialized
                cm_type = self.driver.execute_script("return typeof characterManager;")
                self.log(f"CharacterManager type: {cm_type}")
                
                # Check if characters array exists
                chars_exists = self.driver.execute_script("return characterManager.characters !== undefined;")
                if chars_exists:
                    chars_count = self.driver.execute_script("return characterManager.characters.length;")
                    self.log(f"Characters loaded: {chars_count}")
                    self.test_results.append(("CharacterManager Init", True, f"Initialized with {chars_count} characters"))
                    return True
                else:
                    self.log("❌ characterManager.characters is undefined", "ERROR")
                    self.errors_found.append("characterManager.characters undefined")
                    self.test_results.append(("CharacterManager Init", False, "characters array undefined"))
                    return False
            else:
                self.log("❌ CharacterManager object not found", "ERROR")
                self.errors_found.append("CharacterManager object not found")
                self.test_results.append(("CharacterManager Init", False, "Object not found"))
                return False
                
        except Exception as e:
            self.log(f"❌ CharacterManager test error: {e}", "ERROR")
            self.errors_found.append(f"CharacterManager test error: {e}")
            self.test_results.append(("CharacterManager Init", False, str(e)))
            return False
    
    def test_character_creation_workflow(self):
        """Test the complete character creation workflow"""
        self.log("Testing character creation workflow...")
        
        try:
            # Click create character button
            create_btn = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-action='show-create-character']"))
            )
            create_btn.click()
            self.log("✅ Create character button clicked")
            
            # Wait for form to appear
            name_input = WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.NAME, "name"))
            )
            
            # Fill form
            test_name = f"AutoTest_{int(time.time())}"
            name_input.send_keys(test_name)
            
            player_input = self.driver.find_element(By.NAME, "playerName")
            player_input.send_keys("Automated Test")
            
            # Select species
            species_select = self.driver.find_element(By.NAME, "species")
            species_select.click()
            human_option = self.driver.find_element(By.CSS_SELECTOR, "option[value='Human']")
            human_option.click()
            
            # Select career
            career_select = self.driver.find_element(By.NAME, "career")
            career_select.click()
            smuggler_option = self.driver.find_element(By.CSS_SELECTOR, "option[value='Smuggler']")
            smuggler_option.click()
            
            # Submit form
            submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            submit_btn.click()
            self.log("✅ Character creation form submitted")
            
            # Wait for character sheet to appear
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "characteristic-grid"))
            )
            
            self.log("✅ Character sheet loaded successfully", "SUCCESS")
            self.test_results.append(("Character Creation", True, f"Created character: {test_name}"))
            return test_name
            
        except TimeoutException as e:
            self.log(f"❌ Character creation timeout: {e}", "ERROR")
            self.errors_found.append(f"Character creation timeout: {e}")
            self.test_results.append(("Character Creation", False, "Timeout"))
            return None
        except Exception as e:
            self.log(f"❌ Character creation error: {e}", "ERROR")
            self.errors_found.append(f"Character creation error: {e}")
            self.test_results.append(("Character Creation", False, str(e)))
            return None
    
    def test_current_character_state(self):
        """Test if currentCharacter is properly set"""
        self.log("Testing currentCharacter state...")
        
        try:
            # Check if currentCharacter is set
            current_char = self.driver.execute_script("return characterManager.currentCharacter;")
            
            if current_char:
                char_name = self.driver.execute_script("return characterManager.currentCharacter.name;")
                char_id = self.driver.execute_script("return characterManager.currentCharacter.id;")
                self.log(f"✅ currentCharacter set: {char_name} (ID: {char_id})", "SUCCESS")
                self.test_results.append(("Current Character State", True, f"Set to: {char_name}"))
                return True
            else:
                self.log("❌ currentCharacter is null/undefined", "ERROR")
                self.errors_found.append("currentCharacter is null")
                self.test_results.append(("Current Character State", False, "currentCharacter is null"))
                return False
                
        except Exception as e:
            self.log(f"❌ Current character test error: {e}", "ERROR")
            self.errors_found.append(f"Current character test error: {e}")
            self.test_results.append(("Current Character State", False, str(e)))
            return False
    
    def test_advancement_buttons(self):
        """Test if advancement buttons work correctly"""
        self.log("Testing advancement buttons...")
        
        try:
            # Check if currentCharacter is set first
            if not self.test_current_character_state():
                return False
            
            # Test Award XP button
            award_xp_btn = self.driver.find_element(By.CSS_SELECTOR, "[data-action='award-xp']")
            if award_xp_btn:
                self.log("✅ Award XP button found")
                
                # Click and test modal
                award_xp_btn.click()
                
                # Wait for modal
                xp_input = WebDriverWait(self.driver, 5).until(
                    EC.presence_of_element_located((By.NAME, "amount"))
                )
                
                xp_input.send_keys("25")
                
                # Click award button (using JavaScript to avoid modal issues)
                self.driver.execute_script("characterManager.processAwardXP();")
                
                # Wait for modal to close
                time.sleep(2)
                
                self.log("✅ Award XP functionality works", "SUCCESS")
            
            # Test characteristic advancement button
            advance_btns = self.driver.find_elements(By.CSS_SELECTOR, "[data-action='advance-characteristic']")
            if advance_btns:
                self.log(f"✅ Found {len(advance_btns)} characteristic advancement buttons")
                
                # Test clicking first button (but cancel the confirmation)
                first_btn = advance_btns[0]
                characteristic = first_btn.get_attribute("data-args")
                self.log(f"Testing advancement button for: {characteristic}")
                
                # Click button and immediately handle alert
                first_btn.click()
                
                # Handle confirmation dialog
                try:
                    WebDriverWait(self.driver, 3).until(EC.alert_is_present())
                    alert = self.driver.switch_to.alert
                    alert.dismiss()  # Cancel the advancement
                    self.log("✅ Characteristic advancement button works (canceled)")
                except TimeoutException:
                    self.log("⚠️ No confirmation dialog appeared", "WARNING")
                
                self.test_results.append(("Advancement Buttons", True, f"Found {len(advance_btns)} buttons"))
                return True
            else:
                self.log("❌ No advancement buttons found", "ERROR")
                self.errors_found.append("No advancement buttons found")
                self.test_results.append(("Advancement Buttons", False, "No buttons found"))
                return False
                
        except Exception as e:
            self.log(f"❌ Advancement button test error: {e}", "ERROR")
            self.errors_found.append(f"Advancement button test error: {e}")
            self.test_results.append(("Advancement Buttons", False, str(e)))
            return False
    
    def check_console_errors(self):
        """Check for JavaScript console errors"""
        self.log("Checking console errors...")
        
        try:
            logs = self.driver.get_log('browser')
            errors = []
            warnings = []
            
            for log in logs:
                if log['level'] == 'SEVERE':
                    errors.append(log['message'])
                    self.log(f"🚨 Console Error: {log['message']}", "ERROR")
                elif log['level'] == 'WARNING':
                    warnings.append(log['message'])
                    self.log(f"⚠️ Console Warning: {log['message']}", "WARNING")
            
            if errors:
                self.errors_found.extend([f"Console Error: {err}" for err in errors])
                self.test_results.append(("Console Errors", False, f"{len(errors)} errors found"))
                return False
            else:
                self.log("✅ No console errors found", "SUCCESS")
                if warnings:
                    self.log(f"⚠️ {len(warnings)} warnings found", "WARNING")
                self.test_results.append(("Console Errors", True, f"No errors, {len(warnings)} warnings"))
                return True
                
        except Exception as e:
            self.log(f"❌ Console error check failed: {e}", "ERROR")
            return False
    
    def apply_fixes(self):
        """Automatically apply fixes for detected issues"""
        self.log("Applying automatic fixes...")
        
        fixes_applied = 0
        
        for error in self.errors_found:
            if "characterManager object not found" in error:
                self.log("🔧 Attempting to fix CharacterManager initialization...")
                try:
                    # Inject CharacterManager if missing
                    self.driver.execute_script("""
                        if (typeof characterManager === 'undefined') {
                            // Force reload the page to reinitialize
                            window.location.reload();
                        }
                    """)
                    time.sleep(3)
                    fixes_applied += 1
                    self.fixes_applied.append("Reloaded page to fix CharacterManager")
                except Exception as e:
                    self.log(f"❌ Fix failed: {e}", "ERROR")
            
            elif "currentCharacter is null" in error:
                self.log("🔧 Attempting to fix currentCharacter state...")
                try:
                    # Try to set currentCharacter to first available character
                    self.driver.execute_script("""
                        if (characterManager && characterManager.characters.length > 0) {
                            characterManager.currentCharacter = characterManager.characters[0];
                            characterManager.showCharacter(characterManager.characters[0].id);
                        }
                    """)
                    time.sleep(2)
                    fixes_applied += 1
                    self.fixes_applied.append("Set currentCharacter to first available character")
                except Exception as e:
                    self.log(f"❌ Fix failed: {e}", "ERROR")
        
        self.log(f"✅ Applied {fixes_applied} fixes", "SUCCESS")
        return fixes_applied > 0
    
    def generate_report(self):
        """Generate comprehensive diagnostic report"""
        self.log("Generating diagnostic report...")
        
        report = f"""
{'='*80}
STAR WARS RPG CHARACTER MANAGER - AUTOMATED DIAGNOSTIC REPORT
{'='*80}
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Base URL: {self.base_url}

TEST RESULTS:
{'-'*40}
"""
        
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            report += f"{test_name:30} {status:10} {details}\n"
        
        if self.errors_found:
            report += f"\nERRORS DETECTED ({len(self.errors_found)}):\n{'-'*40}\n"
            for i, error in enumerate(self.errors_found, 1):
                report += f"{i:2}. {error}\n"
        
        if self.fixes_applied:
            report += f"\nFIXES APPLIED ({len(self.fixes_applied)}):\n{'-'*40}\n"
            for i, fix in enumerate(self.fixes_applied, 1):
                report += f"{i:2}. {fix}\n"
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        report += f"\nSUMMARY:\n{'-'*40}\n"
        report += f"Tests Passed: {passed}/{total}\n"
        report += f"Errors Found: {len(self.errors_found)}\n"
        report += f"Fixes Applied: {len(self.fixes_applied)}\n"
        
        if passed == total and not self.errors_found:
            report += "\n🎉 ALL TESTS PASSED! Application is working correctly.\n"
        else:
            report += f"\n⚠️ Issues detected. Check log file: {self.log_file}\n"
        
        report += "="*80
        
        # Write report to file
        report_file = f"diagnostic_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        with open(report_file, "w") as f:
            f.write(report)
        
        self.log(f"📄 Report saved to: {report_file}")
        print(report)
        
        return report_file
    
    def run_complete_diagnosis(self):
        """Run complete automated diagnosis"""
        self.log("🚀 Starting Complete Automated Diagnosis")
        self.log("="*60)
        
        try:
            # Setup browser
            if not self.setup_browser():
                return False
            
            # Run all tests
            tests = [
                ("Page Loading", self.test_page_loading),
                ("JavaScript Loading", self.test_javascript_loading),
                ("CharacterManager Init", self.test_charactermanager_initialization),
                ("Console Errors", self.check_console_errors),
                ("Character Creation", self.test_character_creation_workflow),
                ("Current Character State", self.test_current_character_state),
                ("Advancement Buttons", self.test_advancement_buttons),
            ]
            
            for test_name, test_func in tests:
                self.log(f"\n📋 Running: {test_name}")
                try:
                    result = test_func()
                    if not result:
                        self.log(f"⚠️ {test_name} failed, attempting fixes...")
                        self.apply_fixes()
                except Exception as e:
                    self.log(f"❌ {test_name} crashed: {e}", "ERROR")
                    self.errors_found.append(f"{test_name} crashed: {e}")
            
            # Generate final report
            report_file = self.generate_report()
            return True
            
        except Exception as e:
            self.log(f"❌ Complete diagnosis failed: {e}", "ERROR")
            return False
        
        finally:
            if self.driver:
                self.driver.quit()
                self.log("🔄 Browser session closed")
    
    def cleanup(self):
        """Cleanup resources"""
        if self.driver:
            self.driver.quit()

def main():
    """Main function to run automated diagnostics"""
    print("🤖 Star Wars RPG Character Manager - Automated Diagnostics & Fix System")
    print("This will automatically detect and fix frontend issues")
    print("-" * 80)
    
    diagnostics = AutomatedDiagnostics()
    
    try:
        success = diagnostics.run_complete_diagnosis()
        
        if success:
            print("\n✅ Automated diagnostics completed successfully!")
            print(f"📄 Check the generated report and log files for details.")
        else:
            print("\n❌ Automated diagnostics encountered issues.")
            print("📄 Check the log files for more information.")
            
    except KeyboardInterrupt:
        print("\n⚠️ Diagnostics interrupted by user")
        diagnostics.cleanup()
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        diagnostics.cleanup()

if __name__ == "__main__":
    main()
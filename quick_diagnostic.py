#!/usr/bin/env python3
"""
Quick Diagnostic Tool for Star Wars RPG Character Manager
Tests API endpoints and provides frontend debugging guidance
"""

import urllib.request
import urllib.parse
import json
import time
import os
from datetime import datetime

class QuickDiagnostics:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.issues_found = []
        self.fixes_applied = []
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        prefix = {
            "INFO": "ℹ️ ",
            "SUCCESS": "✅",
            "ERROR": "❌",
            "WARNING": "⚠️ ",
            "FIX": "🔧"
        }.get(level, "")
        
        print(f"[{timestamp}] {prefix} {message}")
        
    def test_api_endpoint(self, endpoint, method='GET', data=None):
        """Test an API endpoint"""
        try:
            url = f"{self.base_url}{endpoint}"
            if data:
                data = json.dumps(data).encode('utf-8')
                
            req = urllib.request.Request(url, data=data, method=method)
            req.add_header('Content-Type', 'application/json')
            
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                return response.status, result
        except urllib.error.HTTPError as e:
            try:
                error_data = json.loads(e.read().decode('utf-8'))
                return e.code, error_data
            except:
                return e.code, {'error': str(e)}
        except Exception as e:
            return 0, {'error': str(e)}
    
    def test_static_files(self):
        """Test if static files are accessible"""
        self.log("Testing static file accessibility...")
        
        files_to_test = [
            "/",
            "/static/css/main.css",
            "/static/js/main.js"
        ]
        
        all_good = True
        for file_path in files_to_test:
            try:
                response = urllib.request.urlopen(f"{self.base_url}{file_path}")
                if response.status == 200:
                    self.log(f"✅ {file_path} - OK", "SUCCESS")
                else:
                    self.log(f"❌ {file_path} - Status {response.status}", "ERROR")
                    self.issues_found.append(f"Static file {file_path} returns {response.status}")
                    all_good = False
            except Exception as e:
                self.log(f"❌ {file_path} - Error: {e}", "ERROR")
                self.issues_found.append(f"Static file {file_path} error: {e}")
                all_good = False
        
        return all_good
    
    def test_api_functionality(self):
        """Test core API functionality"""
        self.log("Testing API functionality...")
        
        # Test 1: Get characters
        status, data = self.test_api_endpoint("/api/characters")
        if status == 200:
            char_count = len(data.get('characters', []))
            self.log(f"✅ GET /api/characters - {char_count} characters found", "SUCCESS")
            
            # Test character creation
            test_char = {
                "name": f"DiagTest_{int(time.time())}",
                "playerName": "Diagnostic Test",
                "species": "Human",
                "career": "Smuggler",
                "background": "Test character"
            }
            
            status, data = self.test_api_endpoint("/api/characters", 'POST', test_char)
            if status == 200:
                char_id = data['character']['id']
                self.log(f"✅ POST /api/characters - Created {char_id}", "SUCCESS")
                
                # Test XP award
                xp_data = {"amount": 25, "reason": "Diagnostic test"}
                status, data = self.test_api_endpoint(f"/api/characters/{urllib.parse.quote(char_id)}/award-xp", 'POST', xp_data)
                if status == 200:
                    self.log("✅ XP award works", "SUCCESS")
                else:
                    self.log(f"❌ XP award failed: {status}", "ERROR")
                    self.issues_found.append(f"XP award API error: {status}")
                
                # Test characteristic advancement
                char_data = {"characteristic": "Brawn"}
                status, data = self.test_api_endpoint(f"/api/characters/{urllib.parse.quote(char_id)}/advance-characteristic", 'POST', char_data)
                if status == 200:
                    self.log("✅ Characteristic advancement works", "SUCCESS")
                    return True
                else:
                    self.log(f"❌ Characteristic advancement failed: {status}", "ERROR")
                    self.issues_found.append(f"Characteristic advancement API error: {status}")
                    
            else:
                self.log(f"❌ Character creation failed: {status}", "ERROR")
                self.issues_found.append(f"Character creation API error: {status}")
                
        else:
            self.log(f"❌ GET /api/characters failed: {status}", "ERROR")
            self.issues_found.append(f"Character list API error: {status}")
            
        return False
    
    def check_javascript_content(self):
        """Check JavaScript file content for common issues"""
        self.log("Analyzing JavaScript content...")
        
        try:
            js_url = f"{self.base_url}/static/js/main.js"
            with urllib.request.urlopen(js_url) as response:
                js_content = response.read().decode('utf-8')
                
            # Check for key components
            checks = [
                ("CharacterManager class", "class CharacterManager"),
                ("constructor method", "constructor()"),
                ("advanceCharacteristic method", "advanceCharacteristic("),
                ("advanceSkill method", "advanceSkill("),
                ("showCharacter method", "showCharacter("),
                ("currentCharacter property", "this.currentCharacter"),
                ("DOMContentLoaded listener", "DOMContentLoaded"),
                ("characterManager initialization", "characterManager = new CharacterManager")
            ]
            
            missing_components = []
            for description, pattern in checks:
                if pattern in js_content:
                    self.log(f"✅ {description} found", "SUCCESS")
                else:
                    self.log(f"❌ {description} missing", "ERROR")
                    missing_components.append(description)
                    self.issues_found.append(f"JavaScript missing: {description}")
            
            return len(missing_components) == 0
            
        except Exception as e:
            self.log(f"❌ Failed to analyze JavaScript: {e}", "ERROR")
            self.issues_found.append(f"JavaScript analysis error: {e}")
            return False
    
    def create_frontend_test_page(self):
        """Create a test page to diagnose frontend issues"""
        self.log("Creating frontend diagnostic test page...", "FIX")
        
        test_page_content = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Frontend Diagnostic Test</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeeba; }
        .test-section { margin: 20px 0; padding: 15px; background: white; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        button { margin: 5px; padding: 8px 15px; background: #007cba; color: white; border: none; border-radius: 3px; cursor: pointer; }
        button:hover { background: #005a87; }
        #console-output { background: #000; color: #00ff00; padding: 10px; font-family: monospace; max-height: 200px; overflow-y: auto; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🔍 Frontend Diagnostic Test</h1>
    <p>This page will automatically test frontend functionality and report issues.</p>
    
    <div class="test-section">
        <h3>Test Results</h3>
        <div id="test-results"></div>
        <button onclick="runAllTests()">Run All Tests</button>
        <button onclick="clearResults()">Clear Results</button>
    </div>
    
    <div class="test-section">
        <h3>Console Output</h3>
        <div id="console-output"></div>
    </div>
    
    <script>
        function logResult(message, type = 'info') {
            const resultsDiv = document.getElementById('test-results');
            const resultDiv = document.createElement('div');
            resultDiv.className = `test-result ${type}`;
            resultDiv.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            resultsDiv.appendChild(resultDiv);
            
            // Also log to console output
            const consoleDiv = document.getElementById('console-output');
            consoleDiv.innerHTML += `<div>[${new Date().toLocaleTimeString()}] ${message}</div>`;
            consoleDiv.scrollTop = consoleDiv.scrollHeight;
        }
        
        function testCharacterManagerExists() {
            try {
                // Try to access the main app
                const mainWindow = window.opener || window.parent;
                if (mainWindow && mainWindow !== window) {
                    if (typeof mainWindow.characterManager !== 'undefined') {
                        logResult('✅ CharacterManager found in parent window', 'success');
                        return mainWindow.characterManager;
                    }
                }
                
                // Try in current window
                if (typeof characterManager !== 'undefined') {
                    logResult('✅ CharacterManager found in current window', 'success');
                    return characterManager;
                }
                
                logResult('❌ CharacterManager not found', 'error');
                return null;
            } catch (e) {
                logResult(`❌ Error accessing CharacterManager: ${e.message}`, 'error');
                return null;
            }
        }
        
        async function testAPI() {
            logResult('Testing API endpoints...', 'info');
            
            try {
                const response = await fetch('http://localhost:8000/api/characters');
                if (response.ok) {
                    const data = await response.json();
                    logResult(`✅ API working: ${data.characters.length} characters found`, 'success');
                    return true;
                } else {
                    logResult(`❌ API error: ${response.status}`, 'error');
                    return false;
                }
            } catch (e) {
                logResult(`❌ API connection failed: ${e.message}`, 'error');
                return false;
            }
        }
        
        function testMainAppConnectivity() {
            logResult('Testing main app connectivity...', 'info');
            
            try {
                // Open main app and test
                const mainApp = window.open('http://localhost:8000', 'mainApp', 'width=1200,height=800');
                
                setTimeout(() => {
                    try {
                        if (mainApp.characterManager) {
                            logResult('✅ Main app loads and CharacterManager initializes', 'success');
                            
                            // Test character loading
                            const charCount = mainApp.characterManager.characters.length;
                            logResult(`✅ Characters loaded: ${charCount}`, 'success');
                            
                            // Test current character
                            if (mainApp.characterManager.currentCharacter) {
                                logResult(`✅ Current character: ${mainApp.characterManager.currentCharacter.name}`, 'success');
                            } else {
                                logResult('⚠️ No current character selected', 'warning');
                            }
                            
                        } else {
                            logResult('❌ CharacterManager not initialized in main app', 'error');
                        }
                    } catch (e) {
                        logResult(`❌ Error testing main app: ${e.message}`, 'error');
                    }
                }, 3000);
                
            } catch (e) {
                logResult(`❌ Failed to open main app: ${e.message}`, 'error');
            }
        }
        
        async function runAllTests() {
            logResult('🚀 Starting automated frontend tests...', 'info');
            
            // Test 1: API connectivity
            await testAPI();
            
            // Test 2: CharacterManager
            testCharacterManagerExists();
            
            // Test 3: Main app connectivity
            testMainAppConnectivity();
            
            logResult('✅ All tests completed', 'success');
        }
        
        function clearResults() {
            document.getElementById('test-results').innerHTML = '';
            document.getElementById('console-output').innerHTML = '';
        }
        
        // Auto-run tests on page load
        window.addEventListener('load', () => {
            setTimeout(runAllTests, 1000);
        });
    </script>
</body>
</html>'''
        
        test_file_path = "/Users/ceverson/Development/new_app_sheets/frontend_diagnostic.html"
        with open(test_file_path, "w") as f:
            f.write(test_page_content)
        
        self.log(f"✅ Created diagnostic test page: {test_file_path}", "SUCCESS")
        self.fixes_applied.append(f"Created diagnostic test page: {test_file_path}")
        return test_file_path
    
    def suggest_fixes(self):
        """Suggest fixes based on found issues"""
        self.log("Analyzing issues and suggesting fixes...", "FIX")
        
        if not self.issues_found:
            self.log("✅ No issues found - application appears to be working correctly!", "SUCCESS")
            return
        
        self.log(f"Found {len(self.issues_found)} issues. Generating fixes...", "WARNING")
        
        for issue in self.issues_found:
            if "JavaScript missing" in issue:
                self.log("🔧 Fix: Check main.js file integrity and ensure all methods are present", "FIX")
                self.fixes_applied.append("Suggested: Check JavaScript file integrity")
            
            elif "Static file" in issue and "404" in issue:
                self.log("🔧 Fix: Ensure Flask static file serving is configured correctly", "FIX")
                self.fixes_applied.append("Suggested: Check Flask static file configuration")
            
            elif "API error" in issue:
                self.log("🔧 Fix: Check Flask server is running and API endpoints are working", "FIX")
                self.fixes_applied.append("Suggested: Verify Flask server and API endpoints")
            
            elif "CharacterManager" in issue:
                self.log("🔧 Fix: Check JavaScript loading order and initialization", "FIX")
                self.fixes_applied.append("Suggested: Check JavaScript initialization")
    
    def run_diagnostics(self):
        """Run complete diagnostics"""
        self.log("🤖 Starting Quick Frontend Diagnostics")
        self.log("=" * 60)
        
        # Test static files
        static_ok = self.test_static_files()
        
        # Test API
        api_ok = self.test_api_functionality()
        
        # Check JavaScript
        js_ok = self.check_javascript_content()
        
        # Create diagnostic test page
        test_page = self.create_frontend_test_page()
        
        # Suggest fixes
        self.suggest_fixes()
        
        # Summary
        self.log("=" * 60)
        self.log("📊 DIAGNOSTIC SUMMARY")
        self.log(f"Static Files: {'✅ OK' if static_ok else '❌ Issues'}")
        self.log(f"API Functionality: {'✅ OK' if api_ok else '❌ Issues'}")
        self.log(f"JavaScript Content: {'✅ OK' if js_ok else '❌ Issues'}")
        self.log(f"Issues Found: {len(self.issues_found)}")
        self.log(f"Fixes Applied: {len(self.fixes_applied)}")
        
        if static_ok and api_ok and js_ok:
            self.log("🎉 All backend tests passed! Frontend issues may be browser-specific.")
            self.log(f"📄 Open the diagnostic test page for browser testing: file://{test_page}")
        else:
            self.log("⚠️ Issues detected. Check the suggestions above.")
        
        self.log("=" * 60)
        self.log("🔧 NEXT STEPS:")
        self.log("1. Open the diagnostic test page in your browser")
        self.log("2. Check the console for JavaScript errors") 
        self.log("3. Test the main application with browser dev tools open")
        self.log("4. If issues persist, the automated test page will help identify them")

def main():
    print("🚀 Star Wars RPG Character Manager - Quick Diagnostics")
    print("This will test the application and identify frontend issues")
    print("-" * 80)
    
    diagnostics = QuickDiagnostics()
    diagnostics.run_diagnostics()

if __name__ == "__main__":
    main()
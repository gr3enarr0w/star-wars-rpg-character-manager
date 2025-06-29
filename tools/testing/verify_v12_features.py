#!/usr/bin/env python3
"""
V1.2 Feature Verification Script

This script verifies that all v1.2 features are properly implemented:
- Enhanced loading states with skeleton screens
- Engaging empty states with clear CTAs
- Font contrast and accessibility improvements
- Mobile responsive design enhancements
- Restructured settings page architecture
- Enhanced campaign filtering and selection
- Complete dark/light theme system
"""

import os
import sys
import subprocess
import time
import requests
import json
from pathlib import Path

def check_file_exists(filepath, description):
    """Check if a file exists and report status"""
    if os.path.exists(filepath):
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ {description}: {filepath} (MISSING)")
        return False

def check_css_feature(filepath, feature_name, css_selectors):
    """Check if CSS features are implemented"""
    if not os.path.exists(filepath):
        print(f"❌ CSS file missing: {filepath}")
        return False
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    missing_selectors = []
    for selector in css_selectors:
        if selector not in content:
            missing_selectors.append(selector)
    
    if missing_selectors:
        print(f"❌ {feature_name}: Missing CSS selectors: {missing_selectors}")
        return False
    else:
        print(f"✅ {feature_name}: All required CSS selectors found")
        return True

def check_html_feature(filepath, feature_name, html_patterns):
    """Check if HTML features are implemented"""
    if not os.path.exists(filepath):
        print(f"❌ HTML file missing: {filepath}")
        return False
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    missing_patterns = []
    for pattern in html_patterns:
        if pattern not in content:
            missing_patterns.append(pattern)
    
    if missing_patterns:
        print(f"❌ {feature_name}: Missing HTML patterns: {missing_patterns}")
        return False
    else:
        print(f"✅ {feature_name}: All required HTML patterns found")
        return True

def start_web_server():
    """Start the web server for testing"""
    print("🚀 Starting web server...")
    process = subprocess.Popen(['python', 'run_web.py'], 
                             stdout=subprocess.PIPE, 
                             stderr=subprocess.PIPE,
                             cwd='/Users/ceverson/Development/new_app_sheets')
    time.sleep(3)  # Give server time to start
    return process

def check_web_endpoints():
    """Check if web endpoints are responding"""
    base_url = "http://localhost:8000"
    endpoints = [
        "/",
        "/login", 
        "/profile",
        "/campaigns",
        "/static/css/main.css"
    ]
    
    results = {}
    for endpoint in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            if response.status_code in [200, 401]:  # 401 is expected for protected routes
                print(f"✅ Endpoint accessible: {endpoint} (status: {response.status_code})")
                results[endpoint] = True
            else:
                print(f"❌ Endpoint error: {endpoint} (status: {response.status_code})")
                results[endpoint] = False
        except Exception as e:
            print(f"❌ Endpoint failed: {endpoint} ({str(e)})")
            results[endpoint] = False
    
    return results

def verify_v12_features():
    """Main verification function"""
    print("=" * 60)
    print("V1.2 FEATURE VERIFICATION")
    print("=" * 60)
    
    base_path = "/Users/ceverson/Development/new_app_sheets"
    web_path = f"{base_path}/web"
    
    results = {
        "files_exist": 0,
        "files_total": 0,
        "features_working": 0,
        "features_total": 0
    }
    
    # 1. Enhanced Loading States with Skeleton Screens
    print("\n1️⃣ ENHANCED LOADING STATES")
    css_check = check_css_feature(
        f"{web_path}/static/css/main.css",
        "Skeleton Screens",
        [".skeleton", ".skeleton-card", "@keyframes skeleton-loading"]
    )
    html_check = check_html_feature(
        f"{web_path}/templates/dashboard.html",
        "Dashboard Loading States",
        ["skeleton-card", "loading-state"]
    )
    if css_check and html_check:
        results["features_working"] += 1
    results["features_total"] += 1
    
    # 2. Engaging Empty States
    print("\n2️⃣ ENGAGING EMPTY STATES")
    empty_state_check = check_html_feature(
        f"{web_path}/templates/dashboard.html",
        "Empty States",
        ["empty-state", "empty-state-icon", "Create Your First Character"]
    )
    if empty_state_check:
        results["features_working"] += 1
    results["features_total"] += 1
    
    # 3. Font Contrast and Accessibility
    print("\n3️⃣ ACCESSIBILITY IMPROVEMENTS")
    accessibility_check = check_css_feature(
        f"{web_path}/static/css/main.css",
        "Accessibility Features",
        ["skip-link", ":focus", "sr-only", "prefers-reduced-motion"]
    )
    if accessibility_check:
        results["features_working"] += 1
    results["features_total"] += 1
    
    # 4. Mobile Responsive Design
    print("\n4️⃣ MOBILE RESPONSIVE DESIGN")
    responsive_check = check_css_feature(
        f"{web_path}/static/css/main.css",
        "Responsive Design",
        ["@media (max-width: 480px)", "@media (max-width: 768px)", "min-height: 44px"]
    )
    if responsive_check:
        results["features_working"] += 1
    results["features_total"] += 1
    
    # 5. Settings Page Architecture
    print("\n5️⃣ SETTINGS PAGE ARCHITECTURE")
    settings_check = check_html_feature(
        f"{web_path}/templates/profile.html",
        "Settings Tabs",
        ["tab-profile", "tab-security", "tab-preferences", "settings-tab"]
    )
    if settings_check:
        results["features_working"] += 1
    results["features_total"] += 1
    
    # 6. Campaign Filtering
    print("\n6️⃣ CAMPAIGN FILTERING")
    campaign_check = check_html_feature(
        f"{web_path}/templates/campaigns.html",
        "Campaign Filtering",
        ["campaign-search", "role-filter", "system-filter", "applyFilters"]
    )
    if campaign_check:
        results["features_working"] += 1
    results["features_total"] += 1
    
    # 7. Theme System
    print("\n7️⃣ DARK/LIGHT THEME SYSTEM")
    theme_css_check = check_css_feature(
        f"{web_path}/static/css/main.css",
        "Theme System",
        ["[data-theme=\"dark\"]", "/* Light Theme (Default) */", "[data-theme=\"auto\"]", "--primary-color"]
    )
    theme_js_check = check_html_feature(
        f"{web_path}/templates/base.html",
        "Theme JavaScript",
        ["toggleTheme", "applyTheme", "initTheme"]
    )
    if theme_css_check and theme_js_check:
        results["features_working"] += 1
    results["features_total"] += 1
    
    # Web Server Test
    print("\n🌐 WEB SERVER VERIFICATION")
    server_process = None
    try:
        server_process = start_web_server()
        endpoint_results = check_web_endpoints()
        working_endpoints = sum(1 for v in endpoint_results.values() if v)
        total_endpoints = len(endpoint_results)
        print(f"📊 Endpoints working: {working_endpoints}/{total_endpoints}")
        
    except Exception as e:
        print(f"❌ Server test failed: {e}")
    finally:
        if server_process:
            server_process.terminate()
            time.sleep(1)
    
    # Summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    print(f"✅ Features implemented: {results['features_working']}/{results['features_total']}")
    
    if results['features_working'] == results['features_total']:
        print("🎉 ALL V1.2 FEATURES SUCCESSFULLY IMPLEMENTED!")
        return True
    else:
        print(f"⚠️  {results['features_total'] - results['features_working']} features need attention")
        return False

if __name__ == "__main__":
    success = verify_v12_features()
    sys.exit(0 if success else 1)
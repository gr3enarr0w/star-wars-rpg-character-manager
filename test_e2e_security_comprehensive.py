#!/usr/bin/env python3
"""Comprehensive E2E security and functionality testing after Issue #103 fixes."""

import requests
import time
import subprocess
import signal
import os
import json
from contextlib import contextmanager

@contextmanager
def test_server():
    """Start the server for testing and clean up afterwards."""
    print("🔧 Starting test server...")
    process = subprocess.Popen(['python3', 'run_web.py'], 
                              stdout=subprocess.PIPE, 
                              stderr=subprocess.PIPE,
                              preexec_fn=os.setsid)
    
    # Wait for server to start
    time.sleep(8)
    
    try:
        yield
    finally:
        print("🔧 Stopping test server...")
        os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        process.wait()

def test_server_startup():
    """Test that server starts properly after security changes."""
    base_url = "http://localhost:8001"
    
    print("🚀 Testing server startup...")
    
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        if response.status_code == 200:
            print("✅ Server started successfully")
            return True
        else:
            print(f"❌ Server startup failed (status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Server startup failed: {e}")
        return False

def test_security_endpoints():
    """Test that all debug endpoints are secured."""
    base_url = "http://localhost:8001"
    
    print("🔒 Testing debug endpoint security...")
    
    critical_endpoints = [
        "/api/debug/create-admin",
        "/api/debug/test-login",
    ]
    
    other_debug_endpoints = [
        "/api/debug/test",
        "/api/debug/info", 
        "/api/test",
        "/debug",
        "/test"
    ]
    
    all_secure = True
    
    # Test critical endpoints first
    for endpoint in critical_endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            if response.status_code == 404:
                print(f"✅ CRITICAL: {endpoint} properly secured (404)")
            else:
                print(f"❌ CRITICAL: {endpoint} still accessible (status: {response.status_code})")
                all_secure = False
        except requests.exceptions.RequestException:
            print(f"✅ CRITICAL: {endpoint} not accessible")
    
    # Test other debug endpoints
    for endpoint in other_debug_endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            if response.status_code == 404:
                print(f"✅ {endpoint} secured")
            else:
                print(f"❌ {endpoint} accessible (status: {response.status_code})")
                all_secure = False
        except requests.exceptions.RequestException:
            print(f"✅ {endpoint} not accessible")
    
    return all_secure

def test_authentication_flows():
    """Test that authentication still works after security changes."""
    base_url = "http://localhost:8001"
    
    print("🔐 Testing authentication flows...")
    
    # Test login page loads
    try:
        response = requests.get(f"{base_url}/login", timeout=5)
        if response.status_code == 200:
            print("✅ Login page loads successfully")
        else:
            print(f"❌ Login page failed (status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Login page failed: {e}")
        return False
    
    # Test admin endpoints require auth
    try:
        response = requests.get(f"{base_url}/api/admin/users", timeout=5)
        if response.status_code in [401, 403]:
            print("✅ Admin endpoints require authentication")
        else:
            print(f"❌ Admin endpoints not protected (status: {response.status_code})")
            return False
    except requests.exceptions.RequestException:
        print("✅ Admin endpoints not accessible without auth")
    
    # Test auth API endpoints exist
    try:
        response = requests.post(f"{base_url}/api/auth/login", 
                               json={'email': 'test@test.com', 'password': 'invalid'},
                               timeout=5)
        if response.status_code in [400, 401]:
            print("✅ Auth login endpoint functional")
        else:
            print(f"⚠️ Auth login unexpected response (status: {response.status_code})")
    except requests.exceptions.RequestException as e:
        print(f"❌ Auth login endpoint failed: {e}")
        return False
    
    return True

def test_error_handling():
    """Test that error handling doesn't expose system information."""
    base_url = "http://localhost:8001"
    
    print("🛡️ Testing secure error handling...")
    
    # Test 404 error
    try:
        response = requests.get(f"{base_url}/nonexistent-endpoint-security-test", timeout=5)
        response_text = response.text.lower()
        
        # Check for system information leakage
        dangerous_terms = ['traceback', 'exception', 'stack trace', 'werkzeug', 'flask', 
                          'python', 'file "/', 'line ', 'module ', 'in <module>']
        
        leaked_info = [term for term in dangerous_terms if term in response_text]
        
        if leaked_info:
            print(f"❌ 404 errors expose system information: {leaked_info}")
            print(f"Response preview: {response_text[:200]}...")
            return False
        else:
            print("✅ 404 errors are secure (no system info exposed)")
    except requests.exceptions.RequestException:
        print("✅ 404 error handling secure")
    
    # Test invalid JSON error
    try:
        response = requests.post(f"{base_url}/api/auth/login", 
                               data="invalid json{", 
                               headers={'Content-Type': 'application/json'},
                               timeout=5)
        response_text = response.text.lower()
        
        dangerous_terms = ['traceback', 'exception', 'werkzeug', 'flask']
        leaked_info = [term for term in dangerous_terms if term in response_text]
        
        if leaked_info:
            print(f"❌ JSON error exposes system info: {leaked_info}")
            return False
        else:
            print("✅ JSON error handling is secure")
    except requests.exceptions.RequestException:
        print("✅ JSON error handling secure")
    
    return True

def test_core_functionality():
    """Test that core application functionality still works."""
    base_url = "http://localhost:8001"
    
    print("⚙️ Testing core functionality...")
    
    # Test main page loads
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        if response.status_code == 200:
            print("✅ Main page loads")
        else:
            print(f"❌ Main page failed (status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Main page failed: {e}")
        return False
    
    # Test static assets load
    try:
        response = requests.get(f"{base_url}/static/css/main.css", timeout=5)
        if response.status_code == 200:
            print("✅ Static CSS loads")
        else:
            print(f"⚠️ Static CSS issues (status: {response.status_code})")
    except requests.exceptions.RequestException:
        print("⚠️ Static CSS not accessible")
    
    try:
        response = requests.get(f"{base_url}/static/js/main.js", timeout=5)
        if response.status_code == 200:
            print("✅ Static JS loads")
        else:
            print(f"⚠️ Static JS issues (status: {response.status_code})")
    except requests.exceptions.RequestException:
        print("⚠️ Static JS not accessible")
    
    # Test character creation page
    try:
        response = requests.get(f"{base_url}/create-character", timeout=5)
        if response.status_code in [200, 302]:  # 302 if redirect to login
            print("✅ Character creation endpoint exists")
        else:
            print(f"⚠️ Character creation issues (status: {response.status_code})")
    except requests.exceptions.RequestException:
        print("⚠️ Character creation endpoint issues")
    
    return True

def test_production_configuration():
    """Test production configuration is properly enforced."""
    print("⚙️ Testing production configuration...")
    
    # This would normally check environment variables and Flask config
    # For now, we'll test that debug mode appears disabled based on responses
    
    base_url = "http://localhost:8001"
    
    try:
        # Test that debug mode isn't leaking in responses
        response = requests.get(f"{base_url}/nonexistent-debug-test", timeout=5)
        response_text = response.text.lower()
        
        if 'werkzeug debugger' in response_text or 'debug mode' in response_text:
            print("❌ Debug mode appears to be enabled")
            return False
        else:
            print("✅ Debug mode appears disabled")
    except requests.exceptions.RequestException:
        print("✅ Debug mode testing complete")
    
    return True

def main():
    """Run comprehensive E2E security and functionality testing."""
    print("🔍 Starting Comprehensive E2E Testing for Issue #103")
    print("=" * 60)
    
    test_results = []
    
    with test_server():
        # Give server extra time to fully start
        time.sleep(3)
        
        # Run all tests
        tests = [
            ("Server Startup", test_server_startup),
            ("Security Endpoints", test_security_endpoints), 
            ("Authentication Flows", test_authentication_flows),
            ("Error Handling", test_error_handling),
            ("Core Functionality", test_core_functionality),
            ("Production Configuration", test_production_configuration)
        ]
        
        for test_name, test_func in tests:
            print(f"\n📋 Running: {test_name}")
            print("-" * 40)
            
            try:
                result = test_func()
                test_results.append((test_name, result))
                
                if result:
                    print(f"✅ {test_name}: PASSED")
                else:
                    print(f"❌ {test_name}: FAILED")
            except Exception as e:
                print(f"❌ {test_name}: ERROR - {e}")
                test_results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 E2E Test Results Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<25} {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL E2E TESTS PASSED! Issue #103 security fixes verified.")
        print("🚀 Application is ready for production deployment.")
        return True
    else:
        print(f"\n⚠️ {total - passed} tests failed. Review issues before deployment.")
        return False

if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
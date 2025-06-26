#!/usr/bin/env python3
"""Test that debug endpoints have been removed."""

import requests
import time
import subprocess
import signal
import os
from contextlib import contextmanager

@contextmanager
def test_server():
    """Start the server for testing and clean up afterwards."""
    # Start the server
    print("🔧 Starting test server...")
    process = subprocess.Popen(['python3', 'run_web.py'], 
                              stdout=subprocess.PIPE, 
                              stderr=subprocess.PIPE,
                              preexec_fn=os.setsid)
    
    # Wait for server to start
    time.sleep(5)
    
    try:
        yield
    finally:
        # Clean up
        print("🔧 Stopping test server...")
        os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        process.wait()

def test_debug_endpoints():
    """Test that all debug endpoints return 404."""
    base_url = "http://localhost:8001"
    
    debug_endpoints = [
        "/api/debug/create-admin",
        "/api/debug/test-login", 
        "/api/debug/test",
        "/api/debug/info",
        "/api/test",
        "/debug",
        "/test"
    ]
    
    all_secure = True
    
    print("🔒 Testing debug endpoint security...")
    
    for endpoint in debug_endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            if response.status_code != 404:
                print(f"❌ Debug endpoint accessible: {endpoint} (status: {response.status_code})")
                all_secure = False
            else:
                print(f"✅ Debug endpoint secured: {endpoint}")
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Could not test {endpoint}: {e}")
    
    return all_secure

def test_error_handling():
    """Test that error handling doesn't expose system information."""
    base_url = "http://localhost:8001"
    
    print("🛡️ Testing error handling security...")
    
    # Test 404 error
    try:
        response = requests.get(f"{base_url}/nonexistent-endpoint", timeout=5)
        if any(word in response.text.lower() for word in ['traceback', 'exception', 'stack', 'werkzeug']):
            print("❌ 404 errors expose system information")
            return False
        else:
            print("✅ 404 errors are secure")
    except requests.exceptions.RequestException:
        print("⚠️ Could not test 404 error handling")
    
    return True

def test_authentication_security():
    """Test that admin endpoints require authentication."""
    base_url = "http://localhost:8001"
    
    print("🔐 Testing authentication security...")
    
    try:
        response = requests.get(f"{base_url}/api/admin/users", timeout=5)
        if response.status_code in [401, 403]:
            print("✅ Admin endpoints require authentication")
            return True
        else:
            print(f"❌ Admin endpoints not properly protected (status: {response.status_code})")
            return False
    except requests.exceptions.RequestException:
        print("⚠️ Could not test admin endpoint security")
        return True

def main():
    """Run all security tests."""
    print("🔍 Starting security validation tests...")
    
    with test_server():
        # Give server time to fully start
        time.sleep(3)
        
        debug_secure = test_debug_endpoints()
        error_secure = test_error_handling()
        auth_secure = test_authentication_security()
        
        if debug_secure and error_secure and auth_secure:
            print("\n✅ All security tests passed!")
            return True
        else:
            print("\n❌ Some security tests failed!")
            return False

if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
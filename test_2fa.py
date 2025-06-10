#!/usr/bin/env python3
"""Test 2FA authentication functionality."""

import requests
import json
import time

BASE_URL = "http://127.0.0.1:8001"

def test_login():
    """Login as admin and get access token."""
    print("🧪 Testing admin login...")
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@swrpg.local",
        "password": "AdminPassword123!@#$"
    })
    
    print(f"Login Status: {response.status_code}")
    data = response.json()
    
    if response.status_code == 200:
        token = data.get("access_token")
        print(f"✅ Got access token")
        return token
    else:
        print(f"❌ Login failed: {data}")
        return None

def test_2fa_setup(token):
    """Test 2FA setup."""
    print("\n🧪 Testing 2FA setup...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.post(f"{BASE_URL}/api/auth/setup-2fa", 
                           headers=headers)
    
    print(f"2FA Setup Status: {response.status_code}")
    data = response.json()
    print(f"2FA Setup Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
    
    if response.status_code == 200:
        secret = data.get('secret')
        qr_code = data.get('qr_code')
        backup_codes = data.get('backup_codes')
        
        print(f"✅ Got 2FA secret: {secret[:10]}...")
        print(f"✅ Got QR code (length: {len(qr_code) if qr_code else 0})")
        print(f"✅ Got {len(backup_codes) if backup_codes else 0} backup codes")
        
        if backup_codes:
            print(f"First backup code: {backup_codes[0]}")
        
        return secret, backup_codes
    else:
        print(f"❌ Failed to setup 2FA: {data}")
        return None, None

def test_2fa_verification(token, backup_code):
    """Test 2FA verification using backup code."""
    print("\n🧪 Testing 2FA verification with backup code...")
    
    headers = {"Authorization": f"Bearer {token}"}
    verification_data = {
        "token": backup_code
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/verify-2fa-setup", 
                           headers=headers,
                           json=verification_data)
    
    print(f"2FA Verification Status: {response.status_code}")
    data = response.json()
    print(f"2FA Verification Response: {data}")
    
    return response.status_code == 200

def main():
    """Run 2FA tests."""
    print("🚀 Starting 2FA tests...\n")
    
    try:
        # Login and get token
        token = test_login()
        if not token:
            print("❌ Could not login, stopping tests")
            return
        
        # Test 2FA setup
        secret, backup_codes = test_2fa_setup(token)
        if not secret or not backup_codes:
            print("❌ Could not setup 2FA, stopping tests")
            return
        
        # Test 2FA verification using the first backup code
        verification_success = test_2fa_verification(token, backup_codes[0])
        
        print("\n📊 Test Results:")
        print(f"  Login: ✅ Success")
        print(f"  2FA Setup: ✅ Success")
        print(f"  2FA Verification: {'✅ Success' if verification_success else '❌ Failed'}")
        
        if verification_success:
            print("\n🎯 2FA functionality working correctly!")
        else:
            print("\n⚠️ 2FA verification failed")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Flask app is running on port 8001")
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    main()
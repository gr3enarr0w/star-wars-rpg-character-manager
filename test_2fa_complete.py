#!/usr/bin/env python3
"""Test complete 2FA workflow with TOTP token generation."""

import requests
import json
import time
import pyotp

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
    
    if response.status_code == 200:
        secret = data.get('secret')
        qr_code = data.get('qr_code')
        backup_codes = data.get('backup_codes')
        
        print(f"✅ Got 2FA secret: {secret}")
        print(f"✅ Got QR code (length: {len(qr_code) if qr_code else 0})")
        print(f"✅ Got {len(backup_codes) if backup_codes else 0} backup codes")
        
        return secret, backup_codes
    else:
        print(f"❌ Failed to setup 2FA: {data}")
        return None, None

def test_2fa_verification(token, secret):
    """Test 2FA verification using TOTP token."""
    print("\n🧪 Testing 2FA verification with TOTP token...")
    
    # Generate current TOTP token
    totp = pyotp.TOTP(secret)
    current_token = totp.now()
    print(f"Generated TOTP token: {current_token}")
    
    headers = {"Authorization": f"Bearer {token}"}
    verification_data = {
        "token": current_token
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/verify-2fa-setup", 
                           headers=headers,
                           json=verification_data)
    
    print(f"2FA Verification Status: {response.status_code}")
    data = response.json()
    print(f"2FA Verification Response: {data}")
    
    return response.status_code == 200

def test_2fa_login(secret, backup_codes):
    """Test login with 2FA enabled."""
    print("\n🧪 Testing login with 2FA enabled...")
    
    # Generate current TOTP token
    totp = pyotp.TOTP(secret)
    current_token = totp.now()
    print(f"Using TOTP token: {current_token}")
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@swrpg.local",
        "password": "AdminPassword123!@#$",
        "two_factor_token": current_token
    })
    
    print(f"Login with 2FA Status: {response.status_code}")
    data = response.json()
    
    if response.status_code == 200:
        print("✅ Login with 2FA successful")
        return True
    else:
        print(f"❌ Login with 2FA failed: {data}")
        
        # Try with backup code
        if backup_codes and len(backup_codes) > 1:
            print("\n🧪 Testing login with backup code...")
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": "admin@swrpg.local",
                "password": "AdminPassword123!@#$",
                "two_factor_token": backup_codes[1]  # Use second backup code since first might have been used
            })
            
            print(f"Login with Backup Code Status: {response.status_code}")
            data = response.json()
            
            if response.status_code == 200:
                print("✅ Login with backup code successful")
                return True
            else:
                print(f"❌ Login with backup code failed: {data}")
        
        return False

def main():
    """Run complete 2FA tests."""
    print("🚀 Starting complete 2FA tests...\n")
    
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
        
        # Test 2FA verification using TOTP
        verification_success = test_2fa_verification(token, secret)
        
        if verification_success:
            # Test login with 2FA enabled
            login_success = test_2fa_login(secret, backup_codes)
        else:
            login_success = False
        
        print("\n📊 Test Results:")
        print(f"  Login: ✅ Success")
        print(f"  2FA Setup: ✅ Success")
        print(f"  2FA Verification: {'✅ Success' if verification_success else '❌ Failed'}")
        print(f"  2FA Login: {'✅ Success' if login_success else '❌ Failed'}")
        
        if verification_success and login_success:
            print("\n🎯 Complete 2FA functionality working correctly!")
        else:
            print("\n⚠️ Some 2FA functionality failed")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Flask app is running on port 8001")
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    main()
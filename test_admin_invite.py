#!/usr/bin/env python3
"""Test admin invite code creation functionality."""

import requests
import json
import time

BASE_URL = "http://127.0.0.1:8001"

def test_admin_login():
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

def test_invite_code_creation(token):
    """Test admin invite code creation."""
    print("\n🧪 Testing admin invite code creation...")
    
    headers = {"Authorization": f"Bearer {token}"}
    invite_data = {
        "role": "player",
        "expires_in_days": 7
    }
    
    response = requests.post(f"{BASE_URL}/api/admin/invite", 
                           headers=headers,
                           json=invite_data)
    
    print(f"Invite Creation Status: {response.status_code}")
    data = response.json()
    print(f"Invite Creation Response: {data}")
    
    if response.status_code in [200, 201]:
        invite_code = data.get('invite_code')
        print(f"✅ Generated invite code: {invite_code}")
        return invite_code
    else:
        print(f"❌ Failed to create invite code")
        return None

def test_registration_with_invite(invite_code):
    """Test user registration with invite code."""
    print(f"\n🧪 Testing registration with invite code: {invite_code}...")
    
    registration_data = {
        "invite_code": invite_code,
        "email": "testuser@example.com",
        "username": "testuser",
        "password": "TestPassword123!@#$test"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/register", json=registration_data)
    
    print(f"Registration Status: {response.status_code}")
    data = response.json()
    print(f"Registration Response: {data}")
    
    return response.status_code in [200, 201]

def main():
    """Run admin invite tests."""
    print("🚀 Starting admin invite code tests...\n")
    
    try:
        # Login as admin
        token = test_admin_login()
        if not token:
            print("❌ Could not login as admin, stopping tests")
            return
        
        # Test invite code creation
        invite_code = test_invite_code_creation(token)
        if not invite_code:
            print("❌ Could not create invite code, stopping tests")
            return
        
        # Test registration with invite code
        registration_success = test_registration_with_invite(invite_code)
        
        print("\n📊 Test Results:")
        print(f"  Admin Login: ✅ Success")
        print(f"  Invite Creation: ✅ Success")
        print(f"  Registration with Invite: {'✅ Success' if registration_success else '❌ Failed'}")
        
        if registration_success:
            print("\n🎯 All admin invite functionality working correctly!")
        else:
            print("\n⚠️ Registration with invite code failed")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Flask app is running on port 8001")
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""Test authentication system."""

import requests
import json
import time

BASE_URL = "http://127.0.0.1:8001"

def test_registration():
    """Test user registration."""
    print("🧪 Testing user registration...")
    
    response = requests.post(f"{BASE_URL}/api/auth/register", json={
        "invite_code": "PLAYER-INVITE-123",
        "email": "testuser@example.com",
        "username": "testuser", 
        "password": "TestPassword123!@#$test"
    })
    
    print(f"Registration Status: {response.status_code}")
    print(f"Registration Response: {response.json()}")
    
    return response.status_code in [200, 201]

def test_login():
    """Test user login."""
    print("\n🧪 Testing admin login...")
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@swrpg.local",
        "password": "AdminPassword123!@#$"
    })
    
    print(f"Login Status: {response.status_code}")
    data = response.json()
    print(f"Login Response: {data}")
    
    if response.status_code == 200:
        token = data.get("access_token")
        print(f"✅ Got access token: {token[:50]}...")
        return token
    
    return None

def test_authenticated_request(token):
    """Test authenticated API request."""
    print("\n🧪 Testing authenticated request...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    
    print(f"Auth Test Status: {response.status_code}")
    print(f"Auth Test Response: {response.json()}")
    
    return response.status_code == 200

def test_campaigns(token):
    """Test campaign endpoints."""
    print("\n🧪 Testing campaign endpoints...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get campaigns
    response = requests.get(f"{BASE_URL}/api/campaigns", headers=headers)
    print(f"Get Campaigns Status: {response.status_code}")
    print(f"Get Campaigns Response: {response.json()}")
    
    # Create campaign
    response = requests.post(f"{BASE_URL}/api/campaigns", 
                           headers=headers,
                           json={
                               "name": "Test Campaign",
                               "description": "A test campaign for our RPG"
                           })
    print(f"Create Campaign Status: {response.status_code}")
    print(f"Create Campaign Response: {response.json()}")
    
    return response.status_code in [200, 201]

def main():
    """Run authentication tests."""
    print("🚀 Starting authentication system tests...\n")
    
    try:
        # Wait for server to be ready
        print("⏳ Waiting for server to be ready...")
        time.sleep(2)
        
        # Test registration
        registration_success = test_registration()
        
        # Test login
        token = test_login()
        if not token:
            print("❌ Login failed, stopping tests")
            return
        
        # Test authenticated request
        auth_success = test_authenticated_request(token)
        if not auth_success:
            print("❌ Authentication test failed")
            return
        
        # Test campaigns
        campaign_success = test_campaigns(token)
        
        print("\n🎉 All tests completed!")
        print(f"✅ Registration: {'Success' if registration_success else 'Failed'}")
        print(f"✅ Login: Success")
        print(f"✅ Authentication: Success")
        print(f"✅ Campaigns: {'Success' if campaign_success else 'Failed'}")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Flask app is running on port 8001")
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""Test campaign management functionality with a simple user."""

import requests
import json
import random
import string

BASE_URL = "http://127.0.0.1:8001"

def create_test_user():
    """Create a test user for campaign testing."""
    print("🧪 Creating test user...")
    
    # First login as admin to get invite code
    admin_response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@swrpg.local",
        "password": "AdminPassword123!@#$"
    })
    
    if admin_response.status_code == 401 and admin_response.json().get('requires_2fa'):
        print("❌ Admin has 2FA enabled. Testing with existing user instead.")
        # Try to login with the previously created test user
        test_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "testuser@example.com",
            "password": "TestPassword123!@#$test"
        })
        
        if test_response.status_code == 200:
            print("✅ Using existing test user")
            return test_response.json().get("access_token")
        else:
            print("❌ No available test user")
            return None
    
    if admin_response.status_code != 200:
        print(f"❌ Admin login failed: {admin_response.json()}")
        return None
    
    admin_token = admin_response.json().get("access_token")
    
    # Generate invite code
    invite_response = requests.post(f"{BASE_URL}/api/admin/invite", 
                                  headers={'Authorization': f'Bearer {admin_token}'},
                                  json={'role': 'player', 'expires_in_days': 1})
    
    if invite_response.status_code != 201:
        print(f"❌ Could not create invite: {invite_response.json()}")
        return None
    
    invite_code = invite_response.json()['invite_code']
    
    # Create test user
    random_suffix = ''.join(random.choices(string.ascii_lowercase, k=6))
    test_email = f'testuser{random_suffix}@example.com'
    
    reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
        'invite_code': invite_code,
        'email': test_email,
        'username': f'testuser{random_suffix}',
        'password': 'TestPassword123!@#$test'
    })
    
    if reg_response.status_code not in [200, 201]:
        print(f"❌ Registration failed: {reg_response.json()}")
        return None
    
    # Login as test user
    login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": test_email,
        "password": "TestPassword123!@#$test"
    })
    
    if login_response.status_code == 200:
        print(f"✅ Created and logged in as test user: {test_email}")
        return login_response.json().get("access_token")
    else:
        print(f"❌ Test user login failed: {login_response.json()}")
        return None

def test_create_campaign(token):
    """Test creating a campaign."""
    print("\n🧪 Testing campaign creation...")
    
    headers = {"Authorization": f"Bearer {token}"}
    campaign_data = {
        "name": "Test Campaign",
        "description": "A test campaign for Star Wars RPG",
        "game_system": "Edge of the Empire",
        "max_players": 4
    }
    
    response = requests.post(f"{BASE_URL}/api/campaigns", 
                           headers=headers,
                           json=campaign_data)
    
    print(f"Campaign Creation Status: {response.status_code}")
    data = response.json()
    print(f"Campaign Creation Response: {data}")
    
    if response.status_code in [200, 201]:
        return data.get('campaign_id')
    return None

def test_get_campaigns(token):
    """Test getting campaigns."""
    print("\n🧪 Testing get campaigns...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/campaigns", headers=headers)
    
    print(f"Get Campaigns Status: {response.status_code}")
    data = response.json()
    print(f"Campaigns found: {len(data.get('campaigns', []))}")
    
    if response.status_code == 200 and data.get('campaigns'):
        print("Campaign details:", data['campaigns'][0] if data['campaigns'] else "None")
    
    return response.status_code == 200

def test_generate_campaign_invite(token, campaign_id):
    """Test generating campaign invite code."""
    print(f"\n🧪 Testing campaign invite generation for {campaign_id}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/api/campaigns/{campaign_id}/invite", 
                           headers=headers)
    
    print(f"Invite Generation Status: {response.status_code}")
    data = response.json()
    print(f"Invite Generation Response: {data}")
    
    if response.status_code == 200:
        return data.get('invite_code')
    return None

def main():
    """Run campaign management tests."""
    print("🚀 Starting campaign management tests...\n")
    
    try:
        # Create/get test user token
        token = create_test_user()
        if not token:
            print("❌ Could not create/login test user, stopping tests")
            return
        
        # Test campaign operations
        results = {}
        
        # Create campaign
        campaign_id = test_create_campaign(token)
        results['creation'] = campaign_id is not None
        
        # Get campaigns
        results['list'] = test_get_campaigns(token)
        
        if campaign_id:
            # Generate invite code
            invite_code = test_generate_campaign_invite(token, campaign_id)
            results['invite_generation'] = invite_code is not None
            
            if invite_code:
                print(f"\n📝 Generated invite code: {invite_code}")
                print("✅ Campaign invite code generation working!")
        
        print("\n📊 Test Results:")
        for test, success in results.items():
            status = "✅ Success" if success else "❌ Failed"
            print(f"  {test.title()}: {status}")
        
        success_count = sum(results.values())
        total_count = len(results)
        print(f"\n🎯 Overall: {success_count}/{total_count} tests passed")
        
        if success_count == total_count:
            print("\n🎉 Campaign management functionality working correctly!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Flask app is running on port 8001")
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    main()
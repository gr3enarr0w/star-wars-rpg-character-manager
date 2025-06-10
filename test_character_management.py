#!/usr/bin/env python3
"""Test character management with authentication."""

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

def test_character_creation(token):
    """Test character creation."""
    print("\n🧪 Testing character creation...")
    
    headers = {"Authorization": f"Bearer {token}"}
    character_data = {
        "name": "Test Character",
        "playerName": "Test Player",
        "species": "Human",
        "career": "Smuggler",
        "background": "A test character"
    }
    
    response = requests.post(f"{BASE_URL}/api/characters", 
                           headers=headers,
                           json=character_data)
    
    print(f"Character Creation Status: {response.status_code}")
    data = response.json()
    print(f"Character Creation Response: {data}")
    
    if response.status_code in [200, 201]:
        return data.get('character', {}).get('id')
    return None

def test_character_list(token):
    """Test getting character list."""
    print("\n🧪 Testing character list...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/characters", headers=headers)
    
    print(f"Character List Status: {response.status_code}")
    data = response.json()
    print(f"Characters: {len(data.get('characters', []))} found")
    
    return response.status_code == 200

def test_character_details(token, character_id):
    """Test getting character details."""
    print(f"\n🧪 Testing character details for {character_id}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/characters/{character_id}", headers=headers)
    
    print(f"Character Details Status: {response.status_code}")
    data = response.json()
    
    if response.status_code == 200:
        print(f"Character Details: {data.get('character', {}).get('name')}")
        return True
    else:
        print(f"Character Details Error: {data}")
        return False

def test_xp_award(token, character_id):
    """Test XP award functionality."""
    print(f"\n🧪 Testing XP award for {character_id}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    xp_data = {
        "amount": 10,
        "reason": "Test XP award"
    }
    
    response = requests.post(f"{BASE_URL}/api/characters/{character_id}/award-xp", 
                           headers=headers,
                           json=xp_data)
    
    print(f"XP Award Status: {response.status_code}")
    data = response.json()
    print(f"XP Award Response: {data}")
    
    return response.status_code == 200

def test_characteristic_advancement(token, character_id):
    """Test characteristic advancement."""
    print(f"\n🧪 Testing characteristic advancement for {character_id}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    advancement_data = {
        "action": "increase"
    }
    
    response = requests.post(f"{BASE_URL}/api/characters/{character_id}/characteristics/brawn", 
                           headers=headers,
                           json=advancement_data)
    
    print(f"Characteristic Advancement Status: {response.status_code}")
    data = response.json()
    print(f"Characteristic Advancement Response: {data}")
    
    return response.status_code == 200

def test_skill_advancement(token, character_id):
    """Test skill advancement."""
    print(f"\n🧪 Testing skill advancement for {character_id}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    advancement_data = {
        "action": "increase"
    }
    
    response = requests.post(f"{BASE_URL}/api/characters/{character_id}/skills/Athletics", 
                           headers=headers,
                           json=advancement_data)
    
    print(f"Skill Advancement Status: {response.status_code}")
    data = response.json()
    print(f"Skill Advancement Response: {data}")
    
    return response.status_code == 200

def test_character_deletion(token, character_id):
    """Test character deletion."""
    print(f"\n🧪 Testing character deletion for {character_id}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.delete(f"{BASE_URL}/api/characters/{character_id}", headers=headers)
    
    print(f"Character Deletion Status: {response.status_code}")
    data = response.json()
    print(f"Character Deletion Response: {data}")
    
    return response.status_code == 200

def main():
    """Run character management tests."""
    print("🚀 Starting character management tests...\n")
    
    try:
        # Login and get token
        token = test_login()
        if not token:
            print("❌ Could not login, stopping tests")
            return
        
        # Test character operations
        results = {}
        
        # Character creation
        character_id = test_character_creation(token)
        results['creation'] = character_id is not None
        
        if character_id:
            # Character list
            results['list'] = test_character_list(token)
            
            # Character details
            results['details'] = test_character_details(token, character_id)
            
            # XP award
            results['xp_award'] = test_xp_award(token, character_id)
            
            # Characteristic advancement
            results['characteristic'] = test_characteristic_advancement(token, character_id)
            
            # Skill advancement
            results['skill'] = test_skill_advancement(token, character_id)
            
            # Character deletion
            results['deletion'] = test_character_deletion(token, character_id)
        
        print("\n📊 Test Results:")
        for test, success in results.items():
            status = "✅ Success" if success else "❌ Failed"
            print(f"  {test.title()}: {status}")
        
        success_count = sum(results.values())
        total_count = len(results)
        print(f"\n🎯 Overall: {success_count}/{total_count} tests passed")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Flask app is running on port 8001")
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    main()
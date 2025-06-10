#!/usr/bin/env python3
"""
Simple debug script to test the API directly and identify issues
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_api():
    print("🔍 Testing API endpoints...")
    
    # Test 1: Get characters
    print("\n1. Testing GET /api/characters")
    try:
        response = requests.get(f"{BASE_URL}/api/characters")
        print(f"Status: {response.status_code}")
        if response.ok:
            data = response.json()
            print(f"Characters found: {len(data['characters'])}")
            for char in data['characters']:
                print(f"  - {char['name']} ({char['species']} {char['career']}) - {char['availableXP']} XP")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Failed: {e}")
    
    # Test 2: Create a test character
    print("\n2. Testing POST /api/characters")
    test_char = {
        "name": f"API_Test_{int(__import__('time').time())}",
        "playerName": "Debug User",
        "species": "Human", 
        "career": "Smuggler",
        "background": "API test character"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/characters",
            json=test_char,
            headers={'Content-Type': 'application/json'}
        )
        print(f"Status: {response.status_code}")
        if response.ok:
            result = response.json()
            char_id = result['character']['id']
            print(f"Created character: {char_id}")
            
            # Test 3: Award XP
            print(f"\n3. Testing POST /api/characters/{char_id}/award-xp")
            xp_response = requests.post(
                f"{BASE_URL}/api/characters/{char_id}/award-xp",
                json={"amount": 50, "reason": "API test"},
                headers={'Content-Type': 'application/json'}
            )
            print(f"XP Status: {xp_response.status_code}")
            if xp_response.ok:
                print(f"XP Result: {xp_response.json()['message']}")
            
            # Test 4: Advance characteristic
            print(f"\n4. Testing POST /api/characters/{char_id}/advance-characteristic")
            char_response = requests.post(
                f"{BASE_URL}/api/characters/{char_id}/advance-characteristic",
                json={"characteristic": "Brawn"},
                headers={'Content-Type': 'application/json'}
            )
            print(f"Characteristic Status: {char_response.status_code}")
            if char_response.ok:
                print(f"Characteristic Result: {char_response.json()['message']}")
            else:
                print(f"Characteristic Error: {char_response.json()}")
            
            # Test 5: Get updated character
            print(f"\n5. Testing GET /api/characters/{char_id}")
            updated_response = requests.get(f"{BASE_URL}/api/characters/{char_id}")
            print(f"Get Character Status: {updated_response.status_code}")
            if updated_response.ok:
                updated_char = updated_response.json()['character']
                print(f"Updated character XP: {updated_char['availableXP']}")
                print(f"Updated character Brawn: {updated_char['characteristics']['brawn']}")
            
        else:
            print(f"Create Error: {response.json()}")
    except Exception as e:
        print(f"Failed: {e}")

def check_frontend_files():
    print("\n🔍 Checking frontend file accessibility...")
    
    files_to_check = [
        "/",
        "/static/css/main.css", 
        "/static/js/main.js"
    ]
    
    for file_path in files_to_check:
        try:
            response = requests.get(f"{BASE_URL}{file_path}")
            print(f"{file_path}: {response.status_code}")
        except Exception as e:
            print(f"{file_path}: FAILED - {e}")

if __name__ == "__main__":
    print("🚀 Star Wars RPG Character Manager - Debug Tool")
    print("=" * 50)
    
    test_api()
    check_frontend_files()
    
    print("\n📋 Quick Debugging Steps:")
    print("1. Open browser to http://localhost:8000")
    print("2. Open browser console (F12)")
    print("3. Check for JavaScript errors")
    print("4. Verify characterManager object exists")
    print("5. Try: characterManager.characters")
    print("6. Try: characterManager.currentCharacter")
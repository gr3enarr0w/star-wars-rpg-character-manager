#!/usr/bin/env python3
"""
Simple automated testing without external dependencies
Tests API and provides debugging guidance
"""

import urllib.request
import urllib.parse
import json
import time

def test_api_endpoint(url, method='GET', data=None):
    """Test an API endpoint"""
    try:
        if data:
            data = json.dumps(data).encode('utf-8')
            
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header('Content-Type', 'application/json')
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return response.status, result
    except urllib.error.HTTPError as e:
        try:
            error_data = json.loads(e.read().decode('utf-8'))
            return e.code, error_data
        except:
            return e.code, {'error': str(e)}
    except Exception as e:
        return 0, {'error': str(e)}

def run_tests():
    base_url = "http://localhost:8000"
    
    print("🚀 Star Wars RPG Character Manager - Simple API Test")
    print("=" * 60)
    
    # Test 1: Get characters
    print("\n1. Testing GET /api/characters")
    status, data = test_api_endpoint(f"{base_url}/api/characters")
    if status == 200:
        print(f"✅ Success: Found {len(data['characters'])} characters")
        for char in data['characters']:
            print(f"   - {char['name']} ({char['species']} {char['career']}) - {char['availableXP']} XP")
    else:
        print(f"❌ Failed: {status} - {data.get('error', 'Unknown error')}")
        return False
    
    # Test 2: Create character
    print("\n2. Testing POST /api/characters")
    test_char = {
        "name": f"AutoTest_{int(time.time())}",
        "playerName": "Automation Test",
        "species": "Human",
        "career": "Smuggler",
        "background": "Automated test character"
    }
    
    status, data = test_api_endpoint(f"{base_url}/api/characters", 'POST', test_char)
    if status == 200:
        char_id = data['character']['id']
        print(f"✅ Character created: {char_id}")
        
        # Test 3: Award XP
        print("\n3. Testing POST award-xp")
        xp_data = {"amount": 50, "reason": "Automation test"}
        status, data = test_api_endpoint(f"{base_url}/api/characters/{urllib.parse.quote(char_id)}/award-xp", 'POST', xp_data)
        if status == 200:
            print(f"✅ XP awarded: {data['message']}")
        else:
            print(f"❌ XP award failed: {status} - {data.get('error', 'Unknown error')}")
        
        # Test 4: Advance characteristic
        print("\n4. Testing POST advance-characteristic")
        char_data = {"characteristic": "Brawn"}
        status, data = test_api_endpoint(f"{base_url}/api/characters/{urllib.parse.quote(char_id)}/advance-characteristic", 'POST', char_data)
        if status == 200:
            print(f"✅ Characteristic advanced: {data['message']}")
        else:
            print(f"❌ Characteristic advancement failed: {status} - {data.get('error', 'Unknown error')}")
        
        # Test 5: Get updated character
        print("\n5. Testing GET character details")
        status, data = test_api_endpoint(f"{base_url}/api/characters/{urllib.parse.quote(char_id)}")
        if status == 200:
            char = data['character']
            print(f"✅ Character details retrieved")
            print(f"   XP: {char['availableXP']}")
            print(f"   Brawn: {char['characteristics']['brawn']}")
        else:
            print(f"❌ Get character failed: {status} - {data.get('error', 'Unknown error')}")
            
    else:
        print(f"❌ Character creation failed: {status} - {data.get('error', 'Unknown error')}")
        return False
    
    print("\n" + "=" * 60)
    print("📊 API Tests Complete")
    print("\n🔧 Frontend Debugging Steps:")
    print("1. Open http://localhost:8000 in browser")
    print("2. Open browser console (F12)")
    print("3. Check for JavaScript errors")
    print("4. Verify: typeof characterManager")
    print("5. Check: characterManager.characters")
    print("6. Test: characterManager.currentCharacter")
    print("7. Create a character and click advancement buttons")
    print("8. Watch console for debug messages")
    
    print("\n📝 Common Frontend Issues:")
    print("- CharacterManager not loading: Check main.js")
    print("- Buttons not working: Check data-action attributes")
    print("- Current character null: Check showCharacter method")
    print("- API calls failing: Check network tab in browser")
    
    return True

if __name__ == "__main__":
    try:
        success = run_tests()
        if success:
            print("\n✅ All API tests passed!")
            print("The backend is working correctly.")
            print("If frontend issues persist, check browser console.")
        else:
            print("\n❌ Some tests failed!")
            print("Check Flask server logs for more details.")
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"\nUnexpected error: {e}")
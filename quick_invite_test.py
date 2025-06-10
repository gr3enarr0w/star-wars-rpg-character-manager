#!/usr/bin/env python3
import requests
import random
import string

BASE_URL = 'http://127.0.0.1:8001'

# Login as admin
response = requests.post(f'{BASE_URL}/api/auth/login', json={
    'email': 'admin@swrpg.local',
    'password': 'AdminPassword123!@#$'
})

if response.status_code == 200:
    token = response.json()['access_token']
    print("✅ Admin login successful")

    # Create invite code
    invite_response = requests.post(f'{BASE_URL}/api/admin/invite', 
                                  headers={'Authorization': f'Bearer {token}'},
                                  json={'role': 'player', 'expires_in_days': 7})
    
    if invite_response.status_code == 201:
        invite_code = invite_response.json()['invite_code']
        print(f"✅ Invite code created: {invite_code}")

        # Test registration with unique email
        random_suffix = ''.join(random.choices(string.ascii_lowercase, k=6))
        test_email = f'testuser{random_suffix}@example.com'

        reg_response = requests.post(f'{BASE_URL}/api/auth/register', json={
            'invite_code': invite_code,
            'email': test_email,
            'username': f'testuser{random_suffix}',
            'password': 'TestPassword123!@#$test'
        })

        print(f'Registration Status: {reg_response.status_code}')
        print(f'Registration Response: {reg_response.json()}')
        
        if reg_response.status_code in [200, 201]:
            print("🎉 Full invite workflow working!")
        else:
            print("❌ Registration failed")
    else:
        print(f"❌ Invite creation failed: {invite_response.json()}")
else:
    print(f"❌ Login failed: {response.json()}")
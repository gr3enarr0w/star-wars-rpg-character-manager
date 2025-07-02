#!/usr/bin/env python3
"""Check what users exist in the database."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from swrpg_character_manager.database import db_manager

def check_users():
    """Check what users exist in the database."""
    try:
        # Connect to database
        db_manager.connect()
        
        # Get all users
        users_collection = db_manager.users
        users = list(users_collection.find({}))
        
        print(f"\n📊 Found {len(users)} users in database:")
        
        for user in users:
            print(f"\n👤 User:")
            print(f"  ID: {user.get('_id')}")
            print(f"  Username: {user.get('username')}")
            print(f"  Email: {user.get('email')}")
            print(f"  Role: {user.get('role')}")
            print(f"  Active: {user.get('is_active', True)}")
            print(f"  Security Features: {user.get('enhanced_security', False)}")
            print(f"  Created: {user.get('created_at')}")
            
        if len(users) == 0:
            print("\n❌ No users found in database!")
            print("You may need to create a user first.")
            
    except Exception as e:
        print(f"❌ Error checking users: {e}")

if __name__ == "__main__":
    check_users()
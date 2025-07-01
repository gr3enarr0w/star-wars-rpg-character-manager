#!/usr/bin/env python3
"""
Test User Management System for E2E Testing
Provides reliable test users for automated browser testing.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from swrpg_character_manager.database import db_manager, User
from swrpg_character_manager.auth import auth_manager
from bson import ObjectId
import json

class TestUserManager:
    """Manages test users for E2E testing scenarios."""
    
    # Test user definitions with compliant passwords
    TEST_USERS = {
        'admin': {
            'email': 'admin@test.example.com',
            'username': 'Test Admin User',
            'password': 'TestPassword123!@#$%ADMIN',  # 26 chars
            'role': 'admin'
        },
        'player': {
            'email': 'player@test.example.com', 
            'username': 'Test Player User',
            'password': 'TestPassword123!@#$%PLAYER',  # 27 chars
            'role': 'player'
        },
        'gm': {
            'email': 'gm@test.example.com',
            'username': 'Test Game Master User',
            'password': 'TestPassword123!@#$%GAMEMASTER',  # 31 chars
            'role': 'game_master'
        }
    }
    
    def __init__(self):
        """Initialize test user manager."""
        self.created_users = []
        self.created_invites = []
    
    def ensure_admin_exists(self):
        """Ensure admin user exists for creating invite codes."""
        admin_email = 'clark@clarkeverson.com'
        admin_user = db_manager.get_user_by_email(admin_email)
        
        if not admin_user:
            print(f"⚠️  Creating admin user: {admin_email}")
            admin = User(
                email=admin_email,
                username='System Admin',
                password_hash=auth_manager.hash_password('TestPassword123!@#$%SYSTEM'),
                role='admin',
                is_active=True
            )
            admin_id = db_manager.create_user(admin)
            print(f"✅ Admin user created: {admin_id}")
            return admin_id
        else:
            print(f"✅ Admin user exists: {admin_user._id}")
            return admin_user._id
    
    def create_test_users(self):
        """Create all test users with proper authentication setup."""
        print("🔧 Setting up test users for E2E testing...")
        
        # Ensure admin exists for invite code creation
        admin_id = self.ensure_admin_exists()
        
        # Create test users
        for role, user_info in self.TEST_USERS.items():
            try:
                # Check if user already exists
                existing_user = db_manager.get_user_by_email(user_info['email'])
                if existing_user:
                    print(f"✅ Test {role} user already exists: {user_info['email']}")
                    continue
                
                # Generate invite code
                print(f"🎫 Creating invite code for {role} user...")
                invite_code = auth_manager.generate_invite_code(
                    admin_id, 
                    user_info['role'], 
                    expires_in_days=365  # Long expiry for testing
                )
                self.created_invites.append(invite_code)
                print(f"   Invite code: {invite_code}")
                
                # Register user
                print(f"👤 Creating {role} test user...")
                success, message, user_id = auth_manager.register_user(
                    user_info['email'],
                    user_info['username'], 
                    user_info['password'],
                    invite_code
                )
                
                if success:
                    print(f"✅ {role.upper()} user created: {user_id}")
                    self.created_users.append(user_id)
                else:
                    print(f"❌ Failed to create {role} user: {message}")
                    
            except Exception as e:
                print(f"❌ Error creating {role} user: {e}")
    
    def verify_test_users(self):
        """Verify all test users can authenticate properly."""
        print("\n🔍 Verifying test user authentication...")
        
        verification_results = {}
        
        for role, user_info in self.TEST_USERS.items():
            try:
                # Test authentication
                success, message, user = auth_manager.authenticate_user(
                    user_info['email'],
                    user_info['password']
                )
                
                if success and user:
                    print(f"✅ {role.upper()} authentication: SUCCESS")
                    print(f"   Email: {user.email}")
                    print(f"   Role: {user.role}")
                    print(f"   Active: {user.is_active}")
                    verification_results[role] = {
                        'status': 'success',
                        'user_id': str(user._id),
                        'email': user.email,
                        'role': user.role
                    }
                else:
                    print(f"❌ {role.upper()} authentication: FAILED - {message}")
                    verification_results[role] = {
                        'status': 'failed',
                        'error': message
                    }
                    
            except Exception as e:
                print(f"❌ {role.upper()} authentication: ERROR - {e}")
                verification_results[role] = {
                    'status': 'error',
                    'error': str(e)
                }
        
        return verification_results
    
    def generate_test_credentials_file(self):
        """Generate credentials file for E2E tests."""
        credentials = {}
        
        for role, user_info in self.TEST_USERS.items():
            credentials[role.upper()] = {
                'email': user_info['email'],
                'password': user_info['password'],
                'role': user_info['role'],
                'username': user_info['username']
            }
        
        # Save to file for E2E tests
        creds_file = os.path.join(os.path.dirname(__file__), 'fixtures', 'test_credentials.json')
        os.makedirs(os.path.dirname(creds_file), exist_ok=True)
        
        with open(creds_file, 'w') as f:
            json.dump(credentials, f, indent=2)
        
        print(f"📄 Test credentials saved to: {creds_file}")
        return creds_file
    
    def cleanup_test_users(self):
        """Remove test users (optional - for clean test runs)."""
        print("\n🧹 Cleaning up test users...")
        
        for role, user_info in self.TEST_USERS.items():
            try:
                user = db_manager.get_user_by_email(user_info['email'])
                if user:
                    # Note: In production, you might want to deactivate rather than delete
                    # For testing, we'll mark them as inactive
                    db_manager.update_user(user._id, {'is_active': False})
                    print(f"✅ Deactivated {role} test user")
            except Exception as e:
                print(f"⚠️  Error cleaning up {role} user: {e}")
    
    def get_test_user_credentials(self, role):
        """Get credentials for specific test user role."""
        if role.lower() in self.TEST_USERS:
            user_info = self.TEST_USERS[role.lower()]
            return {
                'email': user_info['email'],
                'password': user_info['password']
            }
        return None
    
    def list_all_users(self):
        """List all users in the system for debugging."""
        print("\n📊 All users in system:")
        try:
            users = db_manager.get_all_users()
            for user in users:
                status = "🟢" if user.is_active else "🔴"
                print(f"   {status} {user.email} ({user.username}) - Role: {user.role}")
        except Exception as e:
            print(f"❌ Error listing users: {e}")

def main():
    """Main function to set up test users."""
    manager = TestUserManager()
    
    print("🚀 Starting Test User Setup for E2E Testing\n")
    
    # Create test users
    manager.create_test_users()
    
    # Verify authentication
    results = manager.verify_test_users()
    
    # Generate credentials file
    manager.generate_test_credentials_file()
    
    # List all users
    manager.list_all_users()
    
    # Summary
    print("\n🎯 Test User Setup Summary:")
    success_count = len([r for r in results.values() if r['status'] == 'success'])
    total_count = len(results)
    
    if success_count == total_count:
        print(f"✅ All {total_count} test users created and verified successfully!")
        print("🎉 E2E testing environment is ready!")
    else:
        print(f"⚠️  {success_count}/{total_count} test users working correctly")
        print("🔧 Some issues need to be resolved before E2E testing")
    
    return success_count == total_count

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
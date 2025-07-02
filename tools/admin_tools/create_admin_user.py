#!/usr/bin/env python3
"""Create admin user for testing environments using environment variables."""

import os
import sys
from datetime import datetime

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

def create_admin_user():
    """Create admin user using environment variables."""
    try:
        from flask import Flask
        from swrpg_character_manager.database import db_manager, User
        from swrpg_character_manager.auth import auth_manager
        
        # Get admin credentials from environment
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@swrpg.local')
        admin_password = os.getenv('ADMIN_PASSWORD', 'admin123')
        
        print(f"👤 Creating admin user for testing environment...")
        print(f"   📧 Email: {admin_email}")
        
        # Create minimal Flask app for bcrypt initialization
        app = Flask(__name__)
        app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
        auth_manager.init_app(app)
        
        # Connect to database
        db_manager.connect()
        
        # Check if admin user already exists
        existing_admin = db_manager.get_user_by_email(admin_email)
        if existing_admin:
            print(f"   ✅ Admin user already exists with ID: {existing_admin._id}")
            return True
        
        # Create new admin user with app context
        with app.app_context():
            admin_user = User(
                username="admin",
                email=admin_email,
                password_hash=auth_manager.hash_password(admin_password),
                role="admin",
                is_active=True,
                created_at=datetime.now()
            )
        
        admin_id = db_manager.create_user(admin_user)
        print(f"   ✅ New admin user created with ID: {admin_id}")
        
        # Test the new user can be found and authenticated
        test_user = db_manager.get_user_by_email(admin_email)
        if test_user:
            print(f"   ✅ Admin user lookup successful: {test_user.username}")
            
            # Test password verification
            with app.app_context():
                if auth_manager.verify_password(admin_password, test_user.password_hash):
                    print("   ✅ Password verification successful")
                    print("   🎯 Admin user ready for testing")
                    return True
                else:
                    print("   ❌ Password verification failed")
                    return False
        else:
            print("   ❌ Admin user lookup failed")
            return False
        
    except Exception as e:
        print(f"   ❌ Failed to create admin user: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        try:
            db_manager.disconnect()
        except:
            pass

if __name__ == "__main__":
    success = create_admin_user()
    sys.exit(0 if success else 1)
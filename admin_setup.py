#!/usr/bin/env python3
"""Admin setup script for creating initial admin user and invite codes."""

import os
import sys
from datetime import datetime, timezone, timedelta

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from swrpg_character_manager.database import db_manager, User, InviteCode
from swrpg_character_manager.auth import auth_manager
from dotenv import load_dotenv

load_dotenv()

def main():
    """Set up initial admin user and invite codes."""
    try:
        # Connect to database
        db_manager.connect()
        print("✅ Connected to MongoDB")
        
        # Check if admin already exists
        admin_email = "admin@swrpg.local"
        if db_manager.get_user_by_email(admin_email):
            print("⚠️  Admin user already exists")
        else:
            # Create admin user
            admin_password = "AdminPassword123!@#$"  # Change this in production
            admin = User(
                email=admin_email,
                username="admin",
                password_hash=auth_manager.hash_password(admin_password),
                role="admin"
            )
            
            admin_id = db_manager.create_user(admin)
            print(f"✅ Created admin user: {admin_email}")
            print(f"   Password: {admin_password}")
            print(f"   User ID: {admin_id}")
        
        # Create some invite codes
        admin = db_manager.get_user_by_email(admin_email)
        
        # Create player invite code
        player_invite = InviteCode(
            code="PLAYER-INVITE-123",
            created_by=admin._id,
            role="player",
            expires_at=datetime.now(timezone.utc) + timedelta(days=30)
        )
        db_manager.create_invite_code(player_invite)
        print("✅ Created player invite code: PLAYER-INVITE-123")
        
        # Create gamemaster invite code
        gm_invite = InviteCode(
            code="GM-INVITE-456",
            created_by=admin._id,
            role="gamemaster",
            expires_at=datetime.now(timezone.utc) + timedelta(days=30)
        )
        db_manager.create_invite_code(gm_invite)
        print("✅ Created Game Master invite code: GM-INVITE-456")
        
        print("\n🎉 Setup complete! You can now:")
        print("1. Start the Flask app: cd web && python app_with_auth.py")
        print("2. Visit http://127.0.0.1:8001")
        print("3. Register new users with the invite codes above")
        print(f"4. Or login as admin with {admin_email} / {admin_password}")
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
#!/usr/bin/env python3
"""Startup script that ensures admin user exists and starts the web application."""

import os
import sys
import time
import subprocess
from datetime import datetime, timezone, timedelta

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def wait_for_mongodb():
    """Wait for MongoDB to be ready."""
    max_retries = 30
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            from swrpg_character_manager.database import db_manager
            db_manager.connect()
            print("✅ MongoDB is ready")
            return True
        except Exception as e:
            retry_count += 1
            print(f"⏳ Waiting for MongoDB... (attempt {retry_count}/{max_retries})")
            time.sleep(2)
    
    print("❌ MongoDB connection timeout")
    return False

def ensure_admin_user():
    """Ensure the admin user clark@everson.dev exists."""
    try:
        from swrpg_character_manager.database import db_manager, User, InviteCode
        from swrpg_character_manager.auth import auth_manager
        
        # Admin user details
        admin_email = "clark@everson.dev"
        admin_password = "with1artie4oskar3VOCATION!advances"
        
        print(f"🔍 Checking for admin user: {admin_email}")
        
        # Check if admin already exists
        existing_admin = db_manager.get_user_by_email(admin_email)
        if existing_admin:
            print(f"✅ Admin user {admin_email} already exists")
            # Always update password to ensure it's current
            updates = {"password_hash": auth_manager.hash_password(admin_password)}
            db_manager.update_user(existing_admin._id, updates)
            print(f"🔄 Updated admin password")
        else:
            # Create new admin user
            admin = User(
                email=admin_email,
                username="clark_admin",
                password_hash=auth_manager.hash_password(admin_password),
                role="admin",
                created_at=datetime.now(timezone.utc),
                is_active=True
            )
            
            admin_id = db_manager.create_user(admin)
            print(f"✅ Created admin user: {admin_email}")
            print(f"   Username: clark_admin")
            print(f"   User ID: {admin_id}")
        
        # Ensure invite codes exist
        admin = db_manager.get_user_by_email(admin_email)
        
        invite_codes = [
            {"code": "PLAYER-2025-SWRPG", "role": "player"},
            {"code": "GM-2025-SWRPG", "role": "gamemaster"},
            {"code": "ADMIN-2025-SWRPG", "role": "admin"}
        ]
        
        for invite_data in invite_codes:
            if not db_manager.get_invite_code(invite_data["code"]):
                invite = InviteCode(
                    code=invite_data["code"],
                    created_by=admin._id,
                    role=invite_data["role"],
                    expires_at=datetime.now(timezone.utc) + timedelta(days=365),
                    is_used=False
                )
                db_manager.create_invite_code(invite)
                print(f"✅ Created invite code: {invite_data['code']}")
        
        print(f"🎉 Admin setup complete!")
        print(f"🔑 Admin Login: {admin_email}")
        print(f"🔒 Password: {admin_password}")
        
        return True
        
    except Exception as e:
        print(f"❌ Admin setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def start_web_application():
    """Start the Flask web application."""
    print("🚀 Starting Star Wars RPG Character Manager...")
    
    # Start the web application directly
    try:
        # Get the current working directory (GitHub Actions uses this)
        current_dir = os.getcwd()
        print(f"📁 Current directory: {current_dir}")
        
        # Look for run_web.py in current directory
        if os.path.exists("run_web.py"):
            print("📄 Found run_web.py, starting application...")
            subprocess.run([sys.executable, "run_web.py"], check=True)
        else:
            print("❌ run_web.py not found, starting Flask app directly")
            # Import and start Flask app directly from web directory
            web_dir = os.path.join(current_dir, "web")
            sys.path.insert(0, web_dir)
            from app_with_auth import app
            app.run(host='0.0.0.0', port=8000, debug=False)
    except Exception as e:
        print(f"❌ Failed to start web application: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main startup sequence."""
    print("🌟 Star Wars RPG Character Manager - Startup Sequence")
    print("=" * 60)
    
    # Step 1: Wait for MongoDB
    if not wait_for_mongodb():
        print("❌ Cannot start without MongoDB")
        sys.exit(1)
    
    # Step 2: Ensure admin user exists
    if not ensure_admin_user():
        print("❌ Admin setup failed")
        sys.exit(1)
    
    # Step 3: Start web application
    print("\n🚀 Starting web application...")
    print("   Access at: http://localhost:8000")
    print("   Admin login: clark@everson.dev")
    print("=" * 60)
    
    start_web_application()

if __name__ == "__main__":
    main()
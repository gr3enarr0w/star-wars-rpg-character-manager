#!/usr/bin/env python3
"""Production startup script that sets up admin user and starts with Gunicorn."""

import os
import sys
import time
import subprocess
import secrets
from datetime import datetime, timezone, timedelta

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# CRITICAL: Ensure encryption key exists before ANY imports that might use security module
def _ensure_encryption_key_early():
    """Ensure encryption key exists immediately - called before any imports."""
    encryption_key_path = '.encryption_key'
    
    if not os.path.exists(encryption_key_path):
        # Generate a proper Fernet key using PBKDF2 (same as security module)
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
        import base64
        
        password = os.getenv('ENCRYPTION_PASSWORD', 'default-key-change-in-production').encode()
        salt = os.getenv('ENCRYPTION_SALT', 'swrpg-salt-change-in-production').encode()
        
        # Use PBKDF2 with SHA256 and 100,000 iterations (NIST recommended)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # 256-bit key
            salt=salt,
            iterations=100000,  # NIST recommended minimum
        )
        encryption_key = base64.urlsafe_b64encode(kdf.derive(password))
        
        # Write key to file as binary (same as security module expects)
        with open(encryption_key_path, 'wb') as f:
            f.write(encryption_key)
        
        # Set secure permissions (owner read/write only)
        os.chmod(encryption_key_path, 0o600)

# Generate encryption key immediately
_ensure_encryption_key_early()

def ensure_encryption_key():
    """Ensure encryption key exists for security module."""
    encryption_key_path = '.encryption_key'
    
    if not os.path.exists(encryption_key_path):
        print("🔐 Generating encryption key...")
        # Generate a proper Fernet key using PBKDF2 (same as security module)
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
        import base64
        
        password = os.getenv('ENCRYPTION_PASSWORD', 'default-key-change-in-production').encode()
        salt = os.getenv('ENCRYPTION_SALT', 'swrpg-salt-change-in-production').encode()
        
        # Use PBKDF2 with SHA256 and 100,000 iterations (NIST recommended)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # 256-bit key
            salt=salt,
            iterations=100000,  # NIST recommended minimum
        )
        encryption_key = base64.urlsafe_b64encode(kdf.derive(password))
        
        # Write key to file as binary (same as security module expects)
        with open(encryption_key_path, 'wb') as f:
            f.write(encryption_key)
        
        # Set secure permissions (owner read/write only)
        os.chmod(encryption_key_path, 0o600)
        print(f"✅ Encryption key generated and saved to {encryption_key_path}")
    else:
        print(f"✅ Encryption key already exists at {encryption_key_path}")
    
    return True

def wait_for_mongodb():
    """Wait for MongoDB to be ready."""
    # Show MongoDB configuration for debugging
    mongodb_uri = os.getenv('MONGO_URI', os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
    db_name = os.getenv('MONGODB_DB', 'swrpg_manager')
    print(f"🔍 MongoDB URI: {mongodb_uri}")
    print(f"🔍 Database: {db_name}")
    
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
            print(f"   Error: {str(e)}")
            time.sleep(2)
    
    print("❌ MongoDB connection timeout")
    return False

def ensure_admin_user():
    """Ensure the admin user exists."""
    try:
        from swrpg_character_manager.database import db_manager, User, InviteCode
        from swrpg_character_manager.auth import auth_manager
        
        # Admin user details
        admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
        admin_password = os.getenv("ADMIN_PASSWORD", "changeme")
        
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
                username=admin_email.split('@')[0] + "_admin",
                password_hash=auth_manager.hash_password(admin_password),
                role="admin",
                created_at=datetime.now(timezone.utc),
                is_active=True
            )
            
            admin_id = db_manager.create_user(admin)
            print(f"✅ Created admin user: {admin_email}")
            print(f"   Username: {admin.username}")
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
        
        return True
        
    except Exception as e:
        print(f"❌ Admin setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def start_gunicorn():
    """Start the application with Gunicorn."""
    print("🚀 Starting Star Wars RPG Character Manager with Gunicorn...")
    
    # Gunicorn configuration
    workers = int(os.getenv("GUNICORN_WORKERS", "4"))
    port = int(os.getenv("PORT", "8000"))
    bind_address = f"0.0.0.0:{port}"
    
    # Gunicorn command
    cmd = [
        "gunicorn",
        "--bind", bind_address,
        "--workers", str(workers),
        "--worker-class", "sync",
        "--worker-connections", "1000",
        "--max-requests", "1000",
        "--max-requests-jitter", "100",
        "--timeout", "120",
        "--keep-alive", "2",
        "--access-logfile", "-",
        "--error-logfile", "-",
        "--log-level", "info",
        "wsgi:application"
    ]
    
    print(f"🌐 Starting Gunicorn on {bind_address} with {workers} workers")
    print(f"📝 Command: {' '.join(cmd)}")
    
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Gunicorn failed to start: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("🛑 Shutting down...")
        sys.exit(0)

def main():
    """Main startup sequence."""
    print("🌟 Star Wars RPG Character Manager - Production Startup")
    print("=" * 60)
    
    # Step 1: Ensure encryption key exists BEFORE any imports that use security module
    if not ensure_encryption_key():
        print("❌ Encryption key setup failed")
        sys.exit(1)
    
    # Step 2: Wait for MongoDB
    if not wait_for_mongodb():
        print("❌ Cannot start without MongoDB")
        sys.exit(1)
    
    # Step 3: Ensure admin user exists
    if not ensure_admin_user():
        print("❌ Admin setup failed")
        sys.exit(1)
    
    # Step 4: Start Gunicorn
    print("\\n🚀 Starting production server...")
    print("   Access at: http://localhost:8000")
    print("=" * 60)
    
    start_gunicorn()

if __name__ == "__main__":
    main()
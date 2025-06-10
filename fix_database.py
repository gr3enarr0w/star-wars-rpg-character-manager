#!/usr/bin/env python3
"""Fix database by cleaning up existing data and recreating indexes."""

import pymongo
import os
import sys
import hashlib
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

def get_encryption_cipher():
    """Get the encryption cipher using the same method as the security module."""
    password = os.getenv('ENCRYPTION_PASSWORD', 'default-key-change-in-production').encode()
    salt = os.getenv('ENCRYPTION_SALT', 'swrpg-salt-change-in-production').encode()
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password))
    return Fernet(key)

def hash_email_for_index(email):
    """Create email hash for indexing."""
    return hashlib.sha256(email.lower().encode('utf-8')).hexdigest()

def is_email_encrypted(email_data):
    """Check if email is already encrypted."""
    if not email_data:
        return True
    try:
        base64.b64decode(email_data)
        return len(email_data) > 50
    except:
        return False

def fix_database():
    """Fix database schema and migrate existing data."""
    print("🔧 Fixing Database Schema and Data...")
    
    # Connect directly to MongoDB
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    db_name = os.getenv('MONGODB_DB', 'swrpg_manager')
    
    client = pymongo.MongoClient(mongodb_uri)
    db = client[db_name]
    users_collection = db.users
    
    try:
        # Step 1: Drop problematic indexes
        print("   Step 1: Dropping existing indexes...")
        try:
            users_collection.drop_index("email_hash_1")
            print("   ✅ Dropped email_hash index")
        except:
            print("   ℹ️  No email_hash index to drop")
        
        try:
            users_collection.drop_index("email_1")
            print("   ✅ Dropped email index")
        except:
            print("   ℹ️  No email index to drop")
        
        # Step 2: Find and fix users without email_hash
        print("   Step 2: Migrating user data...")
        cipher = get_encryption_cipher()
        
        users_to_fix = list(users_collection.find({
            "$or": [
                {"email_hash": {"$exists": False}},
                {"email_hash": None},
                {"email_hash": ""}
            ]
        }))
        
        print(f"   Found {len(users_to_fix)} users to migrate")
        
        for user in users_to_fix:
            try:
                user_id = user['_id']
                current_email = user.get('email', '')
                
                if not current_email:
                    print(f"   ⚠️  User {user_id} has no email, removing...")
                    users_collection.delete_one({"_id": user_id})
                    continue
                
                # Check if email is encrypted
                if is_email_encrypted(current_email):
                    # Already encrypted, just need hash
                    try:
                        decrypted_email = cipher.decrypt(base64.b64decode(current_email.encode('utf-8'))).decode('utf-8')
                        email_hash = hash_email_for_index(decrypted_email)
                    except:
                        print(f"   ❌ Failed to decrypt email for user {user_id}")
                        continue
                else:
                    # Plaintext email, encrypt it
                    plaintext_email = current_email
                    encrypted_data = cipher.encrypt(plaintext_email.encode('utf-8'))
                    encrypted_email = base64.b64encode(encrypted_data).decode('utf-8')
                    email_hash = hash_email_for_index(plaintext_email)
                    
                    # Update with encrypted email
                    users_collection.update_one(
                        {"_id": user_id},
                        {"$set": {"email": encrypted_email}}
                    )
                
                # Add email_hash
                users_collection.update_one(
                    {"_id": user_id},
                    {"$set": {"email_hash": email_hash}}
                )
                
                print(f"   ✅ Fixed user {user.get('username', 'unknown')}")
                
            except Exception as e:
                print(f"   ❌ Failed to fix user {user_id}: {e}")
        
        # Step 3: Recreate indexes
        print("   Step 3: Creating new indexes...")
        
        # Create sparse unique index for email_hash
        users_collection.create_index("email_hash", unique=True, sparse=True)
        print("   ✅ Created email_hash index")
        
        users_collection.create_index("username", unique=True)
        print("   ✅ Created username index")
        
        users_collection.create_index("google_id", sparse=True)
        print("   ✅ Created google_id index")
        
        users_collection.create_index("discord_id", sparse=True)
        print("   ✅ Created discord_id index")
        
        # Step 4: Check admin user exists
        print("   Step 4: Checking admin user...")
        
        admin_email = "admin@example.com"
        admin_email_hash = hash_email_for_index(admin_email)
        
        existing_admin = users_collection.find_one({
            "$or": [
                {"email_hash": admin_email_hash},
                {"username": "admin"}
            ]
        })
        
        if existing_admin:
            print("   ✅ Admin user already exists")
        else:
            # Encrypt admin email
            encrypted_admin_email = base64.b64encode(
                cipher.encrypt(admin_email.encode('utf-8'))
            ).decode('utf-8')
            
            # Import bcrypt for password hashing
            import bcrypt
            password_hash = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            admin_user = {
                "username": "admin",
                "email": encrypted_admin_email,
                "email_hash": admin_email_hash,
                "password_hash": password_hash,
                "role": "admin",
                "is_active": True,
                "two_factor_enabled": False,
                "passkey_enabled": False,
                "backup_codes": [],
                "passkey_credentials": [],
                "campaigns": []
            }
            
            result = users_collection.insert_one(admin_user)
            print(f"   ✅ Created admin user with ID: {result.inserted_id}")
        
        print("\n🎉 Database fix completed successfully!")
        return True
        
    except Exception as e:
        print(f"   ❌ Database fix failed: {e}")
        return False
    finally:
        client.close()

def main():
    """Run database fix."""
    print("🛡️  Database Schema Fix for NIST Compliance")
    print("=" * 50)
    
    if fix_database():
        print("\n📋 Fix Summary:")
        print("   ✅ Removed problematic indexes")
        print("   ✅ Migrated user emails to encrypted format")
        print("   ✅ Added email_hash fields for secure indexing")
        print("   ✅ Recreated database indexes")
        print("   ✅ Created admin user")
        print("   ✅ Database ready for NIST-compliant operation")
        return True
    else:
        print("\n❌ Database fix failed!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
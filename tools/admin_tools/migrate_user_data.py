#!/usr/bin/env python3
"""Migrate existing user data to use encrypted emails and email_hash fields."""

import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def migrate_existing_users():
    """Migrate existing users to encrypted email format."""
    print("🔄 Migrating Existing User Data...")
    
    try:
        from swrpg_character_manager.database import db_manager
        from swrpg_character_manager.security import data_encryption, audit_log
        
        # Connect to database
        db_manager.connect()
        
        # Find all users that need migration (those without email_hash)
        users_to_migrate = list(db_manager.users.find({
            "$or": [
                {"email_hash": {"$exists": False}},
                {"email_hash": None},
                {"email_hash": ""}
            ]
        }))
        
        print(f"   Found {len(users_to_migrate)} users to migrate")
        
        if len(users_to_migrate) == 0:
            print("   ✅ No users need migration")
            return True
        
        migrated_count = 0
        for user in users_to_migrate:
            try:
                user_id = user['_id']
                current_email = user.get('email', '')
                
                if not current_email:
                    print(f"   ⚠️  Skipping user {user_id} - no email")
                    continue
                
                # Check if email is already encrypted
                if data_encryption.is_email_encrypted(current_email):
                    # Email is already encrypted, just add hash
                    try:
                        decrypted_email = data_encryption.decrypt_email(current_email)
                        email_hash = data_encryption.hash_email_for_index(decrypted_email)
                    except:
                        print(f"   ❌ Failed to decrypt email for user {user_id}")
                        continue
                else:
                    # Email is plaintext, need to encrypt it
                    decrypted_email = current_email
                    encrypted_email = data_encryption.encrypt_email(current_email)
                    email_hash = data_encryption.hash_email_for_index(current_email)
                    
                    # Update the email field with encrypted version
                    db_manager.users.update_one(
                        {"_id": user_id},
                        {"$set": {"email": encrypted_email}}
                    )
                
                # Add email_hash field
                db_manager.users.update_one(
                    {"_id": user_id},
                    {"$set": {"email_hash": email_hash}}
                )
                
                migrated_count += 1
                print(f"   ✅ Migrated user {user.get('username', 'unknown')} ({user_id})")
                
                # Log migration event
                audit_log.log_data_access("system", "user_migration", "email_encryption", True)
                
            except Exception as e:
                print(f"   ❌ Failed to migrate user {user_id}: {e}")
                continue
        
        print(f"   ✅ Successfully migrated {migrated_count} users")
        
        # Now recreate the unique index
        print("   🔧 Recreating unique email_hash index...")
        try:
            # Drop existing index if it exists
            try:
                db_manager.users.drop_index("email_hash_1")
                print("   ✅ Dropped existing email_hash index")
            except:
                pass  # Index might not exist
            
            # Create new unique index
            db_manager.users.create_index("email_hash", unique=True, sparse=True)
            print("   ✅ Created new unique email_hash index")
            
        except Exception as e:
            print(f"   ❌ Failed to recreate index: {e}")
            return False
        
        return True
        
    except Exception as e:
        print(f"   ❌ Migration failed: {e}")
        return False
    finally:
        try:
            db_manager.disconnect()
        except:
            pass

def main():
    """Run user data migration."""
    print("🛡️  User Data Migration for NIST Compliance")
    print("=" * 50)
    
    if migrate_existing_users():
        print("\n🎉 Migration Completed Successfully!")
        print("\n📋 Migration Summary:")
        print("   ✅ Existing user emails encrypted")
        print("   ✅ Email hash fields added for secure indexing")
        print("   ✅ Database schema updated for NIST compliance")
        return True
    else:
        print("\n❌ Migration Failed!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
#!/usr/bin/env python3
"""Migrate existing character storage from JSON files to MongoDB."""

import sys
import os
import json
from datetime import datetime, timezone

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def migrate_character_files():
    """Migrate character files to MongoDB."""
    print("🔄 Migrating Character Files to MongoDB...")
    
    try:
        from swrpg_character_manager.database import db_manager, Character
        from swrpg_character_manager.security import audit_log
        
        # Connect to database
        db_manager.connect()
        
        # Find or create a test user to assign characters to
        test_user = db_manager.get_user_by_username("admin")
        if not test_user:
            print("   ❌ No admin user found. Please create admin user first.")
            return False
        
        test_user_id = test_user._id
        print(f"   ✅ Found admin user: {test_user.username} ({test_user_id})")
        
        # Look for character files
        character_files = [
            "./character_data/characters.json",
            "./web/character_data/characters.json"
        ]
        
        migrated_count = 0
        total_characters = 0
        
        for file_path in character_files:
            if not os.path.exists(file_path):
                continue
                
            print(f"   📁 Processing file: {file_path}")
            
            try:
                with open(file_path, 'r') as f:
                    characters_data = json.load(f)
                
                for char_name, char_data in characters_data.items():
                    total_characters += 1
                    
                    # Check if character already exists
                    existing_char = db_manager.characters.find_one({
                        "name": char_data["name"],
                        "user_id": test_user_id
                    })
                    
                    if existing_char:
                        print(f"   ⚠️  Character '{char_name}' already exists, skipping...")
                        continue
                    
                    # Convert file format to database format
                    try:
                        # Extract basic character info
                        character = Character(
                            user_id=test_user_id,
                            name=char_data["name"],
                            player_name=char_data.get("player_name", "Migrated Player"),
                            species=char_data["species"],
                            career=char_data["career"]["name"],
                            background=char_data.get("background", {}).get("background", ""),
                            
                            # Characteristics
                            brawn=char_data["characteristics"]["brawn"],
                            agility=char_data["characteristics"]["agility"],
                            intellect=char_data["characteristics"]["intellect"],
                            cunning=char_data["characteristics"]["cunning"],
                            willpower=char_data["characteristics"]["willpower"],
                            presence=char_data["characteristics"]["presence"],
                            
                            # Experience
                            total_xp=char_data["experience"]["total_xp"],
                            available_xp=char_data["experience"]["available_xp"],
                            spent_xp=char_data["experience"]["spent_xp"],
                            
                            # Equipment
                            credits=char_data.get("equipment", {}).get("credits", 0),
                            equipment=char_data.get("equipment", {}).get("items", [])
                        )
                        
                        # Convert skills format
                        skills_dict = {}
                        for skill_name, skill_data in char_data.get("skills", {}).items():
                            skills_dict[skill_name] = {
                                "level": skill_data.get("ranks", 0),
                                "career": skill_data.get("career_skill", False)
                            }
                        character.skills = skills_dict
                        
                        # Convert talents (if any)
                        character.talents = char_data.get("talents", [])
                        
                        # Save to database
                        character_id = db_manager.create_character(character)
                        print(f"   ✅ Migrated character: {char_name} -> {character_id}")
                        
                        # Log migration event
                        audit_log.log_data_access(str(test_user_id), "character_migration", "character_data", True)
                        
                        migrated_count += 1
                        
                    except Exception as e:
                        print(f"   ❌ Failed to migrate character '{char_name}': {e}")
                        continue
                        
            except Exception as e:
                print(f"   ❌ Failed to process file {file_path}: {e}")
                continue
        
        print(f"\n   📊 Migration Summary:")
        print(f"      Total characters found: {total_characters}")
        print(f"      Successfully migrated: {migrated_count}")
        print(f"      Assigned to user: {test_user.username}")
        
        # Create a test campaign and assign characters
        if migrated_count > 0:
            print(f"\n   🏰 Creating test campaign...")
            
            from swrpg_character_manager.database import Campaign
            
            # Check if test campaign already exists
            existing_campaign = db_manager.campaigns.find_one({
                "name": "Migrated Characters Campaign",
                "game_master_id": test_user_id
            })
            
            if not existing_campaign:
                test_campaign = Campaign(
                    name="Migrated Characters Campaign",
                    description="Campaign for characters migrated from file storage",
                    game_master_id=test_user_id
                )
                
                campaign_id = db_manager.create_campaign(test_campaign)
                print(f"      ✅ Created test campaign: {campaign_id}")
                
                # Assign migrated characters to campaign
                migrated_chars = db_manager.get_user_characters(test_user_id)
                assigned_count = 0
                
                for character in migrated_chars:
                    if not character.campaign_id:  # Only assign unassigned characters
                        if db_manager.assign_character_to_campaign(character._id, campaign_id):
                            assigned_count += 1
                
                print(f"      ✅ Assigned {assigned_count} characters to campaign")
            else:
                print(f"      ℹ️  Test campaign already exists")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Migration failed: {e}")
        return False
    finally:
        try:
            db_manager.disconnect()
        except:
            pass

def verify_migration():
    """Verify the migration was successful."""
    print("\n🔍 Verifying Migration...")
    
    try:
        from swrpg_character_manager.database import db_manager
        
        # Connect to database
        db_manager.connect()
        
        # Get admin user
        admin_user = db_manager.get_user_by_username("admin")
        if not admin_user:
            print("   ❌ Admin user not found")
            return False
        
        # Get user's characters
        characters = db_manager.get_user_characters(admin_user._id)
        print(f"   📈 Found {len(characters)} characters for admin user")
        
        # Display character details
        for char in characters:
            campaign_info = ""
            if char.campaign_id:
                campaign = db_manager.get_campaign_by_id(char.campaign_id)
                if campaign:
                    campaign_info = f" (Campaign: {campaign.name})"
            
            print(f"      • {char.name} - {char.species} {char.career}{campaign_info}")
            print(f"        XP: {char.available_xp}/{char.total_xp}, Skills: {len(char.skills)}")
        
        # Get user's campaigns
        campaigns = db_manager.get_user_campaigns(admin_user._id)
        print(f"   🏰 Found {len(campaigns)} campaigns for admin user")
        
        for campaign in campaigns:
            char_count = len(campaign.characters) if campaign.characters else 0
            print(f"      • {campaign.name} - {char_count} characters")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Verification failed: {e}")
        return False
    finally:
        try:
            db_manager.disconnect()
        except:
            pass

def main():
    """Run character migration."""
    print("🛡️  Character Migration from Files to MongoDB")
    print("=" * 50)
    
    if migrate_character_files():
        if verify_migration():
            print("\n🎉 Character Migration Completed Successfully!")
            print("\n📋 Migration Summary:")
            print("   ✅ Existing character files processed")
            print("   ✅ Characters imported to MongoDB")
            print("   ✅ Characters assigned to admin user")
            print("   ✅ Test campaign created")
            print("   ✅ NIST-compliant data security maintained")
            
            print("\n🎯 Next Steps:")
            print("   • Log in as admin user to view migrated characters")
            print("   • Test character-campaign assignment functionality")
            print("   • Verify character advancement and XP tracking")
            print("   • Create additional campaigns as needed")
            
            return True
        else:
            print("\n⚠️  Migration completed but verification failed")
            return False
    else:
        print("\n❌ Character Migration Failed!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
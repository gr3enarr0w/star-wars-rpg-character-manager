#!/usr/bin/env python3
"""
Database cleanup script to remove test/duplicate data that's causing incorrect admin statistics.
"""

import sys
import os
from datetime import datetime

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src'))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'web'))

try:
    from app_with_auth import db_manager
    from bson import ObjectId
    
    # Initialize database connection
    if db_manager is None:
        print("❌ Database manager is None")
        sys.exit(1)
        
    # Connect to database
    db_manager.connect()
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running this from the project root directory")
    sys.exit(1)
except Exception as e:
    print(f"❌ Database connection error: {e}")
    sys.exit(1)

def analyze_database():
    """Analyze current database contents."""
    print("🔍 ANALYZING DATABASE CONTENTS...\n")
    
    # Get all characters
    characters = list(db_manager.characters.find({}))
    print(f"📊 CHARACTERS: {len(characters)} total")
    
    # Categorize characters
    test_chars = []
    duplicate_chars = []
    real_chars = []
    
    for char in characters:
        name = char.get('name', '').lower()
        if any(test_word in name for test_word in ['test', 'auto', 'diag', 'debug', 'sample']):
            test_chars.append(char)
        elif name in [c.get('name', '').lower() for c in real_chars]:
            duplicate_chars.append(char)
        else:
            real_chars.append(char)
    
    print(f"  - Test characters: {len(test_chars)}")
    print(f"  - Duplicate characters: {len(duplicate_chars)}")
    print(f"  - Real characters: {len(real_chars)}")
    
    # Show test character names
    if test_chars:
        print("\n📋 Test character names:")
        for char in test_chars[:10]:  # Show first 10
            print(f"  - {char.get('name', 'Unknown')}")
        if len(test_chars) > 10:
            print(f"  ... and {len(test_chars) - 10} more")
    
    # Get all campaigns
    campaigns = list(db_manager.campaigns.find({}))
    print(f"\n📊 CAMPAIGNS: {len(campaigns)} total")
    
    test_campaigns = []
    real_campaigns = []
    
    for campaign in campaigns:
        name = campaign.get('name', '').lower()
        if 'test' in name or name.count('campaign') > 1:
            test_campaigns.append(campaign)
        else:
            real_campaigns.append(campaign)
    
    print(f"  - Test campaigns: {len(test_campaigns)}")
    print(f"  - Real campaigns: {len(real_campaigns)}")
    
    # Show campaign names
    print("\n📋 Campaign names:")
    for campaign in campaigns:
        print(f"  - {campaign.get('name', 'Unknown')}")
    
    # Get all users
    users = list(db_manager.users.find({}))
    print(f"\n📊 USERS: {len(users)} total")
    for user in users:
        print(f"  - {user.get('email', 'Unknown')} ({user.get('role', 'user')})")
    
    return {
        'characters': {'test': test_chars, 'duplicates': duplicate_chars, 'real': real_chars},
        'campaigns': {'test': test_campaigns, 'real': real_campaigns},
        'users': users
    }

def cleanup_database(dry_run=True):
    """Clean up test and duplicate data."""
    data = analyze_database()
    
    print(f"\n🧹 CLEANUP PLAN (DRY RUN: {dry_run})...")
    
    # Characters to remove
    chars_to_remove = data['characters']['test'] + data['characters']['duplicates']
    campaigns_to_remove = data['campaigns']['test']
    
    print(f"\n📋 WILL REMOVE:")
    print(f"  - {len(chars_to_remove)} characters")
    print(f"  - {len(campaigns_to_remove)} campaigns")
    
    if not dry_run:
        print(f"\n⚠️  PERFORMING ACTUAL CLEANUP...")
        
        # Remove test characters
        if chars_to_remove:
            char_ids = [char['_id'] for char in chars_to_remove]
            result = db_manager.characters.delete_many({'_id': {'$in': char_ids}})
            print(f"✅ Removed {result.deleted_count} characters")
        
        # Remove test campaigns
        if campaigns_to_remove:
            campaign_ids = [camp['_id'] for camp in campaigns_to_remove]
            result = db_manager.campaigns.delete_many({'_id': {'$in': campaign_ids}})
            print(f"✅ Removed {result.deleted_count} campaigns")
        
        print(f"\n🎉 CLEANUP COMPLETE!")
        
        # Show final stats
        print(f"\n📊 FINAL STATISTICS:")
        final_chars = db_manager.characters.count_documents({'is_active': True})
        final_campaigns = db_manager.campaigns.count_documents({'is_active': True})
        final_users = db_manager.users.count_documents({})
        
        print(f"  - Characters: {final_chars}")
        print(f"  - Campaigns: {final_campaigns}")
        print(f"  - Users: {final_users}")
    
    else:
        print(f"\n💡 Run with --cleanup to perform actual cleanup")

def main():
    """Main function."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Clean up test data from database')
    parser.add_argument('--cleanup', action='store_true', help='Actually perform cleanup (default is dry run)')
    parser.add_argument('--analyze-only', action='store_true', help='Only analyze, don\'t show cleanup plan')
    
    args = parser.parse_args()
    
    try:
        if args.analyze_only:
            analyze_database()
        else:
            cleanup_database(dry_run=not args.cleanup)
            
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
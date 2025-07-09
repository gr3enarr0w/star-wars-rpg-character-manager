#!/usr/bin/env python3
"""
Check for Duplicates in Comprehensive SWRPG Database
===================================================

Validates the comprehensive database for duplicate entries across all
data types and ensures FFG Wiki data takes priority.
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Set
from collections import defaultdict

class DuplicateDetector:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.db_file = self.base_path / "swrpg_extracted_data" / "comprehensive_authoritative_database.json"
        self.duplicates_found = defaultdict(list)
        
    def load_database(self) -> Dict[str, Any]:
        """Load the comprehensive database"""
        print("📂 Loading comprehensive database...")
        try:
            with open(self.db_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ Error loading database: {e}")
            return None
            
    def check_species_duplicates(self, db: Dict) -> List[Dict]:
        """Check for duplicate species entries"""
        print("\n🔍 CHECKING SPECIES DUPLICATES...")
        
        species_data = db.get("game_data", {}).get("species", {})
        duplicates = []
        
        # Check for exact name matches (case insensitive)
        name_groups = defaultdict(list)
        for species_name, species_info in species_data.items():
            normalized_name = species_name.lower().strip()
            name_groups[normalized_name].append({
                "original_name": species_name,
                "data": species_info
            })
            
        for normalized_name, species_list in name_groups.items():
            if len(species_list) > 1:
                print(f"   ⚠️  DUPLICATE SPECIES: {normalized_name}")
                for species in species_list:
                    source = species["data"].get("metadata", {}).get("data_source_priority", "UNKNOWN")
                    print(f"      - {species['original_name']} (Source: {source})")
                duplicates.append({
                    "type": "species",
                    "normalized_name": normalized_name,
                    "entries": species_list
                })
                
        print(f"📊 Species duplicates found: {len(duplicates)}")
        return duplicates
        
    def check_career_duplicates(self, db: Dict) -> List[Dict]:
        """Check for duplicate career entries"""
        print("\n🔍 CHECKING CAREER DUPLICATES...")
        
        careers_data = db.get("game_data", {}).get("careers", {})
        duplicates = []
        
        # Check for exact name matches (case insensitive)
        name_groups = defaultdict(list)
        for career_name, career_info in careers_data.items():
            normalized_name = career_name.lower().strip()
            name_groups[normalized_name].append({
                "original_name": career_name,
                "data": career_info
            })
            
        for normalized_name, career_list in name_groups.items():
            if len(career_list) > 1:
                print(f"   ⚠️  DUPLICATE CAREER: {normalized_name}")
                for career in career_list:
                    source = career["data"].get("metadata", {}).get("data_source_priority", "UNKNOWN")
                    print(f"      - {career['original_name']} (Source: {source})")
                duplicates.append({
                    "type": "career",
                    "normalized_name": normalized_name,
                    "entries": career_list
                })
                
        print(f"📊 Career duplicates found: {len(duplicates)}")
        return duplicates
        
    def check_equipment_duplicates(self, db: Dict) -> List[Dict]:
        """Check for duplicate equipment entries"""
        print("\n🔍 CHECKING EQUIPMENT DUPLICATES...")
        
        equipment_data = db.get("game_data", {}).get("equipment", {})
        duplicates = []
        
        # Check for exact name matches (case insensitive)
        name_groups = defaultdict(list)
        for equipment_name, equipment_info in equipment_data.items():
            normalized_name = equipment_name.lower().strip()
            name_groups[normalized_name].append({
                "original_name": equipment_name,
                "data": equipment_info
            })
            
        for normalized_name, equipment_list in name_groups.items():
            if len(equipment_list) > 1:
                print(f"   ⚠️  DUPLICATE EQUIPMENT: {normalized_name}")
                for equipment in equipment_list:
                    source = equipment["data"].get("metadata", {}).get("data_source_priority", "UNKNOWN")
                    print(f"      - {equipment['original_name']} (Source: {source})")
                duplicates.append({
                    "type": "equipment",
                    "normalized_name": normalized_name,
                    "entries": equipment_list
                })
                
        print(f"📊 Equipment duplicates found: {len(duplicates)}")
        return duplicates
        
    def resolve_duplicates_by_priority(self, duplicates: List[Dict], db: Dict) -> Dict:
        """Resolve duplicates using FFG Wiki priority system"""
        print("\n🔧 RESOLVING DUPLICATES BY PRIORITY...")
        
        priority_order = [
            "FFG_WIKI_PRIMARY",
            "VECTOR_DB_SECONDARY", 
            "BOOK_DATA_TERTIARY",
            "HARDCODED_SYSTEM"
        ]
        
        resolved_count = 0
        
        for duplicate_group in duplicates:
            data_type = duplicate_group["type"]
            normalized_name = duplicate_group["normalized_name"]
            entries = duplicate_group["entries"]
            
            # Sort by priority
            entries_with_priority = []
            for entry in entries:
                source_priority = entry["data"].get("metadata", {}).get("data_source_priority", "UNKNOWN")
                try:
                    priority_index = priority_order.index(source_priority)
                except ValueError:
                    priority_index = 999  # Unknown sources get lowest priority
                    
                entries_with_priority.append({
                    "entry": entry,
                    "priority_index": priority_index
                })
                
            # Sort by priority (lower index = higher priority)
            entries_with_priority.sort(key=lambda x: x["priority_index"])
            
            # Keep the highest priority entry, remove others
            winner = entries_with_priority[0]["entry"]
            losers = [e["entry"] for e in entries_with_priority[1:]]
            
            print(f"   🎯 RESOLVING {data_type.upper()}: {normalized_name}")
            print(f"      ✅ KEEPING: {winner['original_name']} ({winner['data']['metadata']['data_source_priority']})")
            
            for loser in losers:
                print(f"      ❌ REMOVING: {loser['original_name']} ({loser['data']['metadata']['data_source_priority']})")
                # Remove from database
                if data_type == "species":
                    del db["game_data"]["species"][loser["original_name"]]
                elif data_type == "careers":
                    del db["game_data"]["careers"][loser["original_name"]]
                elif data_type == "equipment":
                    del db["game_data"]["equipment"][loser["original_name"]]
                    
            resolved_count += len(losers)
            
        print(f"📊 Total duplicates resolved: {resolved_count}")
        return db
        
    def update_statistics(self, db: Dict) -> Dict:
        """Update database statistics after duplicate removal"""
        print("\n📊 UPDATING STATISTICS...")
        
        game_data = db.get("game_data", {})
        statistics = db.get("statistics", {})
        
        statistics["total_species"] = len(game_data.get("species", {}))
        statistics["total_careers"] = len(game_data.get("careers", {}))
        statistics["total_equipment"] = len(game_data.get("equipment", {}))
        statistics["total_force_powers"] = len(game_data.get("force_powers", {}))
        statistics["total_planets"] = len(game_data.get("planets", {}))
        statistics["total_rules"] = len(game_data.get("rules", {}))
        
        total_data_points = sum([
            statistics["total_species"],
            statistics["total_careers"], 
            statistics["total_equipment"],
            statistics["total_force_powers"],
            statistics["total_planets"],
            statistics["total_rules"]
        ])
        
        print(f"   📊 Species: {statistics['total_species']}")
        print(f"   🏢 Careers: {statistics['total_careers']}")
        print(f"   ⚔️  Equipment: {statistics['total_equipment']}")
        print(f"   ⚡ Force Powers: {statistics['total_force_powers']}")
        print(f"   🌍 Planets: {statistics['total_planets']}")
        print(f"   📜 Rules: {statistics['total_rules']}")
        print(f"   🎯 TOTAL: {total_data_points}")
        
        # Update metadata
        db["metadata"]["database_version"] = "2.1.0"
        db["metadata"]["last_updated"] = "2025-07-08"
        db["metadata"]["duplicate_check_completed"] = True
        
        return db
        
    def save_cleaned_database(self, db: Dict):
        """Save the cleaned database"""
        print(f"\n💾 SAVING CLEANED DATABASE...")
        
        try:
            with open(self.db_file, 'w', encoding='utf-8') as f:
                json.dump(db, f, indent=2, ensure_ascii=False)
            print(f"   ✅ Successfully saved cleaned database")
            return True
        except Exception as e:
            print(f"   ❌ Error saving database: {e}")
            return False
            
    def check_all_duplicates(self):
        """Main method to check and resolve all duplicates"""
        print("🚀 COMPREHENSIVE DUPLICATE CHECK")
        print("=" * 50)
        
        # Load database
        db = self.load_database()
        if not db:
            print("❌ Failed to load database")
            return
            
        # Check for duplicates in each data type
        all_duplicates = []
        all_duplicates.extend(self.check_species_duplicates(db))
        all_duplicates.extend(self.check_career_duplicates(db))
        all_duplicates.extend(self.check_equipment_duplicates(db))
        
        if all_duplicates:
            print(f"\n⚠️  TOTAL DUPLICATES FOUND: {len(all_duplicates)}")
            
            # Resolve duplicates using priority system
            cleaned_db = self.resolve_duplicates_by_priority(all_duplicates, db)
            
            # Update statistics
            final_db = self.update_statistics(cleaned_db)
            
            # Save cleaned database
            success = self.save_cleaned_database(final_db)
            
            if success:
                print("\n🎯 DUPLICATE RESOLUTION COMPLETE!")
                print("=" * 50)
                print("✅ FFG Wiki data prioritized")
                print("✅ Vector DB data used for gaps")
                print("✅ Book data used for remaining gaps")
                print("✅ All duplicates resolved")
            else:
                print("\n❌ Failed to save cleaned database")
        else:
            print("\n✅ NO DUPLICATES FOUND!")
            print("=" * 50)
            print("🎯 Database is clean and ready")

if __name__ == "__main__":
    base_path = "/Users/ceverson/Development/star-wars-rpg-character-manager"
    detector = DuplicateDetector(base_path)
    detector.check_all_duplicates()
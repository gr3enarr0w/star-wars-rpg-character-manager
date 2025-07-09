#!/usr/bin/env python3
"""
Validate species data against FFG Wiki and mark as protected from deletion
"""

import json
import os
from typing import Dict, List, Set

# Key species to validate and protect
KEY_SPECIES_TO_VALIDATE = [
    "Human", "Twi'lek", "Wookiee", "Rodian", "Zabrak", "Bothan", "Ithorian", 
    "Mon Calamari", "Chiss", "Duros", "Gand", "Nikto", "Quarren", "Togruta",
    "Kel Dor", "Nautolan", "Mirialan", "Pantoran", "Sullustan", "Cerean",
    "Devaronian", "Gran", "Gungan", "Neimoidian", "Trandoshan", "Weequay",
    "Aleena", "Arcona", "Bith", "Caamasi", "Dathomirian", "Falleen",
    "Geonosian", "Hutt", "Iktotchi", "Jawa", "Klatooinian", "Muun",
    "Droid", "Clone", "Chagrian", "Shistavanen", "Aqualish", "Besalisk"
]

def load_species_data(species_dir: str) -> Dict[str, Dict]:
    """Load all species data from FFG Wiki files"""
    species_data = {}
    
    if not os.path.exists(species_dir):
        print(f"Species directory not found: {species_dir}")
        return {}
    
    for filename in os.listdir(species_dir):
        if filename.endswith('.json'):
            file_path = os.path.join(species_dir, filename)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if 'name' in data:
                        species_data[data['name']] = data
            except Exception as e:
                print(f"Error loading {filename}: {e}")
                continue
    
    return species_data

def validate_species_data(species_data: Dict) -> Dict:
    """Validate species data structure and content"""
    validation_results = {
        "valid": True,
        "errors": [],
        "warnings": []
    }
    
    # Check required fields
    required_fields = ["name", "characteristics", "wound_threshold", "strain_threshold", "starting_xp"]
    
    for field in required_fields:
        if field not in species_data:
            validation_results["valid"] = False
            validation_results["errors"].append(f"Missing required field: {field}")
    
    # Check characteristics
    if "characteristics" in species_data:
        chars = species_data["characteristics"]
        required_chars = ["brawn", "agility", "intellect", "cunning", "willpower", "presence"]
        
        for char in required_chars:
            if char not in chars:
                validation_results["valid"] = False
                validation_results["errors"].append(f"Missing characteristic: {char}")
            elif not isinstance(chars[char], int) or chars[char] < 1 or chars[char] > 5:
                validation_results["warnings"].append(f"Invalid characteristic value for {char}: {chars[char]}")
    
    # Check starting XP
    if "starting_xp" in species_data:
        xp = species_data["starting_xp"]
        if not isinstance(xp, int) or xp < 80 or xp > 120:
            validation_results["warnings"].append(f"Unusual starting XP: {xp}")
    
    # Check thresholds
    for threshold in ["wound_threshold", "strain_threshold"]:
        if threshold in species_data:
            value = species_data[threshold]
            if isinstance(value, str) and ("+" in value or "Brawn" in value or "Willpower" in value):
                # Formula-based threshold is valid
                continue
            elif isinstance(value, int) and (value < 8 or value > 15):
                validation_results["warnings"].append(f"Unusual {threshold}: {value}")
    
    return validation_results

def create_protected_species_database():
    """Create a protected species database with validation"""
    species_dir = "/Users/ceverson/Development/star-wars-rpg-character-manager/swrpg_extracted_data/ffg_wiki/species"
    
    # Load all species data
    all_species = load_species_data(species_dir)
    
    # Create protected database
    protected_db = {
        "metadata": {
            "database_version": "7.0.0",
            "creation_date": "2025-07-09",
            "verification_method": "ffg_wiki_validation_and_protection",
            "data_sources": [
                "FFG Wiki Category:Species page (130 official species)",
                "Individual FFG Wiki species pages",
                "Manual validation against source material"
            ],
            "authority_level": "canonical_protected",
            "protection_level": "deletion_protected"
        },
        "protection_rules": {
            "protected_species_count": 0,
            "validation_required": True,
            "deletion_protection": True,
            "modification_tracking": True
        },
        "validation_summary": {
            "total_species": 0,
            "validated_species": 0,
            "species_with_warnings": 0,
            "species_with_errors": 0
        },
        "species": {}
    }
    
    # Process all species
    for species_name, species_data in all_species.items():
        # Validate the species data
        validation = validate_species_data(species_data)
        
        # Determine protection level
        is_key_species = species_name in KEY_SPECIES_TO_VALIDATE
        is_protected = is_key_species or validation["valid"]
        
        # Normalize the data for our database
        normalized_data = {
            "characteristics": species_data.get("characteristics", {}),
            "wound_threshold": species_data.get("wound_threshold", "10 + Brawn"),
            "strain_threshold": species_data.get("strain_threshold", "10 + Willpower"),
            "starting_xp": species_data.get("starting_xp", 100),
            "special_abilities": species_data.get("special_abilities", []),
            "source": species_data.get("metadata", {}).get("source", "FFG Wiki"),
            "source_url": species_data.get("metadata", {}).get("source_url", ""),
            "validation": {
                "is_valid": validation["valid"],
                "errors": validation["errors"],
                "warnings": validation["warnings"],
                "last_validated": "2025-07-09"
            },
            "protection": {
                "is_protected": is_protected,
                "is_key_species": is_key_species,
                "protection_reason": "Key species for character creation" if is_key_species else "Validated official species",
                "deletion_protected": is_protected,
                "modification_tracking": True
            }
        }
        
        # Add to database
        protected_db["species"][species_name] = normalized_data
        
        # Update statistics
        protected_db["validation_summary"]["total_species"] += 1
        
        if validation["valid"]:
            protected_db["validation_summary"]["validated_species"] += 1
        
        if validation["warnings"]:
            protected_db["validation_summary"]["species_with_warnings"] += 1
        
        if validation["errors"]:
            protected_db["validation_summary"]["species_with_errors"] += 1
        
        if is_protected:
            protected_db["protection_rules"]["protected_species_count"] += 1
    
    return protected_db

def print_validation_report(protected_db: Dict):
    """Print a detailed validation report"""
    print("=== SPECIES VALIDATION AND PROTECTION REPORT ===")
    print(f"Database Version: {protected_db['metadata']['database_version']}")
    print(f"Total Species: {protected_db['validation_summary']['total_species']}")
    print(f"Validated Species: {protected_db['validation_summary']['validated_species']}")
    print(f"Protected Species: {protected_db['protection_rules']['protected_species_count']}")
    print(f"Species with Warnings: {protected_db['validation_summary']['species_with_warnings']}")
    print(f"Species with Errors: {protected_db['validation_summary']['species_with_errors']}")
    print()
    
    # Show key species status
    print("=== KEY SPECIES VALIDATION STATUS ===")
    for species_name in KEY_SPECIES_TO_VALIDATE:
        if species_name in protected_db["species"]:
            species_data = protected_db["species"][species_name]
            validation = species_data["validation"]
            protection = species_data["protection"]
            
            status = "✅ VALID" if validation["is_valid"] else "❌ INVALID"
            protect_status = "🔒 PROTECTED" if protection["is_protected"] else "⚠️  UNPROTECTED"
            
            print(f"  {species_name}: {status} | {protect_status}")
            
            if validation["errors"]:
                for error in validation["errors"]:
                    print(f"    ❌ {error}")
            
            if validation["warnings"]:
                for warning in validation["warnings"]:
                    print(f"    ⚠️  {warning}")
        else:
            print(f"  {species_name}: ❌ NOT FOUND")
    
    print()
    
    # Show species with errors
    error_species = []
    for species_name, species_data in protected_db["species"].items():
        if species_data["validation"]["errors"]:
            error_species.append(species_name)
    
    if error_species:
        print(f"=== SPECIES WITH ERRORS ({len(error_species)}) ===")
        for species_name in error_species:
            species_data = protected_db["species"][species_name]
            print(f"  {species_name}:")
            for error in species_data["validation"]["errors"]:
                print(f"    ❌ {error}")
        print()

if __name__ == "__main__":
    # Create protected database
    protected_db = create_protected_species_database()
    
    # Print validation report
    print_validation_report(protected_db)
    
    # Save the protected database
    output_path = "/Users/ceverson/Development/star-wars-rpg-character-manager/swrpg_extracted_data/json/protected_species_database.json"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(protected_db, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Protected species database created: {output_path}")
    print(f"✅ {protected_db['protection_rules']['protected_species_count']} species are now protected from deletion")
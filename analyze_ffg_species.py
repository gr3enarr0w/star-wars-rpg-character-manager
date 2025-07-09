#!/usr/bin/env python3
"""
Analyze FFG Wiki species and create comprehensive species database
"""

import json
import os
from typing import Dict, List, Set

# Official FFG Wiki species list (122 total)
FFG_WIKI_SPECIES = [
    "Abednedo", "Aki-Aki", "Aleena", "Anx", "Aqualish", "Arcona", "Arkanian", "Balosar", "Bardottan", "Besalisk",
    "Bith", "Bothan", "Caamasi", "Caarite", "Cerean", "Chadra-Fan", "Chagrian", "Chevin", "Chiss", "Clawdite",
    "Clone", "Corellian Human", "Cosian", "Dashade", "Dathomirian", "Devaronian", "Dowutin", "Drabatan", "Drall",
    "Dressellian", "Droid", "Dug", "Duros", "Echani", "Elom", "Elomin", "Evereni", "Ewok", "Falleen", "Filordi",
    "Gand", "Gank", "Geonosian", "Gigoran", "Gossam", "Gotal", "Gozzo", "Gran", "Gungan", "Harch", "Human",
    "Human (Onderonian)", "Hutt", "Iakaru", "Iktotchi", "Ishi Tib", "Ithorian", "Jawa", "Kage", "Kaleesh",
    "Kalleran", "Kaminoan", "Karkarodon", "Kel Dor", "Klatooinian", "Kubaz", "Kyuzo", "Lannik", "Lasat",
    "Mandalorian Human", "Melitto", "Mikkian", "Miraluka", "Mirialan", "Mon Calamari", "Mustafarian", "Muun",
    "Nautolan", "Neimoidian", "Nikto", "Noghri", "Omwati", "Pantoran", "Patrolian", "Pau'an", "Phydolon",
    "Polis Massan", "Pyke", "Quarren", "Quermian", "Rakata", "Rattataki", "Rodian", "Sakiyan", "Sathari",
    "Selkath", "Selonian", "Shistavanen", "Sith Pureblood", "Skakoan", "Sluissi", "Squib", "Sullustan",
    "Talpini", "Talz", "Tarasin", "Teedo", "Thisspiasian", "Tholothian", "Tognath", "Togruta", "Toong",
    "Toydarian", "Trandoshan", "Tusken Raider", "Twi'lek", "Ugor", "Umbaran", "Verpine", "Vratix", "Vurk",
    "Weequay", "Whiphid", "Wookiee", "Xexto", "Yahk-Tosh", "Yarkora", "Zabrak", "Zeltron", "Zygerrian"
]

def normalize_species_name(name: str) -> str:
    """Normalize species name for comparison"""
    return name.lower().replace(' ', '_').replace('-', '_').replace("'", '').replace('(', '').replace(')', '')

def load_ffg_wiki_files(directory: str) -> Dict[str, Dict]:
    """Load all FFG Wiki species files"""
    species_data = {}
    
    if not os.path.exists(directory):
        print(f"Directory not found: {directory}")
        return {}
    
    for filename in os.listdir(directory):
        if filename.endswith('.json'):
            file_path = os.path.join(directory, filename)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if 'name' in data:
                        species_data[data['name']] = data
                    else:
                        # Use filename as species name if no name in data
                        species_name = filename.replace('.json', '').replace('_', ' ').title()
                        species_data[species_name] = data
            except Exception as e:
                print(f"Error loading {filename}: {e}")
                continue
    
    return species_data

def create_species_mapping() -> Dict[str, str]:
    """Create mapping between FFG Wiki names and our file names"""
    mapping = {}
    
    for official_name in FFG_WIKI_SPECIES:
        normalized = normalize_species_name(official_name)
        mapping[official_name] = normalized
    
    return mapping

def analyze_species_coverage():
    """Analyze which species we have vs official FFG Wiki list"""
    ffg_wiki_dir = "/Users/ceverson/Development/star-wars-rpg-character-manager/swrpg_extracted_data/ffg_wiki/species"
    
    # Load our extracted data
    extracted_species = load_ffg_wiki_files(ffg_wiki_dir)
    
    # Create mappings
    mapping = create_species_mapping()
    
    # Check coverage
    extracted_normalized = set()
    for species_name in extracted_species.keys():
        extracted_normalized.add(normalize_species_name(species_name))
    
    # Also check filenames
    extracted_files = set()
    if os.path.exists(ffg_wiki_dir):
        for filename in os.listdir(ffg_wiki_dir):
            if filename.endswith('.json'):
                extracted_files.add(filename.replace('.json', ''))
    
    # Analysis
    official_count = len(FFG_WIKI_SPECIES)
    extracted_count = len(extracted_species)
    file_count = len(extracted_files)
    
    print(f"=== SPECIES COVERAGE ANALYSIS ===")
    print(f"Official FFG Wiki species: {official_count}")
    print(f"Extracted species (with names): {extracted_count}")
    print(f"Extracted files: {file_count}")
    print()
    
    # Check which official species we have
    have_species = []
    missing_species = []
    
    for official_name in FFG_WIKI_SPECIES:
        normalized = normalize_species_name(official_name)
        
        # Check if we have this species
        found = False
        for extracted_name in extracted_species.keys():
            if normalize_species_name(extracted_name) == normalized:
                have_species.append(official_name)
                found = True
                break
        
        # Also check filenames
        if not found and normalized in extracted_files:
            have_species.append(official_name)
            found = True
        
        if not found:
            missing_species.append(official_name)
    
    print(f"Species we have: {len(have_species)}")
    print(f"Species we're missing: {len(missing_species)}")
    print()
    
    if missing_species:
        print("MISSING SPECIES:")
        for species in sorted(missing_species):
            print(f"  - {species}")
        print()
    
    # Check for extra species (not on official list)
    extra_species = []
    for filename in extracted_files:
        # Convert filename to display name
        display_name = filename.replace('_', ' ').title()
        
        # Check if this corresponds to an official species
        found = False
        for official_name in FFG_WIKI_SPECIES:
            if normalize_species_name(official_name) == filename:
                found = True
                break
        
        if not found:
            extra_species.append(display_name)
    
    if extra_species:
        print(f"Extra species (not on official list): {len(extra_species)}")
        for species in sorted(extra_species):
            print(f"  - {species}")
    
    return {
        'official_count': official_count,
        'extracted_count': extracted_count,
        'file_count': file_count,
        'have_species': have_species,
        'missing_species': missing_species,
        'extra_species': extra_species,
        'extracted_data': extracted_species
    }

def create_comprehensive_species_database(analysis_results: Dict):
    """Create comprehensive species database with all official FFG Wiki species"""
    
    # Load existing clean database for reference
    clean_db_path = "/Users/ceverson/Development/star-wars-rpg-character-manager/swrpg_extracted_data/json/clean_species_data.json"
    clean_species = {}
    
    if os.path.exists(clean_db_path):
        try:
            with open(clean_db_path, 'r', encoding='utf-8') as f:
                clean_data = json.load(f)
                clean_species = clean_data.get('species', {})
        except Exception as e:
            print(f"Error loading clean database: {e}")
    
    # Create comprehensive database
    comprehensive_db = {
        "metadata": {
            "database_version": "6.0.0",
            "creation_date": "2025-07-09",
            "verification_method": "ffg_wiki_comprehensive_extraction",
            "data_sources": [
                "FFG Wiki Category:Species page (122 official species)",
                "Extracted FFG Wiki species data",
                "Clean species database (verified data)",
                "Default fallback data for missing species"
            ],
            "authority_level": "comprehensive_official"
        },
        "statistics": {
            "total_official_species": len(FFG_WIKI_SPECIES),
            "extracted_species_count": len(analysis_results['have_species']),
            "missing_species_count": len(analysis_results['missing_species']),
            "fallback_species_count": 0
        },
        "species": {}
    }
    
    # Add all official species
    for official_name in FFG_WIKI_SPECIES:
        # Try to find existing data
        species_data = None
        
        # First check clean database
        if official_name in clean_species:
            species_data = clean_species[official_name]
        else:
            # Check extracted data
            for extracted_name, extracted_data in analysis_results['extracted_data'].items():
                if normalize_species_name(extracted_name) == normalize_species_name(official_name):
                    species_data = extracted_data
                    break
        
        if species_data:
            # Use existing data
            comprehensive_db["species"][official_name] = {
                "characteristics": species_data.get("characteristics", {}),
                "wound_threshold": species_data.get("wound_threshold", 10),
                "strain_threshold": species_data.get("strain_threshold", 10),
                "starting_xp": species_data.get("starting_xp", 100),
                "special_abilities": species_data.get("special_abilities", []),
                "source": species_data.get("source", "FFG Wiki"),
                "data_quality": "extracted"
            }
        else:
            # Create fallback data
            comprehensive_db["species"][official_name] = {
                "characteristics": {
                    "brawn": 2,
                    "agility": 2,
                    "intellect": 2,
                    "cunning": 2,
                    "willpower": 2,
                    "presence": 2
                },
                "wound_threshold": 10,
                "strain_threshold": 10,
                "starting_xp": 100,
                "special_abilities": [
                    "Species-specific abilities not yet extracted"
                ],
                "source": "FFG Wiki (placeholder data)",
                "data_quality": "fallback"
            }
            comprehensive_db["statistics"]["fallback_species_count"] += 1
    
    return comprehensive_db

if __name__ == "__main__":
    # Run analysis
    analysis = analyze_species_coverage()
    
    # Create comprehensive database
    comprehensive_db = create_comprehensive_species_database(analysis)
    
    # Save comprehensive database
    output_path = "/Users/ceverson/Development/star-wars-rpg-character-manager/swrpg_extracted_data/json/comprehensive_species_database.json"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(comprehensive_db, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Comprehensive species database created: {output_path}")
    print(f"✅ Total species: {len(comprehensive_db['species'])}")
    print(f"✅ Extracted data: {len(analysis['have_species'])}")
    print(f"✅ Fallback data: {comprehensive_db['statistics']['fallback_species_count']}")
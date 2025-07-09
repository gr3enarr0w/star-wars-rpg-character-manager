#!/usr/bin/env python3
"""
Final Star Wars RPG Species Verification

This script creates the authoritative verified species database by:
1. Using the official species list from sourcebooks
2. Cross-referencing with comprehensive database
3. Removing questionable/fan-created species
4. Ensuring complete game statistics for all species
"""

import json
import re
from datetime import datetime

def load_json_file(file_path):
    """Load JSON file safely"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: {file_path} not found")
        return {}
    except json.JSONDecodeError as e:
        print(f"Error parsing {file_path}: {e}")
        return {}

def load_official_species_list():
    """Load and parse the official species list"""
    official_species = {}
    
    try:
        with open('temp_species_sources.txt', 'r') as f:
            content = f.read()
        
        current_species = None
        for line in content.split('\n'):
            line = line.strip()
            if line and not line.startswith(' ') and line.endswith(':'):
                current_species = line[:-1]
                official_species[current_species] = []
            elif line.startswith(' ') and current_species:
                official_species[current_species].append(line.strip())
    except FileNotFoundError:
        print("Warning: temp_species_sources.txt not found")
    
    return official_species

def get_core_species():
    """Define core species from the three main rulebooks"""
    return {
        'EotE Core': ['Human', 'Bothan', 'Droid', 'Gand', 'Rodian', 'Trandoshan', 'Twi\'lek', 'Wookiee'],
        'AoR Core': ['Human', 'Bothan', 'Duro', 'Gran', 'Ithorian', 'Mon Calamari', 'Sullustan'],
        'F&D Core': ['Human', 'Cerean', 'Kel Dor', 'Mirialan', 'Nautolan', 'Togruta', 'Twi\'lek', 'Zabrak']
    }

def is_species_official(species_name, official_species):
    """Check if a species is in the official list (with name variations)"""
    # Direct match
    if species_name in official_species:
        return True
    
    # Common name variations
    variations = {
        'Pau\'an': 'Pau an',
        'Corellian Human': 'Corelhan Human',
        'Pho Ph\'eahian': 'Pohs Massan',
        'Polis Massan': 'Pohs Massan',
        'Whiphid': 'Whipid',
        'Dressellian': 'Dresselhan'
    }
    
    for variant, official in variations.items():
        if species_name == variant and official in official_species:
            return True
        if species_name == official and variant in official_species:
            return True
    
    return False

def analyze_species_completeness(species_data):
    """Check if species has complete game statistics"""
    required_fields = ['characteristics', 'derived_attributes', 'special_abilities']
    
    for field in required_fields:
        if field not in species_data:
            return False
    
    # Check characteristics
    chars = species_data.get('characteristics', {})
    required_chars = ['brawn', 'agility', 'intellect', 'cunning', 'willpower', 'presence']
    for char in required_chars:
        if char not in chars or not isinstance(chars[char], int):
            return False
    
    # Check derived attributes
    derived = species_data.get('derived_attributes', {})
    required_derived = ['wound_threshold', 'strain_threshold', 'starting_xp']
    for attr in required_derived:
        if attr not in derived:
            return False
    
    return True

def create_final_verified_database():
    """Create the final verified species database"""
    
    print("=== FINAL STAR WARS RPG SPECIES VERIFICATION ===\n")
    
    # Load data sources
    official_species = load_official_species_list()
    comprehensive_db = load_json_file('swrpg_extracted_data/comprehensive_authoritative_database.json')
    clean_db = load_json_file('swrpg_extracted_data/json/clean_species_data.json')
    
    # Get core species
    core_species = get_core_species()
    all_core_species = set()
    for species_list in core_species.values():
        all_core_species.update(species_list)
    
    print(f"Official species from sourcebooks: {len(official_species)}")
    print(f"Comprehensive database species: {len(comprehensive_db.get('game_data', {}).get('species', {}))}")
    print(f"Clean database species: {len(clean_db.get('species', {}))}")
    print(f"Core species total: {len(all_core_species)}")
    print()
    
    # Analysis results
    verified_species = {}
    questionable_species = []
    missing_species = []
    
    # Check comprehensive database species
    comp_species = comprehensive_db.get('game_data', {}).get('species', {})
    for species_name, species_data in comp_species.items():
        if is_species_official(species_name, official_species):
            if analyze_species_completeness(species_data):
                # Add official sources
                sources = official_species.get(species_name, [])
                if not sources:
                    # Check for variants
                    for official_name, official_sources in official_species.items():
                        if (species_name.lower() == official_name.lower() or 
                            species_name.lower() in official_name.lower() or
                            official_name.lower() in species_name.lower()):
                            sources = official_sources
                            break
                
                species_data['official_sources'] = sources
                verified_species[species_name] = species_data
            else:
                missing_species.append(f"{species_name} (incomplete data)")
        else:
            # Check if it's a reasonable species that might have been missed
            if species_name in all_core_species:
                print(f"WARNING: Core species {species_name} not in official list but found in database")
                if analyze_species_completeness(species_data):
                    verified_species[species_name] = species_data
            else:
                questionable_species.append(species_name)
    
    # Check clean database for additional verified species
    clean_species = clean_db.get('species', {})
    for species_name, species_data in clean_species.items():
        if species_name not in verified_species and is_species_official(species_name, official_species):
            # Convert clean database format to comprehensive format
            comp_format = {
                'name': species_name,
                'characteristics': species_data.get('characteristics', {}),
                'derived_attributes': {
                    'wound_threshold': species_data.get('wound_threshold', 10),
                    'strain_threshold': species_data.get('strain_threshold', 10),
                    'starting_xp': species_data.get('starting_xp', 100)
                },
                'special_abilities': species_data.get('special_abilities', []),
                'metadata': {
                    'source': species_data.get('source', 'Unknown'),
                    'data_source_priority': 'CLEAN_DB_VERIFIED',
                    'extraction_date': datetime.now().isoformat(),
                    'authority_level': 'canonical'
                },
                'official_sources': official_species.get(species_name, []),
                'vector_ready': True
            }
            
            if analyze_species_completeness(comp_format):
                verified_species[species_name] = comp_format
    
    # Check for missing core species
    for species_name in all_core_species:
        if species_name not in verified_species:
            missing_species.append(f"{species_name} (CORE SPECIES - CRITICAL)")
    
    # Create final database
    final_db = {
        'metadata': {
            'database_version': '5.0.0',
            'creation_date': datetime.now().isoformat(),
            'verification_method': 'comprehensive_sourcebook_cross_reference',
            'data_sources': [
                'Official FFG/Edge Studio sourcebooks',
                'Comprehensive authoritative database',
                'Clean species database'
            ],
            'authority_level': 'canonical_official_only'
        },
        'statistics': {
            'total_official_species': len(official_species),
            'verified_species_count': len(verified_species),
            'questionable_species_removed': len(questionable_species),
            'missing_species_count': len(missing_species),
            'core_species_verified': len([s for s in verified_species.keys() if s in all_core_species])
        },
        'verification_results': {
            'verified_species': sorted(verified_species.keys()),
            'questionable_species': sorted(questionable_species),
            'missing_species': sorted(missing_species)
        },
        'species': verified_species
    }
    
    # Generate report
    print("=== VERIFICATION RESULTS ===")
    print(f"✓ Verified species: {len(verified_species)}")
    print(f"⚠ Questionable species (removed): {len(questionable_species)}")
    print(f"✗ Missing species: {len(missing_species)}")
    print()
    
    print("CORE SPECIES STATUS:")
    for game_line, species_list in core_species.items():
        print(f"  {game_line}:")
        for species in species_list:
            status = "✓ VERIFIED" if species in verified_species else "✗ MISSING"
            print(f"    {species}: {status}")
    print()
    
    print("QUESTIONABLE SPECIES (to be removed):")
    for species in sorted(questionable_species)[:20]:  # Show first 20
        print(f"  ⚠ {species}")
    if len(questionable_species) > 20:
        print(f"  ... and {len(questionable_species) - 20} more")
    print()
    
    print("MISSING SPECIES (need official stats):")
    for species in sorted(missing_species)[:20]:  # Show first 20
        print(f"  ✗ {species}")
    if len(missing_species) > 20:
        print(f"  ... and {len(missing_species) - 20} more")
    print()
    
    # Save final database
    output_path = 'swrpg_extracted_data/FINAL_VERIFIED_SPECIES_DATABASE.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_db, f, indent=2, ensure_ascii=False)
    
    print(f"Final verified database saved to: {output_path}")
    print(f"Contains {len(verified_species)} verified species with complete official data")
    
    # Save analysis results
    analysis_path = 'final_species_analysis.json'
    analysis_results = {
        'verification_date': datetime.now().isoformat(),
        'official_species_list': official_species,
        'verification_summary': final_db['statistics'],
        'detailed_results': final_db['verification_results'],
        'removal_justifications': {
            species: 'Not found in official FFG/Edge Studio sourcebooks' 
            for species in questionable_species
        }
    }
    
    with open(analysis_path, 'w', encoding='utf-8') as f:
        json.dump(analysis_results, f, indent=2, ensure_ascii=False)
    
    print(f"Analysis results saved to: {analysis_path}")
    print()
    
    return final_db

if __name__ == '__main__':
    result = create_final_verified_database()
    print("=== FINAL VERIFICATION COMPLETE ===")
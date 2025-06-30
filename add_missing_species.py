#!/usr/bin/env python3
"""Add critical missing species to the comprehensive species data."""

import json
import os

def add_missing_species():
    """Add highly requested missing species."""
    
    # Path to the v2 species file
    species_file = "/Users/ceverson/Development/star-wars-rpg-character-manager/swrpg_extracted_data/json/comprehensive_species_data_v2.json"
    
    # Load existing data
    with open(species_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Species to add (based on common requests and notable Star Wars species)
    missing_species = {
        "Neimoidian": {
            "starting_characteristics": {
                "Brawn": 1,
                "Agility": 2,
                "Intellect": 3,
                "Cunning": 3,
                "Willpower": 2,
                "Presence": 2
            },
            "wound_threshold": 9,
            "strain_threshold": 12,
            "starting_xp": 100,
            "special_abilities": [
                "Business Sense: Neimoidians add an automatic advantage to all Negotiation checks.",
                "Cowardly: When a Neimoidian becomes the target of a combat check, they suffer 1 strain."
            ],
            "source": "Various SWRPG Supplements"
        },
        "Pantoran": {
            "starting_characteristics": {
                "Brawn": 2,
                "Agility": 2,
                "Intellect": 2,
                "Cunning": 2,
                "Willpower": 3,
                "Presence": 2
            },
            "wound_threshold": 11,
            "strain_threshold": 11,
            "starting_xp": 100,
            "special_abilities": [
                "Natural Diplomats: Pantorans add an automatic advantage to all Charm and Negotiation checks.",
                "Cold Adaptation: Pantorans can function normally in cold environments down to -30°C."
            ],
            "source": "Endless Vigil"
        },
        "Caamasi": {
            "starting_characteristics": {
                "Brawn": 1,
                "Agility": 2,
                "Intellect": 2,
                "Cunning": 2,
                "Willpower": 3,
                "Presence": 3
            },
            "wound_threshold": 10,
            "strain_threshold": 12,
            "starting_xp": 100,
            "special_abilities": [
                "Memory Share: Caamasi can share specific memories with other Caamasi through touch.",
                "Pacifist Tendencies: Caamasi upgrade the difficulty of all combat checks once."
            ],
            "source": "Desperate Allies"
        },
        "Besalisk": {
            "starting_characteristics": {
                "Brawn": 3,
                "Agility": 2,
                "Intellect": 2,
                "Cunning": 2,
                "Willpower": 2,
                "Presence": 2
            },
            "wound_threshold": 12,
            "strain_threshold": 10,
            "starting_xp": 90,
            "special_abilities": [
                "Four Arms: Besalisks have four arms and may perform a maneuver to add an automatic advantage to their next Brawl or Melee combat check.",
                "Thick Hide: Besalisks have +1 soak value."
            ],
            "source": "Special Modifications"
        },
        "Chagrian": {
            "starting_characteristics": {
                "Brawn": 2,
                "Agility": 2,
                "Intellect": 3,
                "Cunning": 2,
                "Willpower": 2,
                "Presence": 2
            },
            "wound_threshold": 11,
            "strain_threshold": 11,
            "starting_xp": 100,
            "special_abilities": [
                "Amphibious: Chagrians can breathe underwater and never suffer movement penalties for traveling through water.",
                "Radiation Sensitivity: Chagrians upgrade the difficulty of all checks twice when exposed to radiation."
            ],
            "source": "Lead by Example"
        },
        "Iktotchi": {
            "starting_characteristics": {
                "Brawn": 2,
                "Agility": 2,
                "Intellect": 2,
                "Cunning": 3,
                "Willpower": 3,
                "Presence": 1
            },
            "wound_threshold": 11,
            "strain_threshold": 11,
            "starting_xp": 100,
            "special_abilities": [
                "Precognition: Once per session, an Iktotchi may add two boost dice to any one check.",
                "Desert Dweller: Iktotchi remove one setback die imposed due to arid or hot environmental conditions."
            ],
            "source": "Keeping the Peace"
        }
    }
    
    # Add missing species to the data
    if "species" not in data:
        data["species"] = {}
    
    added_count = 0
    for species_name, species_data in missing_species.items():
        if species_name not in data["species"]:
            data["species"][species_name] = species_data
            added_count += 1
            print(f"✅ Added {species_name}")
        else:
            print(f"⚠️ {species_name} already exists")
    
    # Update metadata
    data["total_species"] = len(data["species"])
    data["last_updated"] = "2025-06-29"
    data["note"] = f"Extended with {added_count} additional high-demand species"
    
    # Save updated data
    with open(species_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n🎉 Successfully added {added_count} species!")
    print(f"📊 Total species now: {data['total_species']}")
    print(f"💾 Updated file: {species_file}")

if __name__ == "__main__":
    add_missing_species()
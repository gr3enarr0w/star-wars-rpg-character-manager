"""Character creation functionality for Star Wars RPG."""

import json
import os
from typing import Dict, List, Any
from .models import Character, Career, Specialization, GameLine, Characteristic


class CharacterCreator:
    """Handles character creation process."""
    
    def __init__(self):
        self.careers = self._initialize_careers()
        self.species_data = self._load_extracted_species_data()
    
    def _initialize_careers(self) -> Dict[str, Career]:
        """Initialize available careers for each game line."""
        careers = {}
        
        # Edge of the Empire Careers
        careers["Bounty Hunter"] = Career(
            name="Bounty Hunter",
            game_line=GameLine.EDGE_OF_EMPIRE,
            career_skills=["Athletics", "Brawl", "Perception", "Piloting (Planetary)", 
                          "Piloting (Space)", "Ranged (Heavy)", "Streetwise", "Vigilance"],
            starting_wound_threshold=12,
            starting_strain_threshold=12
        )
        
        careers["Colonist"] = Career(
            name="Colonist",
            game_line=GameLine.EDGE_OF_EMPIRE,
            career_skills=["Charm", "Deception", "Knowledge (Core Worlds)", "Knowledge (Education)", 
                          "Knowledge (Lore)", "Leadership", "Negotiation", "Streetwise"],
            starting_wound_threshold=10,
            starting_strain_threshold=14
        )
        
        careers["Explorer"] = Career(
            name="Explorer",
            game_line=GameLine.EDGE_OF_EMPIRE,
            career_skills=["Astrogation", "Cool", "Knowledge (Lore)", "Knowledge (Xenology)", 
                          "Perception", "Piloting (Planetary)", "Piloting (Space)", "Survival"],
            starting_wound_threshold=11,
            starting_strain_threshold=13
        )
        
        careers["Hired Gun"] = Career(
            name="Hired Gun",
            game_line=GameLine.EDGE_OF_EMPIRE,
            career_skills=["Athletics", "Brawl", "Discipline", "Melee", "Piloting (Planetary)", 
                          "Ranged (Light)", "Ranged (Heavy)", "Resilience"],
            starting_wound_threshold=13,
            starting_strain_threshold=11
        )
        
        careers["Smuggler"] = Career(
            name="Smuggler",
            game_line=GameLine.EDGE_OF_EMPIRE,
            career_skills=["Coordination", "Deception", "Knowledge (Underworld)", 
                          "Perception", "Piloting (Space)", "Skulduggery", "Streetwise", "Vigilance"],
            starting_wound_threshold=11,
            starting_strain_threshold=13
        )
        
        careers["Technician"] = Career(
            name="Technician",
            game_line=GameLine.EDGE_OF_EMPIRE,
            career_skills=["Astrogation", "Computers", "Coordination", "Discipline", 
                          "Knowledge (Outer Rim)", "Mechanics", "Perception", "Piloting (Planetary)"],
            starting_wound_threshold=11,
            starting_strain_threshold=13
        )
        
        # Age of Rebellion Careers
        careers["Ace"] = Career(
            name="Ace",
            game_line=GameLine.AGE_OF_REBELLION,
            career_skills=["Astrogation", "Cool", "Gunnery", "Mechanics", "Perception", 
                          "Piloting (Planetary)", "Piloting (Space)", "Ranged (Light)"],
            starting_wound_threshold=11,
            starting_strain_threshold=13
        )
        
        careers["Commander"] = Career(
            name="Commander",
            game_line=GameLine.AGE_OF_REBELLION,
            career_skills=["Coercion", "Cool", "Discipline", "Knowledge (Warfare)", 
                          "Leadership", "Perception", "Ranged (Light)", "Vigilance"],
            starting_wound_threshold=10,
            starting_strain_threshold=14
        )
        
        careers["Diplomat"] = Career(
            name="Diplomat",
            game_line=GameLine.AGE_OF_REBELLION,
            career_skills=["Charm", "Deception", "Knowledge (Core Worlds)", 
                          "Knowledge (Lore)", "Knowledge (Outer Rim)", "Knowledge (Xenology)", "Leadership", "Negotiation"],
            starting_wound_threshold=10,
            starting_strain_threshold=14
        )
        
        careers["Engineer"] = Career(
            name="Engineer",
            game_line=GameLine.AGE_OF_REBELLION,
            career_skills=["Athletics", "Computers", "Knowledge (Education)", "Mechanics", 
                          "Perception", "Piloting (Space)", "Ranged (Light)", "Vigilance"],
            starting_wound_threshold=11,
            starting_strain_threshold=13
        )
        
        careers["Soldier"] = Career(
            name="Soldier",
            game_line=GameLine.AGE_OF_REBELLION,
            career_skills=["Athletics", "Brawl", "Knowledge (Warfare)", "Medicine", 
                          "Melee", "Ranged (Light)", "Ranged (Heavy)", "Survival"],
            starting_wound_threshold=12,
            starting_strain_threshold=12
        )
        
        careers["Spy"] = Career(
            name="Spy",
            game_line=GameLine.AGE_OF_REBELLION,
            career_skills=["Computers", "Cool", "Coordination", "Deception", 
                          "Knowledge (Warfare)", "Perception", "Skulduggery", "Stealth"],
            starting_wound_threshold=10,
            starting_strain_threshold=14
        )
        
        # Force and Destiny Careers
        careers["Consular"] = Career(
            name="Consular",
            game_line=GameLine.FORCE_AND_DESTINY,
            career_skills=["Cool", "Discipline", "Knowledge (Education)", "Knowledge (Lore)", 
                          "Leadership", "Negotiation"],
            starting_wound_threshold=10,
            starting_strain_threshold=14
        )
        
        careers["Guardian"] = Career(
            name="Guardian",
            game_line=GameLine.FORCE_AND_DESTINY,
            career_skills=["Brawl", "Cool", "Discipline", "Melee", "Resilience", "Vigilance"],
            starting_wound_threshold=13,
            starting_strain_threshold=11
        )
        
        careers["Mystic"] = Career(
            name="Mystic",
            game_line=GameLine.FORCE_AND_DESTINY,
            career_skills=["Charm", "Coercion", "Knowledge (Lore)", "Knowledge (Outer Rim)", 
                          "Perception", "Vigilance"],
            starting_wound_threshold=11,
            starting_strain_threshold=13
        )
        
        careers["Seeker"] = Career(
            name="Seeker",
            game_line=GameLine.FORCE_AND_DESTINY,
            career_skills=["Knowledge (Xenology)", "Piloting (Planetary)", "Piloting (Space)", 
                          "Ranged (Heavy)", "Survival", "Vigilance"],
            starting_wound_threshold=11,
            starting_strain_threshold=13
        )
        
        careers["Sentinel"] = Career(
            name="Sentinel",
            game_line=GameLine.FORCE_AND_DESTINY,
            career_skills=["Computers", "Deception", "Knowledge (Core Worlds)", 
                          "Perception", "Skulduggery", "Stealth"],
            starting_wound_threshold=11,
            starting_strain_threshold=13
        )
        
        careers["Warrior"] = Career(
            name="Warrior",
            game_line=GameLine.FORCE_AND_DESTINY,
            career_skills=["Athletics", "Brawl", "Cool", "Melee", "Perception", "Survival"],
            starting_wound_threshold=12,
            starting_strain_threshold=12
        )
        
        # Rise of the Separatist Careers
        careers["Clone Soldier"] = Career(
            name="Clone Soldier",
            game_line=GameLine.RISE_OF_THE_SEPARATIST,
            career_skills=["Athletics", "Discipline", "Knowledge (Warfare)", 
                          "Medicine", "Ranged (Heavy)", "Resilience", "Vigilance", "Ranged (Light)"],
            starting_wound_threshold=12,
            starting_strain_threshold=12
        )
        
        careers["Jedi"] = Career(
            name="Jedi",
            game_line=GameLine.RISE_OF_THE_SEPARATIST,
            career_skills=["Discipline", "Knowledge (Education)", "Knowledge (Lore)", 
                          "Leadership", "Lightsaber", "Vigilance", "Cool", "Negotiation"],
            starting_wound_threshold=11,
            starting_strain_threshold=13
        )
        
        return careers
    
    def _load_extracted_species_data(self) -> Dict[str, Dict]:
        """Load species data from the official 97 species database (user-verified official species only)."""
        print("🔄 Loading species data from official 97 species database...")
        
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(current_dir))
        
        # Priority 1: Load from Official Species Database (user-verified official species ONLY)
        official_db_file = os.path.join(project_root, 'swrpg_extracted_data', 'OFFICIAL_SPECIES_DATABASE.json')
        official_species = self._load_official_species_database(official_db_file)
        if official_species:
            print(f"✅ Loaded {len(official_species)} official species from organized database")
            return official_species
        
        # Fallback: Load from previous official database
        official_109_db_file = os.path.join(project_root, 'swrpg_extracted_data', 'json', 'official_109_species_database.json')
        official_109_species = self._load_official_109_species_database(official_109_db_file)
        if official_109_species:
            print(f"✅ Loaded {len(official_109_species)} official species from 109 species database")
            return official_109_species
        
        # Final fallback: Load from hardcoded species
        print("⚠️  No official databases found, falling back to hardcoded species")
        core_species = self._get_comprehensive_species_data()
        print(f"✅ Loaded {len(core_species)} hardcoded species")
        return core_species
    
    def _load_species_from_file(self, file_path: str, source_name: str) -> Dict[str, Dict]:
        """Load species data from a JSON file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            species_data = data.get('species', {})
            if species_data:
                # Normalize species data format
                normalized_species = {}
                for name, species_info in species_data.items():
                    normalized_species[name] = self._normalize_species_data(species_info, source_name)
                
                print(f"✅ Loaded {len(normalized_species)} species from {source_name}")
                return normalized_species
            else:
                print(f"⚠️  No species data found in {source_name}")
                return {}
                
        except (FileNotFoundError, json.JSONDecodeError, Exception) as e:
            print(f"⚠️  Could not load {source_name}: {e}")
            return {}
    
    def _load_species_from_ffg_wiki(self, ffg_wiki_dir: str) -> Dict[str, Dict]:
        """Load species data from FFG Wiki JSON files."""
        species_data = {}
        
        try:
            if not os.path.exists(ffg_wiki_dir):
                print(f"⚠️  FFG Wiki directory not found: {ffg_wiki_dir}")
                return {}
            
            json_files = [f for f in os.listdir(ffg_wiki_dir) if f.endswith('.json')]
            
            for json_file in json_files:
                try:
                    file_path = os.path.join(ffg_wiki_dir, json_file)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        species_info = json.load(f)
                    
                    if 'name' in species_info:
                        # Normalize the FFG Wiki data format
                        normalized_species = self._normalize_species_data(species_info, "FFG Wiki")
                        species_data[species_info['name']] = normalized_species
                        
                except (json.JSONDecodeError, Exception) as e:
                    print(f"⚠️  Error loading {json_file}: {e}")
                    continue
            
            if species_data:
                print(f"✅ Loaded {len(species_data)} species from FFG Wiki")
            else:
                print(f"⚠️  No valid species data found in FFG Wiki")
                
        except Exception as e:
            print(f"⚠️  Error loading FFG Wiki species: {e}")
            
        return species_data
    
    def _load_protected_species_database(self, protected_db_file: str) -> Dict[str, Dict]:
        """Load protected species database with all 150 official FFG Wiki species"""
        try:
            with open(protected_db_file, 'r', encoding='utf-8') as f:
                protected_db = json.load(f)
            
            protected_species = {}
            for name, species_info in protected_db.get("species", {}).items():
                # Use the validated and protected species data
                protected_species[name] = self._normalize_species_data(species_info, "Protected Database")
            
            print(f"✅ Loaded {len(protected_species)} protected species from database")
            return protected_species
            
        except Exception as e:
            print(f"⚠️  Could not load protected database: {e}")
            return {}
    
    def _load_comprehensive_species_database(self, comprehensive_db_file: str) -> Dict[str, Dict]:
        """Load comprehensive species database with all official FFG Wiki species"""
        try:
            with open(comprehensive_db_file, 'r', encoding='utf-8') as f:
                comprehensive_db = json.load(f)
            
            comprehensive_species = {}
            for name, species_info in comprehensive_db.get("species", {}).items():
                # Use the comprehensive species data
                comprehensive_species[name] = self._normalize_species_data(species_info, "Comprehensive Database")
            
            print(f"✅ Loaded {len(comprehensive_species)} comprehensive species from database")
            return comprehensive_species
            
        except Exception as e:
            print(f"⚠️  Could not load comprehensive database: {e}")
            return {}
    
    def _filter_valid_ffg_species(self, ffg_species: Dict[str, Dict]) -> Dict[str, Dict]:
        """Filter out FFG Wiki species with invalid/placeholder data."""
        valid_species = {}
        
        for name, species_data in ffg_species.items():
            # Check if species has valid characteristics (not all 2s)
            chars = species_data.get('characteristics', {})
            if not chars:
                continue
                
            # Check if all characteristics are 2 (invalid placeholder data)
            all_twos = all(value == 2 for value in chars.values())
            
            # Check if species has proper data structure
            has_wound_threshold = 'wound_threshold' in species_data
            has_strain_threshold = 'strain_threshold' in species_data
            has_starting_xp = 'starting_xp' in species_data
            
            if not all_twos and has_wound_threshold and has_strain_threshold and has_starting_xp:
                valid_species[name] = species_data
            else:
                print(f"⚠️  Skipping {name} - invalid FFG Wiki data (using fallback)")
                
        return valid_species
    
    def _load_verified_species_database(self, verified_db_file: str) -> Dict[str, Dict]:
        """Load verified species database with deduplication and verification"""
        try:
            with open(verified_db_file, 'r', encoding='utf-8') as f:
                verified_db = json.load(f)
            
            verified_species = {}
            for name, species_info in verified_db.get("species", {}).items():
                # Use the verified data with proper normalization
                species_data = species_info.get("data", {})
                verified_species[name] = self._normalize_species_data(species_data, "Verified Database")
            
            print(f"✅ Loaded {len(verified_species)} species from verified database")
            return verified_species
            
        except Exception as e:
            print(f"⚠️  Could not load verified database: {e}")
            return {}
    
    def _load_official_species_database(self, official_db_file: str) -> Dict[str, Dict]:
        """Load official species database with organized categories"""
        try:
            with open(official_db_file, 'r', encoding='utf-8') as f:
                official_db = json.load(f)
            
            official_species = {}
            for name, species_info in official_db.get("species", {}).items():
                # Use the official data with proper normalization
                official_species[name] = self._normalize_species_data(species_info, "Official Species Database")
            
            print(f"✅ Loaded {len(official_species)} official species from organized database")
            return official_species
            
        except Exception as e:
            print(f"⚠️  Could not load official species database: {e}")
            return {}
    
    def _load_final_verified_species_database(self, final_verified_db_file: str) -> Dict[str, Dict]:
        """Load final verified species database with only official FFG/Edge Studio species"""
        try:
            with open(final_verified_db_file, 'r', encoding='utf-8') as f:
                final_verified_db = json.load(f)
            
            final_verified_species = {}
            for name, species_info in final_verified_db.get("species", {}).items():
                # Use the final verified data with proper normalization
                species_data = species_info.get("data", {})
                final_verified_species[name] = self._normalize_species_data(species_data, "Final Verified Database (Official Only)")
            
            print(f"✅ Loaded {len(final_verified_species)} official species from final verified database")
            return final_verified_species
            
        except Exception as e:
            print(f"⚠️  Could not load final verified database: {e}")
            return {}
    
    def _load_final_official_species_database(self, final_official_db_file: str) -> Dict[str, Dict]:
        """Load final official species database with only 130 official FFG Wiki species"""
        try:
            with open(final_official_db_file, 'r', encoding='utf-8') as f:
                final_official_db = json.load(f)
            
            final_official_species = {}
            for name, species_info in final_official_db.get("species", {}).items():
                # Use the final official data with proper normalization
                final_official_species[name] = self._normalize_species_data(species_info, "Final Official Database (FFG Wiki Only)")
            
            print(f"✅ Loaded {len(final_official_species)} official species from final official database")
            return final_official_species
            
        except Exception as e:
            print(f"⚠️  Could not load final official database: {e}")
            return {}
    
    def _load_official_109_species_database(self, official_109_db_file: str) -> Dict[str, Dict]:
        """Load official 109 species database with user-verified official species"""
        try:
            with open(official_109_db_file, 'r', encoding='utf-8') as f:
                official_109_db = json.load(f)
            
            official_109_species = {}
            for name, species_info in official_109_db.get("species", {}).items():
                # Use the official 109 species data with proper normalization
                official_109_species[name] = self._normalize_species_data(species_info, "Official 109 Species Database")
            
            print(f"✅ Loaded {len(official_109_species)} official species from 109 species database")
            return official_109_species
            
        except Exception as e:
            print(f"⚠️  Could not load official 109 species database: {e}")
            return {}
    
    def _normalize_species_data(self, species_info: Dict[str, Any], source: str) -> Dict[str, Any]:
        """Normalize species data to consistent format for character creation."""
        
        # Handle different data formats from different sources
        normalized = {
            "characteristics": species_info.get("characteristics", {}),
            "wound_threshold": species_info.get("wound_threshold", "10 + Brawn"),
            "strain_threshold": species_info.get("strain_threshold", "10 + Willpower"), 
            "starting_xp": species_info.get("starting_xp", 100),
            "special_abilities": species_info.get("special_abilities", []),
            "source": source
        }
        
        # Handle string-based thresholds (convert to formulas if needed)
        wound_threshold = normalized["wound_threshold"]
        if isinstance(wound_threshold, int):
            normalized["wound_threshold"] = wound_threshold
        elif isinstance(wound_threshold, str) and "+" not in wound_threshold:
            # If it's just a number as string, convert to int
            try:
                normalized["wound_threshold"] = int(wound_threshold)
            except (ValueError, TypeError):
                normalized["wound_threshold"] = "10 + Brawn"
        
        strain_threshold = normalized["strain_threshold"]
        if isinstance(strain_threshold, int):
            normalized["strain_threshold"] = strain_threshold
        elif isinstance(strain_threshold, str) and "+" not in strain_threshold:
            # If it's just a number as string, convert to int
            try:
                normalized["strain_threshold"] = int(strain_threshold)
            except (ValueError, TypeError):
                normalized["strain_threshold"] = "10 + Willpower"
        
        # Ensure special_abilities is a list
        if isinstance(normalized["special_abilities"], str):
            normalized["special_abilities"] = [normalized["special_abilities"]]
        elif not isinstance(normalized["special_abilities"], list):
            normalized["special_abilities"] = []
        
        return normalized
    
    def _get_comprehensive_species_data(self) -> Dict[str, Dict]:
        """Get comprehensive built-in species data for production deployment."""
        return {
            # Core Species from Edge of the Empire
            "Human": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 10,
                "starting_xp": 110,
                "special_abilities": ["Two non-career skills of choice", "Most adaptable and numerous species", "Balanced characteristics"],
                "source": "EotE Core Rulebook"
            },
            "Twi'lek": {
                "characteristics": {"brawn": 1, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 3},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["Twi'leks begin the game with one rank in either Charm or Deception. They still may not train Charm or Deception above rank 2 during character creation.", "Desert Dwellers: When making skill checks, Twi'leks may remove a setback die imposed due to arid or hot environmental conditions."],
                "source": "EotE Core Rulebook"
            },
            "Rodian": {
                "characteristics": {"brawn": 2, "agility": 3, "intellect": 2, 
                                 "cunning": 2, "willpower": 1, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 10,
                "starting_xp": 100,
                "special_abilities": ["Rodians begin the game with one rank in Survival. They still may not train Survival above rank 2 during character creation.", "Rodians start with one rank in the Expert Tracker talent."],
                "source": "EotE Core Rulebook"
            },
            "Wookiee": {
                "characteristics": {"brawn": 3, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 1, "presence": 2},
                "wound_threshold": 14,
                "strain_threshold": 8,
                "starting_xp": 90,
                "special_abilities": ["Wookiees begin the game with oner rank in Brawl. They still may not train Brawl above rank 2 during character creation.", "Wookiee Rage: When a Wookiee has suffered any wounds [they] deal +1 damage to Brawl and Melee attacks. When a Wookiee is Critically Injured, [they] instead deal +2 damage to Brawl and Melee attacks."],
                "source": "EotE Core Rulebook"
            },
            "Bothan": {
                "characteristics": {"brawn": 1, "agility": 2, "intellect": 2, 
                                 "cunning": 3, "willpower": 2, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["Bothans begin the game with one rank in Streetwise. They still may not train Streetwise above rank 2 during character creation.", "They also start with one rank in the Convincing Demeanor talent."],
                "source": "Age of Rebellion"
            },
            
            # Additional Core Species
            "Duros": {
                "characteristics": {"brawn": 1, "agility": 2, "intellect": 3, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 11,
                "strain_threshold": 12,
                "starting_xp": 100,
                "special_abilities": ["One free rank in Piloting (Space) (cannot train above rank 2 during creation)", "May remove up to 2 setback dice imposed due to environmental effects on any Piloting checks", "Low-Light Vision: Remove up to 2 setback dice imposed by low-light conditions"],
                "source": "Age of Rebellion"
            },
            "Gand": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 3, "presence": 1},
                "wound_threshold": 10,
                "strain_threshold": 10,
                "starting_xp": 100,
                "special_abilities": ["One rank in Discipline", "Ammonia Breathers: Subspecies variations", "Findsman tracking abilities"],
                "source": "EotE Core Rulebook"
            },
            "Trandoshan": {
                "characteristics": {"brawn": 3, "agility": 1, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 12,
                "strain_threshold": 9,
                "starting_xp": 90,
                "special_abilities": ["Trandoshans begin the game with one rank in Perception. They still may not train Perception above rank 2 during character creation.", "Regeneration: Whenever a Trandoshan would recover one or more wounds from natural rest or recuperation in a Bacta tank, they recover one additional wound. They do not recover one additional wound when receiving first aid or medical treatment from a character, or when using a stimpack. Trandoshans can regrow lost limbs as well, though it usually takes at least a month before the limb is usable.", "Claws: When a Trandoshan makes Brawl checks to deal damage to an opponent, they deal +1 damage and have a Critical Rating of 3."],
                "source": "Age of Rebellion"
            },
            
            # Force and Destiny Species
            "Cerean": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 3, 
                                 "cunning": 2, "willpower": 3, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 90,
                "special_abilities": ["Begin with one rank in Knowledge (Education)", "May spend Destiny Points to reroll any Knowledge skill check", "Alternative: May spend Strain to add advantage to any Knowledge or Vigilance check"],
                "source": "Force and Destiny"
            },
            "Kel Dor": {
                "characteristics": {"brawn": 1, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 3, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["Atmospheric requirement", "Dark vision"],
                "source": "Force and Destiny"
            },
            "Nautolan": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 10,
                "starting_xp": 100,
                "special_abilities": ["Amphibious: Can breathe underwater", "Pheromone Detection: Can sense emotions and intentions", "Head Tentacles: Enhanced sensory capabilities"],
                "source": "Force and Destiny"
            },
            "Zabrak": {
                "characteristics": {"brawn": 2, "agility": 3, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 11,
                "strain_threshold": 10,
                "starting_xp": 100,
                "special_abilities": ["Pain Tolerance: Reduce Critical Injury results by 10 (minimum of 1)"],
                "source": "Force and Destiny"
            },
            
            # Age of Rebellion Species
            "Mon Calamari": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 3, 
                                 "cunning": 3, "willpower": 2, "presence": 3},
                "wound_threshold": 10,
                "strain_threshold": 13,
                "starting_xp": 100,
                "special_abilities": ["Amphibious: Can breathe underwater", "Keen Vision: Enhanced visual capabilities"],
                "source": "Age of Rebellion"
            },
            "Sullustan": {
                "characteristics": {"brawn": 2, "agility": 3, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 12,
                "strain_threshold": 12,
                "starting_xp": 100,
                "special_abilities": ["Darkvision: Can see in low-light conditions", "Expert Navigator: Bonuses to navigation checks", "Keen Senses: Enhanced sensory capabilities", "Sure-Footed: Improved balance and movement"],
                "source": "Age of Rebellion"
            },
            
            # Additional Popular Species
            "Chiss": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 3, 
                                 "cunning": 2, "willpower": 3, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 10,
                "starting_xp": 100,
                "special_abilities": ["One rank in Cool", "Infravision: Remove setback from lighting conditions", "Disciplined and analytical"],
                "source": "Enter the Unknown"
            },
            "Jawa": {
                "characteristics": {"brawn": 1, "agility": 2, "intellect": 3, 
                                 "cunning": 3, "willpower": 1, "presence": 2},
                "wound_threshold": 8,
                "strain_threshold": 11,
                "starting_xp": 120,
                "special_abilities": ["Technical aptitude", "Scavenger"],
                "source": "Lords of Nal Hutta"
            },
            "Devaronian": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 3, "willpower": 2, "presence": 1},
                "wound_threshold": 11,
                "strain_threshold": 10,
                "starting_xp": 95,
                "special_abilities": ["One rank in Survival or Deception", "Resilient Metabolism: Automatic boost to Resilience checks", "Hardy physiology resistant to toxins"],
                "source": "Lords of Nal Hutta"
            },
            
            # Era of the Republic Species
            "Clone": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 11,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["One rank in Knowledge (Warfare)", "One rank in Resilience", "Kamino Training"],
                "source": "Clone Wars Era"
            },
            "Dathomirian": {
                "characteristics": {"brawn": 3, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 3, "presence": 1},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["One rank in Coordination", "One rank in Survival", "Nightsister Magic"],
                "source": "Clone Wars Era"
            },
            "Togruta": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 3},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["Montrals: Togruta have a pair of hollow horn-like projections called montrals that grow from the top of their heads. These montrals are used for echolocation. Togruta ignore the effects of all environmental conditions that would cause them to upgrade the difficulty of Perception checks once.", "Natural Hunters: Add boost dice to checks to track or hunt prey"],
                "source": "Force and Destiny"
            },
            "Weequay": {
                "characteristics": {"brawn": 3, "agility": 1, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 12,
                "strain_threshold": 9,
                "starting_xp": 90,
                "special_abilities": ["Desert dwellers", "Pheromone communication", "Tough hide"],
                "source": "Lords of Nal Hutta"
            },
            "Quarren": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 3, 
                                 "cunning": 2, "willpower": 1, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 10,
                "starting_xp": 100,
                "special_abilities": ["Amphibious", "Ink cloud", "Tentacle dexterity"],
                "source": "Age of Rebellion"
            },
            "Ithorian": {
                "characteristics": {"brawn": 2, "agility": 1, "intellect": 2, 
                                 "cunning": 2, "willpower": 3, "presence": 2},
                "wound_threshold": 11,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["Nature bond", "Sonic bellow", "Peaceful nature"],
                "source": "Lords of Nal Hutta"
            },
            
            # Additional Species from Sourcebooks
            "Aqualish": {
                "characteristics": {"brawn": 3, "agility": 2, "intellect": 2, 
                                 "cunning": 1, "willpower": 2, "presence": 2},
                "wound_threshold": 11,
                "strain_threshold": 8,
                "starting_xp": 90,
                "special_abilities": ["One rank in Brawl", "Amphibious: Can breathe underwater"],
                "source": "Lords of Nal Hutta"
            },
            "Arcona": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 3, "willpower": 1, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 10,
                "starting_xp": 100,
                "special_abilities": ["One rank in Vigilance", "Desert adaptation", "Mood readers"],
                "source": "Lords of Nal Hutta"
            },
            "Falleen": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 3},
                "wound_threshold": 10,
                "strain_threshold": 12,
                "starting_xp": 90,
                "special_abilities": ["One rank in Charm", "Beguiling Pheromones: Upgrade Charm/Deception/Negotiation", "Color-changing skin and emotional manipulation"],
                "source": "Fly Casual"
            },
                        "Droid": {
                "characteristics": {"brawn": 1, "agility": 1, "intellect": 1, 
                                 "cunning": 1, "willpower": 1, "presence": 1},
                "wound_threshold": 10,
                "strain_threshold": 10,
                "starting_xp": 175,
                "special_abilities": ["Droid: Cannot be targeted by mind-altering Force powers", "Inorganic: Does not need to breathe, eat, or drink", "Mechanical Being: +1 rank in one skill at character creation"],
                "source": "EotE Core Rulebook"
            },
            "Gran": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 1, "presence": 3},
                "wound_threshold": 10,
                "strain_threshold": 9,
                "starting_xp": 100,
                "special_abilities": ["One rank in Charm or Negotiation", "Enhanced Vision: Remove setback from ranged combat/Perception", "Three-eyed peaceful species"],
                "source": "Far Horizons"
            }
        }
    
    # Legacy species data loading method (kept for backwards compatibility)
    def _load_extracted_species_data_old(self) -> Dict[str, Dict]:
        """Legacy method: Load species data from extracted SWRPG PDF data, with comprehensive built-in species fallback."""
        # Start with comprehensive built-in species for compatibility
        builtin_species = self._initialize_species()
        
        # Get the path to the comprehensive species data
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(current_dir))
        species_file = os.path.join(project_root, 'swrpg_extracted_data', 'json', 'comprehensive_species_data_v2.json')
        
        try:
            with open(species_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Extract species data from the JSON
            extracted_species = data.get('species', {})
            
            if extracted_species:
                # Merge extracted species with built-in species (extracted takes precedence)
                combined_species = {**builtin_species, **extracted_species}
                # Silent success for production deployment
                return combined_species
            else:
                # Silent fallback to comprehensive built-in species
                return builtin_species
                
        except FileNotFoundError:
            # Silent fallback to comprehensive built-in species for production deployment
            return builtin_species
        except json.JSONDecodeError:
            # Silent fallback to comprehensive built-in species
            return builtin_species
        except Exception as e:
            # Silent fallback to comprehensive built-in species
            return builtin_species
    
    def _get_core_species_data(self) -> Dict[str, Dict]:
        """Get minimal core species data for compatibility."""
        return {
            "Human": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 10,
                "starting_xp": 110,
                "special_abilities": ["Two non-career skills of choice", "Most adaptable and numerous species", "Balanced characteristics"],
                "source": "EotE Core Rulebook"
            },
            "Twi'lek": {
                "characteristics": {"brawn": 1, "agility": 2, "intellect": 2, 
                                 "cunning": 3, "willpower": 2, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["One rank in Charm or Deception", "Heat resistance: Remove setback from arid/hot conditions", "Lekku head-tails for communication"],
                "source": "EotE Core Rulebook"
            },
            "Wookiee": {
                "characteristics": {"brawn": 3, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 1, "presence": 2},
                "wound_threshold": 14,
                "strain_threshold": 8,
                "starting_xp": 90,
                "special_abilities": ["Rage ability", "Natural claws (Brawl +1 damage)"],
                "source": "EotE Core Rulebook"
            }
        }
    
    def create_character(self, name: str, player_name: str, species: str, 
                        career_name: str, characteristic_points: Dict[str, int] = None) -> Character:
        """Create a new character with the given parameters."""
        
        if career_name not in self.careers:
            raise ValueError(f"Unknown career: {career_name}")
        
        if species not in self.species_data:
            raise ValueError(f"Unknown species: {species}")
        
        career = self.careers[career_name]
        species_info = self.species_data[species]
        
        # Apply species characteristic modifiers
        base_characteristics = species_info["characteristics"].copy()
        
        # Apply additional characteristic points if provided
        if characteristic_points:
            for char, points in characteristic_points.items():
                if char in base_characteristics:
                    base_characteristics[char] += points
        
        # Create character
        character = Character(
            name=name,
            player_name=player_name,
            species=species,
            career=career,
            brawn=base_characteristics["brawn"],
            agility=base_characteristics["agility"],
            intellect=base_characteristics["intellect"],
            cunning=base_characteristics["cunning"],
            willpower=base_characteristics["willpower"],
            presence=base_characteristics["presence"],
            total_xp=species_info["starting_xp"],
            available_xp=species_info["starting_xp"]
        )
        
        return character
    
    def get_available_careers(self, game_line: GameLine = None) -> List[str]:
        """Get list of available careers, optionally filtered by game line."""
        if game_line:
            return [name for name, career in self.careers.items() 
                   if career.game_line == game_line]
        return list(self.careers.keys())
    
    def get_available_species(self) -> List[str]:
        """Get list of available species."""
        return list(self.species_data.keys())
    
    def get_career_info(self, career_name: str) -> Career:
        """Get detailed information about a career."""
        return self.careers.get(career_name)
    
    def get_species_info(self, species_name: str) -> Dict:
        """Get detailed information about a species."""
        return self.species_data.get(species_name)
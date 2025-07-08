"""Character creation functionality for Star Wars RPG."""

import json
import os
from typing import Dict, List
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
            career_skills=["Athletics", "Piloting (Planetary)", "Piloting (Space)", 
                          "Ranged (Heavy)", "Streetwise", "Vigilance"],
            starting_wound_threshold=12,
            starting_strain_threshold=12
        )
        
        careers["Colonist"] = Career(
            name="Colonist",
            game_line=GameLine.EDGE_OF_EMPIRE,
            career_skills=["Charm", "Deception", "Leadership", "Negotiation", 
                          "Streetwise", "Survival"],
            starting_wound_threshold=10,
            starting_strain_threshold=14
        )
        
        careers["Explorer"] = Career(
            name="Explorer",
            game_line=GameLine.EDGE_OF_EMPIRE,
            career_skills=["Astrogation", "Cool", "Perception", "Piloting (Space)", 
                          "Survival", "Xenology"],
            starting_wound_threshold=11,
            starting_strain_threshold=13
        )
        
        careers["Hired Gun"] = Career(
            name="Hired Gun",
            game_line=GameLine.EDGE_OF_EMPIRE,
            career_skills=["Athletics", "Discipline", "Melee", "Ranged (Light)", 
                          "Ranged (Heavy)", "Resilience"],
            starting_wound_threshold=13,
            starting_strain_threshold=11
        )
        
        careers["Smuggler"] = Career(
            name="Smuggler",
            game_line=GameLine.EDGE_OF_EMPIRE,
            career_skills=["Coordination", "Deception", "Knowledge (Underworld)", 
                          "Piloting (Space)", "Skulduggery", "Streetwise"],
            starting_wound_threshold=11,
            starting_strain_threshold=13
        )
        
        careers["Technician"] = Career(
            name="Technician",
            game_line=GameLine.EDGE_OF_EMPIRE,
            career_skills=["Astrogation", "Computers", "Coordination", "Discipline", 
                          "Knowledge (Outer Rim)", "Mechanics"],
            starting_wound_threshold=11,
            starting_strain_threshold=13
        )
        
        # Age of Rebellion Careers
        careers["Ace"] = Career(
            name="Ace",
            game_line=GameLine.AGE_OF_REBELLION,
            career_skills=["Cool", "Coordination", "Mechanics", "Piloting (Planetary)", 
                          "Piloting (Space)", "Ranged (Light)"],
            starting_wound_threshold=11,
            starting_strain_threshold=13
        )
        
        careers["Commander"] = Career(
            name="Commander",
            game_line=GameLine.AGE_OF_REBELLION,
            career_skills=["Cool", "Discipline", "Knowledge (Core Worlds)", 
                          "Knowledge (Warfare)", "Leadership", "Vigilance"],
            starting_wound_threshold=10,
            starting_strain_threshold=14
        )
        
        careers["Diplomat"] = Career(
            name="Diplomat",
            game_line=GameLine.AGE_OF_REBELLION,
            career_skills=["Charm", "Deception", "Knowledge (Core Worlds)", 
                          "Knowledge (Lore)", "Leadership", "Negotiation"],
            starting_wound_threshold=10,
            starting_strain_threshold=14
        )
        
        # Force and Destiny Careers
        careers["Consular"] = Career(
            name="Consular",
            game_line=GameLine.FORCE_AND_DESTINY,
            career_skills=["Cool", "Discipline", "Leadership", "Negotiation", 
                          "Knowledge (Education)", "Knowledge (Lore)"],
            starting_wound_threshold=10,
            starting_strain_threshold=14
        )
        
        careers["Guardian"] = Career(
            name="Guardian",
            game_line=GameLine.FORCE_AND_DESTINY,
            career_skills=["Brawl", "Discipline", "Melee", "Resilience", 
                          "Vigilance", "Cool"],
            starting_wound_threshold=13,
            starting_strain_threshold=11
        )
        
        careers["Mystic"] = Career(
            name="Mystic",
            game_line=GameLine.FORCE_AND_DESTINY,
            career_skills=["Charm", "Coercion", "Deception", "Knowledge (Lore)", 
                          "Perception", "Vigilance"],
            starting_wound_threshold=11,
            starting_strain_threshold=13
        )
        
        careers["Seeker"] = Career(
            name="Seeker",
            game_line=GameLine.FORCE_AND_DESTINY,
            career_skills=["Knowledge (Xenology)", "Medicine", "Perception", 
                          "Piloting (Planetary)", "Stealth", "Survival"],
            starting_wound_threshold=11,
            starting_strain_threshold=13
        )
        
        careers["Sentinel"] = Career(
            name="Sentinel",
            game_line=GameLine.FORCE_AND_DESTINY,
            career_skills=["Computers", "Deception", "Knowledge (Underworld)", 
                          "Skulduggery", "Stealth", "Streetwise"],
            starting_wound_threshold=11,
            starting_strain_threshold=13
        )
        
        careers["Warrior"] = Career(
            name="Warrior",
            game_line=GameLine.FORCE_AND_DESTINY,
            career_skills=["Athletics", "Brawl", "Melee", "Ranged (Light)", 
                          "Resilience", "Survival"],
            starting_wound_threshold=12,
            starting_strain_threshold=12
        )
        
        return careers
    
    def _load_extracted_species_data(self) -> Dict[str, Dict]:
        """Load species data from extracted SWRPG PDF data, with core species fallback."""
        # Start with comprehensive hardcoded species for production deployment
        core_species = self._get_comprehensive_species_data()
        
        # Try to load extracted data if available (for development environments)
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(current_dir))
        species_file = os.path.join(project_root, 'swrpg_extracted_data', 'json', 'comprehensive_species_data_v2.json')
        
        try:
            with open(species_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            extracted_species = data.get('species', {})
            
            if extracted_species:
                # Merge extracted species with core species (extracted takes precedence)
                combined_species = {**core_species, **extracted_species}
                print(f"✅ Loaded {len(extracted_species)} species from extracted sourcebooks + {len(core_species)} built-in species")
                return combined_species
            else:
                # Use comprehensive built-in species
                return core_species
                
        except (FileNotFoundError, json.JSONDecodeError, Exception):
            # Silently fall back to comprehensive built-in species for production
            return core_species
    
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
                "special_abilities": ["Extra skill rank in two different skills"],
                "source": "Core - Edge of the Empire"
            },
            "Twi'lek": {
                "characteristics": {"brawn": 1, "agility": 2, "intellect": 2, 
                                 "cunning": 3, "willpower": 2, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["Remove one setback die from charm and deception checks"],
                "source": "Core - Edge of the Empire"
            },
            "Rodian": {
                "characteristics": {"brawn": 2, "agility": 3, "intellect": 2, 
                                 "cunning": 2, "willpower": 1, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 10,
                "starting_xp": 100,
                "special_abilities": ["Remove one setback die from perception checks", 
                                    "Expert tracker"],
                "source": "Core - Edge of the Empire"
            },
            "Wookiee": {
                "characteristics": {"brawn": 3, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 1, "presence": 2},
                "wound_threshold": 14,
                "strain_threshold": 8,
                "starting_xp": 90,
                "special_abilities": ["Rage ability", "Natural claws (Brawl +1 damage)"],
                "source": "Core - Edge of the Empire"
            },
            "Bothan": {
                "characteristics": {"brawn": 1, "agility": 2, "intellect": 2, 
                                 "cunning": 3, "willpower": 2, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["Conviction: Once per session, may perform a maneuver"],
                "source": "Age of Rebellion"
            },
            
            # Additional Core Species
            "Duros": {
                "characteristics": {"brawn": 1, "agility": 2, "intellect": 3, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 9,
                "strain_threshold": 12,
                "starting_xp": 100,
                "special_abilities": ["Intuitive Navigation", "Remove one setback from Astrogation checks"],
                "source": "Edge of the Empire"
            },
            "Gand": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 3, "willpower": 1, "presence": 2},
                "wound_threshold": 11,
                "strain_threshold": 10,
                "starting_xp": 100,
                "special_abilities": ["Ammonia breathers", "Natural mystics"],
                "source": "Edge of the Empire"
            },
            "Trandoshan": {
                "characteristics": {"brawn": 3, "agility": 1, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 12,
                "strain_threshold": 9,
                "starting_xp": 90,
                "special_abilities": ["Claws", "Regeneration"],
                "source": "Edge of the Empire"
            },
            
            # Force and Destiny Species
            "Cerean": {
                "characteristics": {"brawn": 1, "agility": 2, "intellect": 3, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 9,
                "strain_threshold": 12,
                "starting_xp": 90,
                "special_abilities": ["Binary processor", "Enhanced perception"],
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
                                 "cunning": 2, "willpower": 1, "presence": 3},
                "wound_threshold": 11,
                "strain_threshold": 10,
                "starting_xp": 100,
                "special_abilities": ["Amphibious", "Pheromone detection"],
                "source": "Force and Destiny"
            },
            "Zabrak": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 3, "presence": 1},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["Fearsome countenance", "Mental fortitude"],
                "source": "Force and Destiny"
            },
            
            # Age of Rebellion Species
            "Mon Calamari": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 3, 
                                 "cunning": 1, "willpower": 2, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["Amphibious", "Expert starship designers"],
                "source": "Age of Rebellion"
            },
            "Sullustan": {
                "characteristics": {"brawn": 1, "agility": 3, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 9,
                "strain_threshold": 12,
                "starting_xp": 100,
                "special_abilities": ["Enhanced senses", "Natural pilots"],
                "source": "Age of Rebellion"
            },
            
            # Additional Popular Species
            "Chiss": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 3, 
                                 "cunning": 2, "willpower": 1, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["Infrared vision", "Tactical brilliance"],
                "source": "Unknown Regions"
            },
            "Jawa": {
                "characteristics": {"brawn": 1, "agility": 2, "intellect": 3, 
                                 "cunning": 3, "willpower": 1, "presence": 2},
                "wound_threshold": 8,
                "strain_threshold": 11,
                "starting_xp": 90,
                "special_abilities": ["Technical aptitude", "Scavenger"],
                "source": "Lords of Nal Hutta"
            },
            "Devaronian": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 3, "willpower": 1, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 10,
                "starting_xp": 100,
                "special_abilities": ["Natural mystics", "Wanderlust"],
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
                                 "cunning": 2, "willpower": 3, "presence": 1},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["Pack hunters", "Echolocation", "Natural mystics"],
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
                "characteristics": {"brawn": 2, "agility": 1, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 3},
                "wound_threshold": 10,
                "strain_threshold": 12,
                "starting_xp": 90,
                "special_abilities": ["One rank in Charm", "Beguiling Pheromones"],
                "source": "Lords of Nal Hutta"
            },
            "Gran": {
                "characteristics": {"brawn": 2, "agility": 1, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 3},
                "wound_threshold": 10,
                "strain_threshold": 9,
                "starting_xp": 100,
                "special_abilities": ["One rank in Charm or Negotiation", "Enhanced Vision"],
                "source": "Lords of Nal Hutta"
            }
        }
    
    def _get_core_species_data(self) -> Dict[str, Dict]:
        """Get minimal core species data for compatibility."""
        return {
            "Human": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 10,
                "starting_xp": 110,
                "special_abilities": ["Extra skill rank in two different skills"],
                "source": "Core - Edge of the Empire"
            },
            "Twi'lek": {
                "characteristics": {"brawn": 1, "agility": 2, "intellect": 2, 
                                 "cunning": 3, "willpower": 2, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["Remove one setback die from charm and deception checks"],
                "source": "Core - Edge of the Empire"
            },
            "Wookiee": {
                "characteristics": {"brawn": 3, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 1, "presence": 2},
                "wound_threshold": 14,
                "strain_threshold": 8,
                "starting_xp": 90,
                "special_abilities": ["Rage ability", "Natural claws (Brawl +1 damage)"],
                "source": "Core - Edge of the Empire"
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
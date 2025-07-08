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
                "starting_xp": 120,
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
                                 "cunning": 2, "willpower": 3, "presence": 0},
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
                "starting_xp": 90,
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
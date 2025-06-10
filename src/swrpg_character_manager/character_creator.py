"""Character creation functionality for Star Wars RPG."""

from typing import Dict, List
from .models import Character, Career, Specialization, GameLine, Characteristic


class CharacterCreator:
    """Handles character creation process."""
    
    def __init__(self):
        self.careers = self._initialize_careers()
        self.species_data = self._initialize_species()
    
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
    
    def _initialize_species(self) -> Dict[str, Dict]:
        """Initialize species data with characteristic modifiers."""
        return {
            # Core Species from Edge of the Empire
            "Human": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 10,
                "starting_xp": 110,
                "special_abilities": ["Extra skill rank in two different skills"]
            },
            "Twi'lek": {
                "characteristics": {"brawn": 1, "agility": 2, "intellect": 2, 
                                 "cunning": 3, "willpower": 2, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["Remove one setback die from charm and deception checks"]
            },
            "Rodian": {
                "characteristics": {"brawn": 2, "agility": 3, "intellect": 2, 
                                 "cunning": 2, "willpower": 1, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 10,
                "starting_xp": 100,
                "special_abilities": ["Remove one setback die from perception checks", 
                                    "Expert tracker"]
            },
            "Wookiee": {
                "characteristics": {"brawn": 3, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 1, "presence": 2},
                "wound_threshold": 14,
                "strain_threshold": 8,
                "starting_xp": 90,
                "special_abilities": ["Rage ability", "Natural claws (Brawl +1 damage)"]
            },
            "Bothan": {
                "characteristics": {"brawn": 1, "agility": 2, "intellect": 2, 
                                 "cunning": 3, "willpower": 2, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["Conviction: Once per session, may perform a maneuver"]
            },
            
            # Additional Core Species
            "Duros": {
                "characteristics": {"brawn": 1, "agility": 2, "intellect": 3, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 9,
                "strain_threshold": 12,
                "starting_xp": 100,
                "special_abilities": ["Intuitive Navigation", "Remove one setback from Astrogation checks"]
            },
            "Gand": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 3, "willpower": 1, "presence": 2},
                "wound_threshold": 11,
                "strain_threshold": 10,
                "starting_xp": 100,
                "special_abilities": ["Ammonia breathers", "Natural mystics"]
            },
            "Trandoshan": {
                "characteristics": {"brawn": 3, "agility": 1, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 12,
                "strain_threshold": 9,
                "starting_xp": 90,
                "special_abilities": ["Claws", "Regeneration"]
            },
            
            # Force and Destiny Species
            "Cerean": {
                "characteristics": {"brawn": 1, "agility": 2, "intellect": 3, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 9,
                "strain_threshold": 12,
                "starting_xp": 90,
                "special_abilities": ["Binary processor", "Enhanced perception"]
            },
            "Kel Dor": {
                "characteristics": {"brawn": 1, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 3, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["Atmospheric requirement", "Dark vision"]
            },
            "Nautolan": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 1, "presence": 3},
                "wound_threshold": 11,
                "strain_threshold": 10,
                "starting_xp": 100,
                "special_abilities": ["Amphibious", "Pheromone detection"]
            },
            "Zabrak": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 3, "presence": 1},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["Fearsome countenance", "Mental fortitude"]
            },
            
            # Age of Rebellion Species
            "Mon Calamari": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 3, 
                                 "cunning": 1, "willpower": 2, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["Amphibious", "Expert starship designers"]
            },
            "Sullustan": {
                "characteristics": {"brawn": 1, "agility": 3, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 9,
                "strain_threshold": 12,
                "starting_xp": 100,
                "special_abilities": ["Enhanced senses", "Natural pilots"]
            },
            
            # Additional Popular Species
            "Chiss": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 3, 
                                 "cunning": 2, "willpower": 1, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 11,
                "starting_xp": 100,
                "special_abilities": ["Infrared vision", "Tactical brilliance"]
            },
            "Corellian Human": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 2, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 10,
                "starting_xp": 110,
                "special_abilities": ["Pilot heritage", "Corellian spirit"]
            },
            "Mandalorian Human": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 2, "willpower": 3, "presence": 1},
                "wound_threshold": 11,
                "strain_threshold": 10,
                "starting_xp": 100,
                "special_abilities": ["Warrior culture", "Mandalorian iron will"]
            },
            "Jawa": {
                "characteristics": {"brawn": 1, "agility": 2, "intellect": 3, 
                                 "cunning": 3, "willpower": 1, "presence": 2},
                "wound_threshold": 8,
                "strain_threshold": 11,
                "starting_xp": 90,
                "special_abilities": ["Technical aptitude", "Scavenger"]
            },
            "Ewok": {
                "characteristics": {"brawn": 1, "agility": 3, "intellect": 2, 
                                 "cunning": 2, "willpower": 3, "presence": 1},
                "wound_threshold": 8,
                "strain_threshold": 12,
                "starting_xp": 90,
                "special_abilities": ["Primitive", "Forest dweller"]
            },
            "Devaronian": {
                "characteristics": {"brawn": 2, "agility": 2, "intellect": 2, 
                                 "cunning": 3, "willpower": 1, "presence": 2},
                "wound_threshold": 10,
                "strain_threshold": 10,
                "starting_xp": 100,
                "special_abilities": ["Natural mystics", "Wanderlust"]
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
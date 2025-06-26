"""Enhanced character creation walkthrough system with obligations and context."""

from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from .character_creator import CharacterCreator


@dataclass
class Obligation:
    """Represents a character obligation."""
    type: str
    value: int
    description: str
    xp_bonus: int = 0


class CharacterCreationWalkthrough:
    """Comprehensive character creation walkthrough system."""
    
    def __init__(self):
        self.obligations_data = self._initialize_obligations()
        self.creation_rules = self._initialize_creation_rules()
        self.character_creator = CharacterCreator()
    
    def _initialize_obligations(self) -> Dict[str, Dict]:
        """Initialize obligation types with their details."""
        return {
            "addiction": {
                "name": "Addiction",
                "description": "Character has an addiction that affects their judgment and actions",
                "base_value": 10,
                "xp_bonus": 5
            },
            "betrayal": {
                "name": "Betrayal", 
                "description": "Character has betrayed someone important in their past",
                "base_value": 10,
                "xp_bonus": 5
            },
            "blackmail": {
                "name": "Blackmail",
                "description": "Character is being blackmailed by someone",
                "base_value": 10,
                "xp_bonus": 5
            },
            "bounty": {
                "name": "Bounty",
                "description": "There is a price on the character's head",
                "base_value": 10,
                "xp_bonus": 5
            },
            "criminal_record": {
                "name": "Criminal Record",
                "description": "Character has a documented criminal history",
                "base_value": 10,
                "xp_bonus": 5
            },
            "debt": {
                "name": "Debt", 
                "description": "Character owes a significant amount of money or favors",
                "base_value": 10,
                "xp_bonus": 5
            },
            "dutybound": {
                "name": "Dutybound",
                "description": "Character is bound by duty to an organization or cause",
                "base_value": 10,
                "xp_bonus": 5
            },
            "family": {
                "name": "Family",
                "description": "Character's family is in danger or causes complications",
                "base_value": 10,
                "xp_bonus": 5
            },
            "favor": {
                "name": "Favor",
                "description": "Character owes a significant favor to someone powerful",
                "base_value": 10,
                "xp_bonus": 5
            },
            "obsession": {
                "name": "Obsession",
                "description": "Character is obsessed with something that drives their actions",
                "base_value": 10,
                "xp_bonus": 5
            },
            "oath": {
                "name": "Oath",
                "description": "Character has sworn an oath that binds their actions",
                "base_value": 10,
                "xp_bonus": 5
            },
            "responsibility": {
                "name": "Responsibility",
                "description": "Character is responsible for someone or something important",
                "base_value": 10,
                "xp_bonus": 5
            }
        }
    
    def _initialize_creation_rules(self) -> Dict[str, Dict]:
        """Initialize character creation rules by context."""
        return {
            "new_campaign": {
                "skill_max_rank": 2,
                "characteristic_max": 5,
                "starting_xp_modifier": 0,
                "description": "Creating a character for a new campaign"
            },
            "existing_campaign": {
                "skill_max_rank": 5,
                "characteristic_max": 5,
                "starting_xp_modifier": 0,
                "description": "Creating a character for an existing campaign"
            },
            "replacement": {
                "skill_max_rank": 5,
                "characteristic_max": 5,
                "starting_xp_modifier": 0,
                "description": "Creating a replacement character (due to death, etc.)"
            }
        }
    
    def get_creation_context_options(self) -> List[Dict[str, str]]:
        """Get available character creation contexts."""
        contexts = []
        for key, rules in self.creation_rules.items():
            contexts.append({
                "value": key,
                "label": rules["description"],
                "skill_limit": f"Skills max rank {rules['skill_max_rank']}",
                "char_limit": f"Characteristics max {rules['characteristic_max']}"
            })
        return contexts
    
    def get_obligation_options(self) -> List[Dict[str, Any]]:
        """Get available obligation options."""
        obligations = []
        for key, obligation in self.obligations_data.items():
            obligations.append({
                "value": key,
                "name": obligation["name"],
                "description": obligation["description"],
                "base_value": obligation["base_value"],
                "xp_bonus": obligation["xp_bonus"]
            })
        return obligations
    
    def calculate_obligation_xp_bonus(self, selected_obligations: List[Dict]) -> int:
        """Calculate total XP bonus from selected obligations."""
        total_bonus = 0
        for obligation in selected_obligations:
            obligation_data = self.obligations_data.get(obligation["type"])
            if obligation_data:
                # Base XP bonus
                total_bonus += obligation_data["xp_bonus"]
                
                # Additional bonus for higher obligation values
                if obligation["value"] > 10:
                    total_bonus += (obligation["value"] - 10) // 5 * 5
        
        return total_bonus
    
    def validate_character_creation(self, character_data: Dict, context: str) -> Tuple[bool, List[str]]:
        """Validate character creation data against context rules."""
        errors = []
        
        if context not in self.creation_rules:
            errors.append("Invalid creation context")
            return False, errors
        
        rules = self.creation_rules[context]
        
        # Validate skills against context rules
        skills = character_data.get("skills", {})
        for skill_name, skill_data in skills.items():
            if isinstance(skill_data, dict):
                skill_level = skill_data.get("level", 0)
            else:
                skill_level = skill_data
            
            if skill_level > rules["skill_max_rank"]:
                errors.append(f"Skill '{skill_name}' rank {skill_level} exceeds maximum of {rules['skill_max_rank']} for {context}")
        
        # Validate characteristics
        characteristics = character_data.get("characteristics", {})
        for char_name, char_value in characteristics.items():
            if char_value > rules["characteristic_max"]:
                errors.append(f"Characteristic '{char_name}' value {char_value} exceeds maximum of {rules['characteristic_max']}")
        
        # Validate obligations
        obligations = character_data.get("obligations", [])
        total_obligation = sum(obligation.get("value", 0) for obligation in obligations)
        
        if total_obligation > 20:
            errors.append(f"Total obligation value {total_obligation} exceeds maximum of 20")
        
        if len(obligations) > 2:
            errors.append("Maximum of 2 obligations allowed")
        
        return len(errors) == 0, errors
    
    def get_species_data(self) -> Dict[str, Dict]:
        """Get comprehensive species data for character creation using extracted PDF data."""
        # Get species data from the CharacterCreator (which now uses extracted data)
        species_data = {}
        
        for species_name in self.character_creator.get_available_species():
            species_info = self.character_creator.get_species_info(species_name)
            if species_info:
                # Convert to lowercase key for API compatibility
                key = species_name.lower().replace("'", "").replace(" ", "_")
                species_data[key] = {
                    "name": species_name,
                    "characteristics": species_info["characteristics"],
                    "starting_xp": species_info["starting_xp"],
                    "special_abilities": species_info["special_abilities"]
                }
        
        return species_data
    
    def get_career_data(self) -> Dict[str, Dict]:
        """Get comprehensive career data for character creation."""
        return {
            # Edge of the Empire
            "bounty_hunter": {
                "name": "Bounty Hunter",
                "game_line": "Edge of the Empire",
                "career_skills": ["Athletics", "Brawl", "Piloting (Planetary)", "Piloting (Space)", "Ranged (Heavy)", "Streetwise", "Vigilance", "Knowledge (Underworld)"],
                "starting_credits": "1000 + 1d10 × 50"
            },
            "colonist": {
                "name": "Colonist", 
                "game_line": "Edge of the Empire",
                "career_skills": ["Charm", "Deception", "Knowledge (Core Worlds)", "Knowledge (Education)", "Leadership", "Negotiation", "Streetwise", "Survival"],
                "starting_credits": "1000 + 1d10 × 50"
            },
            "explorer": {
                "name": "Explorer",
                "game_line": "Edge of the Empire", 
                "career_skills": ["Astrogation", "Cool", "Knowledge (Lore)", "Knowledge (Outer Rim)", "Perception", "Piloting (Space)", "Survival", "Xenology"],
                "starting_credits": "1000 + 1d10 × 50"
            },
            "hired_gun": {
                "name": "Hired Gun",
                "game_line": "Edge of the Empire",
                "career_skills": ["Athletics", "Brawl", "Discipline", "Melee", "Ranged (Light)", "Resilience", "Vigilance", "Piloting (Planetary)"],
                "starting_credits": "1000 + 1d10 × 50"
            },
            "smuggler": {
                "name": "Smuggler",
                "game_line": "Edge of the Empire",
                "career_skills": ["Coordination", "Deception", "Knowledge (Underworld)", "Perception", "Piloting (Space)", "Skulduggery", "Streetwise", "Vigilance"],
                "starting_credits": "1000 + 1d10 × 50"
            },
            "technician": {
                "name": "Technician",
                "game_line": "Edge of the Empire",
                "career_skills": ["Astrogation", "Computers", "Coordination", "Discipline", "Knowledge (Outer Rim)", "Mechanics", "Perception", "Piloting (Planetary)"],
                "starting_credits": "1000 + 1d10 × 50"
            },
            # Age of Rebellion
            "ace": {
                "name": "Ace",
                "game_line": "Age of Rebellion",
                "career_skills": ["Astrogation", "Cool", "Gunnery", "Mechanics", "Perception", "Piloting (Planetary)", "Piloting (Space)", "Ranged (Light)"],
                "starting_credits": "500 + 1d10 × 25"
            },
            "commander": {
                "name": "Commander",
                "game_line": "Age of Rebellion",
                "career_skills": ["Coercion", "Cool", "Discipline", "Knowledge (Core Worlds)", "Knowledge (Warfare)", "Leadership", "Perception", "Vigilance"],
                "starting_credits": "500 + 1d10 × 25"
            },
            "diplomat": {
                "name": "Diplomat",
                "game_line": "Age of Rebellion",
                "career_skills": ["Charm", "Deception", "Knowledge (Core Worlds)", "Knowledge (Lore)", "Knowledge (Outer Rim)", "Leadership", "Negotiation", "Vigilance"],
                "starting_credits": "500 + 1d10 × 25"
            },
            # Force and Destiny
            "consular": {
                "name": "Consular",
                "game_line": "Force and Destiny",
                "career_skills": ["Cool", "Discipline", "Knowledge (Education)", "Knowledge (Lore)", "Leadership", "Negotiation", "Perception", "Charm"],
                "starting_credits": "500 + 1d10 × 25"
            },
            "guardian": {
                "name": "Guardian",
                "game_line": "Force and Destiny",
                "career_skills": ["Brawl", "Discipline", "Melee", "Resilience", "Vigilance", "Cool", "Athletics", "Medicine"],
                "starting_credits": "500 + 1d10 × 25"
            },
            "mystic": {
                "name": "Mystic",
                "game_line": "Force and Destiny",
                "career_skills": ["Astrogation", "Charm", "Coercion", "Cool", "Knowledge (Outer Rim)", "Perception", "Piloting (Space)", "Streetwise"],
                "starting_credits": "500 + 1d10 × 25"
            },
            "seeker": {
                "name": "Seeker",
                "game_line": "Force and Destiny",
                "career_skills": ["Athletics", "Knowledge (Xenology)", "Medicine", "Perception", "Piloting (Planetary)", "Stealth", "Streetwise", "Survival"],
                "starting_credits": "500 + 1d10 × 25"
            },
            "sentinel": {
                "name": "Sentinel",
                "game_line": "Force and Destiny",
                "career_skills": ["Computers", "Deception", "Knowledge (Underworld)", "Perception", "Skulduggery", "Stealth", "Streetwise", "Vigilance"],
                "starting_credits": "500 + 1d10 × 25"
            },
            "warrior": {
                "name": "Warrior",
                "game_line": "Force and Destiny",
                "career_skills": ["Athletics", "Brawl", "Knowledge (Warfare)", "Melee", "Ranged (Light)", "Resilience", "Survival", "Vigilance"],
                "starting_credits": "500 + 1d10 × 25"
            }
        }
    
    def calculate_starting_xp(self, species_key: str, obligations: List[Dict], context: str) -> int:
        """Calculate starting XP including species and obligation bonuses."""
        species_data = self.get_species_data().get(species_key, {})
        base_xp = species_data.get("starting_xp", 110)
        
        # Add obligation XP bonuses
        obligation_bonus = self.calculate_obligation_xp_bonus(obligations)
        
        # Context-specific modifiers
        context_rules = self.creation_rules.get(context, {})
        context_modifier = context_rules.get("starting_xp_modifier", 0)
        
        return base_xp + obligation_bonus + context_modifier
    
    def get_creation_walkthrough_data(self) -> Dict[str, Any]:
        """Get all data needed for the character creation walkthrough."""
        return {
            "contexts": self.get_creation_context_options(),
            "species": self.get_species_data(),
            "careers": self.get_career_data(),
            "obligations": self.get_obligation_options(),
            "rules": self.creation_rules
        }


# Global walkthrough instance
character_walkthrough = CharacterCreationWalkthrough()
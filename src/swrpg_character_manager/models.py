"""Core data models for Star Wars RPG character management."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Any


class GameLine(Enum):
    """Represents the different Star Wars RPG game lines."""
    EDGE_OF_THE_EMPIRE = "Edge of the Empire"
    AGE_OF_REBELLION = "Age of Rebellion"
    FORCE_AND_DESTINY = "Force and Destiny"


class Characteristic(Enum):
    """The six core characteristics in Star Wars RPG."""
    BRAWN = "Brawn"
    AGILITY = "Agility"
    INTELLECT = "Intellect"
    CUNNING = "Cunning"
    WILLPOWER = "Willpower"
    PRESENCE = "Presence"


@dataclass
class Skill:
    """Represents a character skill."""
    name: str
    characteristic: Characteristic
    ranks: int = 0
    career_skill: bool = False
    
    def get_dice_pool(self, char_value: int) -> Dict[str, int]:
        """Calculate the dice pool for this skill."""
        # In SWRPG, you roll ability dice (green) equal to characteristic
        # and proficiency dice (yellow) equal to skill ranks
        # But proficiency dice "upgrade" ability dice on a 1:1 basis
        
        ability_dice = max(0, char_value - self.ranks)
        proficiency_dice = min(char_value, self.ranks)
        
        # If skill ranks exceed characteristic, add more proficiency dice
        if self.ranks > char_value:
            proficiency_dice = char_value
            ability_dice = self.ranks - char_value
        
        # Calculate difficulty dice (this would depend on the task)
        difficulty_dice = 0  # Default, would be set by GM
        
        return {
            "ability": ability_dice,
            "proficiency": proficiency_dice,
            "difficulty": difficulty_dice
        }


@dataclass
class Talent:
    """Represents a talent that can be purchased."""
    name: str
    description: str
    activation: str  # "Passive", "Action", "Maneuver", etc.
    ranked: bool = False
    current_rank: int = 0
    cost_per_rank: List[int] = field(default_factory=list)


@dataclass
class Career:
    """Represents a character's career."""
    name: str
    game_line: GameLine
    career_skills: List[str]
    starting_wound_threshold: int
    starting_strain_threshold: int


@dataclass
class Specialization:
    """Represents a specialization within a career."""
    name: str
    career: str
    talent_tree: Dict[str, Talent]
    bonus_career_skills: List[str] = field(default_factory=list)


@dataclass
class Character:
    """Main character class with all character data."""
    
    # Basic Info
    name: str
    player_name: str
    species: str
    career: Career
    specializations: List[Specialization] = field(default_factory=list)
    
    # Characteristics (1-6 typically)
    brawn: int = 2
    agility: int = 2
    intellect: int = 2
    cunning: int = 2
    willpower: int = 2
    presence: int = 2
    
    # Derived Attributes
    wound_threshold: int = 0
    strain_threshold: int = 0
    
    # Experience Points
    total_xp: int = 0
    available_xp: int = 0
    spent_xp: int = 0
    
    # Skills
    skills: Dict[str, Skill] = field(default_factory=dict)
    
    # Talents
    talents: List[Talent] = field(default_factory=list)
    
    # Equipment
    credits: int = 0
    equipment: List[str] = field(default_factory=list)
    
    # Story elements
    motivation: str = ""
    background: str = ""
    
    # Character creation state
    is_created: bool = False  # True after character creation is finalized
    
    def __post_init__(self):
        """Initialize derived values after creation."""
        self.wound_threshold = self.brawn + self.career.starting_wound_threshold
        self.strain_threshold = self.willpower + self.career.starting_strain_threshold
        self._initialize_skills()
    
    def _initialize_skills(self):
        """Initialize all skills with default values."""
        # General skills (this would be expanded with full skill list)
        skill_list = [
            ("Astrogation", Characteristic.INTELLECT),
            ("Athletics", Characteristic.BRAWN),
            ("Charm", Characteristic.PRESENCE),
            ("Coercion", Characteristic.WILLPOWER),
            ("Computers", Characteristic.INTELLECT),
            ("Cool", Characteristic.PRESENCE),
            ("Coordination", Characteristic.AGILITY),
            ("Deception", Characteristic.CUNNING),
            ("Discipline", Characteristic.WILLPOWER),
            ("Leadership", Characteristic.PRESENCE),
            ("Mechanics", Characteristic.INTELLECT),
            ("Medicine", Characteristic.INTELLECT),
            ("Negotiation", Characteristic.PRESENCE),
            ("Perception", Characteristic.CUNNING),
            ("Piloting (Planetary)", Characteristic.AGILITY),
            ("Piloting (Space)", Characteristic.AGILITY),
            ("Resilience", Characteristic.BRAWN),
            ("Skulduggery", Characteristic.CUNNING),
            ("Stealth", Characteristic.AGILITY),
            ("Streetwise", Characteristic.CUNNING),
            ("Survival", Characteristic.CUNNING),
            ("Vigilance", Characteristic.WILLPOWER),
            # Combat skills
            ("Brawl", Characteristic.BRAWN),
            ("Gunnery", Characteristic.AGILITY),
            ("Melee", Characteristic.BRAWN),
            ("Ranged (Light)", Characteristic.AGILITY),
            ("Ranged (Heavy)", Characteristic.AGILITY),
            # Knowledge skills
            ("Knowledge (Core Worlds)", Characteristic.INTELLECT),
            ("Knowledge (Education)", Characteristic.INTELLECT),
            ("Knowledge (Lore)", Characteristic.INTELLECT),
            ("Knowledge (Outer Rim)", Characteristic.INTELLECT),
            ("Knowledge (Underworld)", Characteristic.INTELLECT),
            ("Knowledge (Warfare)", Characteristic.INTELLECT),
            ("Knowledge (Xenology)", Characteristic.INTELLECT),
        ]
        
        # Initialize all skills
        for skill_name, characteristic in skill_list:
            # Check if this skill is a career skill
            is_career_skill = skill_name in self.career.career_skills
            
            self.skills[skill_name] = Skill(
                name=skill_name,
                characteristic=characteristic,
                ranks=0,
                career_skill=is_career_skill
            )
    
    def get_characteristic_value(self, characteristic: Characteristic) -> int:
        """Get the current value of a characteristic."""
        char_name = characteristic.value.lower()
        return getattr(self, char_name)
    
    def spend_xp(self, amount: int) -> bool:
        """Spend XP if available."""
        if self.available_xp >= amount:
            self.available_xp -= amount
            self.spent_xp += amount
            return True
        return False
    
    def award_xp(self, amount: int, reason: str = "") -> None:
        """Award XP to the character."""
        self.total_xp += amount
        self.available_xp += amount
    
    def increase_characteristic(self, characteristic: Characteristic, cost: int) -> bool:
        """Increase a characteristic if XP is available."""
        char_name = characteristic.value.lower()
        current_value = getattr(self, char_name)
        
        if current_value >= 6:
            return False  # Cannot increase beyond 6
        
        if self.spend_xp(cost):
            setattr(self, char_name, current_value + 1)
            # Update derived attributes
            if characteristic == Characteristic.BRAWN:
                self.wound_threshold = self.brawn + self.career.starting_wound_threshold
            elif characteristic == Characteristic.WILLPOWER:
                self.strain_threshold = self.willpower + self.career.starting_strain_threshold
            return True
        return False
    
    def increase_skill(self, skill_name: str) -> bool:
        """Increase a skill rank if XP is available."""
        if skill_name not in self.skills:
            return False
        
        skill = self.skills[skill_name]
        
        if skill.ranks >= 5:
            return False  # Cannot increase beyond rank 5
        
        # Calculate cost based on whether it's a career skill
        if skill.career_skill:
            cost = (skill.ranks + 1) * 5
        else:
            cost = (skill.ranks + 1) * 5 + 5  # +5 for non-career skills
        
        if self.spend_xp(cost):
            skill.ranks += 1
            return True
        return False
    
    def add_talent(self, talent: Talent, cost: int) -> bool:
        """Add a talent to the character."""
        if self.spend_xp(cost):
            self.talents.append(talent)
            return True
        return False
    
    def get_skill_dice_pool(self, skill_name: str) -> Optional[Dict[str, int]]:
        """Get the dice pool for a specific skill."""
        if skill_name not in self.skills:
            return None
        
        skill = self.skills[skill_name]
        char_value = self.get_characteristic_value(skill.characteristic)
        return skill.get_dice_pool(char_value)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert character to dictionary for serialization."""
        return {
            "name": self.name,
            "player_name": self.player_name,
            "species": self.species,
            "career": {
                "name": self.career.name,
                "game_line": self.career.game_line.value,
                "career_skills": self.career.career_skills,
                "starting_wound_threshold": self.career.starting_wound_threshold,
                "starting_strain_threshold": self.career.starting_strain_threshold
            },
            "characteristics": {
                "brawn": self.brawn,
                "agility": self.agility,
                "intellect": self.intellect,
                "cunning": self.cunning,
                "willpower": self.willpower,
                "presence": self.presence
            },
            "wound_threshold": self.wound_threshold,
            "strain_threshold": self.strain_threshold,
            "total_xp": self.total_xp,
            "available_xp": self.available_xp,
            "spent_xp": self.spent_xp,
            "skills": {
                name: {
                    "name": skill.name,
                    "characteristic": skill.characteristic.value,
                    "ranks": skill.ranks,
                    "career_skill": skill.career_skill
                }
                for name, skill in self.skills.items()
            },
            "talents": [
                {
                    "name": talent.name,
                    "description": talent.description,
                    "activation": talent.activation,
                    "ranked": talent.ranked,
                    "current_rank": talent.current_rank
                }
                for talent in self.talents
            ],
            "credits": self.credits,
            "equipment": self.equipment,
            "motivation": self.motivation,
            "background": self.background,
            "is_created": self.is_created
        }
"""Character data models for Star Wars RPG."""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
from enum import Enum


class Characteristic(Enum):
    """The six characteristics in Star Wars RPG."""
    BRAWN = "Brawn"
    AGILITY = "Agility"
    INTELLECT = "Intellect"
    CUNNING = "Cunning"
    WILLPOWER = "Willpower"
    PRESENCE = "Presence"


class GameLine(Enum):
    """The Star Wars RPG game lines."""
    EDGE_OF_EMPIRE = "Edge of the Empire"
    AGE_OF_REBELLION = "Age of Rebellion"
    FORCE_AND_DESTINY = "Force and Destiny"
    RISE_OF_THE_SEPARATIST = "Rise of the Separatist"


@dataclass
class Skill:
    """Represents a skill in the game."""
    name: str
    characteristic: Characteristic
    career_skill: bool = False
    ranks: int = 0
    
    @property
    def dice_pool(self) -> Dict[str, int]:
        """Calculate the dice pool for this skill."""
        char_value = getattr(self.character, self.characteristic.value.lower()) if hasattr(self, 'character') else 2
        ability_dice = min(char_value, self.ranks)
        proficiency_dice = max(0, min(char_value, self.ranks) - ability_dice)
        difficulty_dice = max(0, char_value - self.ranks) if self.ranks < char_value else 0
        
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
            ("Brawl", Characteristic.BRAWN),
            ("Charm", Characteristic.PRESENCE),
            ("Coercion", Characteristic.WILLPOWER),
            ("Computers", Characteristic.INTELLECT),
            ("Cool", Characteristic.PRESENCE),
            ("Coordination", Characteristic.AGILITY),
            ("Deception", Characteristic.CUNNING),
            ("Discipline", Characteristic.WILLPOWER),
            ("Knowledge (Core Worlds)", Characteristic.INTELLECT),
            ("Knowledge (Education)", Characteristic.INTELLECT),
            ("Knowledge (Lore)", Characteristic.INTELLECT),
            ("Knowledge (Outer Rim)", Characteristic.INTELLECT),
            ("Knowledge (Underworld)", Characteristic.INTELLECT),
            ("Knowledge (Warfare)", Characteristic.INTELLECT),
            ("Knowledge (Xenology)", Characteristic.INTELLECT),
            ("Leadership", Characteristic.PRESENCE),
            ("Lightsaber", Characteristic.BRAWN),
            ("Mechanics", Characteristic.INTELLECT),
            ("Medicine", Characteristic.INTELLECT),
            ("Melee", Characteristic.BRAWN),
            ("Negotiation", Characteristic.PRESENCE),
            ("Perception", Characteristic.CUNNING),
            ("Piloting (Planetary)", Characteristic.AGILITY),
            ("Piloting (Space)", Characteristic.AGILITY),
            ("Ranged (Light)", Characteristic.AGILITY),
            ("Ranged (Heavy)", Characteristic.AGILITY),
            ("Resilience", Characteristic.BRAWN),
            ("Skulduggery", Characteristic.CUNNING),
            ("Stealth", Characteristic.AGILITY),
            ("Streetwise", Characteristic.CUNNING),
            ("Survival", Characteristic.CUNNING),
            ("Vigilance", Characteristic.WILLPOWER),
        ]
        
        for skill_name, characteristic in skill_list:
            career_skill = skill_name in self.career.career_skills
            self.skills[skill_name] = Skill(
                name=skill_name,
                characteristic=characteristic,
                career_skill=career_skill
            )
    
    def add_xp(self, amount: int):
        """Add experience points to the character."""
        self.total_xp += amount
        self.available_xp += amount
    
    def spend_xp(self, amount: int) -> bool:
        """Spend experience points if available."""
        if self.available_xp >= amount:
            self.available_xp -= amount
            self.spent_xp += amount
            return True
        return False
    
    def increase_characteristic(self, characteristic: Characteristic, cost: int) -> bool:
        """Increase a characteristic if XP is available."""
        if not self.spend_xp(cost):
            return False
        
        char_name = characteristic.value.lower()
        current_value = getattr(self, char_name)
        setattr(self, char_name, current_value + 1)
        
        # Update derived attributes if needed
        if characteristic == Characteristic.BRAWN:
            self.wound_threshold = self.brawn + self.career.starting_wound_threshold
        elif characteristic == Characteristic.WILLPOWER:
            self.strain_threshold = self.willpower + self.career.starting_strain_threshold
        
        return True
    
    def increase_skill(self, skill_name: str) -> bool:
        """Increase a skill rank."""
        if skill_name not in self.skills:
            return False
        
        skill = self.skills[skill_name]
        
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
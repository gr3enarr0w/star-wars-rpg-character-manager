"""Character advancement and leveling system."""

from typing import Dict, List, Optional
from .models import Character, Characteristic, Talent


class AdvancementManager:
    """Manages character advancement and experience spending."""
    
    def __init__(self):
        self.characteristic_costs = self._initialize_characteristic_costs()
        self.skill_costs = self._initialize_skill_costs()
    
    def _initialize_characteristic_costs(self) -> Dict[int, int]:
        """Initialize XP costs for characteristic increases during character creation only.
        
        SWRPG Rule: Characteristics can only be increased with XP during character creation.
        After creation, they can only be increased through specific talents like 'Dedication'.
        Cost formula: 10 × new rank
        """
        return {
            2: 20,   # 1→2 (10 × 2 = 20 XP)
            3: 30,   # 2→3 (10 × 3 = 30 XP)
            4: 40,   # 3→4 (10 × 4 = 40 XP)
            5: 50,   # 4→5 (10 × 5 = 50 XP)
            6: 60    # 5→6 (10 × 6 = 60 XP)
        }
    
    def _initialize_skill_costs(self) -> Dict[int, int]:
        """Initialize base XP costs for skill rank increases."""
        return {
            1: 5,    # 0→1
            2: 10,   # 1→2
            3: 15,   # 2→3
            4: 20,   # 3→4
            5: 25    # 4→5
        }
    
    def calculate_characteristic_cost(self, character: Character, 
                                    characteristic: Characteristic) -> Optional[int]:
        """Calculate XP cost to increase a characteristic during character creation only.
        
        SWRPG Rule: After character creation, characteristics can only be increased
        through specific talents like 'Dedication', not with XP.
        """
        # Check if character is already created (has been saved/finalized)
        if hasattr(character, 'is_created') and character.is_created:
            return None  # Cannot increase characteristics with XP after creation
        
        char_name = characteristic.value.lower()
        current_value = getattr(character, char_name)
        
        if current_value >= 6:
            return None  # Cannot increase beyond 6
        
        target_value = current_value + 1
        return self.characteristic_costs.get(target_value)
    
    def calculate_skill_cost(self, character: Character, skill_name: str) -> Optional[int]:
        """Calculate XP cost to increase a skill rank."""
        if skill_name not in character.skills:
            return None
        
        skill = character.skills[skill_name]
        
        if skill.ranks >= 5:
            return None  # Cannot increase beyond rank 5
        
        target_rank = skill.ranks + 1
        base_cost = self.skill_costs.get(target_rank, 0)
        
        # Non-career skills cost +5 XP
        if not skill.career_skill:
            base_cost += 5
        
        return base_cost
    
    def advance_characteristic(self, character: Character, 
                             characteristic: Characteristic) -> bool:
        """Advance a characteristic if possible during character creation only.
        
        SWRPG Rule: After character creation, characteristics can only be increased
        through specific talents like 'Dedication', not with XP.
        """
        cost = self.calculate_characteristic_cost(character, characteristic)
        
        if cost is None:
            return False
        
        # Additional check for post-creation attempts
        if hasattr(character, 'is_created') and character.is_created:
            return False
        
        return character.increase_characteristic(characteristic, cost)
    
    def advance_skill(self, character: Character, skill_name: str) -> bool:
        """Advance a skill if possible."""
        cost = self.calculate_skill_cost(character, skill_name)
        
        if cost is None:
            return False
        
        return character.increase_skill(skill_name)
    
    def get_advancement_options(self, character: Character) -> Dict:
        """Get all available advancement options for a character."""
        options = {
            "characteristics": {},
            "skills": {},
            "talents": []
        }
        
        # Characteristic advancement options (only during character creation)
        if not (hasattr(character, 'is_created') and character.is_created):
            for characteristic in Characteristic:
                cost = self.calculate_characteristic_cost(character, characteristic)
                if cost is not None and character.available_xp >= cost:
                    char_name = characteristic.value.lower()
                    current_value = getattr(character, char_name)
                    options["characteristics"][characteristic.value] = {
                        "current": current_value,
                        "target": current_value + 1,
                        "cost": cost
                    }
        
        # Skill advancement options (always available)
        for skill_name, skill in character.skills.items():
            cost = self.calculate_skill_cost(character, skill_name)
            if cost is not None and character.available_xp >= cost:
                options["skills"][skill_name] = {
                    "current": skill.ranks,
                    "target": skill.ranks + 1,
                    "cost": cost,
                    "career_skill": skill.career_skill
                }
        
        return options
    
    def simulate_advancement(self, character: Character, 
                           advancement_plan: Dict) -> Dict:
        """Simulate an advancement plan without actually spending XP."""
        total_cost = 0
        results = {
            "valid": True,
            "total_cost": 0,
            "remaining_xp": character.available_xp,
            "breakdown": []
        }
        
        # Calculate characteristic costs (only during creation)
        if "characteristics" in advancement_plan:
            for char_name, increases in advancement_plan["characteristics"].items():
                characteristic = Characteristic(char_name)
                for _ in range(increases):
                    cost = self.calculate_characteristic_cost(character, characteristic)
                    if cost is None:
                        results["valid"] = False
                        results["breakdown"].append({
                            "type": "characteristic",
                            "name": char_name,
                            "error": "Cannot increase or already at maximum"
                        })
                        break
                    
                    total_cost += cost
                    results["breakdown"].append({
                        "type": "characteristic",
                        "name": char_name,
                        "cost": cost
                    })
        
        # Calculate skill costs
        if "skills" in advancement_plan:
            for skill_name, increases in advancement_plan["skills"].items():
                for _ in range(increases):
                    cost = self.calculate_skill_cost(character, skill_name)
                    if cost is None:
                        results["valid"] = False
                        results["breakdown"].append({
                            "type": "skill",
                            "name": skill_name,
                            "error": "Cannot increase or already at maximum"
                        })
                        break
                    
                    total_cost += cost
                    results["breakdown"].append({
                        "type": "skill",
                        "name": skill_name,
                        "cost": cost
                    })
        
        results["total_cost"] = total_cost
        results["remaining_xp"] = character.available_xp - total_cost
        
        if results["remaining_xp"] < 0:
            results["valid"] = False
        
        return results
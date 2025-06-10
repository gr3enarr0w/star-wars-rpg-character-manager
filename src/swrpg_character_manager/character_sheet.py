"""Character sheet display and formatting functionality."""

from typing import Dict, List
from .models import Character, Characteristic


class CharacterSheetDisplay:
    """Handles character sheet formatting and display."""
    
    def __init__(self):
        pass
    
    def display_character_sheet(self, character: Character) -> str:
        """Generate a formatted character sheet display."""
        sheet = []
        
        # Header
        sheet.append("=" * 60)
        sheet.append(f"CHARACTER SHEET - {character.name.upper()}")
        sheet.append("=" * 60)
        sheet.append("")
        
        # Basic Information
        sheet.append("BASIC INFORMATION")
        sheet.append("-" * 20)
        sheet.append(f"Name: {character.name}")
        sheet.append(f"Player: {character.player_name}")
        sheet.append(f"Species: {character.species}")
        sheet.append(f"Career: {character.career.name}")
        sheet.append(f"Game Line: {character.career.game_line.value}")
        sheet.append("")
        
        # Characteristics
        sheet.append("CHARACTERISTICS")
        sheet.append("-" * 15)
        characteristics = [
            ("Brawn", character.brawn),
            ("Agility", character.agility),
            ("Intellect", character.intellect),
            ("Cunning", character.cunning),
            ("Willpower", character.willpower),
            ("Presence", character.presence)
        ]
        
        for name, value in characteristics:
            sheet.append(f"{name:12}: {value}")
        sheet.append("")
        
        # Derived Attributes
        sheet.append("DERIVED ATTRIBUTES")
        sheet.append("-" * 18)
        sheet.append(f"Wound Threshold: {character.wound_threshold}")
        sheet.append(f"Strain Threshold: {character.strain_threshold}")
        sheet.append("")
        
        # Experience Points
        sheet.append("EXPERIENCE POINTS")
        sheet.append("-" * 17)
        sheet.append(f"Total XP: {character.total_xp}")
        sheet.append(f"Available XP: {character.available_xp}")
        sheet.append(f"Spent XP: {character.spent_xp}")
        sheet.append("")
        
        # Skills
        sheet.append("SKILLS")
        sheet.append("-" * 6)
        
        # Group skills by characteristic
        skill_groups = {char.value: [] for char in Characteristic}
        for skill_name, skill in character.skills.items():
            skill_groups[skill.characteristic.value].append((skill_name, skill))
        
        for char_name, skills in skill_groups.items():
            if skills:
                sheet.append(f"\n{char_name} Skills:")
                for skill_name, skill in sorted(skills):
                    career_marker = "*" if skill.career_skill else " "
                    dice_info = self._format_dice_pool(character, skill)
                    sheet.append(f"  {career_marker}{skill_name:20} Rank: {skill.ranks} {dice_info}")
        
        sheet.append("")
        sheet.append("* = Career Skill")
        sheet.append("")
        
        # Talents
        if character.talents:
            sheet.append("TALENTS")
            sheet.append("-" * 7)
            for talent in character.talents:
                rank_info = f" (Rank {talent.current_rank})" if talent.ranked else ""
                sheet.append(f"• {talent.name}{rank_info}")
                sheet.append(f"  {talent.description}")
                sheet.append(f"  Activation: {talent.activation}")
                sheet.append("")
        
        # Equipment
        if character.equipment:
            sheet.append("EQUIPMENT")
            sheet.append("-" * 9)
            sheet.append(f"Credits: {character.credits}")
            for item in character.equipment:
                sheet.append(f"• {item}")
            sheet.append("")
        
        # Background
        if character.motivation or character.background:
            sheet.append("CHARACTER BACKGROUND")
            sheet.append("-" * 20)
            if character.motivation:
                sheet.append(f"Motivation: {character.motivation}")
            if character.background:
                sheet.append(f"Background: {character.background}")
            sheet.append("")
        
        sheet.append("=" * 60)
        
        return "\n".join(sheet)
    
    def _format_dice_pool(self, character: Character, skill) -> str:
        """Format dice pool information for a skill."""
        char_name = skill.characteristic.value.lower()
        char_value = getattr(character, char_name)
        
        # Calculate dice pool
        if skill.ranks == 0:
            # Untrained: all ability dice
            ability_dice = char_value
            proficiency_dice = 0
        else:
            # Trained: convert ability to proficiency based on ranks
            ability_dice = max(0, char_value - skill.ranks)
            proficiency_dice = min(char_value, skill.ranks)
        
        dice_parts = []
        if ability_dice > 0:
            dice_parts.append(f"{ability_dice}A")
        if proficiency_dice > 0:
            dice_parts.append(f"{proficiency_dice}P")
        
        if not dice_parts:
            return "(No dice)"
        
        return f"({'+'.join(dice_parts)})"
    
    def display_character_summary(self, character: Character) -> str:
        """Generate a brief character summary."""
        summary = []
        summary.append(f"{character.name} ({character.species} {character.career.name})")
        summary.append(f"XP: {character.available_xp}/{character.total_xp}")
        
        # Show top skills
        trained_skills = [(name, skill.ranks) for name, skill in character.skills.items() 
                         if skill.ranks > 0]
        trained_skills.sort(key=lambda x: x[1], reverse=True)
        
        if trained_skills:
            top_skills = trained_skills[:3]
            skills_text = ", ".join([f"{name} {ranks}" for name, ranks in top_skills])
            summary.append(f"Top Skills: {skills_text}")
        
        return " | ".join(summary)
    
    def display_advancement_options(self, character: Character, 
                                  advancement_options: Dict) -> str:
        """Display available advancement options."""
        output = []
        output.append("ADVANCEMENT OPTIONS")
        output.append("=" * 19)
        output.append(f"Available XP: {character.available_xp}")
        output.append("")
        
        # Characteristics
        if advancement_options["characteristics"]:
            output.append("CHARACTERISTICS")
            output.append("-" * 15)
            for char_name, info in advancement_options["characteristics"].items():
                affordable = "✓" if info["affordable"] else "✗"
                output.append(f"{affordable} {char_name}: {info['current']}→{info['target']} "
                            f"({info['cost']} XP)")
            output.append("")
        
        # Skills
        if advancement_options["skills"]:
            output.append("SKILLS")
            output.append("-" * 6)
            
            # Group by affordability and career skill status
            affordable_career = []
            affordable_non_career = []
            unaffordable = []
            
            for skill_name, info in advancement_options["skills"].items():
                skill_line = f"{skill_name}: {info['current']}→{info['target']} ({info['cost']} XP)"
                
                if info["affordable"]:
                    if info["career_skill"]:
                        affordable_career.append(f"✓ {skill_line} *")
                    else:
                        affordable_non_career.append(f"✓ {skill_line}")
                else:
                    marker = "*" if info["career_skill"] else ""
                    unaffordable.append(f"✗ {skill_line} {marker}")
            
            # Display in order of priority
            for line in affordable_career:
                output.append(line)
            for line in affordable_non_career:
                output.append(line)
            for line in unaffordable:
                output.append(line)
            
            output.append("")
            output.append("* = Career Skill")
        
        return "\n".join(output)
    
    def display_dice_reference(self) -> str:
        """Display dice notation reference."""
        reference = []
        reference.append("DICE NOTATION REFERENCE")
        reference.append("=" * 23)
        reference.append("")
        reference.append("A = Ability Die (Green d8)")
        reference.append("P = Proficiency Die (Yellow d12)")
        reference.append("D = Difficulty Die (Purple d8)")
        reference.append("C = Challenge Die (Red d12)")
        reference.append("B = Boost Die (Blue d6)")
        reference.append("S = Setback Die (Black d6)")
        reference.append("")
        reference.append("Example: 2A+1P means 2 Ability dice + 1 Proficiency die")
        reference.append("")
        
        return "\n".join(reference)
"""Character data persistence (save/load functionality)."""

import json
import os
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import asdict
from .models import Character, Career, Specialization, Skill, Talent, GameLine, Characteristic
from .character_creator import CharacterCreator


class CharacterDatabase:
    """Handles saving and loading character data."""
    
    def __init__(self, data_dir: str = "character_data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        self.characters_file = self.data_dir / "characters.json"
        self.character_creator = CharacterCreator()
    
    def save_character(self, character: Character) -> bool:
        """Save a character to the database."""
        try:
            # Load existing characters
            characters_data = self._load_characters_data()
            
            # Convert character to dictionary
            char_dict = self._character_to_dict(character)
            
            # Update or add character
            characters_data[character.name] = char_dict
            
            # Save back to file
            with open(self.characters_file, 'w') as f:
                json.dump(characters_data, f, indent=2)
            
            return True
        except Exception as e:
            print(f"Error saving character: {e}")
            return False
    
    def load_character(self, character_name: str) -> Optional[Character]:
        """Load a character from the database."""
        try:
            characters_data = self._load_characters_data()
            
            if character_name not in characters_data:
                return None
            
            char_dict = characters_data[character_name]
            return self._dict_to_character(char_dict)
        
        except Exception as e:
            print(f"Error loading character: {e}")
            return None
    
    def list_characters(self) -> List[str]:
        """List all saved character names."""
        try:
            characters_data = self._load_characters_data()
            return list(characters_data.keys())
        except Exception:
            return []
    
    def delete_character(self, character_name: str) -> bool:
        """Delete a character from the database."""
        try:
            characters_data = self._load_characters_data()
            
            if character_name not in characters_data:
                return False
            
            del characters_data[character_name]
            
            with open(self.characters_file, 'w') as f:
                json.dump(characters_data, f, indent=2)
            
            return True
        except Exception as e:
            print(f"Error deleting character: {e}")
            return False
    
    def export_character(self, character_name: str, export_path: str) -> bool:
        """Export a character to a standalone JSON file."""
        try:
            character = self.load_character(character_name)
            if not character:
                return False
            
            char_dict = self._character_to_dict(character)
            
            with open(export_path, 'w') as f:
                json.dump(char_dict, f, indent=2)
            
            return True
        except Exception as e:
            print(f"Error exporting character: {e}")
            return False
    
    def import_character(self, import_path: str) -> Optional[Character]:
        """Import a character from a JSON file."""
        try:
            with open(import_path, 'r') as f:
                char_dict = json.load(f)
            
            character = self._dict_to_character(char_dict)
            
            # Save to database
            if character:
                self.save_character(character)
            
            return character
        except Exception as e:
            print(f"Error importing character: {e}")
            return None
    
    def _load_characters_data(self) -> Dict:
        """Load the characters database file."""
        if not self.characters_file.exists():
            return {}
        
        try:
            with open(self.characters_file, 'r') as f:
                return json.load(f)
        except Exception:
            return {}
    
    def _character_to_dict(self, character: Character) -> Dict:
        """Convert a Character object to a dictionary for JSON serialization."""
        char_dict = {
            "name": character.name,
            "player_name": character.player_name,
            "species": character.species,
            "career": {
                "name": character.career.name,
                "game_line": character.career.game_line.value,
                "career_skills": character.career.career_skills,
                "starting_wound_threshold": character.career.starting_wound_threshold,
                "starting_strain_threshold": character.career.starting_strain_threshold
            },
            "specializations": [
                {
                    "name": spec.name,
                    "career": spec.career,
                    "bonus_career_skills": spec.bonus_career_skills
                }
                for spec in character.specializations
            ],
            "characteristics": {
                "brawn": character.brawn,
                "agility": character.agility,
                "intellect": character.intellect,
                "cunning": character.cunning,
                "willpower": character.willpower,
                "presence": character.presence
            },
            "derived_attributes": {
                "wound_threshold": character.wound_threshold,
                "strain_threshold": character.strain_threshold
            },
            "experience": {
                "total_xp": character.total_xp,
                "available_xp": character.available_xp,
                "spent_xp": character.spent_xp
            },
            "skills": {
                name: {
                    "name": skill.name,
                    "characteristic": skill.characteristic.value,
                    "career_skill": skill.career_skill,
                    "ranks": skill.ranks
                }
                for name, skill in character.skills.items()
            },
            "talents": [
                {
                    "name": talent.name,
                    "description": talent.description,
                    "activation": talent.activation,
                    "ranked": talent.ranked,
                    "current_rank": talent.current_rank,
                    "cost_per_rank": talent.cost_per_rank
                }
                for talent in character.talents
            ],
            "equipment": {
                "credits": character.credits,
                "items": character.equipment
            },
            "background": {
                "motivation": character.motivation,
                "background": character.background
            }
        }
        
        return char_dict
    
    def _dict_to_character(self, char_dict: Dict) -> Character:
        """Convert a dictionary back to a Character object."""
        # Recreate career object
        career_data = char_dict["career"]
        career = Career(
            name=career_data["name"],
            game_line=GameLine(career_data["game_line"]),
            career_skills=career_data["career_skills"],
            starting_wound_threshold=career_data["starting_wound_threshold"],
            starting_strain_threshold=career_data["starting_strain_threshold"]
        )
        
        # Recreate specializations
        specializations = []
        for spec_data in char_dict.get("specializations", []):
            spec = Specialization(
                name=spec_data["name"],
                career=spec_data["career"],
                talent_tree={},  # Simplified for now
                bonus_career_skills=spec_data.get("bonus_career_skills", [])
            )
            specializations.append(spec)
        
        # Create character with basic info
        character = Character(
            name=char_dict["name"],
            player_name=char_dict["player_name"],
            species=char_dict["species"],
            career=career,
            specializations=specializations,
            brawn=char_dict["characteristics"]["brawn"],
            agility=char_dict["characteristics"]["agility"],
            intellect=char_dict["characteristics"]["intellect"],
            cunning=char_dict["characteristics"]["cunning"],
            willpower=char_dict["characteristics"]["willpower"],
            presence=char_dict["characteristics"]["presence"],
            total_xp=char_dict["experience"]["total_xp"],
            available_xp=char_dict["experience"]["available_xp"],
            spent_xp=char_dict["experience"]["spent_xp"],
            credits=char_dict["equipment"]["credits"],
            equipment=char_dict["equipment"]["items"],
            motivation=char_dict["background"]["motivation"],
            background=char_dict["background"]["background"]
        )
        
        # Restore skills with ranks
        for skill_name, skill_data in char_dict["skills"].items():
            if skill_name in character.skills:
                character.skills[skill_name].ranks = skill_data["ranks"]
        
        # Restore talents
        character.talents = []
        for talent_data in char_dict.get("talents", []):
            talent = Talent(
                name=talent_data["name"],
                description=talent_data["description"],
                activation=talent_data["activation"],
                ranked=talent_data["ranked"],
                current_rank=talent_data["current_rank"],
                cost_per_rank=talent_data.get("cost_per_rank", [])
            )
            character.talents.append(talent)
        
        return character
    
    def backup_database(self, backup_path: str) -> bool:
        """Create a backup of the entire character database."""
        try:
            import shutil
            shutil.copy2(self.characters_file, backup_path)
            return True
        except Exception as e:
            print(f"Error creating backup: {e}")
            return False
    
    def get_database_stats(self) -> Dict:
        """Get statistics about the character database."""
        characters_data = self._load_characters_data()
        
        stats = {
            "total_characters": len(characters_data),
            "characters_by_career": {},
            "characters_by_species": {},
            "average_xp": 0
        }
        
        if not characters_data:
            return stats
        
        total_xp = 0
        for char_data in characters_data.values():
            # Career stats
            career_name = char_data["career"]["name"]
            stats["characters_by_career"][career_name] = \
                stats["characters_by_career"].get(career_name, 0) + 1
            
            # Species stats
            species = char_data["species"]
            stats["characters_by_species"][species] = \
                stats["characters_by_species"].get(species, 0) + 1
            
            # XP stats
            total_xp += char_data["experience"]["total_xp"]
        
        stats["average_xp"] = total_xp // len(characters_data)
        
        return stats
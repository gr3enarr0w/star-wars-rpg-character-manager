"""Command-line interface for Star Wars RPG Character Manager."""

import argparse
import sys
from typing import Optional
from .character_creator import CharacterCreator
from .advancement import AdvancementManager
from .character_sheet import CharacterSheetDisplay
from .persistence import CharacterDatabase
from .models import Character, Characteristic, GameLine


class CharacterManagerCLI:
    """Command-line interface for character management."""
    
    def __init__(self):
        self.creator = CharacterCreator()
        self.advancement = AdvancementManager()
        self.display = CharacterSheetDisplay()
        self.database = CharacterDatabase()
        self.current_character: Optional[Character] = None
    
    def run(self):
        """Main CLI entry point."""
        parser = self.create_parser()
        args = parser.parse_args()
        
        if hasattr(args, 'func'):
            args.func(args)
        else:
            parser.print_help()
    
    def create_parser(self) -> argparse.ArgumentParser:
        """Create the argument parser with all subcommands."""
        parser = argparse.ArgumentParser(
            description="Star Wars RPG Character Manager - Dynamic Character Leveling"
        )
        
        subparsers = parser.add_subparsers(dest='command', help='Available commands')
        
        # Character creation
        create_parser = subparsers.add_parser('create', help='Create a new character')
        create_parser.add_argument('name', help='Character name')
        create_parser.add_argument('player', help='Player name')
        create_parser.add_argument('species', help='Character species')
        create_parser.add_argument('career', help='Character career')
        create_parser.add_argument('--game-line', choices=['eote', 'aor', 'fad'], 
                                 help='Game line filter for careers')
        create_parser.set_defaults(func=self.create_character)
        
        # Character management
        load_parser = subparsers.add_parser('load', help='Load an existing character')
        load_parser.add_argument('name', help='Character name to load')
        load_parser.set_defaults(func=self.load_character)
        
        save_parser = subparsers.add_parser('save', help='Save current character')
        save_parser.set_defaults(func=self.save_character)
        
        list_parser = subparsers.add_parser('list', help='List all saved characters')
        list_parser.set_defaults(func=self.list_characters)
        
        # Character display
        sheet_parser = subparsers.add_parser('sheet', help='Display character sheet')
        sheet_parser.add_argument('--name', help='Character name (if not loaded)')
        sheet_parser.set_defaults(func=self.show_character_sheet)
        
        summary_parser = subparsers.add_parser('summary', help='Display character summary')
        summary_parser.add_argument('--name', help='Character name (if not loaded)')
        summary_parser.set_defaults(func=self.show_character_summary)
        
        # Advancement
        xp_parser = subparsers.add_parser('award-xp', help='Award experience points')
        xp_parser.add_argument('amount', type=int, help='XP amount to award')
        xp_parser.add_argument('--reason', help='Reason for XP award')
        xp_parser.set_defaults(func=self.award_xp)
        
        advance_parser = subparsers.add_parser('advance', help='Show advancement options')
        advance_parser.set_defaults(func=self.show_advancement_options)
        
        skill_parser = subparsers.add_parser('advance-skill', help='Advance a skill')
        skill_parser.add_argument('skill', help='Skill name to advance')
        skill_parser.set_defaults(func=self.advance_skill)
        
        char_parser = subparsers.add_parser('advance-characteristic', 
                                          help='Advance a characteristic')
        char_parser.add_argument('characteristic', help='Characteristic to advance')
        char_parser.set_defaults(func=self.advance_characteristic)
        
        # Utility commands
        careers_parser = subparsers.add_parser('list-careers', help='List available careers')
        careers_parser.add_argument('--game-line', choices=['eote', 'aor', 'fad'],
                                  help='Filter by game line')
        careers_parser.set_defaults(func=self.list_careers)
        
        species_parser = subparsers.add_parser('list-species', help='List available species')
        species_parser.set_defaults(func=self.list_species)
        
        dice_parser = subparsers.add_parser('dice-help', help='Show dice notation reference')
        dice_parser.set_defaults(func=self.show_dice_help)
        
        # Database management
        export_parser = subparsers.add_parser('export', help='Export character to file')
        export_parser.add_argument('name', help='Character name to export')
        export_parser.add_argument('filename', help='Output filename')
        export_parser.set_defaults(func=self.export_character)
        
        import_parser = subparsers.add_parser('import', help='Import character from file')
        import_parser.add_argument('filename', help='Input filename')
        import_parser.set_defaults(func=self.import_character)
        
        stats_parser = subparsers.add_parser('stats', help='Show database statistics')
        stats_parser.set_defaults(func=self.show_stats)
        
        return parser
    
    def create_character(self, args):
        """Create a new character."""
        try:
            # Validate inputs
            if args.species not in self.creator.get_available_species():
                print(f"Unknown species: {args.species}")
                print(f"Available species: {', '.join(self.creator.get_available_species())}")
                return
            
            if args.career not in self.creator.get_available_careers():
                print(f"Unknown career: {args.career}")
                print(f"Available careers: {', '.join(self.creator.get_available_careers())}")
                return
            
            # Create character
            character = self.creator.create_character(
                name=args.name,
                player_name=args.player,
                species=args.species,
                career_name=args.career
            )
            
            self.current_character = character
            print(f"Created character: {character.name}")
            print(f"Starting XP: {character.available_xp}")
            print("Use 'save' to save this character.")
            
        except Exception as e:
            print(f"Error creating character: {e}")
    
    def load_character(self, args):
        """Load an existing character."""
        character = self.database.load_character(args.name)
        if character:
            self.current_character = character
            print(f"Loaded character: {character.name}")
        else:
            print(f"Character '{args.name}' not found.")
    
    def save_character(self, args):
        """Save the current character."""
        if not self.current_character:
            print("No character loaded. Use 'load' or 'create' first.")
            return
        
        if self.database.save_character(self.current_character):
            print(f"Saved character: {self.current_character.name}")
        else:
            print("Failed to save character.")
    
    def list_characters(self, args):
        """List all saved characters."""
        characters = self.database.list_characters()
        if characters:
            print("Saved characters:")
            for name in sorted(characters):
                character = self.database.load_character(name)
                if character:
                    summary = self.display.display_character_summary(character)
                    print(f"  {summary}")
        else:
            print("No saved characters found.")
    
    def show_character_sheet(self, args):
        """Display a character sheet."""
        character = self._get_character(args.name)
        if character:
            sheet = self.display.display_character_sheet(character)
            print(sheet)
    
    def show_character_summary(self, args):
        """Display a character summary."""
        character = self._get_character(args.name)
        if character:
            summary = self.display.display_character_summary(character)
            print(summary)
    
    def award_xp(self, args):
        """Award experience points to the current character."""
        if not self.current_character:
            print("No character loaded.")
            return
        
        self.advancement.award_xp(self.current_character, args.amount, args.reason or "")
        print(f"Available XP: {self.current_character.available_xp}")
    
    def show_advancement_options(self, args):
        """Show available advancement options."""
        if not self.current_character:
            print("No character loaded.")
            return
        
        options = self.advancement.get_advancement_options(self.current_character)
        display = self.display.display_advancement_options(self.current_character, options)
        print(display)
    
    def advance_skill(self, args):
        """Advance a skill."""
        if not self.current_character:
            print("No character loaded.")
            return
        
        if self.advancement.advance_skill(self.current_character, args.skill):
            skill = self.current_character.skills[args.skill]
            print(f"Advanced {args.skill} to rank {skill.ranks}")
            print(f"Remaining XP: {self.current_character.available_xp}")
        else:
            print(f"Cannot advance {args.skill}")
    
    def advance_characteristic(self, args):
        """Advance a characteristic."""
        if not self.current_character:
            print("No character loaded.")
            return
        
        try:
            characteristic = Characteristic(args.characteristic)
            if self.advancement.advance_characteristic(self.current_character, characteristic):
                char_name = characteristic.value.lower()
                current_value = getattr(self.current_character, char_name)
                print(f"Advanced {characteristic.value} to {current_value}")
                print(f"Remaining XP: {self.current_character.available_xp}")
            else:
                print(f"Cannot advance {characteristic.value}")
        except ValueError:
            print(f"Unknown characteristic: {args.characteristic}")
            print("Valid characteristics: Brawn, Agility, Intellect, Cunning, Willpower, Presence")
    
    def list_careers(self, args):
        """List available careers."""
        game_line = None
        if args.game_line:
            game_line_map = {
                'eote': GameLine.EDGE_OF_EMPIRE,
                'aor': GameLine.AGE_OF_REBELLION,
                'fad': GameLine.FORCE_AND_DESTINY
            }
            game_line = game_line_map.get(args.game_line)
        
        careers = self.creator.get_available_careers(game_line)
        print("Available careers:")
        for career in sorted(careers):
            career_info = self.creator.get_career_info(career)
            print(f"  {career} ({career_info.game_line.value})")
    
    def list_species(self, args):
        """List available species."""
        species = self.creator.get_available_species()
        print("Available species:")
        for spec in sorted(species):
            spec_info = self.creator.get_species_info(spec)
            print(f"  {spec} (Starting XP: {spec_info['starting_xp']})")
    
    def show_dice_help(self, args):
        """Show dice notation reference."""
        reference = self.display.display_dice_reference()
        print(reference)
    
    def export_character(self, args):
        """Export a character to file."""
        if self.database.export_character(args.name, args.filename):
            print(f"Exported {args.name} to {args.filename}")
        else:
            print(f"Failed to export {args.name}")
    
    def import_character(self, args):
        """Import a character from file."""
        character = self.database.import_character(args.filename)
        if character:
            print(f"Imported character: {character.name}")
            self.current_character = character
        else:
            print(f"Failed to import from {args.filename}")
    
    def show_stats(self, args):
        """Show database statistics."""
        stats = self.database.get_database_stats()
        print("Database Statistics:")
        print(f"Total characters: {stats['total_characters']}")
        print(f"Average XP: {stats['average_xp']}")
        
        if stats['characters_by_career']:
            print("\nCharacters by career:")
            for career, count in sorted(stats['characters_by_career'].items()):
                print(f"  {career}: {count}")
        
        if stats['characters_by_species']:
            print("\nCharacters by species:")
            for species, count in sorted(stats['characters_by_species'].items()):
                print(f"  {species}: {count}")
    
    def _get_character(self, name: Optional[str]) -> Optional[Character]:
        """Get character by name or return current character."""
        if name:
            return self.database.load_character(name)
        return self.current_character


def main():
    """Main entry point for the CLI."""
    cli = CharacterManagerCLI()
    cli.run()


if __name__ == "__main__":
    main()
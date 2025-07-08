# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Python application called "star-wars-rpg-character-manager" for dynamic character leveling in Star Wars RPG systems (Edge of the Empire, Age of Rebellion, Force and Destiny). The project provides both a modern web interface (similar to D&D Beyond/Demiplane) and a CLI interface for character management. Built with Flask backend and vanilla JavaScript frontend.

## SWRPG Content Reference

**IMPORTANT**: For all Star Wars RPG game mechanics, rules, species data, careers, talents, equipment, and other content verification, refer to the extracted SWRPG reference materials located in:

- **Extracted PDFs**: `/Users/ceverson/Development/star-wars-rpg-character-manager/swrpg_complete_extraction/`
  - `text/` - Clean text versions of all SWRPG sourcebooks
  - `json/` - Structured data from sourcebooks
  - `markdown/` - Markdown formatted content for easy reading
- **Clean Species Data**: `/Users/ceverson/Development/star-wars-rpg-character-manager/swrpg_extracted_data/json/clean_species_data.json`

This extracted content includes:
- **All Species**: Human, Twi'lek, Wookiee, Clone, Dathomirian, Harch, Karkarodon, Togruta, Weequay, Quarren, Ithorian, etc.
- **All Careers**: Bounty Hunter, Smuggler, Jedi, Diplomat, Ace, Guardian, etc.
- **Game Mechanics**: Characteristics, wound/strain thresholds, starting XP, special abilities
- **Rules Reference**: Combat, Force powers, talents, equipment stats

**Data Verification Protocol**: Always cross-reference character creation data, species stats, career information, and game mechanics against these extracted sources to ensure accuracy and completeness. The application currently has 28+ species available in the character creation wizard.

## SWRPG Advancement Rules

### Character Creation (Official Rules)
- **Characteristic Costs**: 10 × new rank (e.g., 30 XP for rank 3, 40 XP for rank 4)
- **Starting Characteristics**: All start at 2, modified by species
- **Maximum During Creation**: Can increase to rank 5 with XP

### Post-Creation Advancement (Official Rules)
- **Characteristics**: Can ONLY be increased through specific talents like "Dedication", NOT with XP
- **Skills**: 5 × new rank for career skills, +5 XP for non-career skills
- **Talents**: Purchased through talent trees with varying XP costs

### Species Starting XP (Verified Against Sourcebooks)
- **Human**: 110 XP (most versatile)
- **Most Species**: 100 XP (standard)
- **Powerful Species**: 90 XP (Wookiee, etc. - compensated with higher starting characteristics)

## Development Commands

### Running the Web Application (Primary Interface)
```bash
# Install dependencies
pip install flask

# Run the web application
python run_web.py

# Alternative: Run directly from web directory
cd web && PYTHONPATH=../src python app.py

# Access the application at: http://localhost:8000
```

### Running the CLI (Alternative Interface)
```bash
# Run CLI during development (without installation)
PYTHONPATH=src python -m swrpg_character_manager.cli <command>

# After installation via pip install -e .
swrpg <command>

# Test basic functionality
PYTHONPATH=src python -m swrpg_character_manager.cli list-careers
PYTHONPATH=src python -m swrpg_character_manager.cli create "Test Character" "Player" "Human" "Guardian"
```

### Installation and Setup
```bash
# Development setup
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e .

# Quick functionality test
PYTHONPATH=src python -c "
from swrpg_character_manager.character_creator import CharacterCreator
from swrpg_character_manager.character_sheet import CharacterSheetDisplay
creator = CharacterCreator()
character = creator.create_character('Test', 'Player', 'Human', 'Guardian')
display = CharacterSheetDisplay()
print(display.display_character_sheet(character))
"
```

## Complete Usage Guide

### Web Interface (Primary - User-Friendly)
1. **Start the Application**: Run `python run_web.py` and open http://localhost:8000
2. **Character Creation**: Click "Create New Character" and follow the wizard
3. **Character Management**: View all characters on the dashboard, click any to view/edit
4. **Character Advancement**: 
   - Click "Award XP" to give experience points
   - Click "Advance" buttons next to skills to spend XP (characteristics can only be increased during creation or via Dedication talents)
   - View real-time dice pool calculations
5. **Data Management**: Characters auto-save, use Export/Import for backups

### CLI Interface (Advanced Users)
```bash
# Character Creation
swrpg list-careers && swrpg list-species
swrpg create "Luke Skywalker" "Player1" "Human" "Guardian"

# Character Advancement
swrpg award-xp 50 --reason "Completed adventure"
swrpg advance  # Show advancement options
swrpg advance-skill "Discipline"
# Note: Cannot advance characteristics post-creation with XP (need Dedication talents)

# Character Management
swrpg save && swrpg load "Luke Skywalker" && swrpg sheet

# Data Operations
swrpg export "Luke Skywalker" "backup.json"
swrpg import "backup.json"
swrpg stats
```

## Code Architecture

### Core Data Flow
The application follows a layered architecture with dual interfaces:

1. **Models Layer** (`models.py`) - Core data structures (Character, Skill, Talent, Career, etc.)
2. **Creation Layer** (`character_creator.py`) - Character initialization with species/career data
3. **Advancement Layer** (`advancement.py`) - XP spending and character progression logic
4. **Persistence Layer** (`persistence.py`) - JSON save/load with character serialization
5. **Display Layer** (`character_sheet.py`) - Formatted output and dice pool calculations
6. **Interface Layers**:
   - **Web Interface** (`web/app.py` + `web/static/` + `web/templates/`) - Flask API + HTML/CSS/JS frontend
   - **CLI Interface** (`cli.py`) - Command-line interface for advanced users

### Key Design Patterns

**Character Lifecycle**: Characters flow through: CharacterCreator → AdvancementManager → CharacterDatabase → CharacterSheetDisplay

**XP Transaction System**: All advancement costs are calculated in AdvancementManager, with the Character model handling atomic XP spending transactions using `spend_xp()` method

**Dice Pool Calculation**: Skills automatically calculate their dice pools based on linked characteristics and ranks, implementing Star Wars RPG mechanics (Ability dice convert to Proficiency dice based on skill ranks vs characteristic values)

**Data Serialization Strategy**: Characters serialize to/from dictionaries for JSON persistence, with special handling for enum types (GameLine, Characteristic) and nested objects (Career, Specialization, Talent)

### Component Interactions

- **CharacterCreator** initializes characters with species modifiers, career skills, and starting XP from static data tables
- **AdvancementManager** validates advancement costs before calling Character methods, enforces SWRPG rules (no post-creation characteristic advancement with XP)
- **CharacterDatabase** handles complex serialization of Character objects to JSON, flattening nested structures
- **CLI** maintains stateless operation - no persistent current_character between command invocations

### Star Wars RPG Mechanics Implementation

The application implements core SW RPG rules:
- **Six Characteristics**: Brawn, Agility, Intellect, Cunning, Willpower, Presence (typically 1-6 range)
- **Career Skills**: Skills linked to careers cost less XP to advance (base cost vs base cost + 5)
- **Dice Pool Mechanics**: Ability dice (green d8) convert to Proficiency dice (yellow d12) based on skill ranks
- **XP Costs**: 
  - **Character Creation**: Characteristics cost 10 × new rank
  - **Post-Creation**: Skills cost 5 × new rank XP (+5 for non-career)
  - **Characteristics**: Can only be increased post-creation via Dedication talents

## Critical Implementation Details

### CLI State Management
The CLI is completely stateless between commands. Characters must be explicitly loaded via `load` command. The `current_character` attribute only exists during single command execution.

### Character Initialization Process
All characters get the complete skill list initialized in `Character.__post_init__()`, with career skills marked based on the career's skill list. Species provide characteristic modifiers and starting XP amounts.

### JSON Serialization Complexity
Complex objects (Career, Specialization, Talent) are flattened to dictionaries during save and reconstructed during load in `CharacterDatabase`. Enums serialize as string values and are reconstructed via enum constructors.

### Advancement Cost Calculation
`AdvancementManager` provides cost calculation methods that are separate from the actual spending logic in the Character class. This allows for advancement simulation and validation before committing XP. Post-creation characteristic advancement is blocked to enforce SWRPG rules.

## Adding New Content

### Adding Species
Add to `CharacterCreator._initialize_species()` with characteristic modifiers, wound/strain thresholds, starting XP, and special abilities list.

### Adding Careers  
Add to `CharacterCreator._initialize_careers()` with career skills list, starting thresholds, and game line association.

### Adding Skills
Update the skill list in `Character._initialize_skills()` and link to appropriate characteristics via the Characteristic enum.

### Adding Talents
Create Talent objects with activation types, descriptions, and rank costs. Add via advancement system or character creation. For Dedication talents, they should increase characteristics by 1 when purchased.
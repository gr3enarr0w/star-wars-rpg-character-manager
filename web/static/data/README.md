# Star Wars RPG Game Data

This directory contains comprehensive species and career data extracted from the Star Wars RPG Core Rulebooks and reference materials, formatted for use in JavaScript applications.

## Files Overview

### `swrpg-species-data.js`
Contains detailed data for 25+ species from across the Star Wars RPG line, including:
- **Core Species**: Human, Twi'lek, Rodian, Wookiee, Bothan, Duros, Mon Calamari, Sullustan
- **Force and Destiny Species**: Cerean, Kel Dor, Nautolan, Zabrak, Miraluka
- **Extended Universe Species**: Chiss, Mandalorian Human, Corellian Human, Jawa, Ewok, Devaronian, Ithorian, Trandoshan, Gand, and more

Each species entry includes:
```javascript
{
  characteristics: { brawn: 2, agility: 3, intellect: 2, cunning: 2, willpower: 1, presence: 2 },
  woundThreshold: 10,
  strainThreshold: 10,
  startingXP: 100,
  specialAbilities: ["Ability 1", "Ability 2"],
  source: "Core Rulebook",
  description: "Species description"
}
```

### `swrpg-career-data.js`
Contains comprehensive career data for all three game lines:

**Edge of the Empire**: Bounty Hunter, Colonist, Explorer, Hired Gun, Smuggler, Technician

**Age of Rebellion**: Ace, Commander, Diplomat, Engineer, Soldier, Spy

**Force and Destiny**: Consular, Guardian, Mystic, Seeker, Sentinel, Warrior

Each career entry includes:
```javascript
{
  name: "Career Name",
  gameLine: "Edge of the Empire",
  description: "Career description",
  careerSkills: ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5", "Skill6"],
  startingWoundThreshold: 12,
  startingStrainThreshold: 12,
  specializations: [
    {
      name: "Specialization Name",
      description: "Specialization description",
      bonusCareerSkills: ["Bonus1", "Bonus2", "Bonus3", "Bonus4"]
    }
  ],
  forceRating: 1, // Only for F&D careers
  source: "Core Rulebook"
}
```

### `swrpg-game-data.js`
Main utility module that combines species and career data with helper functions:

#### Key Utility Functions:
- `getSpecies()` - Get all available species
- `getCareers()` - Get all available careers
- `getCareersByGameLine(gameLine)` - Filter careers by game line
- `calculateWoundThreshold(species, career, brawn)` - Calculate wound threshold
- `calculateStrainThreshold(species, career, willpower)` - Calculate strain threshold
- `calculateDicePool(characteristic, skillRanks)` - Calculate dice pool for skill checks
- `isCareerSkill(skill, career)` - Check if skill is career skill
- `getCharacteristicAdvancementCost(currentValue)` - Get XP cost for characteristic advancement
- `getSkillAdvancementCost(currentRank, isCareerSkill)` - Get XP cost for skill advancement
- `validateCharacterCreation(data)` - Validate character creation data
- `generateCharacterSummary(name, species, career)` - Generate complete character summary

## Usage Examples

### Basic Character Creation
```javascript
import { SWRPGGameData } from './swrpg-game-data.js';

// Create character summary
const character = SWRPGGameData.generateCharacterSummary(
  "Luke Skywalker",
  "Human", 
  "Guardian"
);

console.log(character);
// Output: Complete character data with characteristics, thresholds, skills, etc.
```

### Get Available Options
```javascript
// Get all species
const species = SWRPGGameData.getSpecies();

// Get careers by game line
const eotecareers = SWRPGGameData.getCareersByGameLine("Edge of the Empire");
const aorCareers = SWRPGGameData.getCareersByGameLine("Age of Rebellion");
const fadCareers = SWRPGGameData.getCareersByGameLine("Force and Destiny");
```

### Calculate Game Mechanics
```javascript
// Calculate dice pool for Agility 3, Piloting 2
const dicePool = SWRPGGameData.calculateDicePool(3, 2);
// Returns: { ability: 1, proficiency: 2 }

// Format for display
const formatted = SWRPGGameData.formatDicePool(dicePool.ability, dicePool.proficiency);
// Returns: "1A + 2P"

// Check if skill is career skill
const isCareer = SWRPGGameData.isCareerSkill("Piloting (Space)", "Smuggler");
// Returns: true

// Get advancement costs
const charCost = SWRPGGameData.getCharacteristicAdvancementCost(2); // 30 XP
const skillCost = SWRPGGameData.getSkillAdvancementCost(1, true); // 10 XP for career skill
```

### Validation
```javascript
const characterData = {
  name: "Test Character",
  playerName: "Player",
  species: "Human",
  career: "Smuggler"
};

const errors = SWRPGGameData.validateCharacterCreation(characterData);
if (errors.length === 0) {
  // Character data is valid
}
```

## Data Sources

The data has been compiled from the following official Star Wars RPG sources:
- **Edge of the Empire Core Rulebook** - Core EotE species and careers
- **Age of Rebellion Core Rulebook** - Core AoR species and careers  
- **Force and Destiny Core Rulebook** - Core F&D species and careers
- **Various Sourcebooks** - Extended species and specializations from supplement books
- **Reference Guides** - Consolidated species and career lists

## Data Accuracy

This data represents the mechanical game statistics as published in the official rulebooks. Some abilities and descriptions have been simplified for programmatic use while maintaining mechanical accuracy. Special abilities are described in natural language and may require interpretation for full implementation.

## Integration

This data is designed to integrate with the existing Star Wars RPG Character Manager application. The data structure matches the expected format in the Python backend (`character_creator.py` and `models.py`) while providing additional detail and expanded species/career options.

To use this data in the web application:

1. Import the modules in your JavaScript character creation interface
2. Use the utility functions to populate dropdowns and calculate values
3. Validate user input before sending to the backend
4. The data format is compatible with the existing Flask API endpoints

## Future Enhancements

Potential additions to this data set:
- **Talents**: Individual talent trees for each specialization
- **Equipment**: Starting equipment for careers and species
- **Force Powers**: Force power trees for Force-sensitive careers
- **Obligations/Duties/Morality**: Background elements for each game line
- **Additional Species**: Species from newer sourcebooks and supplements
- **Signature Abilities**: High-level career capstone abilities
// Star Wars RPG Complete Game Data
// Combined import and utility functions for species and career data

import { SWRPG_SPECIES_DATA, SPECIES_CAREER_SKILLS } from './swrpg-species-data.js';
import { SWRPG_CAREER_DATA, GAME_LINES, UNIVERSAL_SKILLS } from './swrpg-career-data.js';

// Characteristic definitions
const CHARACTERISTICS = {
  brawn: { name: "Brawn", description: "Physical power and toughness" },
  agility: { name: "Agility", description: "Speed, dexterity, and fine motor skills" },
  intellect: { name: "Intellect", description: "Reasoning ability and technical knowledge" },
  cunning: { name: "Cunning", description: "Cleverness, instincts, and practical thinking" },
  willpower: { name: "Willpower", description: "Mental fortitude and discipline" },
  presence: { name: "Presence", description: "Force of personality and leadership" }
};

// Skill to characteristic mapping
const SKILL_CHARACTERISTICS = {
  "Astrogation": "intellect",
  "Athletics": "brawn",
  "Brawl": "brawn",
  "Charm": "presence",
  "Coercion": "willpower", 
  "Computers": "intellect",
  "Cool": "presence",
  "Coordination": "agility",
  "Deception": "cunning",
  "Discipline": "willpower",
  "Gunnery": "agility",
  "Leadership": "presence",
  "Lightsaber": "brawn",
  "Mechanics": "intellect",
  "Medicine": "intellect",
  "Melee": "brawn",
  "Negotiation": "presence",
  "Perception": "cunning",
  "Piloting (Planetary)": "agility",
  "Piloting (Space)": "agility",
  "Ranged (Heavy)": "agility",
  "Ranged (Light)": "agility",
  "Resilience": "brawn",
  "Skulduggery": "cunning",
  "Stealth": "agility",
  "Streetwise": "cunning",
  "Survival": "cunning",
  "Vigilance": "willpower",
  "Knowledge (Core Worlds)": "intellect",
  "Knowledge (Education)": "intellect",
  "Knowledge (Lore)": "intellect",
  "Knowledge (Outer Rim)": "intellect",
  "Knowledge (Underworld)": "intellect",
  "Knowledge (Warfare)": "intellect",
  "Knowledge (Xenology)": "intellect"
};

// Utility functions for character creation
class SWRPGGameData {
  
  // Get all available species
  static getSpecies() {
    return Object.keys(SWRPG_SPECIES_DATA).sort();
  }

  // Get species data by name
  static getSpeciesData(speciesName) {
    return SWRPG_SPECIES_DATA[speciesName];
  }

  // Get all careers
  static getCareers() {
    return Object.keys(SWRPG_CAREER_DATA).sort();
  }

  // Get careers by game line
  static getCareersByGameLine(gameLine) {
    return Object.keys(SWRPG_CAREER_DATA)
      .filter(career => SWRPG_CAREER_DATA[career].gameLine === gameLine)
      .sort();
  }

  // Get career data by name
  static getCareerData(careerName) {
    return SWRPG_CAREER_DATA[careerName];
  }

  // Get all game lines
  static getGameLines() {
    return Object.keys(GAME_LINES);
  }

  // Get game line data
  static getGameLineData(gameLineName) {
    return GAME_LINES[gameLineName];
  }

  // Calculate starting characteristics for a species
  static getStartingCharacteristics(speciesName) {
    const speciesData = SWRPG_SPECIES_DATA[speciesName];
    if (!speciesData) return null;
    
    return { ...speciesData.characteristics };
  }

  // Calculate wound threshold for character
  static calculateWoundThreshold(speciesName, careerName, brawn) {
    const speciesData = SWRPG_SPECIES_DATA[speciesName];
    const careerData = SWRPG_CAREER_DATA[careerName];
    
    if (!speciesData || !careerData) return 0;
    
    return speciesData.woundThreshold + careerData.startingWoundThreshold + brawn;
  }

  // Calculate strain threshold for character  
  static calculateStrainThreshold(speciesName, careerName, willpower) {
    const speciesData = SWRPG_SPECIES_DATA[speciesName];
    const careerData = SWRPG_CAREER_DATA[careerName];
    
    if (!speciesData || !careerData) return 0;
    
    return speciesData.strainThreshold + careerData.startingStrainThreshold + willpower;
  }

  // Get starting XP for species
  static getStartingXP(speciesName) {
    const speciesData = SWRPG_SPECIES_DATA[speciesName];
    return speciesData ? speciesData.startingXP : 0;
  }

  // Check if skill is career skill for given career
  static isCareerSkill(skillName, careerName) {
    const careerData = SWRPG_CAREER_DATA[careerName];
    return careerData ? careerData.careerSkills.includes(skillName) : false;
  }

  // Get characteristic that governs a skill
  static getSkillCharacteristic(skillName) {
    return SKILL_CHARACTERISTICS[skillName] || null;
  }

  // Calculate dice pool for skill
  static calculateDicePool(characteristicValue, skillRanks) {
    if (skillRanks === 0) {
      return { ability: characteristicValue, proficiency: 0 };
    }
    
    const proficiency = Math.min(characteristicValue, skillRanks);
    const ability = Math.max(0, characteristicValue - skillRanks);
    
    return { ability, proficiency };
  }

  // Format dice pool for display
  static formatDicePool(abilityDice, proficiencyDice) {
    const parts = [];
    if (abilityDice > 0) parts.push(`${abilityDice}A`);
    if (proficiencyDice > 0) parts.push(`${proficiencyDice}P`);
    return parts.length > 0 ? parts.join(' + ') : '0';
  }

  // Get XP cost to advance characteristic
  static getCharacteristicAdvancementCost(currentValue) {
    const costs = { 2: 30, 3: 40, 4: 50, 5: 60, 6: 70 };
    return costs[currentValue + 1] || 0;
  }

  // Get XP cost to advance skill
  static getSkillAdvancementCost(currentRank, isCareerSkill) {
    const baseCost = (currentRank + 1) * 5;
    return isCareerSkill ? baseCost : baseCost + 5;
  }

  // Validate character creation choices
  static validateCharacterCreation(data) {
    const errors = [];
    
    // Check required fields
    if (!data.name) errors.push("Character name is required");
    if (!data.playerName) errors.push("Player name is required");
    if (!data.species) errors.push("Species is required");
    if (!data.career) errors.push("Career is required");
    
    // Check if species exists
    if (data.species && !SWRPG_SPECIES_DATA[data.species]) {
      errors.push(`Unknown species: ${data.species}`);
    }
    
    // Check if career exists
    if (data.career && !SWRPG_CAREER_DATA[data.career]) {
      errors.push(`Unknown career: ${data.career}`);
    }
    
    // Check characteristics are within valid range
    if (data.characteristics) {
      Object.keys(data.characteristics).forEach(char => {
        const value = data.characteristics[char];
        if (value < 1 || value > 6) {
          errors.push(`${char} must be between 1 and 6`);
        }
      });
    }
    
    return errors;
  }

  // Generate character creation summary
  static generateCharacterSummary(name, species, career) {
    const speciesData = SWRPG_SPECIES_DATA[species];
    const careerData = SWRPG_CAREER_DATA[career];
    
    if (!speciesData || !careerData) return null;
    
    return {
      name,
      species,
      career,
      gameLine: careerData.gameLine,
      startingXP: speciesData.startingXP,
      characteristics: { ...speciesData.characteristics },
      careerSkills: [...careerData.careerSkills],
      specialAbilities: [...speciesData.specialAbilities],
      woundThreshold: speciesData.woundThreshold + careerData.startingWoundThreshold + speciesData.characteristics.brawn,
      strainThreshold: speciesData.strainThreshold + careerData.startingStrainThreshold + speciesData.characteristics.willpower
    };
  }
}

// Export everything for use in the application
export {
  SWRPG_SPECIES_DATA,
  SWRPG_CAREER_DATA,
  GAME_LINES,
  UNIVERSAL_SKILLS,
  CHARACTERISTICS,
  SKILL_CHARACTERISTICS,
  SWRPGGameData
};
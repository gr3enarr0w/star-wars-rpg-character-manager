// Example implementation of Star Wars RPG character creation using the game data
import { SWRPGGameData } from '../data/swrpg-game-data.js';

// Example: Create a new character
function createExampleCharacter() {
  const characterData = {
    name: "Dash Rendar",
    playerName: "Example Player",
    species: "Human",
    career: "Smuggler"
  };

  // Validate the character data
  const validationErrors = SWRPGGameData.validateCharacterCreation(characterData);
  if (validationErrors.length > 0) {
    console.error("Validation errors:", validationErrors);
    return null;
  }

  // Generate character summary
  const character = SWRPGGameData.generateCharacterSummary(
    characterData.name,
    characterData.species,
    characterData.career
  );

  console.log("Created character:", character);
  return character;
}

// Example: Display available options
function displayAvailableOptions() {
  console.log("Available Species:", SWRPGGameData.getSpecies());
  console.log("Available Careers:", SWRPGGameData.getCareers());
  console.log("Available Game Lines:", SWRPGGameData.getGameLines());
  
  // Show careers by game line
  SWRPGGameData.getGameLines().forEach(gameLine => {
    console.log(`${gameLine} careers:`, SWRPGGameData.getCareersByGameLine(gameLine));
  });
}

// Example: Calculate dice pools
function demonstrateDicePoolCalculation() {
  // Example: Character has Agility 3, Piloting (Space) rank 2
  const agility = 3;
  const pilotingRanks = 2;
  
  const dicePool = SWRPGGameData.calculateDicePool(agility, pilotingRanks);
  const formattedPool = SWRPGGameData.formatDicePool(dicePool.ability, dicePool.proficiency);
  
  console.log(`Piloting (Space) dice pool: ${formattedPool}`);
  console.log(`Details: ${dicePool.ability} Ability dice, ${dicePool.proficiency} Proficiency dice`);
}

// Example: Calculate advancement costs
function demonstrateAdvancementCosts() {
  // Cost to advance Brawn from 2 to 3
  const brawnCost = SWRPGGameData.getCharacteristicAdvancementCost(2);
  console.log(`Cost to advance Brawn from 2 to 3: ${brawnCost} XP`);
  
  // Cost to advance a career skill from rank 1 to 2
  const careerSkillCost = SWRPGGameData.getSkillAdvancementCost(1, true);
  console.log(`Cost to advance career skill from 1 to 2: ${careerSkillCost} XP`);
  
  // Cost to advance a non-career skill from rank 1 to 2
  const nonCareerSkillCost = SWRPGGameData.getSkillAdvancementCost(1, false);
  console.log(`Cost to advance non-career skill from 1 to 2: ${nonCareerSkillCost} XP`);
}

// Example: Species and career analysis
function analyzeSpeciesAndCareer() {
  const species = "Twi'lek";
  const career = "Smuggler";
  
  const speciesData = SWRPGGameData.getSpeciesData(species);
  const careerData = SWRPGGameData.getCareerData(career);
  
  console.log(`\n=== ${species} ${career} Analysis ===`);
  console.log("Starting characteristics:", speciesData.characteristics);
  console.log("Starting XP:", speciesData.startingXP);
  console.log("Special abilities:", speciesData.specialAbilities);
  console.log("Career skills:", careerData.careerSkills);
  console.log("Game line:", careerData.gameLine);
  
  // Calculate thresholds
  const woundThreshold = SWRPGGameData.calculateWoundThreshold(
    species, career, speciesData.characteristics.brawn
  );
  const strainThreshold = SWRPGGameData.calculateStrainThreshold(
    species, career, speciesData.characteristics.willpower
  );
  
  console.log(`Wound Threshold: ${woundThreshold}`);
  console.log(`Strain Threshold: ${strainThreshold}`);
}

// Example: Check if skills are career skills
function demonstrateCareerSkillChecks() {
  const career = "Bounty Hunter";
  const skills = ["Athletics", "Piloting (Space)", "Charm", "Medicine"];
  
  console.log(`\n=== Career Skill Analysis for ${career} ===`);
  skills.forEach(skill => {
    const isCareer = SWRPGGameData.isCareerSkill(skill, career);
    const characteristic = SWRPGGameData.getSkillCharacteristic(skill);
    console.log(`${skill}: ${isCareer ? 'Career' : 'Non-career'} skill (${characteristic})`);
  });
}

// Run examples
function runAllExamples() {
  console.log("=== Star Wars RPG Character Creation Examples ===\n");
  
  displayAvailableOptions();
  
  console.log("\n" + "=".repeat(50));
  createExampleCharacter();
  
  console.log("\n" + "=".repeat(50));
  demonstrateDicePoolCalculation();
  
  console.log("\n" + "=".repeat(50));
  demonstrateAdvancementCosts();
  
  console.log("\n" + "=".repeat(50));
  analyzeSpeciesAndCareer();
  
  console.log("\n" + "=".repeat(50));
  demonstrateCareerSkillChecks();
}

// Export for use in other modules
export {
  createExampleCharacter,
  displayAvailableOptions,
  demonstrateDicePoolCalculation,
  demonstrateAdvancementCosts,
  analyzeSpeciesAndCareer,
  demonstrateCareerSkillChecks,
  runAllExamples
};
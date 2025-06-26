// Star Wars RPG Species Data
// Comprehensive species data extracted from Core Rulebooks and reference materials
// Format: JavaScript object ready for character creation system

const SWRPG_SPECIES_DATA = {
  // Edge of the Empire Core Species
  "Human": {
    characteristics: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 2 },
    woundThreshold: 10,
    strainThreshold: 10,
    startingXP: 110,
    specialAbilities: [
      "Extra skill rank in two different non-career skills during character creation",
      "Ready for Anything: Once per session, may move one story point from the GM pool to the player pool"
    ],
    source: "EotE Core",
    description: "The most common species in the galaxy, known for their adaptability and determination."
  },

  "Twi'lek": {
    characteristics: { brawn: 1, agility: 2, intellect: 2, cunning: 3, willpower: 2, presence: 2 },
    woundThreshold: 10,
    strainThreshold: 11,
    startingXP: 100,
    specialAbilities: [
      "Remove one setback die from Charm and Deception checks",
      "Cultural Adaptability: Add boost die when interacting with different cultures"
    ],
    source: "EotE Core",
    description: "Graceful humanoids with colorful skin and distinctive head-tails called lekku."
  },

  "Rodian": {
    characteristics: { brawn: 2, agility: 3, intellect: 2, cunning: 2, willpower: 1, presence: 2 },
    woundThreshold: 10,
    strainThreshold: 10,
    startingXP: 100,
    specialAbilities: [
      "Remove one setback die from Perception checks",
      "Expert Tracker: Add boost die to Survival checks when tracking"
    ],
    source: "EotE Core",
    description: "Green-skinned hunters with large eyes and keen senses, famous for their tracking abilities."
  },

  "Wookiee": {
    characteristics: { brawn: 3, agility: 2, intellect: 2, cunning: 2, willpower: 1, presence: 2 },
    woundThreshold: 14,
    strainThreshold: 8,
    startingXP: 90,
    specialAbilities: [
      "Wookiee Rage: When wounded, add boost die to Brawl and Melee attacks until end of encounter",
      "Natural Weapons: Claws deal +1 damage to Brawl attacks"
    ],
    source: "EotE Core",
    description: "Tall, hairy humanoids known for their strength, loyalty, and fierce temper when provoked."
  },

  "Bothan": {
    characteristics: { brawn: 1, agility: 2, intellect: 2, cunning: 3, willpower: 2, presence: 2 },
    woundThreshold: 10,
    strainThreshold: 11,
    startingXP: 100,
    specialAbilities: [
      "Conviction: Once per session, may perform a Conviction maneuver to upgrade ability die to proficiency die for next check",
      "Spy Network: Begin each adventure with one useful contact"
    ],
    source: "EotE Core",
    description: "Fur-covered humanoids renowned for their espionage networks and information gathering."
  },

  // Age of Rebellion Core Species
  "Duros": {
    characteristics: { brawn: 1, agility: 2, intellect: 3, cunning: 2, willpower: 2, presence: 2 },
    woundThreshold: 9,
    strainThreshold: 12,
    startingXP: 100,
    specialAbilities: [
      "Intuitive Navigation: Remove one setback die from Astrogation checks",
      "Spaceborn: Remove setback die imposed due to zero gravity or similar conditions"
    ],
    source: "AoR Core",
    description: "Blue-skinned humanoids who were among the first species to develop hyperdrive technology."
  },

  "Mon Calamari": {
    characteristics: { brawn: 2, agility: 2, intellect: 3, cunning: 1, willpower: 2, presence: 2 },
    woundThreshold: 10,
    strainThreshold: 11,
    startingXP: 100,
    specialAbilities: [
      "Amphibious: Can breathe underwater and ignore movement penalties in water",
      "Expert Starship Designers: When building or modifying starships, reduce construction time by 25%"
    ],
    source: "AoR Core",
    description: "Amphibious humanoids known for their shipbuilding expertise and strong moral convictions."
  },

  "Sullustan": {
    characteristics: { brawn: 1, agility: 3, intellect: 2, cunning: 2, willpower: 2, presence: 2 },
    woundThreshold: 9,
    strainThreshold: 12,
    startingXP: 100,
    specialAbilities: [
      "Enhanced Senses: Remove one setback die from Perception checks",
      "Natural Pilots: Remove one setback die from Piloting checks"
    ],
    source: "AoR Core",
    description: "Underground dwellers with enhanced senses and natural piloting instincts."
  },

  // Force and Destiny Core Species
  "Cerean": {
    characteristics: { brawn: 1, agility: 2, intellect: 3, cunning: 2, willpower: 2, presence: 2 },
    woundThreshold: 9,
    strainThreshold: 12,
    startingXP: 90,
    specialAbilities: [
      "Binary Processing: May perform two maneuvers each turn instead of one",
      "Enhanced Perception: Add automatic advantage to Perception checks"
    ],
    source: "F&D Core",
    description: "Tall humanoids with enlarged craniums housing binary brains, allowing complex thinking."
  },

  "Kel Dor": {
    characteristics: { brawn: 1, agility: 2, intellect: 2, cunning: 2, willpower: 3, presence: 2 },
    woundThreshold: 10,
    strainThreshold: 11,
    startingXP: 100,
    specialAbilities: [
      "Atmospheric Requirement: Must wear specialized breathing apparatus in oxygen-rich environments",
      "Dark Vision: Remove up to two setback dice due to darkness from Perception and Vigilance checks"
    ],
    source: "F&D Core",
    description: "Humanoids requiring breathing apparatus in standard atmospheres but gifted with natural Force sensitivity."
  },

  "Nautolan": {
    characteristics: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 1, presence: 3 },
    woundThreshold: 11,
    strainThreshold: 10,
    startingXP: 100,
    specialAbilities: [
      "Amphibious: Can breathe underwater and suffer no movement penalties in water",
      "Pheromone Detection: Add boost die to all social interaction checks"
    ],
    source: "F&D Core",
    description: "Amphibious humanoids with head tentacles that can detect pheromones and emotions."
  },

  "Zabrak": {
    characteristics: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 3, presence: 1 },
    woundThreshold: 10,
    strainThreshold: 11,
    startingXP: 100,
    specialAbilities: [
      "Fearsome Countenance: Add automatic threat to Coercion checks, but remove setback die from Intimidation",
      "Mental Fortitude: Spend one Story Point to ignore effects of Critical Injuries until end of encounter"
    ],
    source: "F&D Core",
    description: "Hardy humanoids with distinctive facial tattoos and small horns, known for their mental toughness."
  },

  // Additional Core Species from various sourcebooks
  "Gand": {
    characteristics: { brawn: 2, agility: 2, intellect: 2, cunning: 3, willpower: 1, presence: 2 },
    woundThreshold: 11,
    strainThreshold: 10,
    startingXP: 100,
    specialAbilities: [
      "Ammonia Breathers: Some Gand require specialized breathing apparatus in oxygen-rich environments",
      "Natural Mystics: Begin with one free rank in Discipline and may purchase Force rating at character creation"
    ],
    source: "Various",
    description: "Insectoid humanoids from a ammonia-rich world, some of whom are naturally Force-sensitive."
  },

  "Trandoshan": {
    characteristics: { brawn: 3, agility: 1, intellect: 2, cunning: 2, willpower: 2, presence: 2 },
    woundThreshold: 12,
    strainThreshold: 9,
    startingXP: 90,
    specialAbilities: [
      "Claws: Deal +1 damage when making Brawl attacks and add boost die to Athletics checks for climbing",
      "Regeneration: Heal one additional wound per day of natural rest"
    ],
    source: "Various",
    description: "Reptilian humanoids known for their hunting prowess and natural regeneration abilities."
  },

  "Chiss": {
    characteristics: { brawn: 2, agility: 2, intellect: 3, cunning: 2, willpower: 1, presence: 2 },
    woundThreshold: 10,
    strainThreshold: 11,
    startingXP: 100,
    specialAbilities: [
      "Infrared Vision: Remove up to two setback dice due to darkness from checks",
      "Tactical Brilliance: Add boost die to Knowledge (Warfare) and Leadership checks during structured encounters"
    ],
    source: "Various",
    description: "Blue-skinned humanoids from the Unknown Regions, known for their tactical and analytical minds."
  },

  "Corellian Human": {
    characteristics: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 2 },
    woundThreshold: 10,
    strainThreshold: 10,
    startingXP: 110,
    specialAbilities: [
      "Pilot Heritage: Begin with one free rank in Piloting (Space) or Piloting (Planetary)",
      "Corellian Spirit: Add boost die to Cool and Discipline checks when facing overwhelming odds"
    ],
    source: "Suns of Fortune",
    description: "Humans from the Corellian system, famous for producing exceptional pilots and smugglers."
  },

  "Mandalorian Human": {
    characteristics: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 3, presence: 1 },
    woundThreshold: 11,
    strainThreshold: 10,
    startingXP: 100,
    specialAbilities: [
      "Warrior Culture: Begin with one free rank in a combat skill of choice",
      "Mandalorian Iron Will: Add boost die to Discipline checks and remove setback die from fear effects"
    ],
    source: "Friends Like These",
    description: "Humans raised in the warrior culture of Mandalore, trained from birth in combat and honor."
  },

  "Jawa": {
    characteristics: { brawn: 1, agility: 2, intellect: 3, cunning: 3, willpower: 1, presence: 2 },
    woundThreshold: 8,
    strainThreshold: 11,
    startingXP: 90,
    specialAbilities: [
      "Technical Aptitude: Add boost die to Mechanics checks",
      "Scavenger: Can find useful parts and components in unlikely places. Add boost die to Skulduggery when searching"
    ],
    source: "Lords of Nal Hutta",
    description: "Small desert scavengers hidden beneath brown robes, masters of technology and barter."
  },

  "Ewok": {
    characteristics: { brawn: 1, agility: 3, intellect: 2, cunning: 2, willpower: 3, presence: 1 },
    woundThreshold: 8,
    strainThreshold: 12,
    startingXP: 90,
    specialAbilities: [
      "Primitive: Cannot use certain high-tech weapons and equipment without training",
      "Forest Dweller: Remove setback dice from Survival checks in forest environments and add boost die to Stealth in natural settings"
    ],
    source: "Age of Rebellion",
    description: "Small furry humanoids living in forest tree cities, primitive but resourceful."
  },

  "Devaronian": {
    characteristics: { brawn: 2, agility: 2, intellect: 2, cunning: 3, willpower: 1, presence: 2 },
    woundThreshold: 10,
    strainThreshold: 10,
    startingXP: 100,
    specialAbilities: [
      "Natural Mystics: May begin with Force Rating 1 (if Force-sensitive career chosen)",
      "Wanderlust: Add boost die to Streetwise checks when in unfamiliar locations"
    ],
    source: "Lords of Nal Hutta",
    description: "Horned humanoids with natural wandering instincts and varying Force sensitivity."
  },

  // Additional popular species from supplemental materials
  "Ithorian": {
    characteristics: { brawn: 3, agility: 1, intellect: 2, cunning: 2, willpower: 2, presence: 2 },
    woundThreshold: 11,
    strainThreshold: 10,
    startingXP: 90,
    specialAbilities: [
      "Sonic Bellow: Once per encounter, can disorient all engaged enemies",
      "Adaptive: Begin with one rank in Knowledge (Xenology) and one rank in Survival"
    ],
    source: "Lords of Nal Hutta",
    description: "Peaceful 'Hammerhead' humanoids known for their environmental consciousness and sonic abilities."
  },

  "Droid": {
    characteristics: { brawn: 1, agility: 1, intellect: 1, cunning: 1, willpower: 1, presence: 1 },
    woundThreshold: 10,
    strainThreshold: 10,
    startingXP: 175,
    specialAbilities: [
      "Mechanical Being: Cannot be affected by biological effects, does not need to eat, sleep, or breathe",
      "Programming: Begin with specialization in specific function type",
      "Cybernetic implant cap: Can have 6 cybernetic implants without penalty"
    ],
    source: "Age of Rebellion",
    description: "Artificial beings with varying degrees of intelligence and specialization."
  },

  "Hutt": {
    characteristics: { brawn: 3, agility: 1, intellect: 3, cunning: 2, willpower: 2, presence: 1 },
    woundThreshold: 15,
    strainThreshold: 8,
    startingXP: 70,
    specialAbilities: [
      "Ponderous: Cannot perform more than one maneuver per turn",
      "Covetous: Add boost die to Negotiation checks involving material gain",
      "Mighty Lungs: Can hold breath for up to 20 minutes"
    ],
    source: "Lords of Nal Hutta",
    description: "Large gastropod-like beings known for their criminal enterprises and longevity."
  },

  "Togruta": {
    characteristics: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 2 },
    woundThreshold: 10,
    strainThreshold: 12,
    startingXP: 100,
    specialAbilities: [
      "Pack Hunters: Add boost die to melee attacks when ally is engaged with same target",
      "Echolocation: Remove setback dice imposed due to darkness or concealment"
    ],
    source: "Force and Destiny",
    description: "Humanoids with colorful head-tails and natural hunting instincts."
  },

  "Miraluka": {
    characteristics: { brawn: 1, agility: 2, intellect: 2, cunning: 2, willpower: 3, presence: 2 },
    woundThreshold: 9,
    strainThreshold: 12,
    startingXP: 100,
    specialAbilities: [
      "Force Sight: Cannot see normally but perceive through the Force, immune to sight-based effects",
      "Force Rating 1: Begin with Force Rating 1"
    ],
    source: "Force and Destiny",
    description: "Humanoids born without eyes who see through the Force, naturally Force-sensitive."
  }
};

// Career skills mapping for each species (if any)
const SPECIES_CAREER_SKILLS = {
  "Human": [], // Humans get to choose any 2 skills
  "Corellian Human": ["Piloting (Space)"], // Gets one free rank
  "Mandalorian Human": [], // Gets to choose one combat skill
  "Jawa": ["Mechanics"],
  "Ithorian": ["Knowledge (Xenology)", "Survival"],
  "Miraluka": ["Discipline"], // From Force sensitivity
  "Gand": ["Discipline"], // From natural mystic ability
  // Most other species don't get specific career skills, just special abilities
};

export { SWRPG_SPECIES_DATA, SPECIES_CAREER_SKILLS };
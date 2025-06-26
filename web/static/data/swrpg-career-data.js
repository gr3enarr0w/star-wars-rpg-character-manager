// Star Wars RPG Career Data
// Comprehensive career data extracted from Core Rulebooks and reference materials
// Format: JavaScript object ready for character creation system

const SWRPG_CAREER_DATA = {
  // EDGE OF THE EMPIRE CAREERS
  "Bounty Hunter": {
    name: "Bounty Hunter",
    gameLine: "Edge of the Empire",
    description: "Professional trackers and captors who pursue targets for credits and reputation.",
    careerSkills: ["Athletics", "Piloting (Planetary)", "Piloting (Space)", "Ranged (Heavy)", "Streetwise", "Vigilance"],
    startingWoundThreshold: 12,
    startingStrainThreshold: 12,
    specializations: [
      {
        name: "Assassin",
        description: "Masters of stealth and precise elimination",
        bonusCareerSkills: ["Melee", "Ranged (Light)", "Skulduggery", "Stealth"]
      },
      {
        name: "Gadgeteer", 
        description: "Technical experts who rely on equipment and devices",
        bonusCareerSkills: ["Brawl", "Coercion", "Mechanics", "Ranged (Light)"]
      },
      {
        name: "Survivalist",
        description: "Wilderness trackers and hunters",
        bonusCareerSkills: ["Perception", "Resilience", "Survival", "Xenology"]
      }
    ],
    source: "EotE Core"
  },

  "Colonist": {
    name: "Colonist",
    gameLine: "Edge of the Empire", 
    description: "Pioneers and settlers who build communities on the frontier.",
    careerSkills: ["Charm", "Deception", "Leadership", "Negotiation", "Streetwise", "Survival"],
    startingWoundThreshold: 10,
    startingStrainThreshold: 14,
    specializations: [
      {
        name: "Doctor",
        description: "Medical professionals and healers",
        bonusCareerSkills: ["Cool", "Education", "Medicine", "Resilience"]
      },
      {
        name: "Politico",
        description: "Politicians and social manipulators", 
        bonusCareerSkills: ["Coercion", "Core Worlds", "Deception", "Knowledge (Education)"]
      },
      {
        name: "Scholar",
        description: "Researchers and academics",
        bonusCareerSkills: ["Astrogation", "Computers", "Knowledge (Education)", "Knowledge (Lore)"]
      }
    ],
    source: "EotE Core"
  },

  "Explorer": {
    name: "Explorer",
    gameLine: "Edge of the Empire",
    description: "Scouts and pathfinders who venture into unknown regions.",
    careerSkills: ["Astrogation", "Cool", "Perception", "Piloting (Space)", "Survival", "Xenology"],
    startingWoundThreshold: 11,
    startingStrainThreshold: 13,
    specializations: [
      {
        name: "Fringer",
        description: "Border scouts and frontier guides",
        bonusCareerSkills: ["Coordination", "Negotiation", "Streetwise", "Survival"]
      },
      {
        name: "Scout",
        description: "Reconnaissance specialists and advance scouts",
        bonusCareerSkills: ["Athletics", "Medicine", "Piloting (Planetary)", "Survival"]
      },
      {
        name: "Trader",
        description: "Merchant explorers and trade route pioneers",
        bonusCareerSkills: ["Charm", "Computers", "Knowledge (Education)", "Negotiation"]
      }
    ],
    source: "EotE Core"
  },

  "Hired Gun": {
    name: "Hired Gun",
    gameLine: "Edge of the Empire",
    description: "Professional soldiers and mercenaries for hire.",
    careerSkills: ["Athletics", "Discipline", "Melee", "Ranged (Light)", "Ranged (Heavy)", "Resilience"],
    startingWoundThreshold: 13,
    startingStrainThreshold: 11,
    specializations: [
      {
        name: "Bodyguard",
        description: "Professional protectors and security specialists",
        bonusCareerSkills: ["Gunnery", "Melee", "Perception", "Vigilance"]
      },
      {
        name: "Marauder",
        description: "Shock troops and heavy assault specialists",
        bonusCareerSkills: ["Coercion", "Intimidation", "Melee", "Resilience"]
      },
      {
        name: "Mercenary Soldier",
        description: "Professional military contractors",
        bonusCareerSkills: ["Discipline", "Knowledge (Warfare)", "Leadership", "Vigilance"]
      }
    ],
    source: "EotE Core"
  },

  "Smuggler": {
    name: "Smuggler",
    gameLine: "Edge of the Empire",
    description: "Operators who transport goods and people past authorities.",
    careerSkills: ["Coordination", "Deception", "Knowledge (Underworld)", "Piloting (Space)", "Skulduggery", "Streetwise"],
    startingWoundThreshold: 11,
    startingStrainThreshold: 13,
    specializations: [
      {
        name: "Pilot",
        description: "Expert spacecraft operators and racing pilots",
        bonusCareerSkills: ["Astrogation", "Gunnery", "Piloting (Planetary)", "Piloting (Space)"]
      },
      {
        name: "Scoundrel",
        description: "Charming rogues and fast-talking con artists",
        bonusCareerSkills: ["Charm", "Cool", "Deception", "Ranged (Light)"]
      },
      {
        name: "Thief",
        description: "Professional criminals and infiltration experts",
        bonusCareerSkills: ["Computers", "Coordination", "Skulduggery", "Stealth"]
      }
    ],
    source: "EotE Core"
  },

  "Technician": {
    name: "Technician",
    gameLine: "Edge of the Empire",
    description: "Technical experts who maintain and modify equipment.",
    careerSkills: ["Astrogation", "Computers", "Coordination", "Discipline", "Knowledge (Outer Rim)", "Mechanics"],
    startingWoundThreshold: 11,
    startingStrainThreshold: 13,
    specializations: [
      {
        name: "Mechanic",
        description: "Vehicle and starship maintenance specialists",
        bonusCareerSkills: ["Brawl", "Discipline", "Mechanics", "Skulduggery"]
      },
      {
        name: "Outlaw Tech",
        description: "Illegal modification specialists and tech criminals",
        bonusCareerSkills: ["Education", "Mechanics", "Skulduggery", "Streetwise"]
      },
      {
        name: "Slicer",
        description: "Computer experts and information warfare specialists",
        bonusCareerSkills: ["Computers", "Education", "Skulduggery", "Stealth"]
      }
    ],
    source: "EotE Core"
  },

  // AGE OF REBELLION CAREERS  
  "Ace": {
    name: "Ace",
    gameLine: "Age of Rebellion",
    description: "Elite pilots who serve the Rebel Alliance with exceptional flying skills.",
    careerSkills: ["Cool", "Coordination", "Mechanics", "Piloting (Planetary)", "Piloting (Space)", "Ranged (Light)"],
    startingWoundThreshold: 11,
    startingStrainThreshold: 13,
    specializations: [
      {
        name: "Driver",
        description: "Ground vehicle specialists and racing experts",
        bonusCareerSkills: ["Cool", "Mechanics", "Piloting (Planetary)", "Vigilance"]
      },
      {
        name: "Gunner",
        description: "Vehicle weapons specialists and fire control experts",
        bonusCareerSkills: ["Discipline", "Gunnery", "Ranged (Heavy)", "Resilience"]
      },
      {
        name: "Pilot",
        description: "Starfighter pilots and spacecraft operators",
        bonusCareerSkills: ["Astrogation", "Cool", "Gunnery", "Piloting (Space)"]
      }
    ],
    source: "AoR Core"
  },

  "Commander": {
    name: "Commander", 
    gameLine: "Age of Rebellion",
    description: "Military leaders who coordinate forces and strategic operations.",
    careerSkills: ["Cool", "Discipline", "Knowledge (Core Worlds)", "Knowledge (Warfare)", "Leadership", "Vigilance"],
    startingWoundThreshold: 10,
    startingStrainThreshold: 14,
    specializations: [
      {
        name: "Commodore",
        description: "Naval commanders and fleet coordination specialists",
        bonusCareerSkills: ["Computers", "Knowledge (Core Worlds)", "Knowledge (Warfare)", "Vigilance"]
      },
      {
        name: "Squadron Leader",
        description: "Small unit commanders and tactical leaders",
        bonusCareerSkills: ["Cool", "Gunnery", "Knowledge (Warfare)", "Piloting (Space)"]
      },
      {
        name: "Tactician",
        description: "Strategic planners and battlefield coordinators",
        bonusCareerSkills: ["Computers", "Leadership", "Knowledge (Warfare)", "Vigilance"]
      }
    ],
    source: "AoR Core"
  },

  "Diplomat": {
    name: "Diplomat",
    gameLine: "Age of Rebellion", 
    description: "Negotiators and ambassadors who fight with words instead of weapons.",
    careerSkills: ["Charm", "Deception", "Knowledge (Core Worlds)", "Knowledge (Lore)", "Leadership", "Negotiation"],
    startingWoundThreshold: 10,
    startingStrainThreshold: 14,
    specializations: [
      {
        name: "Ambassador",
        description: "High-level diplomatic representatives",
        bonusCareerSkills: ["Charm", "Knowledge (Core Worlds)", "Knowledge (Lore)", "Negotiation"]
      },
      {
        name: "Agitator",
        description: "Rabble-rousers and revolutionary organizers",
        bonusCareerSkills: ["Coercion", "Deception", "Leadership", "Streetwise"]
      },
      {
        name: "Quartermaster",
        description: "Supply chain managers and resource coordinators",
        bonusCareerSkills: ["Computers", "Knowledge (Education)", "Negotiation", "Vigilance"]
      }
    ],
    source: "AoR Core"
  },

  "Engineer": {
    name: "Engineer",
    gameLine: "Age of Rebellion",
    description: "Technical specialists who maintain and improve Rebel equipment.",
    careerSkills: ["Astrogation", "Computers", "Coordination", "Discipline", "Knowledge (Education)", "Mechanics"],
    startingWoundThreshold: 11,
    startingStrainThreshold: 13,
    specializations: [
      {
        name: "Mechanic",
        description: "Vehicle and equipment maintenance specialists",
        bonusCareerSkills: ["Brawl", "Discipline", "Mechanics", "Skulduggery"]
      },
      {
        name: "Saboteur",
        description: "Demolitions experts and infrastructure disruptors",
        bonusCareerSkills: ["Computers", "Mechanics", "Skulduggery", "Stealth"]
      },
      {
        name: "Scientist",
        description: "Research specialists and technical innovators",
        bonusCareerSkills: ["Computers", "Education", "Medicine", "Knowledge (Education)"]
      }
    ],
    source: "AoR Core"
  },

  "Soldier": {
    name: "Soldier",
    gameLine: "Age of Rebellion",
    description: "Ground troops and military specialists in the Rebel Alliance.",
    careerSkills: ["Athletics", "Discipline", "Medicine", "Ranged (Heavy)", "Resilience", "Vigilance"],
    startingWoundThreshold: 12,
    startingStrainThreshold: 12,
    specializations: [
      {
        name: "Commando",
        description: "Elite special forces operators",
        bonusCareerSkills: ["Melee", "Ranged (Light)", "Stealth", "Survival"]
      },
      {
        name: "Heavy",
        description: "Heavy weapons specialists and assault troops",
        bonusCareerSkills: ["Gunnery", "Mechanics", "Ranged (Heavy)", "Resilience"]
      },
      {
        name: "Medic",
        description: "Combat medics and battlefield surgeons",
        bonusCareerSkills: ["Cool", "Knowledge (Education)", "Medicine", "Resilience"]
      }
    ],
    source: "AoR Core"
  },

  "Spy": {
    name: "Spy",
    gameLine: "Age of Rebellion",
    description: "Intelligence operatives who gather information and conduct covert operations.",
    careerSkills: ["Computers", "Deception", "Knowledge (Underworld)", "Perception", "Skulduggery", "Stealth"],
    startingWoundThreshold: 10,
    startingStrainThreshold: 14,
    specializations: [
      {
        name: "Infiltrator",
        description: "Deep cover operatives and identity specialists",
        bonusCareerSkills: ["Deception", "Knowledge (Education)", "Skulduggery", "Streetwise"]
      },
      {
        name: "Scout",
        description: "Reconnaissance specialists and intelligence gatherers",
        bonusCareerSkills: ["Athletics", "Medicine", "Piloting (Planetary)", "Survival"]
      },
      {
        name: "Slicer",
        description: "Computer infiltration and cyber warfare specialists",
        bonusCareerSkills: ["Computers", "Education", "Skulduggery", "Stealth"]
      }
    ],
    source: "AoR Core"
  },

  // FORCE AND DESTINY CAREERS
  "Consular": {
    name: "Consular",
    gameLine: "Force and Destiny",
    description: "Diplomatic Force users who seek peaceful resolutions and knowledge.",
    careerSkills: ["Cool", "Discipline", "Leadership", "Negotiation", "Knowledge (Education)", "Knowledge (Lore)"],
    startingWoundThreshold: 10,
    startingStrainThreshold: 14,
    specializations: [
      {
        name: "Healer",
        description: "Medical Force users focused on preservation of life",
        bonusCareerSkills: ["Cool", "Knowledge (Education)", "Medicine", "Resilience"]
      },
      {
        name: "Niman Disciple",
        description: "Balanced lightsaber practitioners and diplomats",
        bonusCareerSkills: ["Deception", "Knowledge (Lore)", "Leadership", "Lightsaber"]
      },
      {
        name: "Sage",
        description: "Scholars and keepers of Force knowledge",
        bonusCareerSkills: ["Astrogation", "Computers", "Knowledge (Education)", "Knowledge (Lore)"]
      }
    ],
    forceRating: 1,
    source: "F&D Core"
  },

  "Guardian": {
    name: "Guardian",
    gameLine: "Force and Destiny",
    description: "Protectors who use the Force to defend others and fight injustice.",
    careerSkills: ["Brawl", "Discipline", "Melee", "Resilience", "Vigilance", "Cool"],
    startingWoundThreshold: 13,
    startingStrainThreshold: 11,
    specializations: [
      {
        name: "Peacekeeper",
        description: "Law enforcement specialists and community protectors",
        bonusCareerSkills: ["Charm", "Knowledge (Core Worlds)", "Negotiation", "Perception"]
      },
      {
        name: "Protector",
        description: "Bodyguards and personal defense specialists",
        bonusCareerSkills: ["Coordination", "Melee", "Ranged (Light)", "Vigilance"]
      },
      {
        name: "Soresu Defender",
        description: "Defensive lightsaber specialists and guardians",
        bonusCareerSkills: ["Lightsaber", "Mechanics", "Piloting (Planetary)", "Vigilance"]
      }
    ],
    forceRating: 1,
    source: "F&D Core"
  },

  "Mystic": {
    name: "Mystic",
    gameLine: "Force and Destiny",
    description: "Spiritual Force users who explore the deeper mysteries of the Force.",
    careerSkills: ["Charm", "Coercion", "Deception", "Knowledge (Lore)", "Perception", "Vigilance"],
    startingWoundThreshold: 11,
    startingStrainThreshold: 13,
    specializations: [
      {
        name: "Advisor",
        description: "Counselors and spiritual guides for others",
        bonusCareerSkills: ["Charm", "Cool", "Knowledge (Education)", "Negotiation"]
      },
      {
        name: "Makashi Duelist",
        description: "Elegant lightsaber combat specialists",
        bonusCareerSkills: ["Charm", "Coordination", "Lightsaber", "Ranged (Light)"]
      },
      {
        name: "Seer",
        description: "Prophets and vision interpreters",
        bonusCareerSkills: ["Astrogation", "Discipline", "Knowledge (Lore)", "Vigilance"]
      }
    ],
    forceRating: 1,
    source: "F&D Core"
  },

  "Seeker": {
    name: "Seeker",
    gameLine: "Force and Destiny",
    description: "Wandering Force users who explore the galaxy seeking knowledge and purpose.",
    careerSkills: ["Knowledge (Xenology)", "Medicine", "Perception", "Piloting (Planetary)", "Stealth", "Survival"],
    startingWoundThreshold: 11,
    startingStrainThreshold: 13,
    specializations: [
      {
        name: "Ataru Striker",
        description: "Aggressive lightsaber combat specialists",
        bonusCareerSkills: ["Athletics", "Coordination", "Lightsaber", "Stealth"]
      },
      {
        name: "Hunter",
        description: "Trackers and bounty hunters with Force abilities",
        bonusCareerSkills: ["Athletics", "Perception", "Ranged (Heavy)", "Vigilance"]
      },
      {
        name: "Pathfinder",
        description: "Scouts and wilderness guides",
        bonusCareerSkills: ["Astrogation", "Cool", "Knowledge (Education)", "Survival"]
      }
    ],
    forceRating: 1,
    source: "F&D Core"
  },

  "Sentinel": {
    name: "Sentinel",
    gameLine: "Force and Destiny",
    description: "Covert Force users who work from the shadows to fight injustice.",
    careerSkills: ["Computers", "Deception", "Knowledge (Underworld)", "Skulduggery", "Stealth", "Streetwise"],
    startingWoundThreshold: 11,
    startingStrainThreshold: 13,
    specializations: [
      {
        name: "Artisan",
        description: "Creators and builders who craft with the Force",
        bonusCareerSkills: ["Computers", "Mechanics", "Knowledge (Education)", "Vigilance"]
      },
      {
        name: "Shadow",
        description: "Covert operatives and Force-sensitive spies",
        bonusCareerSkills: ["Coordination", "Deception", "Skulduggery", "Stealth"]
      },
      {
        name: "Shien Expert",
        description: "Defensive lightsaber specialists against ranged attacks",
        bonusCareerSkills: ["Lightsaber", "Ranged (Light)", "Skulduggery", "Vigilance"]
      }
    ],
    forceRating: 1,
    source: "F&D Core"
  },

  "Warrior": {
    name: "Warrior",
    gameLine: "Force and Destiny",
    description: "Combat-focused Force users who excel at physical confrontation.",
    careerSkills: ["Athletics", "Brawl", "Melee", "Ranged (Light)", "Resilience", "Survival"],
    startingWoundThreshold: 12,
    startingStrainThreshold: 12,
    specializations: [
      {
        name: "Aggressor",
        description: "Intimidating combatants who use fear as a weapon",
        bonusCareerSkills: ["Coercion", "Melee", "Ranged (Heavy)", "Vigilance"]
      },
      {
        name: "Shii-Cho Knight",
        description: "Traditional lightsaber practitioners",
        bonusCareerSkills: ["Lightsaber", "Melee", "Negotiation", "Resilience"]
      },
      {
        name: "Starfighter Ace",
        description: "Force-enhanced pilots and space combat specialists",
        bonusCareerSkills: ["Astrogation", "Cool", "Gunnery", "Piloting (Space)"]
      }
    ],
    forceRating: 1,
    source: "F&D Core"
  }
};

// Game line organization
const GAME_LINES = {
  "Edge of the Empire": {
    description: "Life on the Outer Rim, smuggling, bounty hunting, and surviving on the fringe",
    careers: ["Bounty Hunter", "Colonist", "Explorer", "Hired Gun", "Smuggler", "Technician"],
    theme: "Criminal underworld and frontier life"
  },
  "Age of Rebellion": {
    description: "The Galactic Civil War, Rebel Alliance vs. Empire",
    careers: ["Ace", "Commander", "Diplomat", "Engineer", "Soldier", "Spy"],
    theme: "Military conflict and rebellion"
  },
  "Force and Destiny": {
    description: "Force-sensitive individuals in the dark times after Order 66",
    careers: ["Consular", "Guardian", "Mystic", "Seeker", "Sentinel", "Warrior"],
    theme: "Force powers and lightsaber combat"
  }
};

// Universal career skills (available to all careers)
const UNIVERSAL_SKILLS = [
  "Astrogation",
  "Athletics", 
  "Charm",
  "Coercion",
  "Computers",
  "Cool",
  "Coordination",
  "Deception", 
  "Discipline",
  "Leadership",
  "Mechanics",
  "Medicine",
  "Negotiation",
  "Perception",
  "Piloting (Planetary)",
  "Piloting (Space)",
  "Ranged (Light)",
  "Ranged (Heavy)",
  "Resilience",
  "Skulduggery",
  "Stealth",
  "Streetwise",
  "Survival",
  "Vigilance",
  "Brawl",
  "Melee",
  "Gunnery",
  "Knowledge (Core Worlds)",
  "Knowledge (Education)",
  "Knowledge (Lore)",
  "Knowledge (Outer Rim)",
  "Knowledge (Underworld)",
  "Knowledge (Warfare)",
  "Knowledge (Xenology)",
  "Lightsaber"
];

export { SWRPG_CAREER_DATA, GAME_LINES, UNIVERSAL_SKILLS };
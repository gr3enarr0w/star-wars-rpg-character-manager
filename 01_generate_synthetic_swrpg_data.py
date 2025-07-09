#!/usr/bin/env python3
"""
SWRPG Synthetic Data Generation Script
=====================================

Uses large LLM (Claude/GPT-4) to generate comprehensive synthetic training data
from the perspective of players and game masters covering all SWRPG scenarios.

Pipeline Step 1 of 3:
1. → Generate synthetic data (this script)
2. → Vectorize synthetic data 
3. → Train small specialized LLM

Data Sources:
- FFG Wiki vector database
- Complete SWRPG database  
- Book extractions

Output: Thousands of Q&A pairs covering every SWRPG scenario
"""

import json
import asyncio
import aiohttp
import random
import requests
import time
from pathlib import Path
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass
import logging
import os

@dataclass
class SyntheticExample:
    """Single synthetic training example"""
    scenario_type: str
    perspective: str  # "player" or "gm"
    input_text: str
    output_text: str
    difficulty: str  # "beginner", "intermediate", "expert"
    game_mechanics: List[str]
    source_data: Dict[str, Any]

class SWRPGSyntheticDataGenerator:
    def __init__(self):
        self.base_path = Path("/Users/ceverson/Development/star-wars-rpg-character-manager")
        
        # Load all SWRPG data sources
        self.vector_db_path = self.base_path / "swrpg_extracted_data" / "json" / "comprehensive_species_data_v2.json"
        self.complete_db_path = self.base_path / "swrpg_extracted_data" / "FIXED_COMPREHENSIVE_SWRPG_DATABASE.json"
        self.books_path = self.base_path / "swrpg_complete_extraction"
        
        # Output path for synthetic data
        self.output_path = self.base_path / "synthetic_swrpg_training_data"
        self.output_path.mkdir(exist_ok=True)
        
        # OpenRouter API configuration
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        self.model = "meta-llama/llama-3.2-90b-vision-instruct"
        
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable is required")
        
        # Scenario categories to cover
        self.scenario_types = [
            "character_creation", "character_advancement", "combat_mechanics",
            "skill_checks", "force_powers", "equipment_selection", "vehicle_combat",
            "talent_trees", "campaign_planning", "npc_creation", "encounter_design",
            "rules_interpretation", "dice_mechanics", "social_encounters",
            "exploration", "crafting", "species_lore", "career_guidance"
        ]
        
        # Load data sources
        self.game_data = self.load_all_swrpg_data()
        
        # Initialize logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
    def load_all_swrpg_data(self) -> Dict[str, Any]:
        """Load all available SWRPG data sources"""
        self.logger.info("Loading all SWRPG data sources...")
        
        data = {
            "vector_db": {},
            "complete_db": {},
            "species": {},
            "careers": {},
            "talents": {},
            "equipment": {},
            "force_powers": {},
            "vehicles": {}
        }
        
        try:
            # Load vector database
            if self.vector_db_path.exists():
                with open(self.vector_db_path, 'r') as f:
                    data["vector_db"] = json.load(f)
                    
            # Load complete database
            if self.complete_db_path.exists():
                with open(self.complete_db_path, 'r') as f:
                    data["complete_db"] = json.load(f)
                    
            # Extract specific categories
            if "game_data" in data["complete_db"]:
                game_data = data["complete_db"]["game_data"]
                data["species"] = game_data.get("species", {})
                data["careers"] = game_data.get("careers", {})
                data["talents"] = game_data.get("talents", {})
                data["equipment"] = game_data.get("equipment", {})
                data["force_powers"] = game_data.get("force_powers", {})
                data["vehicles"] = game_data.get("vehicles", {})
                
            self.logger.info(f"Loaded data: {len(data['species'])} species, {len(data['careers'])} careers, {len(data['talents'])} talents")
            
        except Exception as e:
            self.logger.error(f"Error loading SWRPG data: {e}")
            
        return data
        
    def call_openrouter_api(self, prompt: str, max_tokens: int = 1500) -> str:
        """Call OpenRouter API with Llama 3.2 90B Vision"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert Star Wars RPG (Fantasy Flight Games) assistant. Generate high-quality, accurate Q&A pairs for training data. Focus on game mechanics, character creation, combat, Force powers, and all aspects of SWRPG. Provide detailed, helpful responses that would be valuable for both players and game masters."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            "max_tokens": max_tokens,
            "temperature": 0.7,
            "stream": False
        }
        
        try:
            response = requests.post(f"{self.base_url}/chat/completions", headers=headers, json=data)
            response.raise_for_status()
            
            result = response.json()
            return result["choices"][0]["message"]["content"]
            
        except Exception as e:
            self.logger.error(f"OpenRouter API call failed: {e}")
            return ""
            
    def generate_character_creation_examples(self, count: int = 100) -> List[SyntheticExample]:
        """Generate character creation training examples"""
        examples = []
        
        # Get species and careers
        species_list = list(self.game_data["species"].keys())
        careers_list = list(self.game_data["careers"].keys())
        
        for i in range(count):
            # Random species and career
            species = random.choice(species_list)
            career = random.choice(careers_list)
            
            species_data = self.game_data["species"][species]
            career_data = self.game_data["careers"][career]
            
            # Generate via OpenRouter API
            prompt = f"""Generate a detailed Q&A pair for SWRPG character creation:

Species: {species}
Career: {career}

Species Data: {json.dumps(species_data, indent=2)}
Career Data: {json.dumps(career_data, indent=2)}

Create a question from a player's perspective asking about creating this character combination, and provide a comprehensive answer covering:
- Starting characteristics
- Derived attributes (wound/strain thresholds, starting XP)
- Special abilities
- Career details
- How the species and career work together

Format as:
Q: [Player question]
A: [Detailed answer]"""

            try:
                response = self.call_openrouter_api(prompt)
                
                # Parse Q&A from response
                if "Q:" in response and "A:" in response:
                    parts = response.split("A:", 1)
                    if len(parts) == 2:
                        question = parts[0].replace("Q:", "").strip()
                        answer = parts[1].strip()
                        
                        examples.append(SyntheticExample(
                            scenario_type="character_creation",
                            perspective="player",
                            input_text=question,
                            output_text=answer,
                            difficulty="beginner",
                            game_mechanics=["characteristics", "species_abilities", "career_skills"],
                            source_data={"species": species_data, "career": career_data}
                        ))
                        
                        self.logger.info(f"Generated character creation example {i+1}/{count}")
                        
                # Rate limiting
                time.sleep(0.5)
                        
            except Exception as e:
                self.logger.error(f"Error generating character creation example {i+1}: {e}")
                continue
            
        return examples
        
    def generate_combat_examples(self, count: int = 100) -> List[SyntheticExample]:
        """Generate combat mechanics training examples"""
        examples = []
        
        equipment_list = list(self.game_data["equipment"].keys())
        
        for i in range(count):
            weapon = random.choice(equipment_list)
            weapon_data = self.game_data["equipment"][weapon]
            
            # GM perspective example
            gm_input = f"A player wants to attack with a {weapon}. How do I resolve this combat?"
            
            gm_output = f"""Combat Resolution for {weapon}:

**Weapon Stats:**
- Damage: {weapon_data.get('damage', 'Unknown')}
- Critical: {weapon_data.get('critical', 'Unknown')}
- Range: {weapon_data.get('range', 'Unknown')}
- Special Qualities: {', '.join(weapon_data.get('qualities', []))}

**Combat Steps:**
1. **Dice Pool:** Player rolls [Characteristic + Skill] dice
2. **Difficulty:** Set by range and circumstances
3. **Success:** If successful, deal {weapon_data.get('damage', 'weapon damage')} + uncanceled Success symbols
4. **Critical:** On Triumph or if Advantages ≥ Critical rating ({weapon_data.get('critical', 'weapon crit')})
5. **Special:** Apply weapon qualities as relevant

**Range Modifiers:**
- Engaged: No modifier
- Short: 1 Difficulty die
- Medium: 2 Difficulty dice  
- Long: 3 Difficulty dice
- Extreme: 4 Difficulty dice"""

            examples.append(SyntheticExample(
                scenario_type="combat_mechanics",
                perspective="gm",
                input_text=gm_input,
                output_text=gm_output,
                difficulty="intermediate",
                game_mechanics=["combat", "dice_pools", "weapon_stats"],
                source_data={"weapon": weapon_data}
            ))
            
        return examples
        
    def generate_force_power_examples(self, count: int = 50) -> List[SyntheticExample]:
        """Generate Force power training examples"""
        examples = []
        
        force_powers = list(self.game_data["force_powers"].keys())
        
        for i in range(count):
            power = random.choice(force_powers)
            power_data = self.game_data["force_powers"][power]
            
            # Player perspective
            player_input = f"How do I use the {power} Force power? What can it do?"
            
            player_output = f"""Using {power} Force Power:

**Base Power:** {power_data.get('description', f'{power} Force power')}

**Activation:**
- Force Rating: Minimum {power_data.get('force_rating', 1)}
- Difficulty: Varies by effect
- Force Dice: Roll Force dice equal to Force Rating

**Basic Effect:**
{power_data.get('base_power', f'Basic {power} effect')}

**Common Upgrades:**
- Range: Extend power's reach
- Magnitude: Affect multiple targets/objects
- Duration: Extend how long power lasts
- Strength: Increase power's intensity

**Tips:**
- Use Light Side pips when possible
- Dark Side pips cause Strain equal to pips used
- Conflict may result from Dark Side usage
- Higher Force Rating = more reliable activation"""

            examples.append(SyntheticExample(
                scenario_type="force_powers",
                perspective="player", 
                input_text=player_input,
                output_text=player_output,
                difficulty="intermediate",
                game_mechanics=["force_powers", "force_dice", "light_dark_side"],
                source_data={"force_power": power_data}
            ))
            
        return examples
        
    def generate_skill_check_examples(self, count: int = 75) -> List[SyntheticExample]:
        """Generate skill check training examples"""
        examples = []
        
        skills = [
            "Astrogation", "Athletics", "Brawl", "Charm", "Coercion", "Computers",
            "Cool", "Coordination", "Deception", "Discipline", "Gunnery", "Leadership",
            "Mechanics", "Medicine", "Negotiation", "Perception", "Pilot (Planetary)",
            "Pilot (Space)", "Ranged (Heavy)", "Ranged (Light)", "Resilience",
            "Skulduggery", "Stealth", "Streetwise", "Survival", "Vigilance"
        ]
        
        difficulties = {
            "Simple": "No dice needed - automatic success",
            "Easy": "1 Difficulty die (Purple)",
            "Average": "2 Difficulty dice (Purple)", 
            "Hard": "3 Difficulty dice (Purple)",
            "Daunting": "4 Difficulty dice (Purple)",
            "Formidable": "5 Difficulty dice (Purple)"
        }
        
        for i in range(count):
            skill = random.choice(skills)
            difficulty = random.choice(list(difficulties.keys()))
            
            # GM perspective
            gm_input = f"What difficulty should I set for a {skill} check in this situation?"
            
            gm_output = f"""Setting {skill} Check Difficulty:

**Recommended Difficulty: {difficulty}**
{difficulties[difficulty]}

**Factors to Consider:**
- **Environmental:** Lighting, terrain, weather conditions
- **Time Pressure:** Rush jobs increase difficulty
- **Equipment:** Proper tools reduce difficulty
- **Circumstances:** Distractions, injuries, stress

**{skill} Specific Modifiers:**
- **Advantage Uses:** Extra info, faster completion, style points
- **Threat Uses:** Complications, time loss, minor setbacks  
- **Triumph Uses:** Critical success, major breakthrough
- **Despair Uses:** Equipment damage, major complications

**Upgrading Difficulty:**
- Add Challenge dice (Red) for dangerous/opposed situations
- Environmental hazards, active opposition, or critical stakes

**Remember:** Difficulty represents the task itself, not the character's ability."""

            examples.append(SyntheticExample(
                scenario_type="skill_checks",
                perspective="gm",
                input_text=gm_input,
                output_text=gm_output,
                difficulty="beginner",
                game_mechanics=["skill_checks", "difficulty_dice", "narrative_dice"],
                source_data={"skill": skill, "difficulty": difficulty}
            ))
            
        return examples
        
    def generate_all_synthetic_data(self) -> List[SyntheticExample]:
        """Generate comprehensive synthetic training data"""
        self.logger.info("Generating comprehensive synthetic SWRPG training data...")
        
        all_examples = []
        
        # Generate different types of examples
        all_examples.extend(self.generate_character_creation_examples(150))
        all_examples.extend(self.generate_combat_examples(100))
        all_examples.extend(self.generate_force_power_examples(75))
        all_examples.extend(self.generate_skill_check_examples(100))
        
        # Shuffle for variety
        random.shuffle(all_examples)
        
        self.logger.info(f"Generated {len(all_examples)} synthetic training examples")
        return all_examples
        
    def save_synthetic_data(self, examples: List[SyntheticExample]):
        """Save synthetic data in training formats"""
        self.logger.info("Saving synthetic training data...")
        
        # Alpaca format for instruction tuning
        alpaca_data = []
        for example in examples:
            alpaca_data.append({
                "instruction": example.input_text,
                "output": example.output_text,
                "metadata": {
                    "scenario_type": example.scenario_type,
                    "perspective": example.perspective,
                    "difficulty": example.difficulty,
                    "game_mechanics": example.game_mechanics
                }
            })
            
        # Save Alpaca format
        alpaca_path = self.output_path / "swrpg_synthetic_alpaca.json"
        with open(alpaca_path, 'w', encoding='utf-8') as f:
            json.dump(alpaca_data, f, indent=2, ensure_ascii=False)
            
        # ChatML format for conversation training
        chatml_data = []
        for example in examples:
            chatml_data.append({
                "messages": [
                    {"role": "user", "content": example.input_text},
                    {"role": "assistant", "content": example.output_text}
                ],
                "metadata": {
                    "scenario_type": example.scenario_type,
                    "perspective": example.perspective,
                    "difficulty": example.difficulty,
                    "game_mechanics": example.game_mechanics
                }
            })
            
        # Save ChatML format
        chatml_path = self.output_path / "swrpg_synthetic_chatml.json"
        with open(chatml_path, 'w', encoding='utf-8') as f:
            json.dump(chatml_data, f, indent=2, ensure_ascii=False)
            
        # Statistics
        stats = {
            "total_examples": len(examples),
            "by_scenario": {},
            "by_perspective": {},
            "by_difficulty": {}
        }
        
        for example in examples:
            stats["by_scenario"][example.scenario_type] = stats["by_scenario"].get(example.scenario_type, 0) + 1
            stats["by_perspective"][example.perspective] = stats["by_perspective"].get(example.perspective, 0) + 1
            stats["by_difficulty"][example.difficulty] = stats["by_difficulty"].get(example.difficulty, 0) + 1
            
        stats_path = self.output_path / "synthetic_data_statistics.json"
        with open(stats_path, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=2, ensure_ascii=False)
            
        self.logger.info(f"Saved {len(examples)} examples to {self.output_path}")
        self.logger.info(f"Formats: Alpaca ({alpaca_path}) and ChatML ({chatml_path})")
        
        return {
            "alpaca_path": alpaca_path,
            "chatml_path": chatml_path,
            "stats_path": stats_path,
            "total_examples": len(examples)
        }
        
    def run_generation(self):
        """Run complete synthetic data generation"""
        self.logger.info("🚀 STARTING SWRPG SYNTHETIC DATA GENERATION")
        self.logger.info("=" * 60)
        self.logger.info("🤖 Model: Llama 3.2 90B Vision via OpenRouter")
        self.logger.info("💰 Cost: ~$0.06 per million tokens")
        self.logger.info("📊 Sources: Vector DB + Complete DB + FFG Wiki extractions")
        self.logger.info("🎯 Target: Comprehensive Q&A covering all SWRPG scenarios")
        self.logger.info("👥 Perspectives: Player + GM viewpoints")
        print()
        
        try:
            # Generate all synthetic examples
            examples = self.generate_all_synthetic_data()
            
            # Save in training formats
            results = self.save_synthetic_data(examples)
            
            self.logger.info("\n🎯 SYNTHETIC DATA GENERATION COMPLETE!")
            self.logger.info("=" * 60)
            self.logger.info(f"📁 Output Directory: {self.output_path}")
            self.logger.info(f"📊 Total Examples: {results['total_examples']}")
            self.logger.info(f"🎯 Alpaca Format: {results['alpaca_path']}")
            self.logger.info(f"💬 ChatML Format: {results['chatml_path']}")
            self.logger.info("✅ Ready for Step 2: Vectorization")
            
            return results
            
        except Exception as e:
            self.logger.error(f"❌ Generation failed: {e}")
            raise

if __name__ == "__main__":
    generator = SWRPGSyntheticDataGenerator()
    generator.run_generation()
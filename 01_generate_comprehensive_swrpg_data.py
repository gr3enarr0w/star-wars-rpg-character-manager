#!/usr/bin/env python3
"""
COMPREHENSIVE SWRPG Synthetic Data Generation Script
===================================================

Generates massive synthetic training dataset covering ALL perspectives:
- Rules mechanics (Player + GM)
- Creative applications (Character + Storytelling + World building)
- Experience levels (New + Experienced players)
- Narrative integration (Lore + Adventure hooks + Improvisation)
- Character concepts (Archetypes + Multi-class + Progression)

Target: 75,000-100,000 Q&A pairs for under $10 using Llama 3.2 90B Vision
"""

import json
import requests
import time
import random
from pathlib import Path
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass
import logging
import os
from itertools import combinations

@dataclass
class ComprehensiveExample:
    """Single comprehensive training example with full metadata"""
    scenario_type: str
    perspective: str
    experience_level: str
    creative_aspect: str
    input_text: str
    output_text: str
    difficulty: str
    game_mechanics: List[str]
    source_data: Dict[str, Any]
    cost_tokens: int = 0

class ComprehensiveSWRPGDataGenerator:
    def __init__(self):
        self.base_path = Path("/Users/ceverson/Development/star-wars-rpg-character-manager")
        
        # Data sources
        self.vector_db_path = self.base_path / "swrpg_extracted_data" / "json" / "comprehensive_species_data_v2.json"
        self.complete_db_path = self.base_path / "swrpg_extracted_data" / "FIXED_COMPREHENSIVE_SWRPG_DATABASE.json"
        
        # Output path
        self.output_path = self.base_path / "comprehensive_swrpg_training_data"
        self.output_path.mkdir(exist_ok=True)
        
        # OpenRouter API configuration
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        self.model = "meta-llama/llama-3.2-90b-vision-instruct"
        
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable is required")
            
        # ALL PERSPECTIVES for comprehensive coverage
        self.all_perspectives = {
            # Core Rules-Based
            "player_mechanics": "How do I use this mechanically as a player?",
            "gm_adjudication": "How do I resolve this as a GM?",
            
            # Creative Applications
            "character_development": "How do I build compelling characters with this?",
            "storytelling": "How do I create dramatic scenes using this?",
            "world_building": "How do I integrate this into my campaign world?",
            "adventure_design": "How do I create encounters around this?",
            "roleplay_guidance": "How do I embody this character concept?",
            "atmosphere": "How do I make this feel authentically Star Wars?",
            
            # Experience Levels
            "new_player": "I'm new to SWRPG, how do I understand this?",
            "experienced_player": "What are advanced tactics/uses for this?",
            
            # Narrative Integration
            "lore_integration": "How does this fit Star Wars canon and lore?",
            "adventure_hooks": "How can I use this to create adventure hooks?",
            "improvisation": "What if players use this creatively/unexpectedly?",
            "campaign_management": "How do I manage this long-term in campaigns?",
            
            # Character Concepts
            "archetype_building": "How do I make specific character archetypes with this?",
            "multiclass_synergy": "How does this work with other careers/specs?",
            "progression_planning": "How do I advance my character using this?"
        }
        
        # Comprehensive scenario types
        self.scenario_types = [
            "character_creation", "character_advancement", "combat_mechanics",
            "skill_checks", "force_powers", "equipment_usage", "vehicle_combat",
            "talent_trees", "campaign_planning", "npc_creation", "encounter_design",
            "rules_interpretation", "dice_mechanics", "social_encounters",
            "exploration", "crafting", "species_lore", "career_guidance",
            "storytelling", "world_building", "adventure_design", "roleplay",
            "atmosphere", "lore_integration", "problem_solving", "improvisation"
        ]
        
        # Load data
        self.game_data = self.load_all_swrpg_data()
        
        # Statistics tracking
        self.stats = {
            "total_generated": 0,
            "total_cost": 0.0,
            "by_perspective": {},
            "by_scenario": {},
            "by_experience": {}
        }
        
        # Initialize logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
    def load_all_swrpg_data(self) -> Dict[str, Any]:
        """Load all SWRPG data from current extraction"""
        self.logger.info("Loading comprehensive SWRPG data...")
        
        data = {
            "species": {},
            "careers": {},
            "talents": {},
            "equipment": {},
            "force_powers": {},
            "vehicles": {}
        }
        
        try:
            # Load from comprehensive database
            if self.complete_db_path.exists():
                with open(self.complete_db_path, 'r') as f:
                    complete_data = json.load(f)
                    
                if "game_data" in complete_data:
                    game_data = complete_data["game_data"]
                    for key in data.keys():
                        data[key] = game_data.get(key, {})
                        
            # Load additional data from FFG Wiki files
            ffg_wiki_path = self.base_path / "swrpg_extracted_data" / "ffg_wiki"
            
            for category in data.keys():
                category_path = ffg_wiki_path / category
                if category_path.exists():
                    for file_path in category_path.glob("*.json"):
                        try:
                            with open(file_path, 'r') as f:
                                item_data = json.load(f)
                                if "name" in item_data:
                                    data[category][item_data["name"]] = item_data
                        except Exception as e:
                            continue
                            
            total_items = sum(len(category) for category in data.values())
            self.logger.info(f"Loaded {total_items} total SWRPG items")
            
            for category, items in data.items():
                self.logger.info(f"  {category}: {len(items)} items")
                
        except Exception as e:
            self.logger.error(f"Error loading SWRPG data: {e}")
            
        return data
        
    def call_openrouter_api(self, prompt: str, max_tokens: int = 2000) -> Tuple[str, int]:
        """Call OpenRouter API and return response + token count"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert Star Wars RPG (Fantasy Flight Games) assistant. Generate high-quality, detailed Q&A pairs for comprehensive training data. Cover all aspects: rules mechanics, creative applications, storytelling, character development, world building, and campaign management. Provide authentic Star Wars atmosphere and expert guidance for both players and GMs."
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
            content = result["choices"][0]["message"]["content"]
            
            # Estimate token usage (rough calculation)
            prompt_tokens = len(prompt.split()) * 1.3  # Rough token estimation
            completion_tokens = len(content.split()) * 1.3
            total_tokens = prompt_tokens + completion_tokens
            
            return content, int(total_tokens)
            
        except Exception as e:
            self.logger.error(f"OpenRouter API call failed: {e}")
            return "", 0
            
    def generate_comprehensive_examples(self, item_name: str, item_data: Dict[str, Any], 
                                      category: str, max_examples: int = 17) -> List[ComprehensiveExample]:
        """Generate comprehensive examples for a single item across all perspectives"""
        examples = []
        
        # Select perspectives for this item (rotate through all)
        perspectives = list(self.all_perspectives.keys())
        random.shuffle(perspectives)
        selected_perspectives = perspectives[:max_examples]
        
        for perspective in selected_perspectives:
            try:
                # Create comprehensive prompt
                prompt = self.create_comprehensive_prompt(
                    item_name, item_data, category, perspective
                )
                
                # Generate via API
                response, token_count = self.call_openrouter_api(prompt)
                
                if response and "Q:" in response and "A:" in response:
                    # Parse Q&A
                    parts = response.split("A:", 1)
                    if len(parts) == 2:
                        question = parts[0].replace("Q:", "").strip()
                        answer = parts[1].strip()
                        
                        # Determine attributes
                        creative_aspect = self.get_creative_aspect(perspective)
                        experience_level = self.get_experience_level(perspective)
                        scenario_type = self.get_scenario_type(category, perspective)
                        difficulty = self.get_difficulty_level(perspective)
                        
                        example = ComprehensiveExample(
                            scenario_type=scenario_type,
                            perspective=perspective,
                            experience_level=experience_level,
                            creative_aspect=creative_aspect,
                            input_text=question,
                            output_text=answer,
                            difficulty=difficulty,
                            game_mechanics=self.extract_game_mechanics(category, perspective),
                            source_data={category: item_data},
                            cost_tokens=token_count
                        )
                        
                        examples.append(example)
                        
                        # Update statistics
                        self.stats["total_generated"] += 1
                        self.stats["total_cost"] += (token_count / 1_000_000) * 0.06
                        self.stats["by_perspective"][perspective] = self.stats["by_perspective"].get(perspective, 0) + 1
                        self.stats["by_scenario"][scenario_type] = self.stats["by_scenario"].get(scenario_type, 0) + 1
                        self.stats["by_experience"][experience_level] = self.stats["by_experience"].get(experience_level, 0) + 1
                        
                        if len(examples) % 5 == 0:
                            self.logger.info(f"Generated {len(examples)} examples for {item_name}")
                            
                # Rate limiting
                time.sleep(0.3)
                
            except Exception as e:
                self.logger.error(f"Error generating example for {item_name} ({perspective}): {e}")
                continue
                
        return examples
        
    def create_comprehensive_prompt(self, item_name: str, item_data: Dict[str, Any], 
                                  category: str, perspective: str) -> str:
        """Create comprehensive prompt for specific perspective"""
        
        base_context = f"""
SWRPG {category.title()}: {item_name}
Data: {json.dumps(item_data, indent=2)}

Perspective: {self.all_perspectives[perspective]}
"""
        
        # Add perspective-specific guidance
        if "creative" in perspective or "story" in perspective or "roleplay" in perspective:
            base_context += """
Focus on narrative, creativity, and storytelling applications. Include:
- Character development opportunities
- Dramatic story potential
- Atmosphere and Star Wars authenticity
- Creative problem-solving applications
"""
        elif "mechanics" in perspective or "adjudication" in perspective:
            base_context += """
Focus on game mechanics, rules, and technical applications. Include:
- Exact mechanical effects
- Rules interactions
- Tactical considerations
- Technical clarifications
"""
        elif "new_player" in perspective:
            base_context += """
Focus on clear, beginner-friendly explanations. Include:
- Simple explanations of concepts
- Step-by-step guidance
- Common mistakes to avoid
- Basic applications
"""
        elif "experienced" in perspective:
            base_context += """
Focus on advanced applications and tactics. Include:
- Advanced strategies
- Complex interactions
- Expert tips and tricks
- Optimization considerations
"""
        
        prompt = base_context + f"""
Generate a detailed Q&A pair from this perspective. The question should be natural and specific to this perspective. The answer should be comprehensive, helpful, and authentic to Star Wars RPG.

Format as:
Q: [Natural question from this perspective]
A: [Comprehensive, detailed answer]"""
        
        return prompt
        
    def get_creative_aspect(self, perspective: str) -> str:
        """Determine creative aspect from perspective"""
        if "character" in perspective:
            return "character_development"
        elif "story" in perspective or "narrative" in perspective:
            return "storytelling"
        elif "world" in perspective or "campaign" in perspective:
            return "world_building"
        elif "adventure" in perspective:
            return "adventure_design"
        elif "roleplay" in perspective:
            return "roleplay"
        else:
            return "mechanical"
            
    def get_experience_level(self, perspective: str) -> str:
        """Determine experience level from perspective"""
        if "new" in perspective:
            return "beginner"
        elif "experienced" in perspective:
            return "expert"
        else:
            return "intermediate"
            
    def get_scenario_type(self, category: str, perspective: str) -> str:
        """Determine scenario type from category and perspective"""
        if category == "species":
            return "character_creation"
        elif category == "careers":
            return "career_guidance"
        elif category == "talents":
            return "talent_trees"
        elif category == "equipment":
            return "equipment_usage"
        elif category == "force_powers":
            return "force_powers"
        elif category == "vehicles":
            return "vehicle_combat"
        else:
            return "rules_interpretation"
            
    def get_difficulty_level(self, perspective: str) -> str:
        """Determine difficulty level from perspective"""
        if "new" in perspective:
            return "beginner"
        elif "experienced" in perspective or "advanced" in perspective:
            return "expert"
        else:
            return "intermediate"
            
    def extract_game_mechanics(self, category: str, perspective: str) -> List[str]:
        """Extract relevant game mechanics"""
        base_mechanics = [category]
        
        if "character" in perspective:
            base_mechanics.extend(["character_creation", "advancement"])
        if "combat" in perspective:
            base_mechanics.extend(["combat", "dice_pools"])
        if "story" in perspective:
            base_mechanics.extend(["narrative", "roleplay"])
        if "campaign" in perspective:
            base_mechanics.extend(["campaign_management", "adventure_design"])
            
        return base_mechanics
        
    def generate_all_comprehensive_data(self) -> List[ComprehensiveExample]:
        """Generate comprehensive training data for all items"""
        all_examples = []
        
        self.logger.info("Starting comprehensive SWRPG data generation...")
        
        for category, items in self.game_data.items():
            if not items:
                continue
                
            self.logger.info(f"Processing {category}: {len(items)} items")
            
            for item_name, item_data in items.items():
                # Generate comprehensive examples for this item
                examples = self.generate_comprehensive_examples(
                    item_name, item_data, category, max_examples=17
                )
                
                all_examples.extend(examples)
                
                # Progress logging
                if len(all_examples) % 100 == 0:
                    self.logger.info(f"Total examples generated: {len(all_examples)}")
                    self.logger.info(f"Estimated cost so far: ${self.stats['total_cost']:.2f}")
                    
        return all_examples
        
    def save_comprehensive_data(self, examples: List[ComprehensiveExample]):
        """Save comprehensive training data"""
        self.logger.info("Saving comprehensive training data...")
        
        # Convert to training formats
        alpaca_data = []
        chatml_data = []
        
        for example in examples:
            # Alpaca format
            alpaca_data.append({
                "instruction": example.input_text,
                "output": example.output_text,
                "input": "",
                "metadata": {
                    "scenario_type": example.scenario_type,
                    "perspective": example.perspective,
                    "experience_level": example.experience_level,
                    "creative_aspect": example.creative_aspect,
                    "difficulty": example.difficulty,
                    "game_mechanics": example.game_mechanics,
                    "cost_tokens": example.cost_tokens
                }
            })
            
            # ChatML format
            chatml_data.append({
                "messages": [
                    {"role": "user", "content": example.input_text},
                    {"role": "assistant", "content": example.output_text}
                ],
                "metadata": {
                    "scenario_type": example.scenario_type,
                    "perspective": example.perspective,
                    "experience_level": example.experience_level,
                    "creative_aspect": example.creative_aspect,
                    "difficulty": example.difficulty,
                    "game_mechanics": example.game_mechanics,
                    "cost_tokens": example.cost_tokens
                }
            })
            
        # Save files
        alpaca_path = self.output_path / "comprehensive_swrpg_alpaca.json"
        chatml_path = self.output_path / "comprehensive_swrpg_chatml.json"
        
        with open(alpaca_path, 'w', encoding='utf-8') as f:
            json.dump(alpaca_data, f, indent=2, ensure_ascii=False)
            
        with open(chatml_path, 'w', encoding='utf-8') as f:
            json.dump(chatml_data, f, indent=2, ensure_ascii=False)
            
        # Save statistics
        stats_path = self.output_path / "comprehensive_statistics.json"
        with open(stats_path, 'w', encoding='utf-8') as f:
            json.dump(self.stats, f, indent=2, ensure_ascii=False)
            
        return {
            "alpaca_path": alpaca_path,
            "chatml_path": chatml_path,
            "stats_path": stats_path,
            "total_examples": len(examples),
            "total_cost": self.stats["total_cost"]
        }
        
    def run_comprehensive_generation(self):
        """Run complete comprehensive generation"""
        self.logger.info("🚀 COMPREHENSIVE SWRPG SYNTHETIC DATA GENERATION")
        self.logger.info("=" * 70)
        self.logger.info("🤖 Model: Llama 3.2 90B Vision via OpenRouter")
        self.logger.info("💰 Cost: ~$0.06 per million tokens")
        self.logger.info("🎯 Target: 75,000-100,000 Q&A pairs")
        self.logger.info("🎭 Perspectives: 17 comprehensive perspectives")
        self.logger.info("📊 Expected Cost: $6-10 total")
        print()
        
        try:
            # Generate comprehensive examples
            examples = self.generate_all_comprehensive_data()
            
            # Save data
            results = self.save_comprehensive_data(examples)
            
            self.logger.info("\n🎯 COMPREHENSIVE GENERATION COMPLETE!")
            self.logger.info("=" * 70)
            self.logger.info(f"📁 Output Directory: {self.output_path}")
            self.logger.info(f"📊 Total Examples: {results['total_examples']}")
            self.logger.info(f"💰 Total Cost: ${results['total_cost']:.2f}")
            self.logger.info(f"🎯 Alpaca Format: {results['alpaca_path']}")
            self.logger.info(f"💬 ChatML Format: {results['chatml_path']}")
            self.logger.info(f"📈 Statistics: {results['stats_path']}")
            
            # Show perspective breakdown
            self.logger.info("\n📊 PERSPECTIVE BREAKDOWN:")
            for perspective, count in sorted(self.stats["by_perspective"].items()):
                self.logger.info(f"  {perspective}: {count} examples")
                
            self.logger.info("\n✅ Ready for vectorization and training!")
            
            return results
            
        except Exception as e:
            self.logger.error(f"❌ Generation failed: {e}")
            raise

if __name__ == "__main__":
    generator = ComprehensiveSWRPGDataGenerator()
    generator.run_comprehensive_generation()
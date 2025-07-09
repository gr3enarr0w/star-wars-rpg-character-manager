#!/usr/bin/env python3
"""
SWRPG Synthetic Data Vectorization Script
=========================================

Creates embeddings vector database from synthetic training data for LLM training.

Pipeline Step 2 of 3:
1. → Generate synthetic data ✅
2. → Vectorize synthetic data (this script)
3. → Train small specialized LLM

Input: Synthetic Q&A data from Script 1 (Alpaca/ChatML format)
Output: Searchable vector database with metadata for training
"""

import json
import numpy as np
import faiss
from pathlib import Path
from typing import Dict, List, Any, Tuple
from sentence_transformers import SentenceTransformer
import pickle
import logging
from dataclasses import dataclass, asdict

@dataclass
class VectorizedExample:
    """Single vectorized training example with embeddings"""
    id: str
    question_embedding: np.ndarray
    answer_embedding: np.ndarray
    question_text: str
    answer_text: str
    scenario_type: str
    perspective: str
    difficulty: str
    game_mechanics: List[str]
    
class SWRPGSyntheticVectorizer:
    def __init__(self):
        self.base_path = Path("/Users/ceverson/Development/star-wars-rpg-character-manager")
        
        # Input paths
        self.synthetic_data_path = self.base_path / "synthetic_swrpg_training_data"
        self.original_vector_path = self.base_path / "swrpg_extracted_data" / "json" / "comprehensive_species_data_v2.json"
        
        # Output paths
        self.vector_output_path = self.base_path / "swrpg_vector_databases"
        self.vector_output_path.mkdir(exist_ok=True)
        
        # Embedding model - fast and good quality
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.embedding_dim = 384  # all-MiniLM-L6-v2 dimension
        
        # Vector stores
        self.question_index = None
        self.answer_index = None
        self.metadata_store = []
        
        # Initialize logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
    def load_synthetic_data(self) -> List[Dict[str, Any]]:
        """Load synthetic training data from Script 1"""
        self.logger.info("Loading synthetic training data...")
        
        # Try both Alpaca and ChatML formats
        alpaca_path = self.synthetic_data_path / "swrpg_synthetic_alpaca.json"
        chatml_path = self.synthetic_data_path / "swrpg_synthetic_chatml.json"
        
        synthetic_data = []
        
        if alpaca_path.exists():
            with open(alpaca_path, 'r', encoding='utf-8') as f:
                alpaca_data = json.load(f)
                
            for item in alpaca_data:
                synthetic_data.append({
                    "question": item["instruction"],
                    "answer": item["output"],
                    "metadata": item.get("metadata", {})
                })
                
        elif chatml_path.exists():
            with open(chatml_path, 'r', encoding='utf-8') as f:
                chatml_data = json.load(f)
                
            for item in chatml_data:
                messages = item["messages"]
                question = messages[0]["content"] if len(messages) > 0 else ""
                answer = messages[1]["content"] if len(messages) > 1 else ""
                
                synthetic_data.append({
                    "question": question,
                    "answer": answer,
                    "metadata": item.get("metadata", {})
                })
                
        self.logger.info(f"Loaded {len(synthetic_data)} synthetic examples")
        return synthetic_data
        
    def load_original_vector_data(self) -> List[Dict[str, Any]]:
        """Load original FFG Wiki vector database"""
        self.logger.info("Loading original FFG Wiki vector data...")
        
        try:
            with open(self.original_vector_path, 'r', encoding='utf-8') as f:
                original_data = json.load(f)
                
            # Convert to Q&A format for consistency
            vector_data = []
            
            # Extract species data as Q&A pairs
            for species_name, species_info in original_data.get("species", {}).items():
                # Question about species characteristics
                question = f"What are the characteristics and abilities of {species_name}?"
                
                # Answer with species details
                characteristics = species_info.get("characteristics", {})
                abilities = species_info.get("special_abilities", [])
                
                answer = f"""{species_name} Species Information:

**Characteristics:**
- Brawn: {characteristics.get('brawn', 'Unknown')}
- Agility: {characteristics.get('agility', 'Unknown')}
- Intellect: {characteristics.get('intellect', 'Unknown')}
- Cunning: {characteristics.get('cunning', 'Unknown')}
- Willpower: {characteristics.get('willpower', 'Unknown')}
- Presence: {characteristics.get('presence', 'Unknown')}

**Starting XP:** {species_info.get('starting_xp', 'Unknown')}
**Wound Threshold:** {species_info.get('wound_threshold', 'Unknown')}
**Strain Threshold:** {species_info.get('strain_threshold', 'Unknown')}

**Special Abilities:**
{chr(10).join(abilities) if abilities else 'None listed'}"""

                vector_data.append({
                    "question": question,
                    "answer": answer,
                    "metadata": {
                        "scenario_type": "species_information",
                        "perspective": "reference",
                        "difficulty": "beginner",
                        "game_mechanics": ["species", "characteristics"],
                        "source": "original_vector_db"
                    }
                })
                
            self.logger.info(f"Converted {len(vector_data)} original examples to Q&A format")
            return vector_data
            
        except Exception as e:
            self.logger.error(f"Error loading original vector data: {e}")
            return []
            
    def create_embeddings(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """Create embeddings for text list"""
        self.logger.info(f"Creating embeddings for {len(texts)} texts...")
        
        # Process in batches for memory efficiency
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            batch_embeddings = self.embedding_model.encode(
                batch, 
                convert_to_numpy=True,
                show_progress_bar=True if i == 0 else False
            )
            all_embeddings.append(batch_embeddings)
            
        embeddings = np.vstack(all_embeddings)
        self.logger.info(f"Created embeddings shape: {embeddings.shape}")
        return embeddings
        
    def build_vector_databases(self, combined_data: List[Dict[str, Any]]):
        """Build FAISS vector databases for questions and answers"""
        self.logger.info("Building vector databases...")
        
        # Extract texts
        questions = [item["question"] for item in combined_data]
        answers = [item["answer"] for item in combined_data]
        
        # Create embeddings
        question_embeddings = self.create_embeddings(questions)
        answer_embeddings = self.create_embeddings(answers)
        
        # Build FAISS indexes
        self.question_index = faiss.IndexFlatIP(self.embedding_dim)  # Inner product for cosine similarity
        self.answer_index = faiss.IndexFlatIP(self.embedding_dim)
        
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(question_embeddings)
        faiss.normalize_L2(answer_embeddings)
        
        # Add to indexes
        self.question_index.add(question_embeddings.astype(np.float32))
        self.answer_index.add(answer_embeddings.astype(np.float32))
        
        # Store metadata
        for i, item in enumerate(combined_data):
            self.metadata_store.append({
                "id": i,
                "question": item["question"],
                "answer": item["answer"],
                "scenario_type": item["metadata"].get("scenario_type", "unknown"),
                "perspective": item["metadata"].get("perspective", "unknown"),
                "difficulty": item["metadata"].get("difficulty", "unknown"),
                "game_mechanics": item["metadata"].get("game_mechanics", []),
                "source": item["metadata"].get("source", "synthetic")
            })
            
        self.logger.info(f"Built vector databases with {self.question_index.ntotal} entries")
        
    def save_vector_databases(self):
        """Save vector databases and metadata to disk"""
        self.logger.info("Saving vector databases...")
        
        # Save FAISS indexes
        question_index_path = self.vector_output_path / "swrpg_questions.faiss"
        answer_index_path = self.vector_output_path / "swrpg_answers.faiss"
        
        faiss.write_index(self.question_index, str(question_index_path))
        faiss.write_index(self.answer_index, str(answer_index_path))
        
        # Save metadata
        metadata_path = self.vector_output_path / "swrpg_metadata.json"
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(self.metadata_store, f, indent=2, ensure_ascii=False)
            
        # Save configuration
        config = {
            "embedding_model": "all-MiniLM-L6-v2",
            "embedding_dim": self.embedding_dim,
            "total_examples": len(self.metadata_store),
            "indexes": {
                "questions": str(question_index_path),
                "answers": str(answer_index_path),
                "metadata": str(metadata_path)
            }
        }
        
        config_path = self.vector_output_path / "vector_db_config.json"
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
            
        return {
            "question_index": question_index_path,
            "answer_index": answer_index_path,
            "metadata": metadata_path,
            "config": config_path,
            "total_examples": len(self.metadata_store)
        }
        
    def create_training_ready_dataset(self, combined_data: List[Dict[str, Any]]):
        """Create training-ready dataset for LLM fine-tuning"""
        self.logger.info("Creating training-ready dataset...")
        
        # Format for instruction tuning
        training_data = []
        
        for item in combined_data:
            training_example = {
                "instruction": item["question"],
                "output": item["answer"],
                "input": "",  # Empty for simple instruction following
                "metadata": item["metadata"]
            }
            training_data.append(training_example)
            
        # Save training dataset
        training_path = self.vector_output_path / "swrpg_training_dataset.json"
        with open(training_path, 'w', encoding='utf-8') as f:
            json.dump(training_data, f, indent=2, ensure_ascii=False)
            
        # Create train/validation split
        split_idx = int(len(training_data) * 0.9)
        train_data = training_data[:split_idx]
        val_data = training_data[split_idx:]
        
        train_path = self.vector_output_path / "swrpg_train.json"
        val_path = self.vector_output_path / "swrpg_val.json"
        
        with open(train_path, 'w', encoding='utf-8') as f:
            json.dump(train_data, f, indent=2, ensure_ascii=False)
            
        with open(val_path, 'w', encoding='utf-8') as f:
            json.dump(val_data, f, indent=2, ensure_ascii=False)
            
        return {
            "full_dataset": training_path,
            "train_dataset": train_path,
            "val_dataset": val_path,
            "train_size": len(train_data),
            "val_size": len(val_data)
        }
        
    def run_vectorization(self):
        """Run complete vectorization pipeline"""
        self.logger.info("🚀 STARTING SWRPG SYNTHETIC DATA VECTORIZATION")
        self.logger.info("=" * 60)
        self.logger.info("📊 Processing: Synthetic data + Original vector database")
        self.logger.info("🎯 Output: Vector databases + Training datasets")
        print()
        
        try:
            # Load all data
            synthetic_data = self.load_synthetic_data()
            original_data = self.load_original_vector_data()
            
            # Combine datasets
            combined_data = synthetic_data + original_data
            self.logger.info(f"Combined dataset size: {len(combined_data)} examples")
            
            # Build vector databases
            self.build_vector_databases(combined_data)
            
            # Save vector databases
            vector_results = self.save_vector_databases()
            
            # Create training datasets
            training_results = self.create_training_ready_dataset(combined_data)
            
            # Statistics
            stats = {
                "total_examples": len(combined_data),
                "synthetic_examples": len(synthetic_data),
                "original_examples": len(original_data),
                "by_scenario": {},
                "by_perspective": {},
                "by_difficulty": {}
            }
            
            for item in combined_data:
                metadata = item["metadata"]
                scenario = metadata.get("scenario_type", "unknown")
                perspective = metadata.get("perspective", "unknown")
                difficulty = metadata.get("difficulty", "unknown")
                
                stats["by_scenario"][scenario] = stats["by_scenario"].get(scenario, 0) + 1
                stats["by_perspective"][perspective] = stats["by_perspective"].get(perspective, 0) + 1
                stats["by_difficulty"][difficulty] = stats["by_difficulty"].get(difficulty, 0) + 1
                
            stats_path = self.vector_output_path / "vectorization_statistics.json"
            with open(stats_path, 'w', encoding='utf-8') as f:
                json.dump(stats, f, indent=2, ensure_ascii=False)
                
            self.logger.info("\n🎯 VECTORIZATION COMPLETE!")
            self.logger.info("=" * 60)
            self.logger.info(f"📁 Output Directory: {self.vector_output_path}")
            self.logger.info(f"📊 Total Examples: {vector_results['total_examples']}")
            self.logger.info(f"🔍 Question Index: {vector_results['question_index']}")
            self.logger.info(f"💬 Answer Index: {vector_results['answer_index']}")
            self.logger.info(f"🎯 Training Dataset: {training_results['full_dataset']}")
            self.logger.info(f"📚 Train/Val Split: {training_results['train_size']}/{training_results['val_size']}")
            self.logger.info("✅ Ready for Step 3: LLM Training")
            
            return {
                "vector_databases": vector_results,
                "training_datasets": training_results,
                "statistics": stats_path,
                "total_examples": len(combined_data)
            }
            
        except Exception as e:
            self.logger.error(f"❌ Vectorization failed: {e}")
            raise

if __name__ == "__main__":
    vectorizer = SWRPGSyntheticVectorizer()
    vectorizer.run_vectorization()
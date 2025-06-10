"""Flask web application for Star Wars RPG Character Manager."""

import json
import os
import sys
from flask import Flask, render_template, request, jsonify, session
from datetime import datetime

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from swrpg_character_manager.character_creator import CharacterCreator
from swrpg_character_manager.advancement import AdvancementManager
from swrpg_character_manager.character_sheet import CharacterSheetDisplay
from swrpg_character_manager.persistence import CharacterDatabase
from swrpg_character_manager.models import Character, Characteristic

app = Flask(__name__)
app.secret_key = 'swrpg_character_manager_secret_key_change_in_production'

# Initialize character management components
creator = CharacterCreator()
advancement = AdvancementManager()
display = CharacterSheetDisplay()
database = CharacterDatabase(data_dir='character_data')


@app.route('/')
def index():
    """Main application page."""
    return render_template('index.html')


@app.route('/api/characters', methods=['GET'])
def get_characters():
    """Get all characters."""
    try:
        character_names = database.list_characters()
        characters = []
        
        for name in character_names:
            character = database.load_character(name)
            if character:
                characters.append({
                    'id': character.name,  # Using name as ID for now
                    'name': character.name,
                    'playerName': character.player_name,
                    'species': character.species,
                    'career': character.career.name,
                    'totalXP': character.total_xp,
                    'availableXP': character.available_xp,
                    'level': calculate_level(character),
                    'woundThreshold': character.wound_threshold,
                    'strainThreshold': character.strain_threshold,
                    'characteristics': {
                        'brawn': character.brawn,
                        'agility': character.agility,
                        'intellect': character.intellect,
                        'cunning': character.cunning,
                        'willpower': character.willpower,
                        'presence': character.presence
                    }
                })
        
        return jsonify({'characters': characters})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/characters', methods=['POST'])
def create_character():
    """Create a new character."""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'playerName', 'species', 'career']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if character name already exists
        existing_names = database.list_characters()
        if data['name'] in existing_names:
            return jsonify({'error': 'Character name already exists'}), 400
        
        # Create character using the character creator
        character = creator.create_character(
            name=data['name'],
            player_name=data['playerName'],
            species=data['species'],
            career_name=data['career']
        )
        
        # Add optional background
        if data.get('background'):
            character.background = data['background']
        
        # Save character
        if database.save_character(character):
            return jsonify({
                'message': 'Character created successfully',
                'character': {
                    'id': character.name,
                    'name': character.name,
                    'playerName': character.player_name,
                    'species': character.species,
                    'career': character.career.name,
                    'totalXP': character.total_xp,
                    'availableXP': character.available_xp
                }
            })
        else:
            return jsonify({'error': 'Failed to save character'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/characters/<character_name>', methods=['GET'])
def get_character(character_name):
    """Get a specific character with full details."""
    try:
        character = database.load_character(character_name)
        if not character:
            return jsonify({'error': 'Character not found'}), 404
        
        # Get advancement options
        advancement_options = advancement.get_advancement_options(character)
        
        # Prepare skills data
        skills_by_characteristic = {}
        for skill_name, skill in character.skills.items():
            char_name = skill.characteristic.value
            if char_name not in skills_by_characteristic:
                skills_by_characteristic[char_name] = []
            
            skills_by_characteristic[char_name].append({
                'name': skill.name,
                'ranks': skill.ranks,
                'career': skill.career_skill,
                'dicePool': calculate_dice_pool(character, skill),
                'canAdvance': skill.ranks < 5,
                'advancementCost': advancement.calculate_skill_cost(character, skill_name)
            })
        
        character_data = {
            'id': character.name,
            'name': character.name,
            'playerName': character.player_name,
            'species': character.species,
            'career': character.career.name,
            'background': character.background,
            'totalXP': character.total_xp,
            'availableXP': character.available_xp,
            'spentXP': character.spent_xp,
            'woundThreshold': character.wound_threshold,
            'strainThreshold': character.strain_threshold,
            'characteristics': {
                'brawn': character.brawn,
                'agility': character.agility,
                'intellect': character.intellect,
                'cunning': character.cunning,
                'willpower': character.willpower,
                'presence': character.presence
            },
            'skills': skills_by_characteristic,
            'talents': [
                {
                    'name': talent.name,
                    'description': talent.description,
                    'activation': talent.activation,
                    'ranked': talent.ranked,
                    'currentRank': talent.current_rank
                }
                for talent in character.talents
            ],
            'advancementOptions': advancement_options
        }
        
        return jsonify({'character': character_data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/characters/<character_name>/award-xp', methods=['POST'])
def award_xp(character_name):
    """Award experience points to a character."""
    try:
        data = request.json
        amount = data.get('amount', 0)
        reason = data.get('reason', '')
        
        if amount <= 0:
            return jsonify({'error': 'XP amount must be positive'}), 400
        
        character = database.load_character(character_name)
        if not character:
            return jsonify({'error': 'Character not found'}), 404
        
        # Award XP
        advancement.award_xp(character, amount, reason)
        
        # Save character
        if database.save_character(character):
            return jsonify({
                'message': f'Awarded {amount} XP to {character.name}',
                'totalXP': character.total_xp,
                'availableXP': character.available_xp
            })
        else:
            return jsonify({'error': 'Failed to save character'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/characters/<character_name>/advance-skill', methods=['POST'])
def advance_skill(character_name):
    """Advance a character's skill."""
    try:
        data = request.json
        skill_name = data.get('skill')
        
        if not skill_name:
            return jsonify({'error': 'Skill name is required'}), 400
        
        character = database.load_character(character_name)
        if not character:
            return jsonify({'error': 'Character not found'}), 404
        
        # Advance skill
        success = advancement.advance_skill(character, skill_name)
        
        if success:
            # Save character
            if database.save_character(character):
                skill = character.skills[skill_name]
                return jsonify({
                    'message': f'Advanced {skill_name} to rank {skill.ranks}',
                    'newRank': skill.ranks,
                    'availableXP': character.available_xp
                })
            else:
                return jsonify({'error': 'Failed to save character'}), 500
        else:
            return jsonify({'error': 'Cannot advance skill (insufficient XP or max rank)'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/characters/<character_name>/advance-characteristic', methods=['POST'])
def advance_characteristic(character_name):
    """Advance a character's characteristic."""
    try:
        data = request.json
        char_name = data.get('characteristic')
        
        if not char_name:
            return jsonify({'error': 'Characteristic name is required'}), 400
        
        # Convert string to Characteristic enum
        try:
            characteristic = Characteristic(char_name)
        except ValueError:
            return jsonify({'error': 'Invalid characteristic name'}), 400
        
        character = database.load_character(character_name)
        if not character:
            return jsonify({'error': 'Character not found'}), 404
        
        # Advance characteristic
        success = advancement.advance_characteristic(character, characteristic)
        
        if success:
            # Save character
            if database.save_character(character):
                new_value = getattr(character, characteristic.value.lower())
                return jsonify({
                    'message': f'Advanced {characteristic.value} to {new_value}',
                    'newValue': new_value,
                    'availableXP': character.available_xp
                })
            else:
                return jsonify({'error': 'Failed to save character'}), 500
        else:
            return jsonify({'error': 'Cannot advance characteristic (insufficient XP or max value)'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/characters/<character_name>/reduce-characteristic', methods=['POST'])
def reduce_characteristic(character_name):
    """Reduce a character's characteristic and refund XP."""
    try:
        character = database.load_character(character_name)
        if not character:
            return jsonify({'error': 'Character not found'}), 404
        
        data = request.get_json()
        characteristic_name = data.get('characteristic')
        
        if not characteristic_name:
            return jsonify({'error': 'Characteristic name is required'}), 400
        
        # Find the characteristic
        char_attr = characteristic_name.lower()
        current_value = getattr(character, char_attr, 2)
        
        if current_value <= 1:
            return jsonify({'error': f'Cannot reduce {characteristic_name} below 1'}), 400
        
        # Calculate refund (this is the cost to get to current level)
        costs = {2: 30, 3: 40, 4: 50, 5: 60, 6: 70}
        refund = costs.get(current_value, 0)
        
        # Reduce characteristic and refund XP
        setattr(character, char_attr, current_value - 1)
        character.available_xp += refund
        
        if database.save_character(character):
            return jsonify({
                'message': f'Reduced {characteristic_name} to {current_value - 1}, refunded {refund} XP',
                'character': {
                    'id': character.name,
                    'availableXP': character.available_xp,
                    char_attr: current_value - 1
                }
            })
        else:
            return jsonify({'error': 'Failed to save character'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/characters/<character_name>/reduce-skill', methods=['POST'])
def reduce_skill(character_name):
    """Reduce a character's skill rank and refund XP."""
    try:
        character = database.load_character(character_name)
        if not character:
            return jsonify({'error': 'Character not found'}), 404
        
        data = request.get_json()
        skill_name = data.get('skill')
        
        if not skill_name:
            return jsonify({'error': 'Skill name is required'}), 400
        
        if skill_name not in character.skills:
            return jsonify({'error': f'Skill {skill_name} not found'}), 404
        
        skill = character.skills[skill_name]
        
        if skill.ranks <= 0:
            return jsonify({'error': f'Cannot reduce {skill_name} below 0'}), 400
        
        # Calculate refund
        current_rank = skill.ranks
        base_cost = current_rank * 5
        refund = base_cost if skill.career_skill else base_cost + 5
        
        # Reduce skill and refund XP
        skill.ranks -= 1
        character.available_xp += refund
        
        if database.save_character(character):
            return jsonify({
                'message': f'Reduced {skill_name} to rank {skill.ranks}, refunded {refund} XP',
                'character': {
                    'id': character.name,
                    'availableXP': character.available_xp,
                    'skills': {skill_name: {'ranks': skill.ranks}}
                }
            })
        else:
            return jsonify({'error': 'Failed to save character'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/characters/<character_name>', methods=['PUT'])
def update_character(character_name):
    """Update a character."""
    try:
        # Load existing character
        character = database.load_character(character_name)
        if not character:
            return jsonify({'error': 'Character not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update character fields
        old_name = character.name
        if 'name' in data and data['name']:
            character.name = data['name']
        if 'playerName' in data:
            character.player_name = data['playerName']
        if 'species' in data and data['species']:
            character.species = data['species']
        if 'career' in data and data['career']:
            # Find career by name
            career_name = data['career']
            for career in creator.careers:
                if career.name == career_name:
                    character.career = career
                    break
        if 'background' in data:
            character.background = data['background']
        
        # If name changed, delete old file and save with new name
        if old_name != character.name:
            database.delete_character(old_name)
        
        if database.save_character(character):
            return jsonify({
                'message': 'Character updated successfully',
                'character': {
                    'id': character.name,
                    'name': character.name,
                    'playerName': character.player_name,
                    'species': character.species,
                    'career': character.career.name,
                    'totalXP': character.total_xp,
                    'availableXP': character.available_xp
                }
            })
        else:
            return jsonify({'error': 'Failed to save character'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/characters/<character_name>', methods=['DELETE'])
def delete_character(character_name):
    """Delete a character."""
    try:
        success = database.delete_character(character_name)
        
        if success:
            return jsonify({'message': f'Character {character_name} deleted successfully'})
        else:
            return jsonify({'error': 'Character not found or could not be deleted'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/game-data', methods=['GET'])
def get_game_data():
    """Get available species, careers, and other game data."""
    try:
        return jsonify({
            'species': creator.get_available_species(),
            'careers': {
                'all': creator.get_available_careers(),
                'edge_of_empire': creator.get_available_careers(creator.careers['Bounty Hunter'].game_line),
                'age_of_rebellion': creator.get_available_careers(creator.careers['Ace'].game_line),
                'force_and_destiny': creator.get_available_careers(creator.careers['Guardian'].game_line)
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def calculate_level(character):
    """Calculate character level based on spent XP."""
    spent_xp = character.spent_xp
    return max(1, spent_xp // 25 + 1)


def calculate_dice_pool(character, skill):
    """Calculate dice pool string for a skill."""
    char_name = skill.characteristic.value.lower()
    char_value = getattr(character, char_name)
    skill_ranks = skill.ranks
    
    if skill_ranks == 0:
        return f"{char_value}A"
    else:
        ability = max(0, char_value - skill_ranks)
        proficiency = min(char_value, skill_ranks)
        
        pool_parts = []
        if ability > 0:
            pool_parts.append(f"{ability}A")
        if proficiency > 0:
            pool_parts.append(f"{proficiency}P")
        
        return "+".join(pool_parts) if pool_parts else "0"


if __name__ == '__main__':
    # Create character data directory if it doesn't exist
    os.makedirs('character_data', exist_ok=True)
    
    # Run the Flask app
    app.run(debug=True, host='127.0.0.1', port=8000)
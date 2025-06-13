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
    return render_template('index_with_auth.html')


@app.route('/create-character')
def create_character_page():
    """Character creation wizard page."""
    return render_template('create_character_wizard.html')


@app.route('/campaigns')
def campaigns_page():
    """Campaigns management page."""
    return render_template('campaigns.html')


@app.route('/admin')
def admin_page():
    """Admin management page."""
    return render_template('admin.html')


@app.route('/profile')
def profile_page():
    """User profile page."""
    return render_template('profile.html')


@app.route('/documentation')
def documentation_page():
    """Documentation page."""
    return render_template('documentation.html')


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
        
        # Get species info to calculate starting characteristics
        species_info = creator.get_species_info(data['species'])
        if not species_info:
            return jsonify({'error': f'Unknown species: {data["species"]}'}), 400
        
        # Calculate final characteristics (species base + any additional points)
        final_characteristics = species_info['characteristics'].copy()
        if data.get('characteristics'):
            for char, value in data['characteristics'].items():
                if char in final_characteristics:
                    final_characteristics[char] = value
        
        # Create character with custom characteristics
        character = creator.create_character(
            name=data['name'],
            player_name=data['playerName'],
            species=data['species'],
            career_name=data['career'],
            characteristic_points={}  # Will be set directly below
        )
        
        # Set final characteristics
        character.brawn = final_characteristics.get('brawn', 2)
        character.agility = final_characteristics.get('agility', 2)
        character.intellect = final_characteristics.get('intellect', 2)
        character.cunning = final_characteristics.get('cunning', 2)
        character.willpower = final_characteristics.get('willpower', 2)
        character.presence = final_characteristics.get('presence', 2)
        
        # Apply custom skills if provided
        if data.get('skills'):
            for skill_name, ranks in data['skills'].items():
                if skill_name in character.skills and ranks > 0:
                    character.skills[skill_name].ranks = ranks
        
        # Calculate remaining XP based on characteristic and skill investments
        spent_xp = 0
        
        # Calculate XP spent on characteristics (above species base)
        for char, final_value in final_characteristics.items():
            base_value = species_info['characteristics'][char]
            for level in range(base_value + 1, final_value + 1):
                spent_xp += advancement.calculate_characteristic_cost(character, Characteristic(char.upper()))
        
        # Calculate XP spent on skills
        if data.get('skills'):
            for skill_name, ranks in data['skills'].items():
                if ranks > 0:
                    for rank in range(1, ranks + 1):
                        spent_xp += advancement.calculate_skill_cost(character, skill_name)
        
        # Set available XP
        character.available_xp = character.total_xp - spent_xp
        character.spent_xp = spent_xp
        
        # Add optional fields
        if data.get('background'):
            character.background = data['background']
        if data.get('obligation'):
            # Store obligation in character notes for now
            character.background += f"\n\nObligation/Duty: {data['obligation']}"
        if data.get('notes'):
            character.background += f"\n\nNotes: {data['notes']}"
        
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
        # Get detailed species information
        species_list = []
        for species_name in creator.get_available_species():
            species_info = creator.get_species_info(species_name)
            if species_info:
                species_list.append({
                    'name': species_name,
                    'characteristics': species_info['characteristics'],
                    'wound_threshold': species_info['wound_threshold'],
                    'strain_threshold': species_info['strain_threshold'],
                    'starting_xp': species_info['starting_xp'],
                    'special_abilities': species_info['special_abilities']
                })
        
        # Get detailed career information
        careers_list = []
        for career_name in creator.get_available_careers():
            career_info = creator.get_career_info(career_name)
            if career_info:
                careers_list.append({
                    'name': career_info.name,
                    'game_line': career_info.game_line.value,
                    'career_skills': career_info.career_skills,
                    'starting_wound_threshold': career_info.starting_wound_threshold,
                    'starting_strain_threshold': career_info.starting_strain_threshold
                })

        return jsonify({
            'species': species_list,
            'careers': {
                'all': careers_list,
                'edge_of_empire': [c for c in careers_list if c['game_line'] == 'Edge of the Empire'],
                'age_of_rebellion': [c for c in careers_list if c['game_line'] == 'Age of Rebellion'],
                'force_and_destiny': [c for c in careers_list if c['game_line'] == 'Force and Destiny']
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
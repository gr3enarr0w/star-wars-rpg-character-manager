"""Flask web application for Star Wars RPG Character Manager."""

import json
import os
import sys
from flask import Flask, render_template, request, jsonify, session, redirect
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
def create_character_start():
    """Start character creation - redirect to step 1."""
    return redirect('/create-character/basics')


@app.route('/create-character/basics')
def create_character_basics():
    """Character creation step 1: Basic information."""
    return render_template('character_creation/step1_basics.html')


@app.route('/create-character/species')
def create_character_species():
    """Character creation step 2: Species selection."""
    return render_template('character_creation/step2_species.html')


@app.route('/create-character/career')
def create_character_career():
    """Character creation step 3: Career selection."""
    return render_template('character_creation/step3_career.html')


@app.route('/create-character/characteristics')
def create_character_characteristics():
    """Character creation step 4: Characteristics assignment."""
    return render_template('character_creation/step4_characteristics.html')


@app.route('/create-character/skills')
def create_character_skills():
    """Character creation step 5: Skills selection."""
    return render_template('character_creation/step5_skills.html')


@app.route('/create-character/talents')
def create_character_talents():
    """Character creation step 6: Starting talents."""
    return render_template('character_creation/step6_talents.html')


@app.route('/create-character/review')
def create_character_review():
    """Character creation step 7: Review and finalize."""
    return render_template('character_creation/step7_review.html')


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
    """User profile settings page - load main app with profile modal."""
    return render_template('index_with_auth.html')


@app.route('/documentation')
def documentation_page():
    """Documentation page."""
    return render_template('documentation.html')


@app.route('/login')
def login_page():
    """Login page."""
    return render_template('login.html')


@app.route('/register')
def register_page():
    """Registration page."""
    return render_template('register.html')


@app.route('/api/auth/login', methods=['POST'])
def api_login():
    """Simple API login for testing."""
    data = request.json
    email = data.get('email', '')
    password = data.get('password', '')
    
    # For demo purposes, accept any login with email and password
    if email and password:
        # Check for admin credentials
        if email == 'admin@swrpg.local' and password == 'admin123':
            return jsonify({
                'access_token': 'admin_token',
                'user': {
                    'id': 'admin',
                    'username': 'admin',
                    'email': email,
                    'role': 'admin'
                }
            })
        else:
            return jsonify({
                'access_token': 'demo_token_12345',
                'user': {
                    'id': '1',
                    'username': email.split('@')[0] if '@' in email else 'demo_user',  # Use email prefix as username
                    'email': email,
                    'role': 'user'
                }
            })
    else:
        return jsonify({'error': 'Email and password are required'}), 400


@app.route('/api/auth/register', methods=['POST'])
def api_register():
    """Simple API registration for testing."""
    data = request.json
    # For demo purposes, accept any registration
    return jsonify({
        'message': 'Registration successful',
        'access_token': 'demo_token_12345',
        'user': {
            'id': '1',
            'username': data.get('username', 'demo_user'),
            'email': data.get('email', 'demo@example.com'),
            'role': 'user'
        }
    })


@app.route('/api/auth/me', methods=['GET'])
def api_me():
    """Get current user info - for demo, return stored user data."""
    # In a real app, this would verify the JWT token
    # For demo, we'll just return a valid user if any token is present
    auth_header = request.headers.get('Authorization', '')
    if 'Bearer ' in auth_header:
        # Extract token from "Bearer <token>" format
        token = auth_header.replace('Bearer ', '')
        if token:  # Any valid token works for demo
            # For testing, if token contains 'admin' or matches admin login, return admin user
            if 'admin' in token.lower() or token == 'admin_token':
                return jsonify({
                    'id': 'admin',
                    'username': 'admin',
                    'email': 'admin@example.com',
                    'role': 'admin'
                })
            else:
                return jsonify({
                    'id': '1',
                    'username': 'demo_user',
                    'email': 'test@example.com',
                    'role': 'user'
                })
    
    return jsonify({'error': 'No valid token provided'}), 401


@app.route('/api/debug/create-admin', methods=['POST'])
def create_admin_debug():
    """Create admin user for testing - simplified version."""
    try:
        # For the simple auth system, just return success
        # In a real implementation, this would create a user in the database
        return jsonify({
            'message': 'Admin user created successfully',
            'username': 'admin',
            'role': 'admin'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


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
                try:
                    # Map characteristic name to enum
                    char_enum = getattr(Characteristic, char.upper())
                    spent_xp += advancement.calculate_characteristic_cost(character, char_enum)
                except (ValueError, AttributeError):
                    # Handle invalid characteristic names
                    continue
        
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
            # Handle both old format and new detailed format
            if isinstance(data['obligation'], dict):
                obligation_text = f"Obligation: {data['obligation'].get('type', 'Unknown')} ({data['obligation'].get('magnitude', 10)})"
                if data['obligation'].get('details'):
                    obligation_text += f" - {data['obligation']['details']}"
                character.background += f"\n\n{obligation_text}"
            else:
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
        
        # Add equipment and obligations to character data
        equipment = getattr(character, 'equipment', []) or []
        obligations = getattr(character, 'obligations', []) or []
        
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
                    'activation': getattr(talent, 'activation', 'Passive'),
                    'ranked': getattr(talent, 'ranked', False),
                    'currentRank': getattr(talent, 'current_rank', 1)
                }
                for talent in character.talents
            ],
            'equipment': equipment,
            'obligations': obligations,
            'advancementOptions': advancement_options,
            'wounds': getattr(character, 'current_wounds', 0),
            'strain': getattr(character, 'current_strain', 0),
            'credits': getattr(character, 'credits', 500)
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


@app.route('/api/docs/sections', methods=['GET'])
def get_documentation_sections():
    """Get available documentation sections."""
    try:
        # For demo purposes, return basic documentation structure
        sections = {
            "player": [
                {
                    "id": "character_creation",
                    "title": "Character Creation",
                    "description": "Learn how to create and customize your Star Wars RPG character",
                    "sections": [
                        {"id": "species", "title": "Species Selection"},
                        {"id": "careers", "title": "Career Paths"},
                        {"id": "characteristics", "title": "Characteristics"},
                        {"id": "skills", "title": "Skills & Talents"}
                    ]
                },
                {
                    "id": "gameplay",
                    "title": "Gameplay Mechanics",
                    "description": "Understanding dice pools, checks, and character advancement",
                    "sections": [
                        {"id": "dice_system", "title": "Dice System"},
                        {"id": "advancement", "title": "Character Advancement"},
                        {"id": "equipment", "title": "Equipment & Gear"}
                    ]
                }
            ],
            "gm": [
                {
                    "id": "running_games",
                    "title": "Running Games",
                    "description": "Tools and tips for Game Masters",
                    "sections": [
                        {"id": "campaign_management", "title": "Campaign Management"},
                        {"id": "npc_creation", "title": "NPC Creation"},
                        {"id": "encounter_design", "title": "Encounter Design"}
                    ]
                }
            ]
        }
        
        return jsonify({
            'user_role': 'player',
            'sections': sections
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/docs/content/<section_id>/<content_id>', methods=['GET'])
def get_documentation_content(section_id, content_id):
    """Get specific documentation content."""
    try:
        # Demo documentation content
        content_map = {
            "character_creation": {
                "species": {
                    "title": "Species Selection",
                    "content": """# Species in Star Wars RPG

Each species provides unique characteristics and abilities:

## Human
- Balanced characteristics
- Extra skill ranks
- Starting XP: 110

## Twi'lek
- High Cunning
- Charm bonuses
- Starting XP: 100

## Rodian
- High Agility
- Tracking abilities
- Starting XP: 100

## Wookiee
- High Brawn
- Natural weapons
- Starting XP: 90

Choose your species based on your desired character concept and playstyle."""
                },
                "careers": {
                    "title": "Career Paths",
                    "content": """# Career Paths

Your career determines your character's background and specialties:

## Edge of the Empire
- **Bounty Hunter**: Combat and tracking specialists
- **Smuggler**: Pilots and rogues
- **Colonist**: Leaders and diplomats
- **Explorer**: Scouts and survivalists
- **Hired Gun**: Professional soldiers
- **Technician**: Engineers and mechanics

## Age of Rebellion
- **Ace**: Elite pilots
- **Commander**: Military leaders
- **Diplomat**: Negotiators and spies

## Force and Destiny
- **Guardian**: Force-wielding protectors
- **Consular**: Wise Force users
- **Mystic**: Spiritual Force users

Each career provides career skills that cost less XP to advance."""
                },
                "characteristics": {
                    "title": "Characteristics",
                    "content": """# Characteristics

The six core characteristics define your character's basic capabilities:

## Brawn
Physical strength and toughness
- Affects wound threshold
- Used for Athletics, Brawl, Melee

## Agility
Speed, dexterity, and reflexes
- Used for Coordination, Piloting, Ranged skills

## Intellect
Reasoning and memory
- Used for Knowledge skills, Computers

## Cunning
Cleverness and quick thinking
- Used for Deception, Perception, Streetwise

## Willpower
Mental fortitude and determination
- Affects strain threshold
- Used for Discipline, Vigilance

## Presence
Force of personality and leadership
- Used for Charm, Leadership, Negotiation

Characteristics range from 1-6, with 2 being average for most species."""
                },
                "skills": {
                    "title": "Skills & Talents",
                    "content": """# Skills & Talents

## Skills
Skills represent training and expertise in specific areas.

### Skill Ranks
- 0 Ranks: Untrained
- 1 Rank: Novice
- 2 Ranks: Apprentice
- 3 Ranks: Professional
- 4 Ranks: Expert
- 5 Ranks: Master

### Career Skills
Skills marked as career skills for your profession cost less XP to advance.

### Dice Pools
Your dice pool = Characteristic + Skill Ranks
- Ability dice (green): Basic capability
- Proficiency dice (yellow): Trained expertise

## Talents
Special abilities that provide unique bonuses and capabilities.
- Purchased with XP
- Often have prerequisites
- Can be ranked (purchased multiple times)"""
                }
            },
            "gameplay": {
                "dice_system": {
                    "title": "Dice System",
                    "content": """# Star Wars RPG Dice System

The game uses custom dice to create narrative results:

## Positive Dice
- **Ability Dice (Green)**: Basic capability
- **Proficiency Dice (Yellow)**: Trained expertise
- **Boost Dice (Blue)**: Situational advantages

## Negative Dice
- **Difficulty Dice (Purple)**: Task difficulty
- **Challenge Dice (Red)**: Extreme difficulty
- **Setback Dice (Black)**: Minor hindrances

## Results
- **Success**: Complete the task
- **Advantage**: Something good happens
- **Triumph**: Exceptional success
- **Failure**: Task fails
- **Threat**: Something bad happens
- **Despair**: Critical failure

The system creates rich, narrative outcomes beyond simple pass/fail."""
                },
                "advancement": {
                    "title": "Character Advancement",
                    "content": """# Character Advancement

Characters improve by spending Experience Points (XP):

## XP Costs

### Characteristics
- Rank 3: 30 XP
- Rank 4: 40 XP
- Rank 5: 50 XP
- Rank 6: 60 XP

### Skills
Career Skills:
- Rank 1: 5 XP
- Rank 2: 10 XP
- Rank 3: 15 XP
- Rank 4: 20 XP
- Rank 5: 25 XP

Non-Career Skills: +5 XP per rank

### Talents
Varies by talent (typically 5-25 XP)

## Planning Advancement
- Focus on key characteristics early
- Develop career skills for efficiency
- Choose talents that support your concept"""
                }
            }
        }
        
        if section_id in content_map and content_id in content_map[section_id]:
            return jsonify({'content': content_map[section_id][content_id]})
        else:
            return jsonify({'error': 'Content not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/campaigns', methods=['GET'])
def get_campaigns():
    """Get campaigns for the current user."""
    # Check for authentication token
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or 'Bearer ' not in auth_header:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        # For demo purposes, return sample campaigns
        campaigns = [
            {
                "id": "campaign_1",
                "name": "Shadows of the Empire",
                "description": "A story of rebellion against the Empire",
                "game_system": "Edge of the Empire",
                "max_players": 4,
                "player_count": 3,
                "character_count": 4,
                "is_game_master": True,
                "created_at": "2025-06-01T00:00:00Z"
            },
            {
                "id": "campaign_2", 
                "name": "Force Awakens",
                "description": "Discovering the Force in dark times",
                "game_system": "Force and Destiny",
                "max_players": 6,
                "player_count": 2,
                "character_count": 2,
                "is_game_master": False,
                "created_at": "2025-05-15T00:00:00Z"
            }
        ]
        
        return jsonify({'campaigns': campaigns})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/campaigns', methods=['POST'])
def create_campaign_endpoint():
    """Create a new campaign."""
    # Check for authentication token
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or 'Bearer ' not in auth_header:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'game_system']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # For demo purposes, just return success
        campaign = {
            "id": f"campaign_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "name": data['name'],
            "description": data.get('description', ''),
            "game_system": data['game_system'],
            "max_players": data.get('max_players', 4),
            "player_count": 1,
            "character_count": 0,
            "is_game_master": True,
            "created_at": datetime.now().isoformat() + "Z"
        }
        
        return jsonify({
            'message': 'Campaign created successfully',
            'campaign': campaign
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/campaigns/join', methods=['POST'])
def join_campaign():
    """Join a campaign using invite code."""
    try:
        data = request.json
        invite_code = data.get('invite_code')
        
        if not invite_code:
            return jsonify({'error': 'Invite code is required'}), 400
        
        # For demo purposes, accept any invite code
        return jsonify({
            'message': 'Successfully joined campaign',
            'campaign_id': 'demo_campaign'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/campaigns/<campaign_id>/invite', methods=['POST'])
def generate_invite_code(campaign_id):
    """Generate an invite code for a campaign."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or 'Bearer ' not in auth_header:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        # For demo purposes, generate a simple invite code
        invite_code = f"SWRPG-{campaign_id.upper()[:4]}-{datetime.now().strftime('%H%M')}"
        
        return jsonify({
            'invite_code': invite_code,
            'expires_at': (datetime.now()).isoformat() + "Z"
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/campaigns/<campaign_id>', methods=['PUT'])
def update_campaign(campaign_id):
    """Update campaign details."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or 'Bearer ' not in auth_header:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        data = request.json
        # For demo purposes, just return success
        return jsonify({
            'message': 'Campaign updated successfully',
            'campaign': {
                'id': campaign_id,
                'name': data.get('name'),
                'description': data.get('description'),
                'game_system': data.get('game_system'),
                'max_players': data.get('max_players')
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/campaigns/<campaign_id>', methods=['DELETE'])
def delete_campaign(campaign_id):
    """Delete a campaign."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or 'Bearer ' not in auth_header:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        return jsonify({'message': 'Campaign deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/campaigns/<campaign_id>/leave', methods=['POST'])
def leave_campaign(campaign_id):
    """Leave a campaign as a player."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or 'Bearer ' not in auth_header:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        return jsonify({'message': 'Successfully left campaign'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/campaigns/<campaign_id>/settings', methods=['PUT'])
def update_campaign_settings(campaign_id):
    """Update campaign settings."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or 'Bearer ' not in auth_header:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        data = request.json
        return jsonify({
            'message': 'Campaign settings updated successfully',
            'settings': data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/campaigns/current/remove-player', methods=['POST'])
def remove_player_from_campaign():
    """Remove a player from the current campaign."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or 'Bearer ' not in auth_header:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        data = request.json
        player_id = data.get('player_id')
        return jsonify({'message': f'Player {player_id} removed successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/players/<player_id>/characters', methods=['GET'])
def get_player_characters(player_id):
    """Get characters for a specific player."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or 'Bearer ' not in auth_header:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        # For demo purposes, return sample characters
        characters = [
            {
                'id': 'char1',
                'name': 'Luke Skywalker',
                'species': 'Human',
                'career': 'Guardian',
                'level': 3
            },
            {
                'id': 'char2',
                'name': 'Princess Leia',
                'species': 'Human',
                'career': 'Diplomat',
                'level': 2
            }
        ]
        return jsonify({'characters': characters})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/campaigns/<campaign_id>/assign-character', methods=['POST'])
def assign_character_to_campaign(campaign_id):
    """Assign a character to a campaign."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or 'Bearer ' not in auth_header:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        data = request.json
        character_id = data.get('character_id')
        return jsonify({
            'message': f'Character {character_id} assigned to campaign {campaign_id} successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/campaigns/<campaign_id>/sessions', methods=['GET'])
def get_campaign_sessions(campaign_id):
    """Get campaign session history."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or 'Bearer ' not in auth_header:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        # For demo purposes, return sample sessions
        sessions = [
            {
                'id': 'session1',
                'name': 'Session 1: Escape from Mos Eisley',
                'date': '2025-06-01T18:00:00Z',
                'duration': 180,  # minutes
                'players_attended': 4,
                'xp_awarded': 20,
                'notes': 'Great session! Players escaped the cantina after a bar fight.'
            },
            {
                'id': 'session2',
                'name': 'Session 2: The Jawa Deal',
                'date': '2025-06-08T18:00:00Z',
                'duration': 150,
                'players_attended': 3,
                'xp_awarded': 15,
                'notes': 'One player absent. Negotiated with Jawas for droid repairs.'
            }
        ]
        return jsonify({'sessions': sessions})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/campaigns/<campaign_id>/sessions', methods=['POST'])
def create_campaign_session(campaign_id):
    """Create a new campaign session."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header or 'Bearer ' not in auth_header:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        data = request.json
        session = {
            'id': f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'name': data.get('name', 'Untitled Session'),
            'date': data.get('date', datetime.now().isoformat() + 'Z'),
            'duration': data.get('duration', 120),
            'players_attended': data.get('players_attended', 0),
            'xp_awarded': data.get('xp_awarded', 0),
            'notes': data.get('notes', '')
        }
        return jsonify({
            'message': 'Session created successfully',
            'session': session
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/character/<character_id>')
def character_sheet(character_id):
    """Display character sheet for editing and viewing."""
    try:
        # Load the character by ID (for now, ID and name are the same)
        character = database.load_character(character_id)
        if not character:
            return render_template('error.html', 
                                 error_message=f"Character '{character_id}' not found"), 404
        
        return render_template('character_sheet.html', character=character, character_id=character_id)
    except Exception as e:
        return render_template('error.html', 
                             error_message=f"Error loading character: {str(e)}"), 500


@app.route('/api/characters/<character_name>/equipment', methods=['GET'])
def get_character_equipment(character_name):
    """Get character equipment."""
    try:
        character = database.load_character(character_name)
        if not character:
            return jsonify({'error': 'Character not found'}), 404
        
        # Return sample equipment for demo
        equipment = [
            {
                'id': 'eq1',
                'name': 'Blaster Pistol',
                'type': 'weapon',
                'description': 'Standard sidearm, Ranged Light, Damage 6, Critical 3, Range Medium',
                'encumbrance': 1,
                'rarity': 4,
                'price': 400
            },
            {
                'id': 'eq2',
                'name': 'Heavy Clothing',
                'type': 'armor',
                'description': 'Basic protection, Soak +1, Defense 0',
                'encumbrance': 1,
                'rarity': 0,
                'price': 50
            },
            {
                'id': 'eq3',
                'name': 'Comlink',
                'type': 'gear',
                'description': 'Standard communication device with planetary range',
                'encumbrance': 0,
                'rarity': 1,
                'price': 25
            }
        ]
        
        return jsonify({'equipment': equipment})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/characters/<character_name>/equipment', methods=['POST'])
def add_character_equipment(character_name):
    """Add equipment to character."""
    try:
        character = database.load_character(character_name)
        if not character:
            return jsonify({'error': 'Character not found'}), 404
        
        data = request.json
        equipment_item = {
            'id': f"eq_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'name': data.get('name', 'Unknown Item'),
            'type': data.get('type', 'gear'),
            'description': data.get('description', ''),
            'encumbrance': data.get('encumbrance', 0),
            'rarity': data.get('rarity', 0),
            'price': data.get('price', 0)
        }
        
        # For demo purposes, just return success
        return jsonify({
            'message': 'Equipment added successfully',
            'equipment': equipment_item
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/characters/<character_name>/talents', methods=['GET'])
def get_character_talents(character_name):
    """Get character talents."""
    try:
        character = database.load_character(character_name)
        if not character:
            return jsonify({'error': 'Character not found'}), 404
        
        # Return sample talents for demo
        talents = [
            {
                'id': 'tal1',
                'name': 'Grit',
                'tier': 1,
                'activation': 'Passive',
                'description': 'Gain +1 strain threshold per rank.',
                'ranked': True,
                'current_rank': 2,
                'max_rank': 5,
                'tree': 'Guardian'
            },
            {
                'id': 'tal2',
                'name': 'Parry',
                'tier': 2,
                'activation': 'Maneuver',
                'description': 'When hit by a melee attack, suffer 3 strain to reduce damage by 2 + ranks in Parry.',
                'ranked': True,
                'current_rank': 1,
                'max_rank': 5,
                'tree': 'Guardian'
            },
            {
                'id': 'tal3',
                'name': 'Force Rating',
                'tier': 4,
                'activation': 'Passive',
                'description': 'Gain Force Rating 1 (or +1 if already Force sensitive).',
                'ranked': False,
                'current_rank': 1,
                'max_rank': 1,
                'tree': 'Guardian'
            }
        ]
        
        return jsonify({'talents': talents})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/characters/<character_name>/xp-history', methods=['GET'])
def get_character_xp_history(character_name):
    """Get character XP history."""
    try:
        character = database.load_character(character_name)
        if not character:
            return jsonify({'error': 'Character not found'}), 404
        
        # Return sample XP history for demo
        xp_history = [
            {
                'id': 'xp1',
                'date': '2025-06-01T18:00:00Z',
                'type': 'awarded',
                'amount': 20,
                'reason': 'Completed first adventure',
                'balance_after': 130
            },
            {
                'id': 'xp2',
                'date': '2025-06-01T18:15:00Z',
                'type': 'spent',
                'amount': -15,
                'reason': 'Advanced Discipline skill to rank 2',
                'balance_after': 115
            },
            {
                'id': 'xp3',
                'date': '2025-06-08T19:30:00Z',
                'type': 'awarded',
                'amount': 15,
                'reason': 'Good roleplay and teamwork',
                'balance_after': 130
            },
            {
                'id': 'xp4',
                'date': '2025-06-08T19:45:00Z',
                'type': 'spent',
                'amount': -30,
                'reason': 'Advanced Willpower from 3 to 4',
                'balance_after': 100
            }
        ]
        
        return jsonify({'xp_history': xp_history})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/characters/<character_name>/obligations', methods=['GET'])
def get_character_obligations(character_name):
    """Get character obligations/duties/morality."""
    try:
        character = database.load_character(character_name)
        if not character:
            return jsonify({'error': 'Character not found'}), 404
        
        # Return sample obligations for demo
        obligations = [
            {
                'id': 'obl1',
                'type': 'Debt',
                'magnitude': 15,
                'description': 'Owes 5,000 credits to a Hutt crime lord for a failed smuggling run.',
                'system': 'Edge of the Empire'
            },
            {
                'id': 'obl2',
                'type': 'Family',
                'magnitude': 5,
                'description': 'Has a younger sister who depends on financial support.',
                'system': 'Edge of the Empire'
            }
        ]
        
        return jsonify({'obligations': obligations})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/characters/<character_name>/obligations', methods=['POST'])
def add_character_obligation(character_name):
    """Add obligation/duty/morality to character."""
    try:
        character = database.load_character(character_name)
        if not character:
            return jsonify({'error': 'Character not found'}), 404
        
        data = request.json
        obligation = {
            'id': f"obl_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'type': data.get('type', 'Unknown'),
            'magnitude': data.get('magnitude', 10),
            'description': data.get('description', ''),
            'system': data.get('system', 'Edge of the Empire')
        }
        
        return jsonify({
            'message': 'Obligation added successfully',
            'obligation': obligation
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Create character data directory if it doesn't exist
    os.makedirs('character_data', exist_ok=True)
    
    # Run the Flask app
    app.run(debug=True, host='127.0.0.1', port=8000)
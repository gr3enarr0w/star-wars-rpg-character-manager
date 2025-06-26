"""Enhanced Flask web application with authentication and MongoDB integration."""

import os
import sys
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, get_jwt
from bson import ObjectId
from dotenv import load_dotenv

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from swrpg_character_manager.database import db_manager, User, Campaign, Character
from swrpg_character_manager.auth import auth_manager
from swrpg_character_manager.character_creator import CharacterCreator
from swrpg_character_manager.advancement import AdvancementManager
from swrpg_character_manager.social_auth import social_auth_manager
from swrpg_character_manager.character_walkthrough import character_walkthrough

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'dev-key-change-in-production')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-dev-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions
auth_manager.init_app(app)
social_auth_manager.init_app(app)
jwt = JWTManager(app)

# Initialize character management components
creator = CharacterCreator()
advancement = AdvancementManager()

@app.before_request
def initialize_database():
    """Initialize database connection."""
    if not hasattr(initialize_database, '_called'):
        initialize_database._called = True
        try:
            db_manager.connect()
            print("✅ Database initialized successfully")
        except Exception as e:
            print(f"❌ Failed to initialize database: {e}")

# Authentication Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user."""
    try:
        data = request.get_json()
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')
        invite_code = data.get('invite_code')

        if not all([email, username, password, invite_code]):
            return jsonify({'error': 'All fields are required'}), 400

        success, message, user_id = auth_manager.register_user(email, username, password, invite_code)

        if success:
            return jsonify({'message': message, 'user_id': str(user_id)}), 201
        else:
            return jsonify({'error': message}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/debug/test-login', methods=['POST'])
def test_login_debug():
    """DEBUG: Simple test login that bypasses encryption."""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        print(f"🔍 TEST LOGIN: email={email}, password={password}")
        
        # Simple test credentials
        if email == 'admin@test.com' and password == 'AdminTest123!':
            # Create fake JWT token for testing
            from flask_jwt_extended import create_access_token
            access_token = create_access_token(identity='684b6bdafbc051235c4b58d3')
            return jsonify({
                'access_token': access_token,
                'user': {
                    'id': '684b6bdafbc051235c4b58d3',
                    'username': 'admin',
                    'email': 'admin@test.com',
                    'role': 'admin'
                }
            }), 200
        else:
            return jsonify({'error': 'Invalid test credentials'}), 401
            
    except Exception as e:
        print(f"Test login error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/debug/create-admin', methods=['POST'])
def create_admin_debug():
    """DEBUG: Create admin user using Flask app's context."""
    try:
        # Delete all existing users first
        db_manager.users.delete_many({})
        
        # Create admin user using the same encryption context as Flask app
        from swrpg_character_manager.database import User
        from datetime import datetime
        
        admin_user = User(
            username="admin",
            email="admin@swrpg.local",
            password_hash=auth_manager.hash_password("admin123"),
            role="admin",
            is_active=True,
            created_at=datetime.now()
        )
        
        admin_id = db_manager.create_user(admin_user)
        
        # Test that we can find the user immediately
        test_user = db_manager.get_user_by_email("admin@swrpg.local")
        
        return jsonify({
            'message': 'Admin created successfully',
            'admin_id': str(admin_id),
            'test_lookup': test_user is not None,
            'test_username': test_user.username if test_user else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to create admin: {str(e)}'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user."""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        two_factor_token = data.get('two_factor_token')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        success, message, user = auth_manager.authenticate_user(email, password)

        if not success:
            return jsonify({'error': message}), 401

        # Check 2FA if enabled
        if user.two_factor_enabled:
            if not two_factor_token:
                return jsonify({'error': 'Two-factor authentication token required', 'requires_2fa': True}), 401

            if not auth_manager.verify_2fa_token(user, two_factor_token):
                return jsonify({'error': 'Invalid two-factor authentication token'}), 401

        # Create access token
        access_token = auth_manager.create_access_token(user)

        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': {
                'id': str(user._id),
                'username': user.username,
                'role': user.role
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/me', methods=['GET'])
@auth_manager.require_auth
def get_current_user():
    """Get current user information."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        user = db_manager.get_user_by_id(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'id': str(user._id),
            'username': user.username,
            'role': user.role,
            'two_factor_enabled': user.two_factor_enabled
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/setup-2fa', methods=['POST'])
@auth_manager.require_auth
def setup_2fa():
    """Set up two-factor authentication."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        secret, qr_code, backup_codes = auth_manager.setup_2fa(current_user_id)

        return jsonify({
            'secret': secret,
            'qr_code': qr_code,
            'backup_codes': backup_codes
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/verify-2fa-setup', methods=['POST'])
@auth_manager.require_auth
def verify_2fa_setup():
    """Verify 2FA setup."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        token = request.get_json().get('token')

        if not token:
            return jsonify({'error': 'Token is required'}), 400

        if auth_manager.verify_2fa_setup(current_user_id, token):
            return jsonify({'message': 'Two-factor authentication enabled successfully'}), 200
        else:
            return jsonify({'error': 'Invalid token'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/change-password', methods=['POST'])
@auth_manager.require_auth
def change_password():
    """Change user password."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        data = request.get_json()
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        # Get current user
        user = db_manager.get_user_by_id(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify current password
        if not auth_manager.verify_password(current_password, user.password_hash):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        # Hash new password
        new_password_hash = auth_manager.hash_password(new_password)
        
        # Update password
        success = db_manager.update_user(current_user_id, {'password_hash': new_password_hash})
        
        if success:
            return jsonify({'message': 'Password changed successfully'}), 200
        else:
            return jsonify({'error': 'Failed to update password'}), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Social Authentication Routes
@app.route('/api/auth/social/google/login')
def google_login():
    """Initiate Google OAuth login."""
    redirect_uri = url_for('google_callback', _external=True)
    login_url = social_auth_manager.get_google_login_url(redirect_uri)

    if not login_url:
        return jsonify({'error': 'Google OAuth not configured'}), 500

    return redirect(login_url)

@app.route('/api/auth/social/google/callback')
def google_callback():
    """Handle Google OAuth callback."""
    try:
        success, message, user_data = social_auth_manager.handle_google_callback()

        if not success:
            return redirect(f'/login?error={message}')

        # Check if user exists by Google ID
        existing_user = social_auth_manager.find_user_by_social_id('google', user_data['google_id'])

        if existing_user:
            # User exists, log them in
            user = db_manager.get_user_by_id(existing_user['_id'])
            access_token = auth_manager.create_access_token(user)

            # Redirect with token (in production, use secure session or cookie)
            return redirect(f'/?token={access_token}&message=Logged in via Google')
        else:
            # New user, redirect to registration with social data
            session['social_registration'] = {
                'provider': 'google',
                'data': user_data
            }
            return redirect('/register?social=google')

    except Exception as e:
        return redirect(f'/login?error=Google authentication failed: {str(e)}')

@app.route('/api/auth/social/discord/login')
def discord_login():
    """Initiate Discord OAuth login."""
    redirect_uri = url_for('discord_callback', _external=True)
    login_url = social_auth_manager.get_discord_login_url(redirect_uri)

    if not login_url:
        return jsonify({'error': 'Discord OAuth not configured'}), 500

    return redirect(login_url)

@app.route('/api/auth/social/discord/callback')
def discord_callback():
    """Handle Discord OAuth callback."""
    try:
        success, message, user_data = social_auth_manager.handle_discord_callback()

        if not success:
            return redirect(f'/login?error={message}')

        # Check if user exists by Discord ID
        existing_user = social_auth_manager.find_user_by_social_id('discord', user_data['discord_id'])

        if existing_user:
            # User exists, log them in
            user = db_manager.get_user_by_id(existing_user['_id'])
            access_token = auth_manager.create_access_token(user)

            # Redirect with token (in production, use secure session or cookie)
            return redirect(f'/?token={access_token}&message=Logged in via Discord')
        else:
            # New user, redirect to registration with social data
            session['social_registration'] = {
                'provider': 'discord',
                'data': user_data
            }
            return redirect('/register?social=discord')

    except Exception as e:
        return redirect(f'/login?error=Discord authentication failed: {str(e)}')

@app.route('/api/auth/social/register', methods=['POST'])
def social_register():
    """Complete registration with social login data."""
    try:
        social_data = session.get('social_registration')
        if not social_data:
            return jsonify({'error': 'No social registration data found'}), 400

        data = request.get_json()
        invite_code = data.get('invite_code')

        if not invite_code:
            return jsonify({'error': 'Invite code is required for registration'}), 400

        # Create user from social data
        success, message, user_id = social_auth_manager.create_user_from_social(
            social_data['provider'],
            social_data['data'],
            invite_code
        )

        if success:
            # Clear social registration data
            session.pop('social_registration', None)

            # Create access token
            user = db_manager.get_user_by_id(ObjectId(user_id))
            access_token = auth_manager.create_access_token(user)

            return jsonify({
                'message': message,
                'access_token': access_token,
                'user': {
                    'id': str(user._id),
                    'username': user.username,
                    'role': user.role
                }
            }), 201
        else:
            return jsonify({'error': message}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/social/link', methods=['POST'])
@auth_manager.require_auth
def link_social_account():
    """Link social account to existing user."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        data = request.get_json()
        provider = data.get('provider')

        if provider not in ['google', 'discord']:
            return jsonify({'error': 'Invalid provider'}), 400

        # Check if social data is in session
        social_data = session.get('social_registration')
        if not social_data or social_data['provider'] != provider:
            return jsonify({'error': 'No social registration data found'}), 400

        # Link the account
        success = social_auth_manager.link_social_account(
            current_user_id,
            provider,
            social_data['data']
        )

        if success:
            session.pop('social_registration', None)
            return jsonify({'message': f'{provider.title()} account linked successfully'}), 200
        else:
            return jsonify({'error': f'Failed to link {provider} account'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Campaign Management Routes
@app.route('/api/campaigns', methods=['GET'])
@auth_manager.require_auth
def get_campaigns():
    """Get user's campaigns."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        campaigns = db_manager.get_user_campaigns(current_user_id)

        campaign_data = []
        for campaign in campaigns:
            campaign_data.append({
                'id': str(campaign._id),
                'name': campaign.name,
                'description': campaign.description,
                'is_game_master': campaign.game_master_id == current_user_id,
                'player_count': len(campaign.players),
                'character_count': len(campaign.characters),
                'created_at': campaign.created_at.isoformat()
            })

        return jsonify({'campaigns': campaign_data}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/campaigns', methods=['POST'])
@auth_manager.require_auth
def create_campaign():
    """Create a new campaign."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        data = request.get_json()

        # Validate required fields
        if not data.get('name') or not data.get('name').strip():
            return jsonify({'error': 'Campaign name is required'}), 400

        if not data.get('game_system'):
            return jsonify({'error': 'Game system is required'}), 400

        # Prepare campaign settings with additional fields
        campaign_settings = {
            'game_system': data.get('game_system'),
            'max_players': data.get('max_players', 4)
        }

        campaign = Campaign(
            name=data.get('name').strip(),
            description=data.get('description', ''),
            game_master_id=current_user_id,
            settings=campaign_settings
        )

        campaign_id = db_manager.create_campaign(campaign)

        return jsonify({
            'message': 'Campaign created successfully',
            'campaign_id': str(campaign_id),
            'campaign': {
                'id': str(campaign_id),
                'name': campaign.name,
                'description': campaign.description,
                'game_system': campaign_settings['game_system'],
                'max_players': campaign_settings['max_players']
            }
        }), 201

    except Exception as e:
        print(f"Campaign creation error: {str(e)}")  # Add logging
        return jsonify({'error': str(e)}), 500

@app.route('/api/campaigns/<campaign_id>/invite', methods=['POST'])
@auth_manager.require_auth
def generate_campaign_invite(campaign_id):
    """Generate campaign invite code."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        campaign = db_manager.get_campaign_by_id(ObjectId(campaign_id))

        if not campaign or campaign.game_master_id != current_user_id:
            return jsonify({'error': 'Access denied'}), 403

        # Generate campaign invite code
        invite_code = auth_manager.generate_campaign_invite(ObjectId(campaign_id), current_user_id)

        return jsonify({
            'message': 'Campaign invite code generated successfully',
            'invite_code': invite_code
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/campaigns/join', methods=['POST'])
@auth_manager.require_auth
def join_campaign():
    """Join campaign using invite code."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        data = request.get_json()
        invite_code = data.get('invite_code')

        if not invite_code:
            return jsonify({'error': 'Invite code is required'}), 400

        # Join campaign using invite code
        success, message = db_manager.join_campaign_by_invite(current_user_id, invite_code)

        if success:
            return jsonify({'message': message}), 200
        else:
            return jsonify({'error': message}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Character Creation Walkthrough Routes
@app.route('/api/character-creation/walkthrough-data', methods=['GET'])
@auth_manager.require_auth
def get_walkthrough_data():
    """Get all data needed for character creation walkthrough."""
    try:
        walkthrough_data = character_walkthrough.get_creation_walkthrough_data()
        return jsonify(walkthrough_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/character-creation/validate', methods=['POST'])
@auth_manager.require_auth
def validate_character_creation():
    """Validate character creation data."""
    try:
        data = request.get_json()
        character_data = data.get('character_data', {})
        context = data.get('context', 'new_campaign')
        
        is_valid, errors = character_walkthrough.validate_character_creation(character_data, context)
        
        return jsonify({
            'valid': is_valid,
            'errors': errors
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/character-creation/calculate-xp', methods=['POST'])
@auth_manager.require_auth
def calculate_starting_xp():
    """Calculate starting XP based on species, obligations, and context."""
    try:
        data = request.get_json()
        species = data.get('species', 'human')
        obligations = data.get('obligations', [])
        context = data.get('context', 'new_campaign')
        
        starting_xp = character_walkthrough.calculate_starting_xp(species, obligations, context)
        obligation_bonus = character_walkthrough.calculate_obligation_xp_bonus(obligations)
        
        return jsonify({
            'starting_xp': starting_xp,
            'obligation_bonus': obligation_bonus,
            'base_xp': starting_xp - obligation_bonus
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Enhanced Character Routes with Campaign Support
@app.route('/api/characters', methods=['GET'])
@auth_manager.require_auth
def get_characters():
    """Get user's characters, optionally filtered by campaign."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        campaign_id = request.args.get('campaign_id')

        if campaign_id:
            # Verify user has access to this campaign
            campaign = db_manager.get_campaign_by_id(ObjectId(campaign_id))
            if not campaign or (current_user_id != campaign.game_master_id and current_user_id not in campaign.players):
                return jsonify({'error': 'Access denied to this campaign'}), 403

            # Get characters for this campaign
            if current_user_id == campaign.game_master_id:
                # GM can see all characters in campaign
                characters = db_manager.get_campaign_characters(ObjectId(campaign_id))
            else:
                # Players can only see their own characters
                characters = db_manager.get_user_characters(current_user_id, ObjectId(campaign_id))
        else:
            # Get all user's characters
            characters = db_manager.get_user_characters(current_user_id)

        character_data = []
        for character in characters:
            character_data.append({
                'id': str(character._id),
                'name': character.name,
                'playerName': character.player_name,
                'species': character.species,
                'career': character.career,
                'totalXP': character.total_xp,
                'availableXP': character.available_xp,
                'campaign_id': str(character.campaign_id) if character.campaign_id else None,
                'level': calculate_level(character),
                'woundThreshold': character.brawn + 10,  # Simplified calculation
                'strainThreshold': character.willpower + 10,
                'characteristics': {
                    'brawn': character.brawn,
                    'agility': character.agility,
                    'intellect': character.intellect,
                    'cunning': character.cunning,
                    'willpower': character.willpower,
                    'presence': character.presence
                }
            })

        return jsonify({'characters': character_data}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/characters', methods=['POST'])
@auth_manager.require_auth
def create_character():
    """Create a new character using enhanced walkthrough system."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        data = request.get_json()

        # Validate required fields
        required_fields = ['name', 'playerName', 'species', 'career']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Get creation context and obligations
        creation_context = data.get('creation_context', 'new_campaign')
        obligations = data.get('obligations', [])
        
        # Validate character creation data with context
        character_data = {
            'skills': data.get('skills', {}),
            'characteristics': data.get('characteristics', {}),
            'obligations': obligations
        }
        
        is_valid, errors = character_walkthrough.validate_character_creation(character_data, creation_context)
        if not is_valid:
            return jsonify({'error': 'Character validation failed', 'details': errors}), 400

        # Get species data for starting characteristics and XP
        species_data = character_walkthrough.get_species_data().get(data['species'], {})
        starting_characteristics = species_data.get('characteristics', {
            'brawn': 2, 'agility': 2, 'intellect': 2, 
            'cunning': 2, 'willpower': 2, 'presence': 2
        })
        
        # Calculate starting XP including obligation bonuses
        starting_xp = character_walkthrough.calculate_starting_xp(data['species'], obligations, creation_context)
        
        # Apply any characteristic upgrades from character data
        final_characteristics = starting_characteristics.copy()
        char_upgrades = data.get('characteristics', {})
        for char_name, value in char_upgrades.items():
            if char_name in final_characteristics:
                final_characteristics[char_name] = value

        # Create enhanced character model
        character = Character(
            user_id=current_user_id,
            name=data['name'],
            player_name=data['playerName'],
            species=data['species'],
            career=data['career'],
            background=data.get('background', ''),
            creation_context=creation_context,
            
            # Set characteristics
            brawn=final_characteristics['brawn'],
            agility=final_characteristics['agility'],
            intellect=final_characteristics['intellect'],
            cunning=final_characteristics['cunning'],
            willpower=final_characteristics['willpower'],
            presence=final_characteristics['presence'],
            
            # Set experience
            total_xp=starting_xp,
            available_xp=data.get('available_xp', starting_xp),
            spent_xp=data.get('spent_xp', 0),
            
            # Set skills and obligations
            skills=data.get('skills', {}),
            obligations=obligations,
            
            # Equipment
            credits=data.get('credits', 0),
            equipment=data.get('equipment', [])
        )

        # Assign to campaign if specified
        campaign_id = data.get('campaign_id')
        if campaign_id:
            character.campaign_id = ObjectId(campaign_id)

        character_id = db_manager.create_character(character)

        return jsonify({
            'message': 'Character created successfully',
            'character': {
                'id': str(character_id),
                'name': character.name,
                'playerName': character.player_name,
                'species': character.species,
                'career': character.career,
                'totalXP': character.total_xp,
                'availableXP': character.available_xp,
                'obligations': character.obligations,
                'creation_context': character.creation_context
            }
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/characters/<character_id>/assign-campaign', methods=['POST'])
@auth_manager.require_auth
def assign_character_to_campaign(character_id):
    """Assign character to campaign."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        character = db_manager.get_character_by_id(ObjectId(character_id))

        if not character or character.user_id != current_user_id:
            return jsonify({'error': 'Character not found or access denied'}), 404

        data = request.get_json()
        campaign_id = data.get('campaign_id')

        if campaign_id:
            # Verify user has access to campaign
            campaign = db_manager.get_campaign_by_id(ObjectId(campaign_id))
            if not campaign or (current_user_id != campaign.game_master_id and current_user_id not in campaign.players):
                return jsonify({'error': 'Access denied to this campaign'}), 403

        if db_manager.assign_character_to_campaign(ObjectId(character_id), ObjectId(campaign_id) if campaign_id else None):
            return jsonify({'message': 'Character assigned to campaign successfully'}), 200
        else:
            return jsonify({'error': 'Failed to assign character to campaign'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/characters/<character_id>', methods=['GET'])
@auth_manager.require_auth
def get_character(character_id):
    """Get specific character details."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        character = db_manager.get_character_by_id(ObjectId(character_id))

        if not character:
            return jsonify({'error': 'Character not found'}), 404

        # Check access permissions
        if character.user_id != current_user_id:
            # Check if user is GM of character's campaign
            if character.campaign_id:
                campaign = db_manager.get_campaign_by_id(character.campaign_id)
                if not campaign or campaign.game_master_id != current_user_id:
                    return jsonify({'error': 'Access denied'}), 403
            else:
                return jsonify({'error': 'Access denied'}), 403

        return jsonify({
            'character': {
                'id': str(character._id),
                'name': character.name,
                'playerName': character.player_name,
                'species': character.species,
                'career': character.career,
                'background': character.background,
                'totalXP': character.total_xp,
                'availableXP': character.available_xp,
                'spentXP': character.spent_xp,
                'characteristics': {
                    'brawn': character.brawn,
                    'agility': character.agility,
                    'intellect': character.intellect,
                    'cunning': character.cunning,
                    'willpower': character.willpower,
                    'presence': character.presence
                },
                'skills': character.skills,
                'campaign_id': str(character.campaign_id) if character.campaign_id else None
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/characters/<character_id>', methods=['DELETE'])
@auth_manager.require_auth
def delete_character(character_id):
    """Delete a character."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        character = db_manager.get_character_by_id(ObjectId(character_id))

        if not character or character.user_id != current_user_id:
            return jsonify({'error': 'Character not found or access denied'}), 404

        # Soft delete by marking as inactive
        if db_manager.update_character(ObjectId(character_id), {'is_active': False}):
            return jsonify({'message': 'Character deleted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to delete character'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/characters/<character_id>/award-xp', methods=['POST'])
@auth_manager.require_auth
def award_xp(character_id):
    """Award XP to character."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        character = db_manager.get_character_by_id(ObjectId(character_id))

        if not character:
            return jsonify({'error': 'Character not found'}), 404

        # Check permissions (owner or GM)
        can_modify = character.user_id == current_user_id
        if not can_modify and character.campaign_id:
            campaign = db_manager.get_campaign_by_id(character.campaign_id)
            can_modify = campaign and campaign.game_master_id == current_user_id

        if not can_modify:
            return jsonify({'error': 'Access denied'}), 403

        data = request.get_json()
        xp_amount = data.get('amount', 5)  # Default 5 XP

        new_total_xp = character.total_xp + xp_amount
        new_available_xp = character.available_xp + xp_amount

        if db_manager.update_character(ObjectId(character_id), {
            'total_xp': new_total_xp,
            'available_xp': new_available_xp
        }):
            return jsonify({
                'message': f'Awarded {xp_amount} XP',
                'totalXP': new_total_xp,
                'availableXP': new_available_xp
            }), 200
        else:
            return jsonify({'error': 'Failed to award XP'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/characters/<character_id>/characteristics/<characteristic>', methods=['POST'])
@auth_manager.require_auth
def modify_characteristic(character_id, characteristic):
    """Increase or decrease a characteristic."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        character = db_manager.get_character_by_id(ObjectId(character_id))

        if not character or character.user_id != current_user_id:
            return jsonify({'error': 'Character not found or access denied'}), 404

        data = request.get_json()
        action = data.get('action')  # 'increase' or 'decrease'

        # Get current value
        current_value = getattr(character, characteristic, 2)

        if action == 'increase':
            if current_value >= 5:
                return jsonify({'error': 'Characteristic already at maximum'}), 400

            # Calculate cost
            costs = {2: 30, 3: 40, 4: 50, 5: 60}
            cost = costs.get(current_value + 1, 60)

            if character.available_xp < cost:
                return jsonify({'error': 'Not enough XP'}), 400

            new_value = current_value + 1
            new_available_xp = character.available_xp - cost
            new_spent_xp = character.spent_xp + cost

        elif action == 'decrease':
            if current_value <= 1:
                return jsonify({'error': 'Characteristic already at minimum'}), 400

            # Calculate refund
            costs = {1: 30, 2: 30, 3: 40, 4: 50, 5: 60}
            refund = costs.get(current_value, 30)

            new_value = current_value - 1
            new_available_xp = character.available_xp + refund
            new_spent_xp = character.spent_xp - refund

        else:
            return jsonify({'error': 'Invalid action'}), 400

        # Update character
        updates = {
            characteristic: new_value,
            'available_xp': new_available_xp,
            'spent_xp': new_spent_xp
        }

        if db_manager.update_character(ObjectId(character_id), updates):
            return jsonify({
                'message': f'{characteristic.title()} {action}d successfully',
                'newValue': new_value,
                'availableXP': new_available_xp,
                'spentXP': new_spent_xp
            }), 200
        else:
            return jsonify({'error': 'Failed to update characteristic'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/characters/<character_id>/skills/<skill>', methods=['POST'])
@auth_manager.require_auth
def modify_skill(character_id, skill):
    """Increase or decrease a skill."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        character = db_manager.get_character_by_id(ObjectId(character_id))

        if not character or character.user_id != current_user_id:
            return jsonify({'error': 'Character not found or access denied'}), 404

        data = request.get_json()
        action = data.get('action')  # 'increase' or 'decrease'

        # Get current skill level
        current_level = character.skills.get(skill, {}).get('level', 0)

        if action == 'increase':
            if current_level >= 5:
                return jsonify({'error': 'Skill already at maximum'}), 400

            # Calculate cost (simplified: 5 XP per level)
            cost = 5

            if character.available_xp < cost:
                return jsonify({'error': 'Not enough XP'}), 400

            new_level = current_level + 1
            new_available_xp = character.available_xp - cost
            new_spent_xp = character.spent_xp + cost

        elif action == 'decrease':
            if current_level <= 0:
                return jsonify({'error': 'Skill already at minimum'}), 400

            refund = 5
            new_level = current_level - 1
            new_available_xp = character.available_xp + refund
            new_spent_xp = character.spent_xp - refund

        else:
            return jsonify({'error': 'Invalid action'}), 400

        # Update skills dict
        new_skills = character.skills.copy()
        if skill not in new_skills:
            new_skills[skill] = {}
        new_skills[skill]['level'] = new_level

        # Update character
        updates = {
            'skills': new_skills,
            'available_xp': new_available_xp,
            'spent_xp': new_spent_xp
        }

        if db_manager.update_character(ObjectId(character_id), updates):
            return jsonify({
                'message': f'{skill} {action}d successfully',
                'newLevel': new_level,
                'availableXP': new_available_xp,
                'spentXP': new_spent_xp
            }), 200
        else:
            return jsonify({'error': 'Failed to update skill'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Documentation Routes
@app.route('/api/docs/sections', methods=['GET'])
@auth_manager.require_auth
def get_documentation_sections():
    """Get documentation sections based on user role."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        user = db_manager.get_user_by_id(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Base documentation structure
        sections = {
            'player': [
                {
                    'id': 'character_creation',
                    'title': 'Character Creation Guide',
                    'description': 'Complete guide to creating Star Wars RPG characters',
                    'sections': [
                        {'id': 'species', 'title': 'Species Selection', 'content_type': 'species_guide'},
                        {'id': 'careers', 'title': 'Career Paths', 'content_type': 'career_guide'},
                        {'id': 'obligations', 'title': 'Obligations System', 'content_type': 'obligations_guide'},
                        {'id': 'creation_walkthrough', 'title': 'Step-by-Step Creation', 'content_type': 'walkthrough_guide'}
                    ]
                },
                {
                    'id': 'game_mechanics',
                    'title': 'Game Mechanics',
                    'description': 'Core rules and mechanics for players',
                    'sections': [
                        {'id': 'dice_system', 'title': 'Dice System', 'content_type': 'rules_basic'},
                        {'id': 'skill_checks', 'title': 'Skill Checks', 'content_type': 'rules_basic'},
                        {'id': 'combat_basics', 'title': 'Combat Basics', 'content_type': 'rules_basic'},
                        {'id': 'social_encounters', 'title': 'Social Encounters', 'content_type': 'rules_basic'}
                    ]
                },
                {
                    'id': 'equipment',
                    'title': 'Equipment Catalog',
                    'description': 'Weapons, armor, and gear available to characters',
                    'sections': [
                        {'id': 'weapons', 'title': 'Weapons', 'content_type': 'equipment_catalog'},
                        {'id': 'armor', 'title': 'Armor & Protection', 'content_type': 'equipment_catalog'},
                        {'id': 'gear', 'title': 'General Equipment', 'content_type': 'equipment_catalog'},
                        {'id': 'vehicles', 'title': 'Vehicles (Civilian)', 'content_type': 'equipment_catalog'}
                    ]
                }
            ]
        }

        # Add GM-only sections if user is GM or admin
        if user.role in ['gamemaster', 'admin']:
            sections['gamemaster'] = [
                {
                    'id': 'gm_resources',
                    'title': 'Game Master Resources',
                    'description': 'Tools and guides for running Star Wars RPG campaigns',
                    'sections': [
                        {'id': 'adversaries', 'title': 'NPCs & Adversaries', 'content_type': 'gm_only'},
                        {'id': 'adventures', 'title': 'Adventure Modules', 'content_type': 'gm_only'},
                        {'id': 'campaign_management', 'title': 'Campaign Management', 'content_type': 'gm_only'},
                        {'id': 'advanced_rules', 'title': 'Advanced Rules', 'content_type': 'gm_only'}
                    ]
                },
                {
                    'id': 'setting_secrets',
                    'title': 'Setting & Lore (GM)',
                    'description': 'Hidden lore and setting information for GMs',
                    'sections': [
                        {'id': 'secret_organizations', 'title': 'Secret Organizations', 'content_type': 'gm_only'},
                        {'id': 'hidden_locations', 'title': 'Hidden Locations', 'content_type': 'gm_only'},
                        {'id': 'restricted_tech', 'title': 'Restricted Technology', 'content_type': 'gm_only'},
                        {'id': 'plot_hooks', 'title': 'Plot Hooks & Seeds', 'content_type': 'gm_only'}
                    ]
                }
            ]

        # Add admin-only sections if user is admin
        if user.role == 'admin':
            sections['admin'] = [
                {
                    'id': 'system_docs',
                    'title': 'System Documentation',
                    'description': 'Technical documentation for system administration',
                    'sections': [
                        {'id': 'user_management', 'title': 'User Management', 'content_type': 'admin_only'},
                        {'id': 'campaign_oversight', 'title': 'Campaign Oversight', 'content_type': 'admin_only'},
                        {'id': 'system_maintenance', 'title': 'System Maintenance', 'content_type': 'admin_only'}
                    ]
                }
            ]

        return jsonify({
            'sections': sections,
            'user_role': user.role,
            'access_levels': ['player'] + (['gamemaster'] if user.role in ['gamemaster', 'admin'] else []) + (['admin'] if user.role == 'admin' else [])
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/docs/content/<section_id>/<content_id>', methods=['GET'])
@auth_manager.require_auth
def get_documentation_content(section_id, content_id):
    """Get specific documentation content based on user role."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        user = db_manager.get_user_by_id(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Sample content based on the analysis
        content_library = {
            'species_guide': {
                'species': {
                    'title': 'Species Selection Guide',
                    'content': '''
# Species Selection Guide

## Core Species Options

### Human
- **Characteristics**: Balanced starting characteristics (2 in all)
- **Starting XP**: 110 (highest of all species)
- **Special Abilities**: Extra skill rank during character creation
- **Recommended For**: New players, versatile builds

### Twi'lek
- **Characteristics**: High Cunning (3), Low Brawn (1)
- **Starting XP**: 100
- **Special Abilities**: Free rank in Charm or Deception
- **Recommended For**: Social characters, spies, diplomats

### Wookiee
- **Characteristics**: High Brawn (3), Low Willpower (1)
- **Starting XP**: 90
- **Special Abilities**: Powerful Build, Free rank in Brawl
- **Recommended For**: Warriors, mechanics, pilots

### Rodian
- **Characteristics**: High Agility (3), Low Willpower (1)
- **Starting XP**: 100
- **Special Abilities**: Expert Tracker, Free rank in Survival
- **Recommended For**: Bounty hunters, scouts, trackers

## Choosing Your Species

Consider these factors when selecting a species:
1. **Career Synergy**: Choose species that complement your intended career
2. **Role-Playing Opportunities**: Each species has unique cultural backgrounds
3. **Mechanical Benefits**: Starting characteristics and special abilities
4. **Campaign Setting**: Some species may be more or less common in your campaign
                    '''
                }
            },
            'career_guide': {
                'careers': {
                    'title': 'Career Paths Guide',
                    'content': '''
# Career Paths Guide

## Edge of the Empire Careers

### Bounty Hunter
- **Focus**: Tracking and capturing targets
- **Key Skills**: Athletics, Brawl, Ranged (Heavy), Vigilance
- **Specializations**: Assassin, Gadgeteer, Survivalist
- **Starting Credits**: 1000 + 1d10 × 50

### Smuggler
- **Focus**: Fast talking and faster ships
- **Key Skills**: Piloting (Space), Deception, Skulduggery, Streetwise
- **Specializations**: Pilot, Scoundrel, Thief
- **Starting Credits**: 1000 + 1d10 × 50

### Technician
- **Focus**: Fixing, building, and improving technology
- **Key Skills**: Mechanics, Computers, Knowledge (Outer Rim)
- **Specializations**: Mechanic, Outlaw Tech, Slicer
- **Starting Credits**: 1000 + 1d10 × 50

## Age of Rebellion Careers

### Ace
- **Focus**: Piloting and vehicle combat
- **Key Skills**: Piloting (Space/Planetary), Gunnery, Mechanics
- **Specializations**: Driver, Gunner, Pilot
- **Starting Credits**: 500 + 1d10 × 25

### Commander
- **Focus**: Leadership and tactics
- **Key Skills**: Leadership, Knowledge (Warfare), Cool, Discipline
- **Specializations**: Commodore, Squadron Leader, Tactician
- **Starting Credits**: 500 + 1d10 × 25

## Force and Destiny Careers

### Guardian
- **Focus**: Protection and lightsaber combat
- **Key Skills**: Brawl, Melee, Discipline, Vigilance
- **Specializations**: Protector, Soresu Defender, Warleader
- **Starting Credits**: 500 + 1d10 × 25

### Consular
- **Focus**: Negotiation and Force powers
- **Key Skills**: Discipline, Leadership, Negotiation, Knowledge (Lore)
- **Specializations**: Healer, Niman Disciple, Sage
- **Starting Credits**: 500 + 1d10 × 25
                    '''
                }
            },
            'obligations_guide': {
                'obligations': {
                    'title': 'Obligations System Guide',
                    'content': '''
# Obligations System Guide

## What are Obligations?

Obligations represent debts, commitments, or complications that tie your character to the galaxy. They create story hooks and can provide additional starting XP at character creation.

## Obligation Types

### Addiction
- **Value**: 10 (base)
- **XP Bonus**: +5
- **Description**: Character has an addiction that affects judgment and actions
- **Story Potential**: Need for the substance, withdrawal effects, dealers

### Debt
- **Value**: 10 (base)
- **XP Bonus**: +5
- **Description**: Character owes significant money or favors
- **Story Potential**: Creditors, payment deadlines, interest

### Bounty
- **Value**: 10 (base)
- **XP Bonus**: +5
- **Description**: Price on the character's head
- **Story Potential**: Bounty hunters, recognition, hiding identity

### Family
- **Value**: 10 (base)
- **XP Bonus**: +5
- **Description**: Family in danger or causing complications
- **Story Potential**: Rescue missions, family obligations, protection

## Using Obligations

### Character Creation
- **Single Obligation**: Standard 10 value, +5 starting XP
- **Multiple Obligations**: Can take up to 2, each worth +5 XP
- **Higher Values**: Increase obligation value for more XP (GM discretion)

### During Play
- **Obligation Triggers**: GM rolls at session start
- **Effects**: When triggered, creates complications for that character
- **Reducing Obligations**: Through play, characters can reduce or eliminate obligations

## Tips for Players

1. **Choose Meaningful Obligations**: Pick obligations that interest you story-wise
2. **Coordinate with GM**: Discuss how obligations fit into the campaign
3. **Embrace Complications**: Obligations create great story moments
4. **Work Toward Resolution**: Make reducing obligations a character goal
                    '''
                }
            }
        }

        # Check access permissions
        gm_only_content = ['adversaries', 'adventures', 'campaign_management', 'advanced_rules', 
                          'secret_organizations', 'hidden_locations', 'restricted_tech', 'plot_hooks']
        admin_only_content = ['user_management', 'campaign_oversight', 'system_maintenance']

        if content_id in gm_only_content and user.role not in ['gamemaster', 'admin']:
            return jsonify({'error': 'Access denied: Game Master access required'}), 403

        if content_id in admin_only_content and user.role != 'admin':
            return jsonify({'error': 'Access denied: Administrator access required'}), 403

        # Get content from library or return placeholder
        content = content_library.get(section_id, {}).get(content_id, {
            'title': f'{content_id.replace("_", " ").title()}',
            'content': f'Documentation for {content_id} is being prepared. Check back soon!'
        })

        return jsonify({
            'content': content,
            'section_id': section_id,
            'content_id': content_id,
            'user_role': user.role
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Admin Routes
@app.route('/api/admin/stats', methods=['GET'])
@auth_manager.require_role('admin')
def get_system_stats():
    """Get system statistics (admin only)."""
    try:
        # Get user count
        total_users = db_manager.users.count_documents({})
        
        # Get campaign count
        total_campaigns = db_manager.campaigns.count_documents({'is_active': True})
        
        # Get character count
        total_characters = db_manager.characters.count_documents({'is_active': True})
        
        # Get active sessions (simplified - just return a placeholder)
        active_sessions = 0  # TODO: Implement session tracking
        
        return jsonify({
            'total_users': total_users,
            'total_campaigns': total_campaigns,
            'total_characters': total_characters,
            'active_sessions': active_sessions
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users', methods=['GET'])
@auth_manager.require_role('admin')
def get_all_users():
    """Get all users (admin only)."""
    try:
        # Get all users with basic info
        users_cursor = db_manager.users.find({}, {
            'username': 1,
            'role': 1,
            'two_factor_enabled': 1,
            'created_at': 1,
            'is_active': 1,
            'last_login': 1
        })
        
        users = []
        for user_doc in users_cursor:
            users.append({
                'id': str(user_doc['_id']),
                'username': user_doc.get('username', ''),
                'role': user_doc.get('role', 'player'),
                'two_factor_enabled': user_doc.get('two_factor_enabled', False),
                'created_at': user_doc.get('created_at').isoformat() if user_doc.get('created_at') else None,
                'is_active': user_doc.get('is_active', True),
                'last_login': user_doc.get('last_login').isoformat() if user_doc.get('last_login') else None
            })
        
        return jsonify({'users': users}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<user_id>/role', methods=['POST'])
@auth_manager.require_role('admin')
def change_user_role(user_id):
    """Change user role (admin only)."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        target_user_id = ObjectId(user_id)
        
        # Don't allow changing own role
        if current_user_id == target_user_id:
            return jsonify({'error': 'Cannot change your own role'}), 400
        
        data = request.get_json()
        new_role = data.get('role')
        
        if new_role not in ['player', 'gamemaster', 'admin']:
            return jsonify({'error': 'Invalid role'}), 400
        
        # Update user role
        result = db_manager.update_user(target_user_id, {'role': new_role})
        
        if result:
            return jsonify({'message': 'User role updated successfully'}), 200
        else:
            return jsonify({'error': 'Failed to update user role'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/invite', methods=['POST'])
@auth_manager.require_role('admin')
def create_invite():
    """Create invite code (admin only)."""
    try:
        current_user_id = ObjectId(get_jwt_identity())
        data = request.get_json()

        role = data.get('role', 'player')
        expires_in_days = data.get('expires_in_days', 7)

        invite_code = auth_manager.generate_invite_code(current_user_id, role, expires_in_days)

        return jsonify({
            'invite_code': invite_code,
            'role': role,
            'expires_in_days': expires_in_days
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Utility functions
def calculate_level(character):
    """Calculate character level based on spent XP."""
    spent_xp = character.spent_xp
    return max(1, spent_xp // 25 + 1)

# Main routes - Dashboard and Landing
@app.route('/')
def index():
    """Main dashboard page with client-side authentication."""
    return render_template('index_with_auth.html')

@app.route('/welcome')
def welcome():
    """Welcome/landing page for unauthenticated users."""
    return render_template('index_with_auth.html')

# Authentication Pages
@app.route('/login')
def login_page():
    """Login page."""
    return render_template('login.html')

@app.route('/register')
def register_page():
    """Registration page."""
    return render_template('register.html')

# Character Management Pages
@app.route('/create')
@auth_manager.require_auth
def create_character_page():
    """Character creation page."""
    current_user_id = ObjectId(get_jwt_identity())
    current_user = db_manager.get_user_by_id(current_user_id)
    return render_template('create_character.html', current_user=current_user)

@app.route('/create-character')
@auth_manager.require_auth
def create_character_start():
    """Alias for character creation page to match template expectations."""
    return redirect(url_for('create_character_page'))

@app.route('/character/<character_id>')
@auth_manager.require_auth
def character_sheet_page(character_id):
    """Character sheet page."""
    current_user_id = ObjectId(get_jwt_identity())
    current_user = db_manager.get_user_by_id(current_user_id)
    
    # Verify access to character
    character = db_manager.get_character_by_id(ObjectId(character_id))
    if not character:
        return render_template('error.html', error_message='Character not found', current_user=current_user), 404
    
    # Check permissions
    if character.user_id != current_user_id:
        if character.campaign_id:
            campaign = db_manager.get_campaign_by_id(character.campaign_id)
            if not campaign or campaign.game_master_id != current_user_id:
                return render_template('error.html', error_message='Access denied', current_user=current_user), 403
        else:
            return render_template('error.html', error_message='Access denied', current_user=current_user), 403
    
    return render_template('character_sheet.html', character_id=character_id, current_user=current_user)

# Campaign Management
@app.route('/campaigns')
@auth_manager.require_auth
def campaigns_page():
    """Campaign management page."""
    current_user_id = ObjectId(get_jwt_identity())
    current_user = db_manager.get_user_by_id(current_user_id)
    return render_template('campaigns.html', current_user=current_user)

# Documentation
@app.route('/docs')
@auth_manager.require_auth
def documentation_page():
    """Documentation page with role-based access."""
    current_user_id = ObjectId(get_jwt_identity())
    current_user = db_manager.get_user_by_id(current_user_id)
    return render_template('documentation.html', current_user=current_user)

# User Profile
@app.route('/profile')
def profile_page():
    """User profile settings page - redirect to main app with profile hash."""
    return render_template('index_with_auth.html')

# Admin Panel
@app.route('/admin')
@auth_manager.require_role('admin')
def admin_page():
    """Admin panel page."""
    current_user_id = ObjectId(get_jwt_identity())
    current_user = db_manager.get_user_by_id(current_user_id)
    return render_template('admin.html', current_user=current_user)

# Legacy route for compatibility
@app.route('/main')
@auth_manager.require_auth
def main_dashboard():
    """Legacy main dashboard route - redirects to new dashboard."""
    return redirect(url_for('index'))

if __name__ == '__main__':
    # Create character data directory if it doesn't exist
    os.makedirs('character_data', exist_ok=True)

    # Use port 8080 to avoid macOS AirPlay conflicts on port 5000
    port = int(os.getenv('FLASK_PORT', 8080))
    
    print(f"🚀 Starting Star Wars RPG Character Manager on http://localhost:{port}")
    print("🔧 Set FLASK_PORT environment variable to use a different port")
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=port)
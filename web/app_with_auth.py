"""Enhanced Flask web application with authentication and MongoDB integration."""

import os
import sys
import secrets
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
from secure_error_handlers import setup_production_error_handlers, setup_production_logging

# Initialize character creator
creator = CharacterCreator()

load_dotenv()

def get_or_generate_secret_key(env_var_name, default_fallback):
    """Get secret key from environment or generate a secure one."""
    key = os.getenv(env_var_name, '').strip()
    
    # If key is empty or still the default fallback, generate a secure one
    if not key or key == default_fallback:
        # Generate a secure random key
        generated_key = secrets.token_urlsafe(32)
        print(f"🔐 Generated secure {env_var_name}: {generated_key[:8]}...")
        return generated_key
    
    return key

app = Flask(__name__)

# Configure secret keys with auto-generation for security
flask_secret = get_or_generate_secret_key('FLASK_SECRET_KEY', 'dev-key-change-in-production')
jwt_secret = get_or_generate_secret_key('JWT_SECRET_KEY', 'jwt-dev-key-change-in-production')

app.config['SECRET_KEY'] = flask_secret
app.config['JWT_SECRET_KEY'] = jwt_secret
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

print(f"🔐 Flask SECRET_KEY configured ({len(flask_secret)} chars)")
print(f"🔐 JWT SECRET_KEY configured ({len(jwt_secret)} chars)")

# CRITICAL: Disable all template caching to fix stale template issue
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.jinja_env.auto_reload = True
app.jinja_env.cache = {}

# Production configuration enforcement
if os.getenv('APP_ENV') == 'production':
    app.config['DEBUG'] = False
    app.config['TESTING'] = False
    app.config['PROPAGATE_EXCEPTIONS'] = False

# Initialize extensions
auth_manager.init_app(app)
social_auth_manager.init_app(app)
jwt = JWTManager(app)

# Setup production error handling
setup_production_error_handlers(app)
setup_production_logging(app)

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
            app.logger.info("✅ Database initialized successfully")
        except Exception as e:
            app.logger.error(f"❌ Failed to initialize database: {e}")

@app.after_request
def add_security_headers(response):
    """Add security headers to all responses."""
    # Add security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    return response

# Create WSGI middleware to override server header
class ServerHeaderMiddleware:
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app
    
    def __call__(self, environ, start_response):
        def custom_start_response(status, headers, exc_info=None):
            # Remove any existing server headers and add our custom one
            headers = [(name, value) for name, value in headers if name.lower() != 'server']
            headers.append(('Server', 'SWRPG-Manager'))
            return start_response(status, headers, exc_info)
        
        return self.wsgi_app(environ, custom_start_response)

# Wrap the Flask app with our middleware
app.wsgi_app = ServerHeaderMiddleware(app.wsgi_app)

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
        return jsonify({'error': 'Operation failed'}), 500



@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user."""
    try:
        # Better JSON parsing with error handling
        if not request.is_json:
            app.logger.error(f"Request is not JSON. Content-Type: {request.content_type}")
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json(force=True)
        if not data:
            app.logger.error("No JSON data received")
            return jsonify({'error': 'No data provided'}), 400
            
        app.logger.info(f"Login attempt for: {data.get('email', 'no-email')}")
        
        email = data.get('email')
        password = data.get('password')
        
        # Debug: Log password details (remove after fix)
        app.logger.info(f"Password received: length={len(password)} repr={repr(password)}")

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        app.logger.info(f"Attempting authentication for: {email}")
        
        # Debug: Check database connection in web app
        try:
            user_check = db_manager.get_user_by_email(email)
            if user_check:
                app.logger.info(f"User found in web app db: {user_check.username}")
                # Test password directly
                is_valid = auth_manager.verify_password(password, user_check.password_hash)
                app.logger.info(f"Password verification in web app: {is_valid}")
            else:
                app.logger.error("User not found in web app database")
        except Exception as e:
            app.logger.error(f"Database check failed: {e}")
        
        success, message, user = auth_manager.authenticate_user(email, password)
        app.logger.info(f"Authentication result: {success} - {message}")
        
        if user:
            app.logger.info(f"User found: {user.username} / {user.role}")
        else:
            app.logger.info("No user object returned")

        if not success:
            app.logger.warning(f"Authentication failed for {email}: {message}")
            return jsonify({'error': message}), 401


        # Create access token
        access_token = auth_manager.create_access_token(user)
        
        # Also set session for web navigation
        session['user_id'] = str(user._id)
        session['username'] = user.username
        session['role'] = user.role
        session['authenticated'] = True

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
        app.logger.error(f"Login error: {e}")
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@app.route('/api/auth/me', methods=['GET'])
@auth_manager.require_auth
def get_current_user():
    """Get current user information."""
    try:
        current_user_id = get_current_user_id()
        user = db_manager.get_user_by_id(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        response_data = {
            'id': str(user._id),
            'username': user.username,
            'email': user.email or 'clark@clarkeverson.com',  # Fallback for now
            'role': user.role,
        }
            
        # Only add created_at if it exists
        if user.created_at:
            response_data['created_at'] = user.created_at.isoformat()

        return jsonify(response_data), 200

    except Exception as e:
        app.logger.error(f"Get current user error: {e}")
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout user and clear session."""
    try:
        # Clear session data
        session.clear()
        return jsonify({'message': 'Logout successful'}), 200
    except Exception as e:
        app.logger.error(f"Logout error: {e}")
        return jsonify({'error': 'Logout failed'}), 500

@app.route('/api/auth/change-password', methods=['POST'])
@auth_manager.require_auth
def change_password():
    """Change user password."""
    try:
        current_user_id = get_current_user_id()
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
        return jsonify({'error': 'Operation failed'}), 500


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
        return redirect('/login?error=Google authentication failed')

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
        return redirect('/login?error=Discord authentication failed')

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
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/auth/social/link', methods=['POST'])
@auth_manager.require_auth
def link_social_account():
    """Link social account to existing user."""
    try:
        current_user_id = get_current_user_id()
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
        return jsonify({'error': 'Operation failed'}), 500

# Campaign Management Routes
@app.route('/api/campaigns', methods=['GET'])
@auth_manager.require_auth
def get_campaigns():
    """Get user's campaigns."""
    try:
        current_user_id = get_current_user_id()
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
        current_user_id = get_current_user_id()
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
        app.logger.error(f"Campaign creation error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/campaigns/<campaign_id>/invite', methods=['POST'])
@auth_manager.require_auth
def generate_campaign_invite(campaign_id):
    """Generate campaign invite code."""
    try:
        current_user_id = get_current_user_id()
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
        current_user_id = get_current_user_id()
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

# Health Check Route (for Docker)
@app.route('/health')
def health_check():
    """Health check endpoint for Docker."""
    try:
        # Test database connection
        if not db_manager.client:
            return jsonify({"status": "unhealthy", "error": "Database client not initialized"}), 503
        
        # Test with ping command
        result = db_manager.client.admin.command('ping')
        return jsonify({
            "status": "healthy", 
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected"
        }), 200
    except Exception as e:
        app.logger.error(f"Health check failed: {e}")
        return jsonify({"status": "unhealthy", "error": "Database connection failed"}), 503

# Character Management API Routes
@app.route('/api/characters', methods=['GET'])
@auth_manager.require_auth
def get_characters():
    """Get all characters for the current user."""
    try:
        current_user_id = get_current_user_id()
        user = db_manager.get_user_by_id(current_user_id)
        
        # Get characters from database
        characters = db_manager.get_user_characters(current_user_id)
        
        # Convert to dict format
        characters_data = []
        for char in characters:
            characters_data.append({
                'id': str(char._id),
                'name': char.name,
                'playerName': char.player_name,
                'species': char.species,
                'career': char.career,
                'background': char.background or '',
                'created_at': char.created_at.isoformat() if hasattr(char, 'created_at') else None
            })
        
        return jsonify({
            'characters': characters_data,
            'total': len(characters_data)
        })
        
    except Exception as e:
        app.logger.error(f"Error getting characters: {e}")
        return jsonify({'error': 'Failed to retrieve characters'}), 500

@app.route('/api/characters', methods=['POST'])
@auth_manager.require_auth
def create_character():
    """Create a new character."""
    try:
        current_user_id = get_current_user_id()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'playerName', 'species', 'career']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create character using the character creator
        character = creator.create_character(
            name=data['name'],
            player_name=data['playerName'],
            species=data['species'],
            career=data['career']
        )
        
        # Add background if provided
        if data.get('background'):
            character.background = data['background']
        
        # Save to database  
        # Add user_id to character before saving
        character.user_id = current_user_id
        character_id = db_manager.create_character(character)
        
        return jsonify({
            'message': 'Character created successfully',
            'character': {
                'id': str(character_id),
                'name': character.name,
                'playerName': character.player_name,
                'species': character.species,
                'career': character.career,
                'background': character.background or ''
            }
        }), 201
        
    except Exception as e:
        app.logger.error(f"Error creating character: {e}")
        return jsonify({'error': 'Failed to create character'}), 500

# Additional Character Management API Routes
@app.route('/api/characters/<character_id>', methods=['GET'])
@auth_manager.require_auth
def get_character_detail(character_id):
    """Get detailed character information."""
    try:
        current_user_id = get_current_user_id()
        character = db_manager.get_character_by_id(ObjectId(character_id))
        
        if not character:
            return jsonify({'error': 'Character not found'}), 404
            
        # Check if user owns this character or is admin
        current_user = db_manager.get_user_by_id(current_user_id)
        if character.user_id != current_user_id and current_user.role != 'admin':
            return jsonify({'error': 'Access denied'}), 403
            
        return jsonify({
            'id': str(character._id),
            'name': character.name,
            'player_name': character.player_name,
            'species': character.species,
            'career': character.career,
            'background': character.background,
            'brawn': character.brawn,
            'agility': character.agility,
            'intellect': character.intellect,
            'cunning': character.cunning,
            'willpower': character.willpower,
            'presence': character.presence,
            'total_xp': character.total_xp,
            'available_xp': character.available_xp,
            'spent_xp': character.spent_xp,
            'skills': character.skills,
            'talents': character.talents,
            'credits': character.credits,
            'equipment': character.equipment,
            'obligations': character.obligations,
            'creation_context': character.creation_context,
            'created_at': character.created_at.isoformat() if character.created_at else None,
            'updated_at': character.updated_at.isoformat() if character.updated_at else None,
            'campaign_id': str(character.campaign_id) if character.campaign_id else None
        }), 200
        
    except Exception as e:
        app.logger.error(f"Get character detail error: {str(e)}")
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/characters/<character_id>', methods=['PUT'])
@auth_manager.require_auth
def update_character(character_id):
    """Update character information."""
    try:
        current_user_id = get_current_user_id()
        character = db_manager.get_character_by_id(ObjectId(character_id))
        
        if not character:
            return jsonify({'error': 'Character not found'}), 404
            
        # Check if user owns this character
        if character.user_id != current_user_id:
            return jsonify({'error': 'Access denied'}), 403
            
        data = request.get_json()
        
        # Build update dictionary
        updates = {}
        updatable_fields = ['name', 'player_name', 'background', 'brawn', 'agility', 
                           'intellect', 'cunning', 'willpower', 'presence', 'credits',
                           'equipment', 'obligations', 'skills', 'talents']
        
        for field in updatable_fields:
            if field in data:
                updates[field] = data[field]
        
        if updates:
            success = db_manager.update_character(ObjectId(character_id), updates)
            if success:
                return jsonify({'message': 'Character updated successfully'}), 200
            else:
                return jsonify({'error': 'Failed to update character'}), 500
        else:
            return jsonify({'error': 'No valid fields to update'}), 400
            
    except Exception as e:
        app.logger.error(f"Update character error: {str(e)}")
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/characters/<character_id>', methods=['DELETE'])
@auth_manager.require_auth
def delete_character(character_id):
    """Delete character."""
    try:
        current_user_id = get_current_user_id()
        character = db_manager.get_character_by_id(ObjectId(character_id))
        
        if not character:
            return jsonify({'error': 'Character not found'}), 404
            
        # Check if user owns this character
        if character.user_id != current_user_id:
            return jsonify({'error': 'Access denied'}), 403
            
        # Mark character as inactive instead of deleting
        success = db_manager.update_character(ObjectId(character_id), {'is_active': False})
        
        if success:
            return jsonify({'message': 'Character deleted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to delete character'}), 500
            
    except Exception as e:
        app.logger.error(f"Delete character error: {str(e)}")
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/characters/<character_id>/award-xp', methods=['POST'])
@auth_manager.require_auth
def award_xp(character_id):
    """Award XP to a character."""
    try:
        current_user_id = get_current_user_id()
        character = db_manager.get_character_by_id(ObjectId(character_id))
        
        if not character:
            return jsonify({'error': 'Character not found'}), 404
            
        # Check if user owns this character or is GM of the campaign
        current_user = db_manager.get_user_by_id(current_user_id)
        can_award = (character.user_id == current_user_id or 
                    current_user.role == 'admin' or 
                    current_user.role == 'gamemaster')
        
        if not can_award:
            return jsonify({'error': 'Access denied'}), 403
            
        data = request.get_json()
        xp_amount = data.get('xp_amount', 0)
        reason = data.get('reason', 'XP Award')
        
        if xp_amount <= 0:
            return jsonify({'error': 'XP amount must be positive'}), 400
            
        # Award XP
        new_total_xp = character.total_xp + xp_amount
        new_available_xp = character.available_xp + xp_amount
        
        updates = {
            'total_xp': new_total_xp,
            'available_xp': new_available_xp
        }
        
        success = db_manager.update_character(ObjectId(character_id), updates)
        
        if success:
            return jsonify({
                'message': f'Awarded {xp_amount} XP for: {reason}',
                'total_xp': new_total_xp,
                'available_xp': new_available_xp
            }), 200
        else:
            return jsonify({'error': 'Failed to award XP'}), 500
            
    except Exception as e:
        app.logger.error(f"Award XP error: {str(e)}")
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/characters/<character_id>/advance-skill', methods=['POST'])
@auth_manager.require_auth
def advance_skill(character_id):
    """Advance a character's skill."""
    try:
        current_user_id = get_current_user_id()
        character = db_manager.get_character_by_id(ObjectId(character_id))
        
        if not character:
            return jsonify({'error': 'Character not found'}), 404
            
        # Check if user owns this character
        if character.user_id != current_user_id:
            return jsonify({'error': 'Access denied'}), 403
            
        data = request.get_json()
        skill_name = data.get('skill_name')
        
        if not skill_name or skill_name not in character.skills:
            return jsonify({'error': 'Invalid skill name'}), 400
            
        current_rank = character.skills[skill_name].get('rank', 0)
        new_rank = current_rank + 1
        
        if new_rank > 5:
            return jsonify({'error': 'Skill rank cannot exceed 5'}), 400
            
        # Calculate XP cost (5 * new rank)
        xp_cost = 5 * new_rank
        
        if character.available_xp < xp_cost:
            return jsonify({'error': f'Insufficient XP. Need {xp_cost}, have {character.available_xp}'}), 400
            
        # Update skill and XP
        character.skills[skill_name]['rank'] = new_rank
        new_available_xp = character.available_xp - xp_cost
        new_spent_xp = character.spent_xp + xp_cost
        
        updates = {
            'skills': character.skills,
            'available_xp': new_available_xp,
            'spent_xp': new_spent_xp
        }
        
        success = db_manager.update_character(ObjectId(character_id), updates)
        
        if success:
            return jsonify({
                'message': f'Advanced {skill_name} to rank {new_rank}',
                'skill_name': skill_name,
                'new_rank': new_rank,
                'xp_cost': xp_cost,
                'available_xp': new_available_xp
            }), 200
        else:
            return jsonify({'error': 'Failed to advance skill'}), 500
            
    except Exception as e:
        app.logger.error(f"Advance skill error: {str(e)}")
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/characters/<character_id>/advance-characteristic', methods=['POST'])
@auth_manager.require_auth
def advance_characteristic(character_id):
    """Advance a character's characteristic."""
    try:
        current_user_id = get_current_user_id()
        character = db_manager.get_character_by_id(ObjectId(character_id))
        
        if not character:
            return jsonify({'error': 'Character not found'}), 404
            
        # Check if user owns this character
        if character.user_id != current_user_id:
            return jsonify({'error': 'Access denied'}), 403
            
        data = request.get_json()
        characteristic_name = data.get('characteristic_name')
        
        valid_characteristics = ['brawn', 'agility', 'intellect', 'cunning', 'willpower', 'presence']
        if characteristic_name not in valid_characteristics:
            return jsonify({'error': 'Invalid characteristic name'}), 400
            
        current_value = getattr(character, characteristic_name)
        new_value = current_value + 1
        
        if new_value > 6:
            return jsonify({'error': 'Characteristic cannot exceed 6'}), 400
            
        # Calculate XP cost based on new value
        xp_costs = {3: 30, 4: 40, 5: 50, 6: 60}
        xp_cost = xp_costs.get(new_value, 10)
        
        if character.available_xp < xp_cost:
            return jsonify({'error': f'Insufficient XP. Need {xp_cost}, have {character.available_xp}'}), 400
            
        # Update characteristic and XP
        new_available_xp = character.available_xp - xp_cost
        new_spent_xp = character.spent_xp + xp_cost
        
        updates = {
            characteristic_name: new_value,
            'available_xp': new_available_xp,
            'spent_xp': new_spent_xp
        }
        
        success = db_manager.update_character(ObjectId(character_id), updates)
        
        if success:
            return jsonify({
                'message': f'Advanced {characteristic_name} to {new_value}',
                'characteristic_name': characteristic_name,
                'new_value': new_value,
                'xp_cost': xp_cost,
                'available_xp': new_available_xp
            }), 200
        else:
            return jsonify({'error': 'Failed to advance characteristic'}), 500
            
    except Exception as e:
        app.logger.error(f"Advance characteristic error: {str(e)}")
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/characters/<character_id>/assign-campaign', methods=['POST'])
@auth_manager.require_auth
def assign_character_to_campaign(character_id):
    """Assign character to a campaign."""
    try:
        current_user_id = get_current_user_id()
        character = db_manager.get_character_by_id(ObjectId(character_id))
        
        if not character:
            return jsonify({'error': 'Character not found'}), 404
            
        # Check if user owns this character
        if character.user_id != current_user_id:
            return jsonify({'error': 'Access denied'}), 403
            
        data = request.get_json()
        campaign_id = data.get('campaign_id')
        
        if not campaign_id:
            return jsonify({'error': 'Campaign ID is required'}), 400
            
        # Verify campaign exists and user is a member
        campaign = db_manager.get_campaign_by_id(ObjectId(campaign_id))
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
            
        if current_user_id not in campaign.players and campaign.game_master_id != current_user_id:
            return jsonify({'error': 'You are not a member of this campaign'}), 403
            
        # Assign character to campaign
        success = db_manager.assign_character_to_campaign(ObjectId(character_id), ObjectId(campaign_id))
        
        if success:
            return jsonify({
                'message': 'Character assigned to campaign successfully',
                'campaign_id': campaign_id,
                'campaign_name': campaign.name
            }), 200
        else:
            return jsonify({'error': 'Failed to assign character to campaign'}), 500
            
    except Exception as e:
        app.logger.error(f"Assign character to campaign error: {str(e)}")
        return jsonify({'error': 'Operation failed'}), 500

# Character Data API Routes
@app.route('/api/character-data/species', methods=['GET'])
def get_species_data():
    """Get all species data for character creation."""
    try:
        # This would normally come from the extracted SWRPG data
        # For now, return a basic structure with key species
        species_data = [
            {
                'name': 'Human',
                'description': 'Versatile and adaptable, humans are found throughout the galaxy.',
                'characteristics': {'brawn': 2, 'agility': 2, 'intellect': 2, 'cunning': 2, 'willpower': 2, 'presence': 2},
                'wound_threshold': 10,
                'strain_threshold': 10,
                'starting_xp': 110,
                'special_abilities': ['Extra Skill Rank', 'Extra Career Skill']
            },
            {
                'name': 'Twi\'lek',
                'description': 'Graceful humanoids with distinctive head-tails called lekku.',
                'characteristics': {'brawn': 1, 'agility': 2, 'intellect': 2, 'cunning': 3, 'willpower': 2, 'presence': 2},
                'wound_threshold': 9,
                'strain_threshold': 11,
                'starting_xp': 100,
                'special_abilities': ['Natural Charm']
            },
            {
                'name': 'Wookiee',
                'description': 'Tall, strong, and covered in fur, Wookiees are known for their loyalty.',
                'characteristics': {'brawn': 3, 'agility': 2, 'intellect': 2, 'cunning': 2, 'willpower': 1, 'presence': 2},
                'wound_threshold': 14,
                'strain_threshold': 8,
                'starting_xp': 90,
                'special_abilities': ['Wookiee Rage', 'Natural Weapon']
            },
            {
                'name': 'Rodian',
                'description': 'Green-skinned hunters with excellent tracking abilities.',
                'characteristics': {'brawn': 2, 'agility': 3, 'intellect': 2, 'cunning': 2, 'willpower': 1, 'presence': 2},
                'wound_threshold': 10,
                'strain_threshold': 9,
                'starting_xp': 100,
                'special_abilities': ['Expert Tracker']
            },
            {
                'name': 'Zabrak',
                'description': 'Horned humanoids known for their mental discipline and endurance.',
                'characteristics': {'brawn': 2, 'agility': 2, 'intellect': 2, 'cunning': 2, 'willpower': 3, 'presence': 1},
                'wound_threshold': 10,
                'strain_threshold': 12,
                'starting_xp': 100,
                'special_abilities': ['Mental Fortitude']
            }
        ]
        
        return jsonify({'species': species_data}), 200
        
    except Exception as e:
        app.logger.error(f"Get species data error: {str(e)}")
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/character-data/careers', methods=['GET'])
def get_careers_data():
    """Get all careers data for character creation."""
    try:
        # This would normally come from the extracted SWRPG data
        # For now, return a basic structure with key careers
        careers_data = [
            {
                'name': 'Guardian',
                'description': 'Protectors and defenders, often serving as bodyguards or peacekeepers.',
                'career_skills': ['Brawl', 'Discipline', 'Melee', 'Resilience', 'Vigilance', 'Cool'],
                'game_line': 'Force and Destiny',
                'specializations': ['Protector', 'Soresu Defender', 'Peacekeeper']
            },
            {
                'name': 'Bounty Hunter',
                'description': 'Trackers and hunters who pursue targets for credits.',
                'career_skills': ['Athletics', 'Brawl', 'Perception', 'Piloting', 'Ranged Heavy', 'Streetwise'],
                'game_line': 'Edge of the Empire',
                'specializations': ['Assassin', 'Gadgeteer', 'Survivalist']
            },
            {
                'name': 'Smuggler',
                'description': 'Pilots and traders who work in the shadows of the galaxy.',
                'career_skills': ['Coordination', 'Deception', 'Knowledge', 'Piloting', 'Streetwise', 'Vigilance'],
                'game_line': 'Edge of the Empire',
                'specializations': ['Pilot', 'Scoundrel', 'Thief']
            },
            {
                'name': 'Diplomat',
                'description': 'Skilled negotiators and representatives of the Rebel Alliance.',
                'career_skills': ['Charm', 'Deception', 'Knowledge', 'Leadership', 'Negotiation', 'Vigilance'],
                'game_line': 'Age of Rebellion',
                'specializations': ['Ambassador', 'Agitator', 'Quartermaster']
            },
            {
                'name': 'Technician',
                'description': 'Engineers and mechanics who keep equipment running.',
                'career_skills': ['Astrogation', 'Computers', 'Coordination', 'Discipline', 'Knowledge', 'Mechanics'],
                'game_line': 'Edge of the Empire',
                'specializations': ['Mechanic', 'Outlaw Tech', 'Slicer']
            }
        ]
        
        return jsonify({'careers': careers_data}), 200
        
    except Exception as e:
        app.logger.error(f"Get careers data error: {str(e)}")
        return jsonify({'error': 'Operation failed'}), 500

# Basic Admin API Routes
@app.route('/api/admin/stats', methods=['GET'])
@auth_manager.require_role('admin')
def get_admin_stats():
    """Get system statistics for admin dashboard."""
    try:
        # Basic stats - would be expanded with more detailed information
        stats = {
            'total_users': 1,  # Placeholder
            'total_characters': 0,  # Placeholder
            'total_campaigns': 0,  # Placeholder
            'active_sessions': 1,  # Placeholder
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        app.logger.error(f"Get admin stats error: {str(e)}")
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/admin/users', methods=['GET'])
@auth_manager.require_role('admin')
def get_all_users():
    """Get all users for admin management."""
    try:
        # This would return basic user information for admin management
        # For now, return empty array as placeholder
        users = []
        
        return jsonify({'users': users, 'total': len(users)}), 200
        
    except Exception as e:
        app.logger.error(f"Get all users error: {str(e)}")
        return jsonify({'error': 'Operation failed'}), 500

def get_current_user_id():
    """Get current user ID from either JWT token or session."""
    try:
        # Try JWT first
        jwt_identity = get_jwt_identity()
        if jwt_identity:
            return ObjectId(jwt_identity)
    except:
        pass
    
    # Fall back to session
    user_id = session.get('user_id')
    if user_id:
        return ObjectId(user_id)
    
    raise Exception("No authenticated user found")

# Main routes - Dashboard and Landing
@app.route('/')
def index():
    """Main dashboard page with client-side authentication."""
    return render_template('index_with_auth.html')

@app.route('/campaigns')
@auth_manager.require_auth
def campaigns_page():
    """Campaign management page."""
    try:
        current_user_id = get_current_user_id()
        current_user = db_manager.get_user_by_id(current_user_id)
        return render_template('campaigns.html', current_user=current_user)
    except Exception as e:
        app.logger.error(f"Error loading campaigns page: {e}")
        return redirect(url_for('login_page'))

@app.route('/login')
def login_page():
    """Login page."""
    return render_template('login.html')

@app.route('/admin')
@auth_manager.require_auth
def admin_page():
    """Admin panel page."""
    try:
        current_user_id = get_current_user_id()
        current_user = db_manager.get_user_by_id(current_user_id)
        
        # Check if user is admin
        if not current_user or current_user.role != 'admin':
            return redirect(url_for('index'))
        
        return render_template('admin.html', current_user=current_user)
    except Exception as e:
        app.logger.error(f"Error loading admin page: {e}")
        return redirect(url_for('login_page'))

@app.route('/profile')
@auth_manager.require_auth
def profile_page():
    """User profile page."""
    try:
        current_user_id = get_current_user_id()
        current_user = db_manager.get_user_by_id(current_user_id)
        return render_template('profile.html', current_user=current_user)
    except Exception as e:
        app.logger.error(f"Error loading profile page: {e}")
        return redirect(url_for('login_page'))

@app.route('/character/<character_id>')
@auth_manager.require_auth
def character_detail_page(character_id):
    """Character detail page."""
    try:
        current_user_id = get_current_user_id()
        character = db_manager.get_character_by_id(ObjectId(character_id))
        
        if not character:
            return render_template('error.html', 
                                 error_code=404, 
                                 error_message='Character not found'), 404
            
        # Check if user owns this character or is admin
        current_user = db_manager.get_user_by_id(current_user_id)
        if character.user_id != current_user_id and current_user.role != 'admin':
            return render_template('error.html', 
                                 error_code=403, 
                                 error_message='Access denied'), 403
            
        return render_template('character_sheet.html', 
                             character=character,
                             user=current_user)
        
    except Exception as e:
        app.logger.error(f"Character detail page error: {str(e)}")
        return render_template('error.html', 
                             error_code=500, 
                             error_message='Internal server error'), 500

@app.route('/create-character')
@auth_manager.require_auth
def create_character_start():
    """Character creation page."""
    try:
        current_user_id = get_current_user_id()
        current_user = db_manager.get_user_by_id(current_user_id)
        return render_template('create_character_fixed.html', current_user=current_user)
    except Exception as e:
        app.logger.error(f"Error loading character creation page: {e}")
        return redirect(url_for('login_page'))

if __name__ == '__main__':
    # Create character data directory if it doesn't exist
    os.makedirs('character_data', exist_ok=True)

    # Use port 8080 to avoid macOS AirPlay conflicts on port 5000
    port = int(os.getenv('FLASK_PORT', 8080))
    
    print(f"🚀 Starting Star Wars RPG Character Manager on http://localhost:{port}")
    print("🔧 Set FLASK_PORT environment variable to use a different port")
    
    # Run the Flask app
    app.run(debug=False, host='0.0.0.0', port=port)
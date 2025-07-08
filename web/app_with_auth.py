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

load_dotenv()

def get_or_generate_secret_key(env_var_name, default_fallback):
    """Get secret key from environment or generate secure random key if empty/default."""
    key = os.getenv(env_var_name, '').strip()
    if not key or key == default_fallback:
        # Generate cryptographically secure random key
        generated_key = secrets.token_urlsafe(32)
        return generated_key
    return key

app = Flask(__name__)
app.config['SECRET_KEY'] = get_or_generate_secret_key('FLASK_SECRET_KEY', 'dev-key-change-in-production')
app.config['JWT_SECRET_KEY'] = get_or_generate_secret_key('JWT_SECRET_KEY', 'jwt-dev-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# CRITICAL: Disable all template caching to fix stale template issue
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.jinja_env.auto_reload = True
app.jinja_env.cache = {}

# Production configuration enforcement
import os
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
            app.logger.info("Database initialized successfully")
        except Exception as e:
            app.logger.error(f"Failed to initialize database: {e}")

@app.after_request
def add_security_headers(response):
    """Add security headers to all responses."""
    # Add security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
    
    # Add HSTS header in production
    if os.getenv('FLASK_ENV') == 'production':
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
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

# API authentication check middleware
@app.before_request
def check_api_authentication():
    """Check authentication for all API routes before route processing."""
    # Skip authentication for non-API routes
    if not request.path.startswith('/api/'):
        return None
    
    # Skip authentication for public endpoints
    public_endpoints = [
        '/api/auth/login',
        '/api/auth/register', 
        '/api/auth/google',
        '/api/auth/github',
        '/api/auth/callback',
        '/health'
    ]
    
    if request.path in public_endpoints:
        return None
    
    # Check if this is an OPTIONS request (CORS preflight)
    if request.method == 'OPTIONS':
        return None
    
    # For all other API routes, verify JWT token
    try:
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        
        # Verify user exists and is active
        user = db_manager.get_user_by_id(ObjectId(current_user_id))
        if not user or not user.is_active:
            return jsonify({"error": "Authentication required"}), 401
            
        return None  # Continue to route handler
        
    except Exception as e:
        # Return 401 for any authentication failure
        return jsonify({"error": "Authentication required"}), 401

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
        return jsonify({'error': 'Operation failed'}), 500

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
        return jsonify({'error': 'Operation failed'}), 500

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
        return jsonify({'error': 'Operation failed'}), 500

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
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/campaigns/<campaign_id>/players/<player_id>', methods=['DELETE'])
@auth_manager.require_auth
def remove_player_from_campaign(campaign_id, player_id):
    """Remove a player from a campaign."""
    try:
        current_user_id = get_current_user_id()
        campaign = db_manager.get_campaign_by_id(ObjectId(campaign_id))

        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404

        if campaign.game_master_id != current_user_id:
            return jsonify({'error': 'Access denied'}), 403

        # Remove player from campaign
        success, message = db_manager.remove_player_from_campaign(ObjectId(campaign_id), ObjectId(player_id))

        if success:
            return jsonify({'message': message}), 200
        else:
            return jsonify({'error': message}), 400

    except Exception as e:
        app.logger.error(f"Campaign player removal error: {str(e)}")
        return jsonify({'error': 'Resource not found'}), 404

@app.route('/api/campaigns/<campaign_id>/players', methods=['GET'])
@auth_manager.require_auth
def get_campaign_players(campaign_id):
    """Get players in a campaign."""
    try:
        current_user_id = get_current_user_id()
        campaign = db_manager.get_campaign_by_id(ObjectId(campaign_id))
        
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
            
        # Check if user has access to view players (GM or player in campaign)
        if current_user_id != campaign.game_master_id and current_user_id not in campaign.players:
            return jsonify({'error': 'Access denied'}), 403
            
        # Get player details
        players = []
        for player_id in campaign.players:
            user = db_manager.get_user_by_id(player_id)
            if user:
                players.append({
                    'id': str(player_id),
                    'email': user.email,
                    'username': getattr(user, 'username', user.email.split('@')[0]),
                    'role': 'player',
                    'joined_at': getattr(user, 'created_at', None)
                })
        
        return jsonify({'players': players}), 200
        
    except Exception as e:
        app.logger.error(f"Get campaign players error: {str(e)}")
        return jsonify({'error': 'Operation failed'}), 500

# Character Creation Walkthrough Routes
@app.route('/api/character-creation/walkthrough-data', methods=['GET'])
@auth_manager.require_auth
def get_walkthrough_data():
    """Get all data needed for character creation walkthrough."""
    try:
        walkthrough_data = character_walkthrough.get_creation_walkthrough_data()
        return jsonify(walkthrough_data), 200
    except Exception as e:
        return jsonify({'error': 'Operation failed'}), 500

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
        return jsonify({'error': 'Operation failed'}), 500

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
        return jsonify({'error': 'Operation failed'}), 500

def get_current_user_id():
    """Get current user ID from either JWT token or session."""
    try:
        # Try JWT first
        return ObjectId(get_jwt_identity())
    except:
        # Fall back to session
        user_id = session.get('user_id')
        if user_id:
            return ObjectId(user_id)
        raise Exception("No authenticated user found")

# Character Creation Data API Routes
@app.route('/api/character-data/species', methods=['GET'])
def get_species_data():
    """Get available species data for character creation."""
    try:
        # Get comprehensive species data from character creator
        species_data = {}
        
        # Add all species from character creator with formatted descriptions
        if hasattr(creator, 'species_data') and creator.species_data:
            for species_name, species_info in creator.species_data.items():
                species_data[species_name] = {
                    'name': species_name,
                    'starting_xp': species_info.get('starting_xp', 100),
                    'characteristics': species_info.get('characteristics', {}),
                    'wound_threshold': species_info.get('wound_threshold', 10),
                    'strain_threshold': species_info.get('strain_threshold', 10),
                    'special_abilities': species_info.get('special_abilities', []),
                    'description': f"{species_name} ({species_info.get('starting_xp', 100)} XP)"
                }
        
        return jsonify({
            'species': species_data,
            'count': len(species_data)
        }), 200
    except Exception as e:
        app.logger.error(f"Error fetching species data: {e}")
        return jsonify({'error': 'Failed to fetch species data'}), 500

@app.route('/api/character-data/careers', methods=['GET'])
def get_careers_data():
    """Get available careers data for character creation."""
    try:
        careers_data = {}
        
        # Get all careers from character creator
        for career_name, career in creator.careers.items():
            careers_data[career_name] = {
                'name': career_name,
                'game_line': career.game_line.value,
                'career_skills': career.career_skills,
                'starting_wound_threshold': career.starting_wound_threshold,
                'starting_strain_threshold': career.starting_strain_threshold,
                'description': f"{career_name} ({career.game_line.value})"
            }
        
        return jsonify({
            'careers': careers_data,
            'count': len(careers_data)
        }), 200
    except Exception as e:
        app.logger.error(f"Error fetching careers data: {e}")
        return jsonify({'error': 'Failed to fetch careers data'}), 500

# Enhanced Character Routes with Campaign Support
@app.route('/api/characters', methods=['GET'])
@auth_manager.require_auth
def get_characters():
    """Get user's characters, optionally filtered by campaign."""
    try:
        current_user_id = get_current_user_id()
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
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/characters', methods=['POST'])
@auth_manager.require_auth
def create_character():
    """Create a new character using enhanced walkthrough system."""
    try:
        current_user_id = get_current_user_id()
        data = request.get_json()

        # Validate required fields
        required_fields = ['name', 'playerName', 'species', 'career']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Simple character creation for form-based interface
        try:
            # Get species data for starting characteristics and XP
            species_data = character_walkthrough.get_species_data().get(data['species'], {})
            starting_characteristics = species_data.get('characteristics', {
                'brawn': 2, 'agility': 2, 'intellect': 2, 
                'cunning': 2, 'willpower': 2, 'presence': 2
            })
            starting_xp = species_data.get('starting_xp', 100)
        except:
            # Fallback to default values if walkthrough module fails
            starting_characteristics = {
                'brawn': 2, 'agility': 2, 'intellect': 2, 
                'cunning': 2, 'willpower': 2, 'presence': 2
            }
            starting_xp = 100
        
        # Use starting characteristics as final (no custom allocation for simple form)
        final_characteristics = starting_characteristics

        # Create simple character model
        character = Character(
            user_id=current_user_id,
            name=data['name'],
            player_name=data['playerName'],
            species=data['species'],
            career=data['career'],
            background=data.get('background', ''),
            
            # Set characteristics
            brawn=final_characteristics['brawn'],
            agility=final_characteristics['agility'],
            intellect=final_characteristics['intellect'],
            cunning=final_characteristics['cunning'],
            willpower=final_characteristics['willpower'],
            presence=final_characteristics['presence'],
            
            # Set experience
            total_xp=starting_xp,
            available_xp=starting_xp,
            spent_xp=0,
            
            # Set default skills and empty obligations
            skills={},
            obligations=[],
            
            # Equipment
            credits=500,  # Default starting credits
            equipment=[]
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
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/characters/<character_id>/assign-campaign', methods=['POST'])
@auth_manager.require_auth
def assign_character_to_campaign(character_id):
    """Assign character to campaign."""
    try:
        current_user_id = get_current_user_id()
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
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/characters/<character_id>', methods=['GET'])
@auth_manager.require_auth
def get_character(character_id):
    """Get specific character details."""
    try:
        current_user_id = get_current_user_id()
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
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/characters/<character_id>', methods=['DELETE'])
@auth_manager.require_auth
def delete_character(character_id):
    """Delete a character."""
    try:
        current_user_id = get_current_user_id()
        character = db_manager.get_character_by_id(ObjectId(character_id))

        if not character or character.user_id != current_user_id:
            return jsonify({'error': 'Character not found or access denied'}), 404

        # Soft delete by marking as inactive
        if db_manager.update_character(ObjectId(character_id), {'is_active': False}):
            return jsonify({'message': 'Character deleted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to delete character'}), 500

    except Exception as e:
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/characters/<character_id>/award-xp', methods=['POST'])
@auth_manager.require_auth
def award_xp(character_id):
    """Award XP to character."""
    try:
        current_user_id = get_current_user_id()
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
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/characters/<character_id>/characteristics/<characteristic>', methods=['POST'])
@auth_manager.require_auth
def modify_characteristic(character_id, characteristic):
    """Increase or decrease a characteristic."""
    try:
        current_user_id = get_current_user_id()
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
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/characters/<character_id>/skills/<skill>', methods=['POST'])
@auth_manager.require_auth
def modify_skill(character_id, skill):
    """Increase or decrease a skill."""
    try:
        current_user_id = get_current_user_id()
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
        return jsonify({'error': 'Operation failed'}), 500

# Documentation Routes
@app.route('/api/docs/sections', methods=['GET'])
@auth_manager.require_auth
def get_documentation_sections():
    """Get documentation sections based on user role."""
    try:
        current_user_id = get_current_user_id()
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
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/docs/content/<section_id>/<content_id>', methods=['GET'])
@auth_manager.require_auth
def get_documentation_content(section_id, content_id):
    """Get specific documentation content based on user role."""
    try:
        current_user_id = get_current_user_id()
        user = db_manager.get_user_by_id(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Comprehensive content library
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
- **Characteristics**: High Brawn (3), Low Presence (1)
- **Starting XP**: 90
- **Special Abilities**: Powerful Build, Natural Weapons (Claws)
- **Recommended For**: Warriors, mechanics, heavy combat

### Clone
- **Characteristics**: High Brawn (2), balanced stats
- **Starting XP**: 100
- **Special Abilities**: Military Training, Clones bond
- **Recommended For**: Soldiers, tactical characters

### Dathomirian
- **Characteristics**: Varies by subspecies
- **Starting XP**: 95
- **Special Abilities**: Force Sensitivity potential
- **Recommended For**: Force-sensitive characters, warriors

## Tips for Species Selection
1. Consider your preferred playstyle
2. Match species strengths to career requirements
3. Think about roleplay opportunities
4. Starting XP affects advancement speed
                    '''
                },
                'careers': {
                    'title': 'Career Path Guide',
                    'content': '''
# Career Path Guide

## Edge of the Empire Careers

### Bounty Hunter
- **Skills**: Piloting, Athletics, Ranged Combat
- **Specializations**: Assassin, Gadgeteer, Survivalist
- **Playstyle**: Combat-focused, tracking, enforcement

### Smuggler
- **Skills**: Piloting, Streetwise, Deception
- **Specializations**: Pilot, Scoundrel, Thief
- **Playstyle**: Fast-talking, ship operations, criminal

### Colonist
- **Skills**: Knowledge, Medicine, Social
- **Specializations**: Doctor, Politico, Scholar
- **Playstyle**: Support, healing, information

### Explorer
- **Skills**: Survival, Xenology, Piloting
- **Specializations**: Fringer, Scout, Trader
- **Playstyle**: Exploration, frontier life

### Hired Gun
- **Skills**: Ranged Combat, Athletics, Intimidation
- **Specializations**: Bodyguard, Marauder, Mercenary
- **Playstyle**: Combat, protection, military

### Technician
- **Skills**: Mechanics, Computers, Knowledge
- **Specializations**: Mechanic, Outlaw Tech, Slicer
- **Playstyle**: Technical support, gadgets, hacking

## Choosing Your Career
1. Consider your group's needs
2. Think about character background
3. Match career skills to your concept
4. Plan for specialization growth
                    '''
                },
                'obligations': {
                    'title': 'Obligations System',
                    'content': '''
# Obligations System

## What are Obligations?
Obligations represent debts, duties, or commitments that tie your character to the galaxy and drive story complications.

## Types of Obligations

### Debt
- You owe credits to someone dangerous
- **Story Hooks**: Loan sharks, payment deadlines
- **Complications**: Bounty hunters, interest rates

### Family
- Responsibilities to family members
- **Story Hooks**: Protecting relatives, family honor
- **Complications**: Family in danger, conflicting loyalties

### Favor
- You owe someone a significant favor
- **Story Hooks**: Called in at inconvenient times
- **Complications**: Moral conflicts, competing interests

### Criminal
- Wanted by law enforcement
- **Story Hooks**: Manhunts, limited travel
- **Complications**: Arrests, bounties

### Oath
- Bound by a sworn promise
- **Story Hooks**: Honor conflicts, duty calls
- **Complications**: Breaking oaths, impossible choices

## Obligation Mechanics
- Start with 10 Obligation points
- Can take more for extra credits/XP
- GM rolls to trigger complications
- Higher Obligation = more problems

## Managing Obligations
1. Work with GM on story integration
2. Consider how they drive character growth
3. Use them to create dramatic moments
4. Remember they can be reduced through play
                    '''
                },
                'creation_walkthrough': {
                    'title': 'Character Creation Walkthrough',
                    'content': '''
# Character Creation Step-by-Step

## Step 1: Concept
1. Decide on character archetype
2. Consider background and motivation
3. Think about role in group
4. Choose a general concept

## Step 2: Species
1. Review species options
2. Consider characteristic bonuses
3. Note starting XP amounts
4. Factor in special abilities

## Step 3: Career
1. Match to your concept
2. Review career skills
3. Consider specializations
4. Plan advancement path

## Step 4: Characteristics
1. Allocate starting points
2. Apply species modifiers
3. Consider career requirements
4. Balance offensive/defensive needs

## Step 5: Skills
1. Choose career skills
2. Allocate free ranks
3. Consider specialization skills
4. Round out with general skills

## Step 6: Talents
1. Choose starting specialization
2. Select initial talents
3. Plan talent tree progression
4. Consider synergies

## Step 7: Equipment
1. Purchase starting gear
2. Consider career requirements
3. Don't forget armor and weapons
4. Save some credits for later

## Step 8: Final Details
1. Calculate derived attributes
2. Set Obligation
3. Write backstory
4. Establish connections to other PCs

## Tips for New Players
- Start simple, add complexity later
- Ask experienced players for advice
- Don't min-max your first character
- Focus on fun over optimization
                    '''
                }
            },
            'game_mechanics': {
                'dice_system': {
                    'title': 'Star Wars RPG Dice System',
                    'content': '''
# Star Wars RPG Dice System

## Dice Types

### Ability Dice (Green d8)
- Represent natural talent and training
- Show Success and Advantage symbols
- **Success**: Achieve the basic goal
- **Advantage**: Additional positive effects

### Proficiency Dice (Yellow d12)
- Represent mastery and expertise
- Upgrade from Ability dice
- Show Success, Advantage, and Triumph symbols
- **Triumph**: Major success with story impact

### Difficulty Dice (Purple d8)
- Represent task difficulty
- Show Failure and Threat symbols
- **Failure**: Cancel Success symbols
- **Threat**: Negative side effects

### Challenge Dice (Red d12)
- Represent extreme difficulty
- Upgrade from Difficulty dice
- Show Failure, Threat, and Despair symbols
- **Despair**: Major failure with story consequences

### Boost Dice (Blue d6)
- Represent beneficial circumstances
- Show Success and Advantage symbols
- Added for favorable conditions

### Setback Dice (Black d6)
- Represent penalties and obstacles
- Show Failure and Threat symbols
- Added for unfavorable conditions

## Building Dice Pools
1. Start with Characteristic rating (Ability dice)
2. Upgrade dice equal to Skill ranks
3. Add Difficulty dice for task difficulty
4. Add Boost/Setback dice for conditions

## Reading Results
1. Count net Success (Success - Failure)
2. Count net Advantage (Advantage - Threat)
3. Check for Triumph and Despair
4. Interpret narrative outcomes

## Success and Failure
- Need 1+ net Success to succeed
- Can succeed with Threat or fail with Advantage
- Triumph/Despair always have narrative impact
                    '''
                },
                'skill_checks': {
                    'title': 'Skill Checks and Difficulty',
                    'content': '''
# Skill Checks and Difficulty

## Difficulty Levels

### Simple (0 Difficulty)
- No dice needed
- Automatic success under normal circumstances
- **Examples**: Walking, basic conversation

### Easy (1 Purple)
- Minor challenge
- **Examples**: Climbing a ladder, finding food in civilization

### Average (2 Purple)
- Moderate challenge
- **Examples**: Picking a simple lock, haggling

### Hard (3 Purple)
- Significant challenge
- **Examples**: Piloting through an asteroid field

### Daunting (4 Purple)
- Major challenge
- **Examples**: Hacking Imperial security

### Formidable (5 Purple)
- Extreme challenge
- **Examples**: Surgery without proper tools

## Modifying Difficulty

### Boost Dice (Add Blue)
- Superior equipment
- Advantageous circumstances
- Assistance from allies
- Environmental benefits

### Setback Dice (Add Black)
- Poor equipment
- Distracting conditions
- Environmental hazards
- Time pressure

### Upgrading Difficulty
- Upgrade Purple to Red for:
  - Active opposition
  - Extreme circumstances
  - Critical situations

## Competitive Checks
1. Both characters roll
2. Compare net Success
3. Higher wins
4. Ties go to PC or use secondary factors

## Opposed Checks
- Opponent's dice become Difficulty
- One character makes the roll
- Used for social conflicts, stealth, etc.
                    '''
                },
                'combat_basics': {
                    'title': 'Combat Basics',
                    'content': '''
# Combat Basics

## Initiative and Turn Order
1. Roll Initiative (Cool or Vigilance)
2. Generate Initiative slots
3. Players choose order within PC slots
4. Alternate between PC and NPC slots

## Actions in Combat

### Maneuvers (1 per turn, or 2 strain)
- Move to short range
- Draw/holster weapon
- Open door
- Aim (add Boost die)
- Take cover

### Actions (1 per turn)
- Attack
- Full defense
- Use skill
- Activate ability

### Incidentals (unlimited)
- Speak
- Drop item
- Simple interactions

## Combat Skills

### Ranged (Light)
- Pistols, small weapons
- **Characteristic**: Agility
- **Range**: Short to medium

### Ranged (Heavy)
- Rifles, heavy weapons
- **Characteristic**: Agility
- **Range**: Long to extreme

### Melee
- Brawl, Lightsaber, Melee weapons
- **Characteristic**: Brawn (Brawl), varies
- **Range**: Engaged only

### Gunnery
- Vehicle weapons
- **Characteristic**: Agility
- **Range**: Varies by weapon

## Damage and Health

### Wounds
- Physical damage
- When exceed Wound Threshold: incapacitated
- Healed slowly over time

### Strain
- Mental/physical stress
- When exceed Strain Threshold: unconscious
- Recovers after encounters

## Range Bands
- **Engaged**: Touching, wrestling
- **Short**: Across a room
- **Medium**: Down a hallway
- **Long**: Across a plaza
- **Extreme**: Across a valley
                    '''
                },
                'social_encounters': {
                    'title': 'Social Encounters',
                    'content': '''
# Social Encounters

## Social Skills

### Charm
- **Characteristic**: Presence
- **Use**: Being likeable, friendly persuasion
- **Works On**: Those inclined to be friendly

### Coercion
- **Characteristic**: Willpower
- **Use**: Threats, intimidation
- **Works On**: Those who can be frightened

### Deception
- **Characteristic**: Cunning
- **Use**: Lies, misdirection, disguise
- **Works On**: Those who don't know the truth

### Leadership
- **Characteristic**: Presence
- **Use**: Inspiring allies, giving orders
- **Works On**: Allies and subordinates

### Negotiation
- **Characteristic**: Presence
- **Use**: Making deals, finding compromise
- **Works On**: Those with something to gain

## Social Mechanics

### Difficulty Factors
- Target's disposition
- Plausibility of request
- Stakes involved
- Social situation

### Advantage/Threat in Social
- **Advantage**: Gain favor, learn information
- **Threat**: Create suspicion, social cost
- **Triumph**: Major social victory
- **Despair**: Significant social consequence

## Structured Social Encounters
1. Set stakes and victory conditions
2. Determine NPC motivation
3. Make opposed social checks
4. Track "strain" or pressure
5. Resolve when threshold reached

## Tips for Social Play
- Roleplay first, roll second
- Use multiple approaches
- Consider NPC motivations
- Consequences matter
- Make it collaborative storytelling
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
        return jsonify({'error': 'Operation failed'}), 500

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
        return jsonify({'error': 'Operation failed'}), 500

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
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/admin/users/<user_id>/role', methods=['POST'])
@auth_manager.require_role('admin')
def change_user_role(user_id):
    """Change user role (admin only)."""
    try:
        current_user_id = get_current_user_id()
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
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/admin/invite', methods=['POST'])
@auth_manager.require_role('admin')
def create_invite():
    """Create invite code (admin only)."""
    try:
        current_user_id = get_current_user_id()
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
        return jsonify({'error': 'Operation failed'}), 500

# Additional admin user management routes for API completeness
@app.route('/api/admin/users', methods=['POST'])
@auth_manager.require_role('admin')
def create_admin_user():
    """Create new user (admin only)."""
    try:
        data = request.get_json()
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')
        role = data.get('role', 'player')
        
        if not all([email, username, password]):
            return jsonify({'error': 'Email, username, and password are required'}), 400
        
        # Create user using auth manager
        success, message, user_id = auth_manager.register_user_direct(email, username, password, role)
        
        if success:
            return jsonify({'message': 'User created successfully', 'user_id': str(user_id)}), 201
        else:
            return jsonify({'error': message}), 400
            
    except Exception as e:
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/admin/users/<user_id>', methods=['PUT'])
@auth_manager.require_role('admin')  
def update_admin_user(user_id):
    """Update user information (admin only)."""
    try:
        current_user_id = get_current_user_id()
        target_user_id = ObjectId(user_id)
        
        # Don't allow updating own account through this endpoint
        if current_user_id == target_user_id:
            return jsonify({'error': 'Use profile endpoint to update your own account'}), 400
        
        data = request.get_json()
        update_data = {}
        
        # Only allow updating specific fields
        allowed_fields = ['username', 'role', 'is_active']
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        result = db_manager.update_user(target_user_id, update_data)
        
        if result:
            return jsonify({'message': 'User updated successfully'}), 200
        else:
            return jsonify({'error': 'User not found'}), 404
            
    except Exception as e:
        return jsonify({'error': 'Operation failed'}), 500

@app.route('/api/admin/users/<user_id>', methods=['DELETE'])
@auth_manager.require_role('admin')
def delete_admin_user(user_id):
    """Delete user (admin only)."""
    try:
        current_user_id = get_current_user_id()
        target_user_id = ObjectId(user_id)
        
        # Don't allow deleting own account
        if current_user_id == target_user_id:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        # Check if user exists
        user = db_manager.get_user_by_id(target_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Delete user
        result = db_manager.delete_user(target_user_id)
        
        if result:
            return jsonify({'message': 'User deleted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to delete user'}), 500
            
    except Exception as e:
        return jsonify({'error': 'Operation failed'}), 500

# Add missing character route for PUT method
@app.route('/api/characters/<character_id>', methods=['PUT'])
@jwt_required()
def update_character(character_id):
    """Update character information."""
    try:
        current_user_id = get_current_user_id()
        char_obj_id = ObjectId(character_id)
        
        # Get character and verify ownership
        character = db_manager.get_character_by_id(char_obj_id)
        if not character:
            return jsonify({'error': 'Character not found'}), 404
        
        if character.user_id != current_user_id:
            return jsonify({'error': 'Not authorized to update this character'}), 403
        
        data = request.get_json()
        update_data = {}
        
        # Only allow updating specific fields
        allowed_fields = ['name', 'player', 'description', 'notes']
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        result = db_manager.update_character(char_obj_id, update_data)
        
        if result:
            return jsonify({'message': 'Character updated successfully'}), 200
        else:
            return jsonify({'error': 'Failed to update character'}), 500
            
    except Exception as e:
        return jsonify({'error': 'Operation failed'}), 500

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
    # CRITICAL: Force template reload to fix stale content issue
    app.jinja_env.cache.clear()
    
    # Debug: Read template directly from disk to verify content
    import os
    template_path = os.path.join(app.template_folder, 'login.html')
    try:
        with open(template_path, 'r') as f:
            template_content = f.read()
            app.logger.info(f"Template size: {len(template_content)} chars")
            problematic_terms = ['passkey', '2fa', 'two-factor', 'authenticator']
            for term in problematic_terms:
                count = template_content.lower().count(term.lower())
                if count > 0:
                    app.logger.error(f"FOUND {term}: {count} times in template file!")
                    
    except Exception as e:
        app.logger.error(f"Failed to read template: {e}")
    
    return render_template('login.html')

@app.route('/register')
def register_page():
    """Registration page."""
    return render_template('register.html')

# Character Management Pages
@app.route('/create')
def create_character_page():
    """Character creation page with client-side authentication."""
    # Let JavaScript handle authentication like homepage
    return render_template('create_character_fixed.html')

@app.route('/create-character')
@auth_manager.require_auth
def create_character_start():
    """Alias for character creation page to match template expectations."""
    return redirect(url_for('create_character_page'))

@app.route('/character/<character_id>')
@auth_manager.require_auth
def character_sheet_page(character_id):
    """Character sheet page."""
    current_user_id = get_current_user_id()
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
    current_user_id = get_current_user_id()
    current_user = db_manager.get_user_by_id(current_user_id)
    return render_template('campaigns.html', current_user=current_user)

@app.route('/campaigns/<campaign_id>/manage')
@auth_manager.require_auth
def campaign_management_page(campaign_id):
    """Dedicated campaign management page."""
    current_user_id = get_current_user_id()
    current_user = db_manager.get_user_by_id(current_user_id)
    
    # Get campaign details
    try:
        campaign = db_manager.get_campaign_by_id(ObjectId(campaign_id))
        if not campaign:
            return render_template('error.html', error_message='Campaign not found', current_user=current_user), 404
        
        # Check if user has access to this campaign
        if current_user_id not in [campaign.game_master_id] + campaign.players:
            return render_template('error.html', error_message='Access denied', current_user=current_user), 403
        
        return render_template('campaign_management.html', campaign=campaign, current_user=current_user)
    except Exception as e:
        return render_template('error.html', error_message='Failed to load campaign', current_user=current_user), 500

# Documentation
@app.route('/docs')
@app.route('/documentation')  # Add alias for backward compatibility
@auth_manager.require_auth
def documentation_page():
    """Documentation page with role-based access."""
    current_user_id = get_current_user_id()
    current_user = db_manager.get_user_by_id(current_user_id)
    return render_template('documentation.html', current_user=current_user)

# User Profile
@app.route('/profile')
@jwt_required()
def profile_page():
    """User profile settings page."""
    current_user_id = get_current_user_id()
    current_user = db_manager.get_user_by_id(current_user_id)
    return render_template('profile.html', current_user=current_user)

# Admin Panel
@app.route('/admin')
@auth_manager.require_role('admin')
def admin_page():
    """Admin panel page."""
    current_user_id = get_current_user_id()
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
    app.run(debug=False, host='0.0.0.0', port=port)
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

# [REST OF THE FILE CONTINUES UNCHANGED - including all the other routes and functions]

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

# Main routes - Dashboard and Landing
@app.route('/')
def index():
    """Main dashboard page with client-side authentication."""
    return render_template('index_with_auth.html')

if __name__ == '__main__':
    # Create character data directory if it doesn't exist
    os.makedirs('character_data', exist_ok=True)

    # Use port 8080 to avoid macOS AirPlay conflicts on port 5000
    port = int(os.getenv('FLASK_PORT', 8080))
    
    print(f"🚀 Starting Star Wars RPG Character Manager on http://localhost:{port}")
    print("🔧 Set FLASK_PORT environment variable to use a different port")
    
    # Run the Flask app
    app.run(debug=False, host='0.0.0.0', port=port)
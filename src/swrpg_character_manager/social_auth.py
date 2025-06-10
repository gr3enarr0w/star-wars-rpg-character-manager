"""Social authentication module for Google and Discord login."""

import os
import secrets
import requests
from typing import Optional, Tuple, Dict, Any
from urllib.parse import urlencode
from flask import request, session, redirect, url_for
from authlib.integrations.flask_client import OAuth


class SocialAuthManager:
    """Manage social authentication for Google and Discord."""
    
    def __init__(self, app=None):
        self.oauth = None
        self.google = None
        self.discord = None
        
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize social authentication with Flask app."""
        self.oauth = OAuth(app)
        
        # Configure Google OAuth
        if os.getenv('GOOGLE_CLIENT_ID') and os.getenv('GOOGLE_CLIENT_SECRET'):
            self.google = self.oauth.register(
                name='google',
                client_id=os.getenv('GOOGLE_CLIENT_ID'),
                client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
                server_metadata_url='https://accounts.google.com/.well-known/openid_configuration',
                client_kwargs={
                    'scope': 'openid email profile'
                }
            )
        
        # Configure Discord OAuth
        if os.getenv('DISCORD_CLIENT_ID') and os.getenv('DISCORD_CLIENT_SECRET'):
            self.discord = self.oauth.register(
                name='discord',
                client_id=os.getenv('DISCORD_CLIENT_ID'),
                client_secret=os.getenv('DISCORD_CLIENT_SECRET'),
                authorization_url='https://discord.com/api/oauth2/authorize',
                token_url='https://discord.com/api/oauth2/token',
                client_kwargs={
                    'scope': 'identify email'
                }
            )
    
    def generate_state_token(self) -> str:
        """Generate secure state token for OAuth flow."""
        state = secrets.token_urlsafe(32)
        session['oauth_state'] = state
        return state
    
    def verify_state_token(self, received_state: str) -> bool:
        """Verify OAuth state token to prevent CSRF attacks."""
        stored_state = session.get('oauth_state')
        if not stored_state or stored_state != received_state:
            return False
        
        # Clear state token after use
        session.pop('oauth_state', None)
        return True
    
    def get_google_login_url(self, redirect_uri: str) -> Optional[str]:
        """Get Google OAuth login URL."""
        if not self.google:
            return None
        
        state = self.generate_state_token()
        return self.google.authorize_redirect(
            redirect_uri=redirect_uri,
            state=state
        ).location
    
    def get_discord_login_url(self, redirect_uri: str) -> Optional[str]:
        """Get Discord OAuth login URL."""
        if not self.discord:
            return None
        
        state = self.generate_state_token()
        params = {
            'client_id': os.getenv('DISCORD_CLIENT_ID'),
            'redirect_uri': redirect_uri,
            'response_type': 'code',
            'scope': 'identify email',
            'state': state
        }
        
        return f"https://discord.com/api/oauth2/authorize?{urlencode(params)}"
    
    def handle_google_callback(self) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """Handle Google OAuth callback."""
        try:
            # Verify state token
            state = request.args.get('state')
            if not self.verify_state_token(state):
                return False, "Invalid state token", None
            
            if not self.google:
                return False, "Google OAuth not configured", None
            
            # Get access token
            token = self.google.authorize_access_token()
            
            # Get user info
            user_info = token.get('userinfo')
            if not user_info:
                resp = self.google.parse_id_token(token)
                user_info = resp
            
            # Extract user data
            user_data = {
                'google_id': user_info['sub'],
                'email': user_info['email'],
                'name': user_info.get('name', ''),
                'picture': user_info.get('picture', ''),
                'verified_email': user_info.get('email_verified', False)
            }
            
            return True, "Google authentication successful", user_data
            
        except Exception as e:
            return False, f"Google authentication failed: {str(e)}", None
    
    def handle_discord_callback(self) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """Handle Discord OAuth callback."""
        try:
            # Verify state token
            state = request.args.get('state')
            if not self.verify_state_token(state):
                return False, "Invalid state token", None
            
            # Get authorization code
            code = request.args.get('code')
            if not code:
                return False, "No authorization code received", None
            
            # Exchange code for access token
            token_data = {
                'client_id': os.getenv('DISCORD_CLIENT_ID'),
                'client_secret': os.getenv('DISCORD_CLIENT_SECRET'),
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': request.base_url,
            }
            
            token_response = requests.post(
                'https://discord.com/api/oauth2/token',
                data=token_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            if not token_response.ok:
                return False, "Failed to get access token from Discord", None
            
            token_info = token_response.json()
            access_token = token_info['access_token']
            
            # Get user information
            user_response = requests.get(
                'https://discord.com/api/users/@me',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            
            if not user_response.ok:
                return False, "Failed to get user info from Discord", None
            
            user_info = user_response.json()
            
            # Extract user data
            user_data = {
                'discord_id': user_info['id'],
                'email': user_info.get('email'),
                'username': user_info['username'],
                'discriminator': user_info.get('discriminator'),
                'avatar': user_info.get('avatar'),
                'verified': user_info.get('verified', False)
            }
            
            return True, "Discord authentication successful", user_data
            
        except Exception as e:
            return False, f"Discord authentication failed: {str(e)}", None
    
    def link_social_account(self, user_id, provider: str, social_data: Dict[str, Any]) -> bool:
        """Link social account to existing user."""
        try:
            from .database import db_manager
            
            updates = {}
            if provider == 'google':
                updates['google_id'] = social_data['google_id']
            elif provider == 'discord':
                updates['discord_id'] = social_data['discord_id']
            
            return db_manager.update_user(user_id, updates)
            
        except Exception as e:
            print(f"Failed to link {provider} account: {e}")
            return False
    
    def find_user_by_social_id(self, provider: str, social_id: str):
        """Find user by social media ID."""
        try:
            from .database import db_manager
            
            if provider == 'google':
                return db_manager.users.find_one({'google_id': social_id})
            elif provider == 'discord':
                return db_manager.users.find_one({'discord_id': social_id})
            
            return None
            
        except Exception as e:
            print(f"Failed to find user by {provider} ID: {e}")
            return None
    
    def create_user_from_social(self, provider: str, social_data: Dict[str, Any], 
                              invite_code: Optional[str] = None) -> Tuple[bool, str, Optional[str]]:
        """Create new user from social login data."""
        try:
            from .database import db_manager, User
            from .auth import auth_manager
            from .security import audit_log
            
            # Validate invite code if provided
            if invite_code:
                invite = db_manager.get_invite_code(invite_code)
                if not invite:
                    return False, "Invalid or expired invite code", None
            
            # Generate username from social data
            if provider == 'google':
                email = social_data['email']
                base_username = social_data.get('name', email.split('@')[0])
                social_id = social_data['google_id']
            elif provider == 'discord':
                email = social_data.get('email')
                base_username = social_data['username']
                social_id = social_data['discord_id']
                
                if not email:
                    return False, "Email required for account creation", None
            else:
                return False, "Unsupported social provider", None
            
            # Ensure unique username
            username = base_username.replace(' ', '').lower()
            counter = 1
            while db_manager.get_user_by_username(username):
                username = f"{base_username.replace(' ', '').lower()}{counter}"
                counter += 1
            
            # Check if email already exists
            existing_user = db_manager.get_user_by_email(email)
            if existing_user:
                # Link social account to existing user
                if self.link_social_account(existing_user._id, provider, social_data):
                    return True, "Social account linked to existing user", str(existing_user._id)
                else:
                    return False, "Failed to link social account", None
            
            # Create new user
            user = User(
                username=username,
                email=email,
                password_hash="",  # No password for social login
                role=invite.role if invite_code else "player"
            )
            
            # Add social ID
            if provider == 'google':
                user.google_id = social_id
            elif provider == 'discord':
                user.discord_id = social_id
            
            user_id = db_manager.create_user(user)
            
            # Mark invite code as used
            if invite_code:
                db_manager.use_invite_code(invite_code, user_id)
            
            # Log successful social registration
            audit_log.log_data_access(str(user_id), f"{provider}_registration", "user_creation", True)
            
            return True, f"User created successfully via {provider}", str(user_id)
            
        except Exception as e:
            print(f"Failed to create user from {provider} login: {e}")
            return False, f"Failed to create user: {str(e)}", None


# Global social auth manager instance
social_auth_manager = SocialAuthManager()
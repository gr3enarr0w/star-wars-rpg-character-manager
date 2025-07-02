"""Authentication and authorization system for Star Wars RPG Character Manager."""

import secrets
import string
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, List, Tuple, Any
from functools import wraps
from flask import request, jsonify, current_app, redirect, url_for
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, verify_jwt_in_request
from bson import ObjectId

from .database import db_manager, User, InviteCode

bcrypt = Bcrypt()

class AuthManager:
    """Authentication and authorization manager."""
    
    def __init__(self, app=None):
        self.app = app
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize with Flask app."""
        self.app = app
        bcrypt.init_app(app)
        self.jwt = JWTManager(app)
    
    # Password management
    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt."""
        return bcrypt.generate_password_hash(password).decode('utf-8')
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify a password against its hash."""
        return bcrypt.check_password_hash(password_hash, password)
    
    def generate_secure_password(self, length: int = 20) -> str:
        """Generate a secure random password."""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    def validate_password_strength(self, password: str) -> Tuple[bool, List[str]]:
        """Validate password meets security requirements."""
        errors = []
        
        if len(password) < 20:
            errors.append("Password must be at least 20 characters long")
        
        if not any(c.isupper() for c in password):
            errors.append("Password must contain at least one uppercase letter")
        
        if not any(c.islower() for c in password):
            errors.append("Password must contain at least one lowercase letter")
        
        if not any(c.isdigit() for c in password):
            errors.append("Password must contain at least one number")
        
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            errors.append("Password must contain at least one special character")
        
        return len(errors) == 0, errors
    
    # User registration and authentication
    def register_user(self, email: str, username: str, password: str, invite_code: str) -> Tuple[bool, str, Optional[ObjectId]]:
        """Register a new user with invite code."""
        # Validate invite code
        invite = db_manager.get_invite_code(invite_code)
        if not invite:
            return False, "Invalid or expired invite code", None
        
        # Check if user already exists
        if db_manager.get_user_by_email(email):
            return False, "Email already registered", None
        
        if db_manager.get_user_by_username(username):
            return False, "Username already taken", None
        
        # Validate password
        is_valid, errors = self.validate_password_strength(password)
        if not is_valid:
            return False, "; ".join(errors), None
        
        # Create user
        user = User(
            email=email,
            username=username,
            password_hash=self.hash_password(password),
            role=invite.role
        )
        
        try:
            user_id = db_manager.create_user(user)
            db_manager.use_invite_code(invite_code, user_id)
            return True, "User registered successfully", user_id
        except Exception as e:
            return False, f"Registration failed: {str(e)}", None
    
    def authenticate_user(self, email: str, password: str) -> Tuple[bool, str, Optional[User]]:
        """Authenticate user with email and password."""
        user = db_manager.get_user_by_email(email)
        if not user:
            return False, "Invalid email or password", None
        
        if not user.is_active:
            return False, "Account is disabled", None
        
        if not self.verify_password(password, user.password_hash):
            return False, "Invalid email or password", None
        
        return True, "Authentication successful", user
    
    def create_access_token(self, user: User) -> str:
        """Create JWT access token for user."""
        additional_claims = {
            "user_id": str(user._id),
            "username": user.username,
            "role": user.role,
            "email": user.email
        }
        return create_access_token(
            identity=str(user._id),
            additional_claims=additional_claims
        )
    
    # Invite code management
    def generate_invite_code(self, created_by: ObjectId, role: str = "player", expires_in_days: int = 7) -> str:
        """Generate invite code."""
        code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(12))
        
        invite = InviteCode(
            code=code,
            created_by=created_by,
            role=role,
            expires_at=datetime.now(timezone.utc) + timedelta(days=expires_in_days)
        )
        
        db_manager.create_invite_code(invite)
        return code
    
    def generate_campaign_invite(self, campaign_id: ObjectId, created_by: ObjectId, expires_in_days: int = 7) -> str:
        """Generate campaign invite code."""
        code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(12))
        
        # Store campaign invite in database
        db_manager.create_campaign_invite(code, campaign_id, created_by, expires_in_days)
        return code
    
    # Authorization decorators
    def require_auth(self, f):
        """Decorator to require authentication."""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # Try JWT authentication first
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                
                # Verify user exists and is active
                user = db_manager.get_user_by_id(ObjectId(current_user_id))
                if not user or not user.is_active:
                    raise Exception("User not found or inactive")
                
                return f(*args, **kwargs)
            except Exception as e:
                # Check if this is an API route
                if request.path.startswith('/api/'):
                    return jsonify({"error": "Authentication required"}), 401
                else:
                    # For page routes, redirect to login
                    return redirect(url_for('login_page'))
        return decorated_function
    
    def require_role(self, *allowed_roles):
        """Decorator to require specific role(s)."""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                try:
                    verify_jwt_in_request()
                    current_user_id = get_jwt_identity()
                    
                    user = db_manager.get_user_by_id(ObjectId(current_user_id))
                    if not user or user.role not in allowed_roles:
                        if request.path.startswith('/api/'):
                            return jsonify({"error": "Insufficient permissions"}), 403
                        else:
                            return redirect(url_for('dashboard'))
                    
                    return f(*args, **kwargs)
                except Exception as e:
                    if request.path.startswith('/api/'):
                        return jsonify({"error": "Authentication required"}), 401
                    else:
                        return redirect(url_for('login_page'))
            return decorated_function
        return decorator
    
    def require_campaign_access(self, f):
        """Decorator to require access to specific campaign."""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                
                # Get campaign_id from request
                campaign_id = request.view_args.get('campaign_id') or request.form.get('campaign_id') or request.json.get('campaign_id')
                if not campaign_id:
                    return jsonify({"error": "Campaign ID required"}), 400
                
                campaign = db_manager.get_campaign_by_id(ObjectId(campaign_id))
                if not campaign:
                    return jsonify({"error": "Campaign not found"}), 404
                
                user_obj_id = ObjectId(current_user_id)
                if user_obj_id != campaign.game_master_id and user_obj_id not in campaign.players:
                    return jsonify({"error": "Access denied to this campaign"}), 403
                
                return f(*args, **kwargs)
            except Exception as e:
                # Check if this is an API route
                if request.path.startswith('/api/'):
                    return jsonify({"error": "Authentication required"}), 401
                else:
                    # For page routes, redirect to login
                    return redirect(url_for('login_page'))
        return decorated_function

# Global auth manager instance
auth_manager = AuthManager()
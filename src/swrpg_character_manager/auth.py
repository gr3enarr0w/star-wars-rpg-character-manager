"""Authentication and authorization system for Star Wars RPG Character Manager."""

import secrets
import string
import pyotp
import qrcode
from io import BytesIO
import base64
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, List, Tuple
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
    
    # Two-Factor Authentication
    def setup_2fa(self, user_id: ObjectId) -> Tuple[str, str, List[str]]:
        """Set up 2FA for user. Returns secret, QR code data URL, and backup codes."""
        secret = pyotp.random_base32()
        user = db_manager.get_user_by_id(user_id)
        
        # Generate QR code
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.email,
            issuer_name="Star Wars RPG Manager"
        )
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = BytesIO()
        img.save(buffered)
        img_str = base64.b64encode(buffered.getvalue()).decode()
        qr_data_url = f"data:image/png;base64,{img_str}"
        
        # Generate backup codes
        backup_codes = [self.generate_backup_code() for _ in range(10)]
        
        # Save to database (but don't enable 2FA yet - user needs to verify)
        db_manager.update_user(user_id, {
            "two_factor_secret": secret,
            "backup_codes": backup_codes
        })
        
        return secret, qr_data_url, backup_codes
    
    def verify_2fa_setup(self, user_id: ObjectId, token: str) -> bool:
        """Verify 2FA setup token and enable 2FA."""
        user = db_manager.get_user_by_id(user_id)
        if not user.two_factor_secret:
            return False
        
        totp = pyotp.TOTP(user.two_factor_secret)
        if totp.verify(token):
            db_manager.update_user(user_id, {"two_factor_enabled": True})
            return True
        return False
    
    def verify_2fa_token(self, user: User, token: str) -> bool:
        """Verify 2FA token for login."""
        if not user.two_factor_enabled:
            return True  # 2FA not enabled
        
        # Check TOTP token
        totp = pyotp.TOTP(user.two_factor_secret)
        if totp.verify(token):
            return True
        
        # Check backup codes
        if token in user.backup_codes:
            # Remove used backup code
            remaining_codes = [code for code in user.backup_codes if code != token]
            db_manager.update_user(user._id, {"backup_codes": remaining_codes})
            return True
        
        return False
    
    def generate_backup_code(self) -> str:
        """Generate a backup code for 2FA."""
        return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
    
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
                return f(*args, **kwargs)
            except Exception as e:
                # Check if this is an API route
                if request.path.startswith('/api/'):
                    return jsonify({"error": "Authentication required"}), 401
                else:
                    # For page routes, check session authentication
                    from flask import session
                    if session.get('authenticated') and session.get('user_id'):
                        return f(*args, **kwargs)
                    else:
                        # Redirect to login if not authenticated
                        return redirect(url_for('login_page'))
        return decorated_function
    
    def require_login(self, f):
        """Alias for require_auth for consistency."""
        return self.require_auth(f)
    
    def require_role(self, required_role: str):
        """Decorator to require specific role."""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                try:
                    # Try JWT authentication first
                    verify_jwt_in_request()
                    current_user_id = get_jwt_identity()
                    user = db_manager.get_user_by_id(ObjectId(current_user_id))
                    
                    if not user or user.role != required_role:
                        return jsonify({"error": "Insufficient permissions"}), 403
                    
                    return f(*args, **kwargs)
                except Exception as e:
                    # Check if this is an API route
                    if request.path.startswith('/api/'):
                        return jsonify({"error": "Authentication required"}), 401
                    else:
                        # For page routes, check session authentication
                        from flask import session
                        if session.get('authenticated') and session.get('user_id'):
                            # Get user from session
                            current_user_id = ObjectId(session['user_id'])
                            user = db_manager.get_user_by_id(current_user_id)
                            
                            if not user or user.role != required_role:
                                # User is authenticated but doesn't have required role
                                from flask import render_template
                                return render_template('error.html', 
                                                     error_title="Access Denied",
                                                     error_message=f"You need {required_role} role to access this page.",
                                                     current_user=user), 403
                            
                            return f(*args, **kwargs)
                        else:
                            # Not authenticated, redirect to login
                            return redirect(url_for('login_page'))
            return decorated_function
        return decorator
    
    def require_campaign_access(self, f):
        """Decorator to require campaign access (player or GM)."""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                campaign_id = request.view_args.get('campaign_id') or request.json.get('campaign_id')
                
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
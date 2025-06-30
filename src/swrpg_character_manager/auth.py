"""Authentication and authorization system for Star Wars RPG Character Manager."""

import secrets
import string
import pyotp
import qrcode
from io import BytesIO
import base64
import json
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, List, Tuple, Any
from functools import wraps
from flask import request, jsonify, current_app, redirect, url_for
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, verify_jwt_in_request
from bson import ObjectId

# WebAuthn imports
try:
    from webauthn import generate_registration_options, verify_registration_response
    from webauthn import generate_authentication_options, verify_authentication_response
    from webauthn.helpers.cose import COSEAlgorithmIdentifier
    from webauthn.helpers.structs import (
        AttestationConveyancePreference,
        AuthenticatorAttachment,
        AuthenticatorSelectionCriteria,
        ResidentKeyRequirement,
        UserVerificationRequirement,
        PublicKeyCredentialDescriptor,
        PublicKeyCredentialType,
        RegistrationCredential,
        AuthenticationCredential,
    )
    WEBAUTHN_AVAILABLE = True
except ImportError:
    WEBAUTHN_AVAILABLE = False

from .database import db_manager, User, InviteCode, Passkey

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
    
    def disable_2fa(self, user_id: ObjectId) -> bool:
        """Disable two-factor authentication for a user."""
        try:
            # Update user to disable 2FA and clear secrets
            update_data = {
                "two_factor_enabled": False,
                "two_factor_secret": None,
                "backup_codes": []
            }
            
            result = db_manager.update_user(user_id, update_data)
            return result is not None
            
        except Exception as e:
            print(f"Failed to disable 2FA for user {user_id}: {str(e)}")
            return False
    
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
                    # Check authentication using the same logic as other routes
                    from flask import g
                    
                    current_user_id = None
                    user = None
                    
                    # Try JWT authentication first
                    try:
                        verify_jwt_in_request()
                        current_user_id = ObjectId(get_jwt_identity())
                        user = db_manager.get_user_by_id(current_user_id)
                    except:
                        # Fall back to session authentication for non-API routes
                        if not request.path.startswith('/api/'):
                            from flask import session
                            if session.get('authenticated') and session.get('user_id'):
                                current_user_id = ObjectId(session['user_id'])
                                user = db_manager.get_user_by_id(current_user_id)
                    
                    # Check if user was found and has required role
                    if not user:
                        if request.path.startswith('/api/'):
                            return jsonify({"error": "Authentication required"}), 401
                        else:
                            return redirect(url_for('login_page'))
                    
                    if user.role != required_role:
                        if request.path.startswith('/api/'):
                            return jsonify({"error": "Insufficient permissions"}), 403
                        else:
                            from flask import render_template
                            return render_template('error.html', 
                                                 error_title="Access Denied",
                                                 error_message=f"You need {required_role} role to access this page.",
                                                 current_user=user), 403
                    
                    return f(*args, **kwargs)
                    
                except Exception as e:
                    # Handle any unexpected errors
                    if request.path.startswith('/api/'):
                        return jsonify({"error": "Authentication error"}), 401
                    else:
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
    
    # WebAuthn/Passkey Methods
    def get_webauthn_config(self) -> Dict[str, Any]:
        """Get WebAuthn configuration from environment or defaults."""
        return {
            "rp_id": os.getenv("WEBAUTHN_RP_ID", "localhost"),
            "rp_name": os.getenv("WEBAUTHN_RP_NAME", "Star Wars RPG Character Manager"),
            "origin": os.getenv("WEBAUTHN_ORIGIN", "http://localhost:8080"),
        }
    
    def generate_passkey_registration_options(self, user: User) -> Optional[Dict[str, Any]]:
        """Generate WebAuthn registration options for passkey creation."""
        if not WEBAUTHN_AVAILABLE:
            return None
            
        config = self.get_webauthn_config()
        
        # Get existing passkeys to exclude
        existing_passkeys = db_manager.get_passkeys_by_user(user._id)
        exclude_credentials = [
            PublicKeyCredentialDescriptor(
                id=base64.urlsafe_b64decode(passkey.credential_id.encode('ascii')),
                type=PublicKeyCredentialType.PUBLIC_KEY,
            )
            for passkey in existing_passkeys
        ]
        
        try:
            options = generate_registration_options(
                rp_id=config["rp_id"],
                rp_name=config["rp_name"],
                user_id=str(user._id).encode('utf-8'),
                user_name=user.username,
                user_display_name=user.username,
                exclude_credentials=exclude_credentials,
                authenticator_selection=AuthenticatorSelectionCriteria(
                    authenticator_attachment=AuthenticatorAttachment.PLATFORM,
                    resident_key=ResidentKeyRequirement.PREFERRED,
                    user_verification=UserVerificationRequirement.PREFERRED,
                ),
                supported_pub_key_algs=[
                    COSEAlgorithmIdentifier.ECDSA_SHA_256,
                    COSEAlgorithmIdentifier.RSASSA_PKCS1_v1_5_SHA_256,
                ],
                attestation=AttestationConveyancePreference.NONE,
            )
            
            # Store challenge in session/cache for verification
            # In production, use Redis or database for session storage
            
            def serialize_webauthn_object(obj):
                """Recursively serialize WebAuthn objects to JSON-compatible format."""
                if isinstance(obj, bytes):
                    return base64.urlsafe_b64encode(obj).decode('ascii')
                elif hasattr(obj, 'value'):  # Enum
                    return obj.value
                elif hasattr(obj, 'dict'):  # Pydantic model
                    return {k: serialize_webauthn_object(v) for k, v in obj.dict().items()}
                elif hasattr(obj, '__dict__'):  # Regular object
                    return {k: serialize_webauthn_object(v) for k, v in obj.__dict__.items() if not k.startswith('_')}
                elif isinstance(obj, list):
                    return [serialize_webauthn_object(item) for item in obj]
                elif isinstance(obj, dict):
                    return {k: serialize_webauthn_object(v) for k, v in obj.items()}
                else:
                    return obj
            
            # Serialize options for JSON response
            options_dict = serialize_webauthn_object(options)
            
            return {
                "challenge": base64.urlsafe_b64encode(options.challenge).decode('ascii'),
                "options": options_dict
            }
            
        except Exception as e:
            print(f"Error generating passkey registration options: {e}")
            return None
    
    def verify_passkey_registration(self, user: User, credential_data: Dict[str, Any], challenge: str, passkey_name: str = "") -> Tuple[bool, str]:
        """Verify passkey registration response and store the credential."""
        if not WEBAUTHN_AVAILABLE:
            return False, "WebAuthn not available"
            
        config = self.get_webauthn_config()
        
        try:
            print(f"Starting passkey verification for user {user._id}")
            print(f"Challenge length: {len(challenge)}")
            print(f"Config: {config}")
            
            # Parse the credential data
            print("Parsing credential data...")
            credential = RegistrationCredential.model_validate(credential_data)
            print("Credential data parsed successfully")
            
            # Verify the registration response
            print("Starting WebAuthn verification...")
            verification = verify_registration_response(
                credential=credential,
                expected_challenge=base64.urlsafe_b64decode(challenge.encode('ascii')),
                expected_origin=config["origin"],
                expected_rp_id=config["rp_id"],
            )
            print(f"WebAuthn verification result: {verification.verified}")
            
            if verification.verified:
                print("Creating passkey object for database storage...")
                # Store the passkey in database
                passkey = Passkey(
                    user_id=user._id,
                    credential_id=base64.urlsafe_b64encode(verification.credential_id).decode('ascii'),
                    public_key=base64.urlsafe_b64encode(verification.credential_public_key).decode('ascii'),
                    sign_count=verification.sign_count,
                    name=passkey_name or f"Passkey {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                    attestation_object=base64.urlsafe_b64encode(credential.response.attestation_object).decode('ascii'),
                    client_data_json=base64.urlsafe_b64encode(credential.response.client_data_json).decode('ascii'),
                )
                
                print("Saving passkey to database...")
                passkey_id = db_manager.create_passkey(passkey)
                print(f"Passkey saved with ID: {passkey_id}")
                
                # Update user's passkey status
                print("Updating user passkey status...")
                db_manager.update_user_passkey_status(user._id)
                print("User passkey status updated")
                
                return True, "Passkey registered successfully"
            else:
                print("WebAuthn verification failed")
                return False, "Passkey verification failed"
                
        except Exception as e:
            print(f"Error verifying passkey registration: {e}")
            import traceback
            print(f"Full traceback: {traceback.format_exc()}")
            return False, f"Registration verification error: {str(e)}"
    
    def generate_passkey_authentication_options(self, username: str = None) -> Optional[Dict[str, Any]]:
        """Generate WebAuthn authentication options for passkey login."""
        print(f"WebAuthn available check: {WEBAUTHN_AVAILABLE}")
        if not WEBAUTHN_AVAILABLE:
            print("WebAuthn not available, returning None")
            return None
            
        config = self.get_webauthn_config()
        print(f"WebAuthn config: {config}")
        
        try:
            # Get allowed credentials (all passkeys if no username specified)
            allowed_credentials = []
            
            if username:
                user = db_manager.get_user_by_username(username)
                if user:
                    passkeys = db_manager.get_passkeys_by_user(user._id)
                    allowed_credentials = [
                        PublicKeyCredentialDescriptor(
                            id=base64.urlsafe_b64decode(passkey.credential_id.encode('ascii')),
                            type=PublicKeyCredentialType.PUBLIC_KEY,
                        )
                        for passkey in passkeys
                    ]
            
            options = generate_authentication_options(
                rp_id=config["rp_id"],
                allow_credentials=allowed_credentials,
                user_verification=UserVerificationRequirement.PREFERRED,
            )
            
            # Serialize options for JSON response
            options_dict = {}
            if hasattr(options, 'dict'):
                options_dict = options.dict()
            else:
                options_dict = options.__dict__.copy()
            
            # Convert bytes to base64 strings for JSON serialization
            if 'challenge' in options_dict and isinstance(options_dict['challenge'], bytes):
                options_dict['challenge'] = base64.urlsafe_b64encode(options_dict['challenge']).decode('ascii')
            
            # Convert enum values to strings
            for key, value in options_dict.items():
                if hasattr(value, 'value'):
                    options_dict[key] = value.value
            
            return {
                "challenge": base64.urlsafe_b64encode(options.challenge).decode('ascii'),
                "options": options_dict
            }
            
        except Exception as e:
            print(f"Error generating passkey authentication options: {e}")
            return None
    
    def verify_passkey_authentication(self, credential_data: Dict[str, Any], challenge: str) -> Tuple[bool, Optional[User], str]:
        """Verify passkey authentication response."""
        if not WEBAUTHN_AVAILABLE:
            return False, None, "WebAuthn not available"
            
        config = self.get_webauthn_config()
        
        try:
            # Parse the credential data
            credential = AuthenticationCredential.model_validate(credential_data)
            
            # Get the passkey from database using credential ID
            credential_id = base64.urlsafe_b64encode(credential.id).decode('ascii')
            passkey = db_manager.get_passkey_by_credential_id(credential_id)
            
            if not passkey:
                return False, None, "Passkey not found"
            
            # Get the user
            user = db_manager.get_user_by_id(passkey.user_id)
            if not user or not user.is_active:
                return False, None, "User not found or inactive"
            
            # Verify the authentication response
            verification = verify_authentication_response(
                credential=credential,
                expected_challenge=base64.urlsafe_b64decode(challenge.encode('ascii')),
                expected_origin=config["origin"],
                expected_rp_id=config["rp_id"],
                credential_public_key=base64.urlsafe_b64decode(passkey.public_key.encode('ascii')),
                credential_current_sign_count=passkey.sign_count,
            )
            
            if verification.verified:
                # Update passkey usage
                db_manager.update_passkey_usage(credential_id, verification.new_sign_count)
                
                # Update user's last passkey used timestamp
                db_manager.update_user(user._id, {
                    "last_passkey_used": datetime.now(timezone.utc)
                })
                
                return True, user, "Authentication successful"
            else:
                return False, None, "Authentication verification failed"
                
        except Exception as e:
            print(f"Error verifying passkey authentication: {e}")
            return False, None, f"Authentication error: {str(e)}"
    
    def get_user_passkeys(self, user_id: ObjectId) -> List[Dict[str, Any]]:
        """Get user's passkeys for management (without sensitive data)."""
        passkeys = db_manager.get_passkeys_by_user(user_id)
        return [
            {
                "id": str(passkey._id),
                "name": passkey.name,
                "created_at": passkey.created_at.isoformat() if passkey.created_at else None,
                "last_used": passkey.last_used.isoformat() if passkey.last_used else None,
                "is_active": passkey.is_active,
            }
            for passkey in passkeys
        ]
    
    def rename_user_passkey(self, user_id: ObjectId, passkey_id: str, new_name: str) -> bool:
        """Rename a user's passkey."""
        try:
            return db_manager.rename_passkey(ObjectId(passkey_id), new_name, user_id)
        except Exception as e:
            print(f"Error renaming passkey: {e}")
            return False
    
    def delete_user_passkey(self, user_id: ObjectId, passkey_id: str) -> bool:
        """Delete (deactivate) a user's passkey."""
        try:
            result = db_manager.deactivate_passkey(ObjectId(passkey_id), user_id)
            if result:
                # Update user's passkey status
                db_manager.update_user_passkey_status(user_id)
            return result
        except Exception as e:
            print(f"Error deleting passkey: {e}")
            return False

# Global auth manager instance
auth_manager = AuthManager()
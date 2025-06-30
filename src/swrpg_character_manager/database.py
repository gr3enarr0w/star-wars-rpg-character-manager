"""MongoDB database models and operations for Star Wars RPG Character Manager."""

from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from bson import ObjectId
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
import os
from dotenv import load_dotenv
from .security import data_encryption, audit_log

load_dotenv()

@dataclass
class User:
    """User model for authentication and authorization."""
    _id: Optional[ObjectId] = None
    username: str = ""
    email: str = ""  # This will be encrypted in database
    email_hash: str = ""  # Hash for indexing/searching
    password_hash: str = ""
    role: str = "player"  # player, gamemaster, admin
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # 2FA settings
    two_factor_enabled: bool = False
    two_factor_secret: Optional[str] = None
    backup_codes: List[str] = None
    
    # Passkey settings
    passkey_enabled: bool = False
    passkey_only: bool = False
    last_passkey_used: Optional[datetime] = None
    
    # Social login
    google_id: Optional[str] = None
    discord_id: Optional[str] = None
    
    # Campaign memberships
    campaigns: List[ObjectId] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)
        if self.updated_at is None:
            self.updated_at = datetime.now(timezone.utc)
        if self.backup_codes is None:
            self.backup_codes = []
        if self.campaigns is None:
            self.campaigns = []

@dataclass
class Passkey:
    """Passkey model for WebAuthn credentials."""
    _id: Optional[ObjectId] = None
    user_id: ObjectId = None
    credential_id: str = ""  # Base64url encoded credential ID
    public_key: str = ""  # Base64url encoded public key
    sign_count: int = 0  # Counter for replay protection
    name: str = ""  # User-friendly name (e.g. "iPhone", "YubiKey")
    created_at: Optional[datetime] = None
    last_used: Optional[datetime] = None
    is_active: bool = True
    
    # Optional: Store full attestation data for compliance/debugging
    attestation_object: Optional[str] = None
    client_data_json: Optional[str] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)
        if self.last_used is None:
            self.last_used = datetime.now(timezone.utc)

@dataclass
class Campaign:
    """Campaign model for organizing characters and players."""
    _id: Optional[ObjectId] = None
    name: str = ""
    description: str = ""
    game_master_id: ObjectId = None
    players: List[ObjectId] = None
    characters: List[ObjectId] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Campaign settings
    settings: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)
        if self.updated_at is None:
            self.updated_at = datetime.now(timezone.utc)
        if self.players is None:
            self.players = []
        if self.characters is None:
            self.characters = []
        if self.settings is None:
            self.settings = {}

@dataclass
class Character:
    """Enhanced character model with database integration."""
    _id: Optional[ObjectId] = None
    user_id: ObjectId = None
    campaign_id: Optional[ObjectId] = None
    
    # Character data
    name: str = ""
    player_name: str = ""
    species: str = ""
    career: str = ""
    background: str = ""
    
    # Characteristics
    brawn: int = 2
    agility: int = 2
    intellect: int = 2
    cunning: int = 2
    willpower: int = 2
    presence: int = 2
    
    # Experience
    total_xp: int = 110
    available_xp: int = 110
    spent_xp: int = 0
    
    # Skills (stored as nested document)
    skills: Dict[str, Dict] = None
    
    # Talents
    talents: List[Dict] = None
    
    # Equipment and credits
    credits: int = 0
    equipment: List[str] = None
    
    # Obligations (Edge of the Empire)
    obligations: List[Dict] = None
    
    # Character creation context
    creation_context: str = "new_campaign"  # "new_campaign" or "existing_campaign" or "replacement"
    
    # Metadata
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_active: bool = True
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)
        if self.updated_at is None:
            self.updated_at = datetime.now(timezone.utc)
        if self.skills is None:
            self.skills = {}
        if self.talents is None:
            self.talents = []
        if self.equipment is None:
            self.equipment = []
        if self.obligations is None:
            self.obligations = []

@dataclass
class InviteCode:
    """Invite code model for user registration."""
    _id: Optional[ObjectId] = None
    code: str = ""
    created_by: ObjectId = None
    used_by: Optional[ObjectId] = None
    is_used: bool = False
    expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    role: str = "player"  # Role to assign to user when they use this code
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)

class MongoDBManager:
    """MongoDB database manager for Star Wars RPG Character Manager."""
    
    def __init__(self):
        self.client: MongoClient = None
        self.db: Database = None
        self.users: Collection = None
        self.campaigns: Collection = None
        self.characters: Collection = None
        self.invite_codes: Collection = None
        self.campaign_invites: Collection = None
        self.sessions: Collection = None
        
    def connect(self):
        """Connect to MongoDB database."""
        try:
            mongodb_uri = os.getenv('MONGO_URI', os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
            db_name = os.getenv('MONGODB_DB', 'swrpg_manager')
            
            self.client = MongoClient(mongodb_uri)
            self.db = self.client[db_name]
            
            # Initialize collections
            self.users = self.db.users
            self.passkeys = self.db.passkeys
            self.campaigns = self.db.campaigns
            self.characters = self.db.characters
            self.invite_codes = self.db.invite_codes
            self.campaign_invites = self.db.campaign_invites
            self.sessions = self.db.sessions
            
            # Create indexes
            self._create_indexes()
            
            # Test connection
            self.client.admin.command('ping')
            print("✅ Connected to MongoDB successfully")
            
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            raise
    
    def _create_indexes(self):
        """Create database indexes for performance."""
        # User indexes
        try:
            # Create unique email_hash index with sparse option to handle null values
            self.users.create_index("email_hash", unique=True, sparse=True)
        except Exception as e:
            print(f"⚠️  Email hash index creation failed (may need migration): {e}")
            # Continue without failing - migration script will fix this
        
        self.users.create_index("username", unique=True)
        self.users.create_index("google_id", sparse=True)
        self.users.create_index("discord_id", sparse=True)
        
        # Passkey indexes
        self.passkeys.create_index("credential_id", unique=True)  # For authentication lookups
        self.passkeys.create_index("user_id")  # For user passkey queries
        self.passkeys.create_index([("user_id", 1), ("is_active", 1)])  # For active passkey queries
        self.passkeys.create_index("created_at")  # For sorting by creation date
        self.passkeys.create_index("last_used")  # For activity tracking
        
        # Campaign indexes
        self.campaigns.create_index("game_master_id")
        self.campaigns.create_index("players")
        
        # Character indexes
        self.characters.create_index("user_id")
        self.characters.create_index("campaign_id")
        self.characters.create_index([("user_id", 1), ("campaign_id", 1)])
        
        # Invite code indexes
        self.invite_codes.create_index("code", unique=True)
        self.invite_codes.create_index("expires_at")
        
        # Campaign invite indexes
        self.campaign_invites.create_index("code", unique=True)
        self.campaign_invites.create_index("campaign_id")
        self.campaign_invites.create_index("expires_at")
        
        # Session indexes
        self.sessions.create_index("expires_at", expireAfterSeconds=0)
    
    def disconnect(self):
        """Disconnect from MongoDB."""
        if self.client:
            self.client.close()
    
    # User operations
    def create_user(self, user: User) -> ObjectId:
        """Create a new user with encrypted email."""
        user_dict = asdict(user)
        user_dict.pop('_id', None)  # Remove _id to let MongoDB generate it
        
        # Encrypt email and create hash for indexing
        if user_dict.get('email'):
            plain_email = user_dict['email']
            user_dict['email'] = data_encryption.encrypt_email(plain_email)
            user_dict['email_hash'] = data_encryption.hash_email_for_index(plain_email)
            
            # Log encryption event
            audit_log.log_encryption_event("email_encryption", True)
        
        result = self.users.insert_one(user_dict)
        audit_log.log_data_access("system", "create_user", "user_data", True)
        return result.inserted_id
    
    def get_user_by_id(self, user_id: ObjectId) -> Optional[User]:
        """Get user by ID with email decryption."""
        doc = self.users.find_one({"_id": user_id})
        if doc:
            # Decrypt email for use
            if doc.get('email'):
                try:
                    doc['email'] = data_encryption.decrypt_email(doc['email'])
                    audit_log.log_encryption_event("email_decryption", True)
                except Exception as e:
                    audit_log.log_encryption_event("email_decryption", False)
                    print(f"Failed to decrypt email for user {user_id}: {e}")
            
            audit_log.log_data_access(str(user_id), "get_user_by_id", "user_data", True)
            return User(**doc)
        return None
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email using email hash for secure lookup."""
        # Use email hash for lookup instead of plaintext email
        email_hash = data_encryption.hash_email_for_index(email)
        doc = self.users.find_one({"email_hash": email_hash})
        
        if doc:
            # Decrypt email for use
            if doc.get('email'):
                try:
                    doc['email'] = data_encryption.decrypt_email(doc['email'])
                    audit_log.log_encryption_event("email_decryption", True)
                except Exception as e:
                    audit_log.log_encryption_event("email_decryption", False)
                    print(f"Failed to decrypt email for user lookup: {e}")
            
            audit_log.log_data_access("system", "get_user_by_email", "user_data", True)
            return User(**doc)
        return None
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        doc = self.users.find_one({"username": username})
        return User(**doc) if doc else None
    
    def update_user(self, user_id: ObjectId, updates: Dict) -> bool:
        """Update user document."""
        updates['updated_at'] = datetime.now(timezone.utc)
        result = self.users.update_one({"_id": user_id}, {"$set": updates})
        return result.modified_count > 0
    
    # Passkey operations
    def create_passkey(self, passkey: Passkey) -> ObjectId:
        """Create a new passkey credential."""
        passkey_dict = asdict(passkey)
        passkey_dict.pop('_id', None)  # Remove _id to let MongoDB generate it
        result = self.passkeys.insert_one(passkey_dict)
        audit_log.log_data_access(str(passkey.user_id), "create_passkey", "passkey_data", True)
        return result.inserted_id
    
    def get_passkeys_by_user(self, user_id: ObjectId, active_only: bool = True) -> List[Passkey]:
        """Get all passkeys for a user."""
        query = {"user_id": user_id}
        if active_only:
            query["is_active"] = True
        
        docs = self.passkeys.find(query).sort("created_at", -1)  # Most recent first
        audit_log.log_data_access(str(user_id), "get_passkeys_by_user", "passkey_data", True)
        return [Passkey(**doc) for doc in docs]
    
    def get_passkey_by_credential_id(self, credential_id: str) -> Optional[Passkey]:
        """Get passkey by credential ID for authentication."""
        doc = self.passkeys.find_one({"credential_id": credential_id, "is_active": True})
        if doc:
            audit_log.log_data_access(str(doc['user_id']), "get_passkey_by_credential_id", "passkey_data", True)
            return Passkey(**doc)
        return None
    
    def update_passkey_usage(self, credential_id: str, sign_count: int) -> bool:
        """Update passkey sign count and last used timestamp."""
        result = self.passkeys.update_one(
            {"credential_id": credential_id, "is_active": True},
            {
                "$set": {
                    "sign_count": sign_count,
                    "last_used": datetime.now(timezone.utc)
                }
            }
        )
        if result.matched_count > 0:
            # Get the passkey to log the user_id
            doc = self.passkeys.find_one({"credential_id": credential_id})
            if doc:
                audit_log.log_data_access(str(doc['user_id']), "update_passkey_usage", "passkey_data", True)
        return result.modified_count > 0
    
    def rename_passkey(self, passkey_id: ObjectId, new_name: str, user_id: ObjectId) -> bool:
        """Rename a passkey (user can only rename their own passkeys)."""
        result = self.passkeys.update_one(
            {"_id": passkey_id, "user_id": user_id, "is_active": True},
            {"$set": {"name": new_name}}
        )
        if result.modified_count > 0:
            audit_log.log_data_access(str(user_id), "rename_passkey", "passkey_data", True)
        return result.modified_count > 0
    
    def deactivate_passkey(self, passkey_id: ObjectId, user_id: ObjectId) -> bool:
        """Deactivate a passkey (soft delete - user can only deactivate their own passkeys)."""
        result = self.passkeys.update_one(
            {"_id": passkey_id, "user_id": user_id},
            {"$set": {"is_active": False}}
        )
        if result.modified_count > 0:
            audit_log.log_data_access(str(user_id), "deactivate_passkey", "passkey_data", True)
        return result.modified_count > 0
    
    def count_user_passkeys(self, user_id: ObjectId) -> int:
        """Count active passkeys for a user."""
        return self.passkeys.count_documents({"user_id": user_id, "is_active": True})
    
    def update_user_passkey_status(self, user_id: ObjectId) -> bool:
        """Update user's passkey_enabled flag based on active passkeys."""
        passkey_count = self.count_user_passkeys(user_id)
        result = self.users.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "passkey_enabled": passkey_count > 0,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        return result.modified_count > 0

    # Campaign operations
    def create_campaign(self, campaign: Campaign) -> ObjectId:
        """Create a new campaign."""
        campaign_dict = asdict(campaign)
        campaign_dict.pop('_id', None)
        result = self.campaigns.insert_one(campaign_dict)
        return result.inserted_id
    
    def get_campaign_by_id(self, campaign_id: ObjectId) -> Optional[Campaign]:
        """Get campaign by ID."""
        doc = self.campaigns.find_one({"_id": campaign_id})
        return Campaign(**doc) if doc else None
    
    def get_user_campaigns(self, user_id: ObjectId) -> List[Campaign]:
        """Get all campaigns for a user (as player or GM)."""
        docs = self.campaigns.find({
            "$or": [
                {"game_master_id": user_id},
                {"players": user_id}
            ],
            "is_active": True
        })
        return [Campaign(**doc) for doc in docs]
    
    def get_campaigns_as_gm(self, user_id: ObjectId) -> List[Campaign]:
        """Get campaigns where user is game master."""
        docs = self.campaigns.find({"game_master_id": user_id, "is_active": True})
        return [Campaign(**doc) for doc in docs]
    
    def add_player_to_campaign(self, campaign_id: ObjectId, user_id: ObjectId) -> bool:
        """Add player to campaign."""
        result = self.campaigns.update_one(
            {"_id": campaign_id},
            {"$addToSet": {"players": user_id}, "$set": {"updated_at": datetime.now(timezone.utc)}}
        )
        return result.modified_count > 0
    
    # Character operations
    def create_character(self, character: Character) -> ObjectId:
        """Create a new character."""
        character_dict = asdict(character)
        character_dict.pop('_id', None)
        result = self.characters.insert_one(character_dict)
        return result.inserted_id
    
    def get_character_by_id(self, character_id: ObjectId) -> Optional[Character]:
        """Get character by ID."""
        doc = self.characters.find_one({"_id": character_id})
        return Character(**doc) if doc else None
    
    def get_user_characters(self, user_id: ObjectId, campaign_id: Optional[ObjectId] = None) -> List[Character]:
        """Get all characters for a user, optionally filtered by campaign."""
        query = {"user_id": user_id, "is_active": True}
        if campaign_id:
            query["campaign_id"] = campaign_id
        
        docs = self.characters.find(query)
        return [Character(**doc) for doc in docs]
    
    def get_campaign_characters(self, campaign_id: ObjectId) -> List[Character]:
        """Get all characters in a campaign."""
        docs = self.characters.find({"campaign_id": campaign_id, "is_active": True})
        return [Character(**doc) for doc in docs]
    
    def update_character(self, character_id: ObjectId, updates: Dict) -> bool:
        """Update character document."""
        updates['updated_at'] = datetime.now(timezone.utc)
        result = self.characters.update_one({"_id": character_id}, {"$set": updates})
        return result.modified_count > 0
    
    def assign_character_to_campaign(self, character_id: ObjectId, campaign_id: ObjectId) -> bool:
        """Assign character to a campaign."""
        result = self.characters.update_one(
            {"_id": character_id},
            {"$set": {"campaign_id": campaign_id, "updated_at": datetime.now(timezone.utc)}}
        )
        
        # Also add character to campaign's character list
        self.campaigns.update_one(
            {"_id": campaign_id},
            {"$addToSet": {"characters": character_id}, "$set": {"updated_at": datetime.now(timezone.utc)}}
        )
        
        return result.modified_count > 0
    
    # Invite code operations
    def create_invite_code(self, invite: InviteCode) -> ObjectId:
        """Create invite code."""
        invite_dict = asdict(invite)
        invite_dict.pop('_id', None)
        result = self.invite_codes.insert_one(invite_dict)
        return result.inserted_id
    
    def get_invite_code(self, code: str) -> Optional[InviteCode]:
        """Get invite code by code string."""
        doc = self.invite_codes.find_one({"code": code, "is_used": False})
        if doc and doc.get('expires_at'):
            expires_at = doc['expires_at']
            # Ensure timezone-aware comparison
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at < datetime.now(timezone.utc):
                return None  # Expired
        return InviteCode(**doc) if doc else None
    
    def use_invite_code(self, code: str, user_id: ObjectId) -> bool:
        """Mark invite code as used."""
        result = self.invite_codes.update_one(
            {"code": code, "is_used": False},
            {"$set": {"is_used": True, "used_by": user_id}}
        )
        return result.modified_count > 0
    
    # Campaign invite management
    def create_campaign_invite(self, code: str, campaign_id: ObjectId, created_by: ObjectId, expires_in_days: int = 7) -> bool:
        """Create a campaign invite code."""
        try:
            invite = {
                "code": code,
                "campaign_id": campaign_id,
                "created_by": created_by,
                "created_at": datetime.now(timezone.utc),
                "expires_at": datetime.now(timezone.utc) + timedelta(days=expires_in_days),
                "is_used": False,
                "used_by": None
            }
            self.campaign_invites.insert_one(invite)
            return True
        except Exception as e:
            print(f"Error creating campaign invite: {e}")
            return False
    
    def join_campaign_by_invite(self, user_id: ObjectId, invite_code: str) -> tuple[bool, str]:
        """Join a campaign using an invite code."""
        try:
            # Find the invite code
            invite = self.campaign_invites.find_one({"code": invite_code, "is_used": False})
            if not invite:
                return False, "Invalid or already used invite code"
            
            # Check if expired
            if invite["expires_at"] < datetime.now(timezone.utc):
                return False, "Invite code has expired"
            
            # Get the campaign
            campaign = self.get_campaign_by_id(invite["campaign_id"])
            if not campaign:
                return False, "Campaign not found"
            
            # Check if user is already in the campaign
            if user_id in campaign.players:
                return False, "You are already a member of this campaign"
            
            # Add user to campaign
            if self.add_player_to_campaign(invite["campaign_id"], user_id):
                # Mark invite as used
                self.campaign_invites.update_one(
                    {"code": invite_code},
                    {"$set": {"is_used": True, "used_by": user_id}}
                )
                return True, "Successfully joined campaign"
            else:
                return False, "Failed to join campaign"
                
        except Exception as e:
            print(f"Error joining campaign by invite: {e}")
            return False, "An error occurred while joining the campaign"

# Global database manager instance
db_manager = MongoDBManager()
#!/usr/bin/env python3
"""Shared admin setup utilities to eliminate code duplication."""

import os
import sys
from typing import Tuple, Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta

from swrpg_character_manager.database import db_manager, User, InviteCode
from swrpg_character_manager.auth import auth_manager
from swrpg_character_manager.invite_codes import generate_default_invite_codes


def validate_admin_credentials() -> Tuple[str, str]:
    """Validate and return admin credentials from environment.
    
    Returns:
        Tuple of (admin_email, admin_password)
        
    Raises:
        ValueError: If ADMIN_PASSWORD is not set
    """
    admin_email = os.getenv("ADMIN_EMAIL", "clark@everson.dev")
    admin_password = os.getenv("ADMIN_PASSWORD")
    
    if not admin_password:
        raise ValueError("ADMIN_PASSWORD environment variable not set")
    
    return admin_email, admin_password


def ensure_admin_user_exists(admin_email: str, admin_password: str) -> Tuple[User, bool]:
    """Create or update admin user.
    
    Args:
        admin_email: Admin email address
        admin_password: Admin password
        
    Returns:
        Tuple of (User object, was_created: bool)
        
    Raises:
        Exception: If user creation/update fails
    """
    print(f"🔍 Checking for admin user: {admin_email}")
    
    # Check if admin already exists
    existing_admin = db_manager.get_user_by_email(admin_email)
    if existing_admin:
        print(f"✅ Admin user {admin_email} already exists")
        # Always update password to ensure it's current
        updates = {"password_hash": auth_manager.hash_password(admin_password)}
        db_manager.update_user(existing_admin._id, updates)
        print("🔄 Updated admin password")
        return existing_admin, False
    else:
        # Create new admin user
        admin = User(
            email=admin_email,
            username="clark_admin",
            password_hash=auth_manager.hash_password(admin_password),
            role="admin",
            created_at=datetime.now(timezone.utc),
            is_active=True
        )
        
        admin_id = db_manager.create_user(admin)
        admin._id = admin_id  # Set the ID on the object
        print(f"✅ Created admin user: {admin_email}")
        print(f"   Username: clark_admin")
        print("   Password: *** (configured from environment)")
        print(f"   User ID: {admin_id}")
        return admin, True


def create_default_invite_codes(admin_user: User) -> List[Dict[str, Any]]:
    """Create secure invite codes for all roles with optimized database operations.
    
    Args:
        admin_user: Admin user object to associate codes with
        
    Returns:
        List of created invite codes (empty if all already exist)
    """
    # Generate secure invite codes
    invite_codes = generate_default_invite_codes()
    
    # Batch check for existing codes to reduce database queries
    existing_codes = set()
    for invite_data in invite_codes:
        existing_code = db_manager.get_invite_code(invite_data["code"])
        if existing_code:
            existing_codes.add(invite_data["code"])
            print(f"⚠️  Invite code for {invite_data['role']} already exists")
    
    # Create only new codes
    created_codes = []
    expires_at = datetime.now(timezone.utc) + timedelta(days=365)
    
    for invite_data in invite_codes:
        if invite_data["code"] not in existing_codes:
            invite = InviteCode(
                code=invite_data["code"],
                created_by=admin_user._id,
                role=invite_data["role"],
                expires_at=expires_at,
                is_used=False
            )
            db_manager.create_invite_code(invite)
            created_codes.append(invite_data)
            print(f"✅ Created secure invite code for {invite_data['role']}: {invite_data['code']}")
    
    if not created_codes:
        print("✅ All invite codes already exist")
    
    return created_codes


def setup_admin_environment() -> Dict[str, Any]:
    """Complete admin setup - user creation and invite codes.
    
    Returns:
        Dictionary with setup results:
        {
            "admin_email": str,
            "admin_user": User,
            "user_created": bool,
            "invite_codes": List[Dict]
        }
        
    Raises:
        ValueError: If credentials are invalid
        Exception: If database operations fail
    """
    try:
        # Step 1: Validate credentials
        admin_email, admin_password = validate_admin_credentials()
        
        # Step 2: Ensure admin user exists
        admin_user, user_created = ensure_admin_user_exists(admin_email, admin_password)
        
        # Step 3: Create invite codes
        created_codes = create_default_invite_codes(admin_user)
        
        # Success summary
        print(f"🎉 Admin setup complete!")
        print(f"🔑 Admin Login: {admin_email}")
        print("🔒 Password: *** (configured from environment)")
        
        return {
            "admin_email": admin_email,
            "admin_user": admin_user,
            "user_created": user_created,
            "invite_codes": created_codes
        }
        
    except Exception as e:
        print(f"❌ Admin setup failed: {e}")
        raise
#!/usr/bin/env python3
"""Secure invite code generation utilities."""

import secrets
import string
from typing import List, Dict, Any


def generate_secure_invite_code(role: str, length: int = 12) -> str:
    """Generate a cryptographically secure invite code.
    
    Args:
        role: The role for the invite code (e.g., 'PLAYER', 'GM', 'ADMIN')
        length: Length of the random portion (default: 12)
        
    Returns:
        A secure invite code like 'PLAYER-xKj9mN2pQ8vL'
    """
    # Use uppercase letters and digits for readability
    alphabet = string.ascii_uppercase + string.digits
    random_part = ''.join(secrets.choice(alphabet) for _ in range(length))
    return f"{role.upper()}-{random_part}"


def generate_default_invite_codes() -> List[Dict[str, Any]]:
    """Generate secure default invite codes for all roles.
    
    Returns:
        List of dictionaries with 'code' and 'role' keys
    """
    roles = [
        {"role": "player", "prefix": "PLAYER"},
        {"role": "gamemaster", "prefix": "GM"},
        {"role": "admin", "prefix": "ADMIN"}
    ]
    
    invite_codes = []
    for role_info in roles:
        code = generate_secure_invite_code(role_info["prefix"])
        invite_codes.append({
            "code": code,
            "role": role_info["role"]
        })
    
    return invite_codes


def generate_bulk_invite_codes(role: str, count: int = 10) -> List[str]:
    """Generate multiple secure invite codes for a specific role.
    
    Args:
        role: The role for the invite codes
        count: Number of codes to generate
        
    Returns:
        List of secure invite codes
    """
    return [generate_secure_invite_code(role) for _ in range(count)]
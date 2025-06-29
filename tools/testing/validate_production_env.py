#!/usr/bin/env python3
"""Validate production environment configuration."""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

def validate_production_environment():
    """Validate that production environment is properly configured."""
    errors = []
    warnings = []
    
    # Check required environment variables
    required_vars = [
        'SECRET_KEY',
        'JWT_SECRET_KEY', 
        'MONGODB_URI',
        'ENCRYPTION_PASSWORD'
    ]
    
    for var in required_vars:
        value = os.getenv(var)
        if not value:
            errors.append(f"Missing required environment variable: {var}")
        elif len(value) < 32:
            warnings.append(f"Environment variable {var} may be too short (< 32 chars)")
    
    # Check APP_ENV is set to production
    app_env = os.getenv('APP_ENV')
    if app_env != 'production':
        errors.append(f"APP_ENV should be 'production', got: {app_env}")
    
    # Check DEBUG is disabled
    debug = os.getenv('DEBUG', '').lower()
    if debug in ['true', '1', 'yes']:
        errors.append("DEBUG should be disabled in production")
    
    # Check for development database URLs
    mongodb_uri = os.getenv('MONGODB_URI', '')
    if 'localhost' in mongodb_uri and app_env == 'production':
        warnings.append("Using localhost MongoDB in production environment")
    
    # Report results
    if errors:
        print("❌ Production environment validation failed:")
        for error in errors:
            print(f"  - {error}")
        return False
    
    if warnings:
        print("⚠️ Production environment warnings:")
        for warning in warnings:
            print(f"  - {warning}")
    
    print("✅ Production environment validation passed")
    return True

if __name__ == '__main__':
    success = validate_production_environment()
    sys.exit(0 if success else 1)
#!/usr/bin/env python3
"""
Star Wars RPG Character Manager - Application Startup Script

This script properly starts the Flask application with all required environment
variables and configuration for development and testing.
"""

import os
import sys
import subprocess
from pathlib import Path

def setup_environment():
    """Set up required environment variables for development"""
    
    # Required environment variables with secure defaults for development
    env_vars = {
        'FLASK_ENV': 'development',
        'FLASK_PORT': '8080',
        'FLASK_SECRET_KEY': 'dev-secret-key-change-in-production',
        'JWT_SECRET_KEY': 'dev-jwt-key-change-in-production', 
        'ADMIN_PASSWORD': 'TestAdmin123!',
        'MONGODB_URI': 'mongodb://localhost:27017/swrpg_character_manager',
        'MONGODB_DB': 'swrpg_character_manager'
    }
    
    print("🔧 Setting up development environment variables...")
    
    for key, default_value in env_vars.items():
        if key not in os.environ:
            os.environ[key] = default_value
            print(f"   ✅ {key} = {default_value}")
        else:
            print(f"   ♻️  {key} = {os.environ[key]} (from environment)")

def check_dependencies():
    """Check if required dependencies are installed"""
    
    required_modules = [
        'flask', 'flask_jwt_extended', 'pymongo', 
        'flask_bcrypt', 'dotenv', 'bcrypt', 'passlib'
    ]
    
    print("📦 Checking required dependencies...")
    
    missing_modules = []
    for module in required_modules:
        try:
            __import__(module)
            print(f"   ✅ {module}")
        except ImportError:
            missing_modules.append(module)
            print(f"   ❌ {module} - MISSING")
    
    if missing_modules:
        print(f"\n❌ Missing dependencies: {', '.join(missing_modules)}")
        print("Run: pip install flask flask-jwt-extended pymongo flask-bcrypt python-dotenv bcrypt passlib")
        return False
    
    print("   ✅ All dependencies available")
    return True

def check_mongodb():
    """Check if MongoDB is accessible"""
    
    print("🗄️  Checking MongoDB connection...")
    
    try:
        import pymongo
        client = pymongo.MongoClient(os.environ['MONGODB_URI'], serverSelectionTimeoutMS=5000)
        client.server_info()
        print("   ✅ MongoDB connection successful")
        return True
    except Exception as e:
        print(f"   ⚠️  MongoDB connection failed: {e}")
        print("   💡 MongoDB is optional for basic UI testing")
        return False

def start_flask_app():
    """Start the Flask application"""
    
    app_file = Path('web/app_with_auth.py')
    
    if not app_file.exists():
        print(f"❌ Flask app file not found: {app_file}")
        return False
    
    print(f"🚀 Starting Flask application from {app_file}")
    print(f"🌐 Application will be available at: http://localhost:{os.environ['FLASK_PORT']}")
    print("🛑 Press Ctrl+C to stop the application")
    print("="*60)
    
    try:
        # Start the Flask app with proper Python path
        env = os.environ.copy()
        current_dir = Path.cwd()
        env['PYTHONPATH'] = f"{current_dir}/src:{current_dir}/.venv/lib/python3.13/site-packages"
        
        # Change to web directory for the app to find templates and static files
        subprocess.run([sys.executable, app_file.name], env=env, cwd='web', check=True)
        return True
        
    except KeyboardInterrupt:
        print("\n🛑 Application stopped by user")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Flask application failed to start: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def main():
    """Main startup sequence"""
    
    print("🌟 Star Wars RPG Character Manager - Starting Application")
    print("="*60)
    
    # Setup environment
    setup_environment()
    print()
    
    # Check dependencies
    if not check_dependencies():
        print("\n❌ Cannot start application - missing dependencies")
        sys.exit(1)
    print()
    
    # Check MongoDB (optional)
    check_mongodb()
    print()
    
    # Start Flask app
    if start_flask_app():
        print("\n✅ Application startup completed successfully")
    else:
        print("\n❌ Application startup failed")
        sys.exit(1)

if __name__ == '__main__':
    main()
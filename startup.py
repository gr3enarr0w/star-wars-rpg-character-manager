#!/usr/bin/env python3
"""Startup script that ensures admin user exists and starts the web application."""

import os
import sys
import time
import subprocess

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def wait_for_mongodb():
    """Wait for MongoDB with exponential backoff."""
    max_retries = 10
    base_delay = 0.5
    max_delay = 30
    
    for attempt in range(max_retries):
        try:
            from swrpg_character_manager.database import db_manager
            db_manager.connect()
            print("✅ MongoDB is ready")
            return True
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"❌ MongoDB connection timeout after {max_retries} attempts")
                print(f"   Last error: {e}")
                break
            
            # Exponential backoff with jitter
            delay = min(base_delay * (2 ** attempt), max_delay)
            print(f"⏳ Waiting for MongoDB... (attempt {attempt + 1}/{max_retries}, retry in {delay:.1f}s)")
            time.sleep(delay)
    
    return False

def ensure_admin_user():
    """Ensure the admin user exists using shared admin setup module."""
    try:
        from swrpg_character_manager.admin_setup import setup_admin_environment
        setup_admin_environment()
        return True
        
    except Exception as e:
        print(f"❌ Admin setup failed: {e}")
        return False

def start_web_application():
    """Start the Flask web application with improved error handling."""
    print("🚀 Starting Star Wars RPG Character Manager...")
    
    try:
        current_dir = os.getcwd()
        print(f"📁 Current directory: {current_dir}")
        
        # Try to use run_web.py first (preferred method)
        run_web_path = os.path.join(current_dir, "run_web.py")
        if os.path.exists(run_web_path):
            print("📄 Found run_web.py, starting application...")
            # Set environment for consistent port usage
            os.environ['FLASK_PORT'] = '8000'
            os.environ['PORT'] = '8000'
            subprocess.run([sys.executable, "run_web.py"], check=True, timeout=300)
        else:
            print("❌ run_web.py not found, attempting direct Flask startup...")
            # Fallback: direct Flask app import
            web_dir = os.path.join(current_dir, "web")
            if os.path.exists(web_dir):
                sys.path.insert(0, web_dir)
                from app_with_auth import app
                app.run(host='0.0.0.0', port=8000, debug=False)
            else:
                raise FileNotFoundError("Neither run_web.py nor web/ directory found")
                
    except subprocess.TimeoutExpired:
        print("⚠️  Application startup timeout - this may be normal for long-running servers")
    except FileNotFoundError as e:
        print(f"❌ Application files not found: {e}")
        return False
    except ImportError as e:
        print(f"❌ Failed to import Flask application: {e}")
        return False
    except Exception as e:
        print(f"❌ Failed to start web application: {e}")
        return False
    
    return True

def main():
    """Main startup sequence."""
    print("🌟 Star Wars RPG Character Manager - Startup Sequence")
    print("=" * 60)
    
    # Step 1: Wait for MongoDB
    if not wait_for_mongodb():
        print("❌ Cannot start without MongoDB")
        sys.exit(1)
    
    # Step 2: Ensure admin user exists
    if not ensure_admin_user():
        print("❌ Admin setup failed")
        sys.exit(1)
    
    # Step 3: Start web application
    print("\n🚀 Starting web application...")
    print("   Access at: http://localhost:8000")
    admin_email = os.getenv("ADMIN_EMAIL", "clark@everson.dev")
    print(f"   Admin login: {admin_email}")
    print("=" * 60)
    
    start_web_application()

if __name__ == "__main__":
    main()
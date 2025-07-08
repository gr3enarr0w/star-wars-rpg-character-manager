#!/usr/bin/env python3
"""Production startup script using Gunicorn for the Star Wars RPG Character Manager."""

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

def start_production_server():
    """Start the production web application using Gunicorn."""
    print("🚀 STARTUP_PRODUCTION.PY - Starting Star Wars RPG Character Manager (Production Mode)")
    print("🔧 DEBUG: This message confirms startup_production.py is being executed")
    
    # Get configuration from environment
    port = os.getenv('PORT', '8000')
    host = os.getenv('HOST', '0.0.0.0')
    workers = int(os.getenv('GUNICORN_WORKERS', '2'))
    
    bind_address = f"{host}:{port}"
    
    # Set up paths for proper imports  
    app_dir = os.path.dirname(__file__)
    web_dir = os.path.join(app_dir, 'web')
    src_dir = os.path.join(app_dir, 'src')
    
    # Ensure PYTHONPATH includes both src and web directories
    python_path = os.environ.get('PYTHONPATH', '')
    if src_dir not in python_path:
        python_path = f"{src_dir}:{python_path}" if python_path else src_dir
    if web_dir not in python_path:
        python_path = f"{web_dir}:{python_path}"
    os.environ['PYTHONPATH'] = python_path
    
    # Change to web directory for wsgi.py
    os.chdir(web_dir)
    
    print(f"📊 Configuration:")
    print(f"   Bind: {bind_address}")
    print(f"   Workers: {workers}")
    print(f"   Working Directory: {web_dir}")
    print(f"   PYTHONPATH: {python_path}")
    
    # Build Gunicorn command
    cmd = [
        "gunicorn",
        "--bind", bind_address,
        "--workers", str(workers),
        "--worker-class", "sync",
        "--timeout", "120",
        "--keep-alive", "2",
        "--max-requests", "1000",
        "--max-requests-jitter", "100",
        "--preload",
        "--access-logfile", "-",
        "--error-logfile", "-",
        "--log-level", "info",
        "--pythonpath", python_path,
        "wsgi:application"
    ]
    
    print(f"🔧 Gunicorn command: {' '.join(cmd)}")
    
    try:
        # Start Gunicorn process
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Gunicorn failed to start: {e}")
        return False
    except KeyboardInterrupt:
        print("🛑 Received shutdown signal")
        return True
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
    
    return True

def main():
    """Main production startup sequence."""
    print("🌟 Star Wars RPG Character Manager - Production Startup")
    print("=" * 60)
    
    # Step 1: Wait for MongoDB
    if not wait_for_mongodb():
        print("❌ Cannot start without MongoDB")
        sys.exit(1)
    
    # Step 2: Ensure admin user exists
    if not ensure_admin_user():
        print("❌ Admin setup failed")
        sys.exit(1)
    
    # Step 3: Start production server
    print("\n🚀 Starting production web server...")
    port = os.getenv('PORT', '8000')
    print(f"   Access at: http://localhost:{port}")
    admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
    print(f"   Admin login: {admin_email}")
    print("=" * 60)
    
    success = start_production_server()
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()
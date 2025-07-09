#!/usr/bin/env python3
"""Optimized startup script for CI environments with faster startup and health checks."""

import os
import sys
import time
import threading
import signal
from datetime import datetime

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def wait_for_mongodb():
    """Wait for MongoDB with faster retries for CI."""
    max_retries = 15
    base_delay = 0.2
    max_delay = 5
    
    print("⏳ Connecting to MongoDB...")
    for attempt in range(max_retries):
        try:
            from swrpg_character_manager.database import db_manager
            db_manager.connect()
            print("✅ MongoDB connected successfully")
            return True
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"❌ MongoDB connection failed after {max_retries} attempts")
                print(f"   Error: {e}")
                return False
            
            # Faster exponential backoff for CI
            delay = min(base_delay * (1.5 ** attempt), max_delay)
            if attempt < 3:  # Show first few attempts
                print(f"   Attempt {attempt + 1}/{max_retries} - retrying in {delay:.1f}s...")
            time.sleep(delay)
    
    return False

def ensure_admin_user():
    """Ensure admin user exists with optimized setup."""
    try:
        print("👤 Setting up admin user...")
        from swrpg_character_manager.admin_setup import setup_admin_environment
        setup_admin_environment()
        print("✅ Admin environment ready")
        return True
        
    except Exception as e:
        print(f"❌ Admin setup error: {e}")
        return False

def start_flask_app():
    """Start Flask app in background thread for CI testing."""
    try:
        print("🚀 Initializing Flask application...")
        
        # Set optimal configuration for CI
        os.environ['FLASK_PORT'] = '8000'
        os.environ['PORT'] = '8000'
        os.environ['FLASK_ENV'] = os.getenv('FLASK_ENV', 'production')
        
        # Import and configure the Flask app
        web_dir = os.path.join(os.getcwd(), "web")
        if web_dir not in sys.path:
            sys.path.insert(0, web_dir)
        
        from app_with_auth import app
        
        # Configure for CI testing
        app.config.update({
            'TESTING': True,
            'DEBUG': False,
            'PROPAGATE_EXCEPTIONS': True,
            'TEMPLATES_AUTO_RELOAD': True
        })
        
        print("✅ Flask app configured")
        print("🌐 Starting web server on http://localhost:8000")
        
        # Start the app (this will run until interrupted)
        app.run(
            host='0.0.0.0',
            port=8000,
            debug=False,
            use_reloader=False,
            threaded=True
        )
        
    except Exception as e:
        print(f"❌ Flask startup error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

def run_health_check():
    """Perform a quick health check to verify the app is responding."""
    import urllib.request
    import urllib.error
    
    for attempt in range(10):
        try:
            with urllib.request.urlopen('http://localhost:8000/health', timeout=5) as response:
                if response.status == 200:
                    print("✅ Health check passed - application is ready!")
                    return True
        except (urllib.error.URLError, urllib.error.HTTPError, ConnectionError):
            if attempt < 9:
                time.sleep(1)
            else:
                print("⚠️  Health check timeout - app may still be starting...")
    
    return False

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    print(f"\n🛑 Received signal {signum}, shutting down...")
    sys.exit(0)

def main():
    """Main startup sequence optimized for CI."""
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("🌟 Star Wars RPG Character Manager - CI Startup")
    print(f"🕐 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 55)
    
    # Step 1: MongoDB connection
    if not wait_for_mongodb():
        print("❌ Cannot proceed without MongoDB")
        sys.exit(1)
    
    # Step 2: Admin user setup
    if not ensure_admin_user():
        print("❌ Admin setup failed")
        sys.exit(1)
    
    # Step 3: Start Flask application
    print("\n🚀 Launching web application...")
    admin_email = os.getenv("ADMIN_EMAIL", "clark@everson.dev")
    print(f"   👤 Admin: {admin_email}")
    print(f"   🌐 URL: http://localhost:8000")
    print(f"   🔧 Environment: {os.getenv('FLASK_ENV', 'production')}")
    print("=" * 55)
    
    # For CI, we want the app to start and stay running
    try:
        start_flask_app()
    except KeyboardInterrupt:
        print("\n🛑 Graceful shutdown initiated")
    except Exception as e:
        print(f"❌ Startup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
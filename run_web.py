#!/usr/bin/env python3
"""Simple script to run the web application."""

import os
import sys

# Configuration constants
DEFAULT_PORT = 8000
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def setup_python_paths():
    """Setup Python paths for imports."""
    sys.path.insert(0, os.path.join(SCRIPT_DIR, 'src'))
    sys.path.insert(0, os.path.join(SCRIPT_DIR, 'web'))

def change_to_web_directory():
    """Change to web directory for Flask template/static file discovery."""
    web_dir = os.path.join(SCRIPT_DIR, 'web')
    if not os.path.exists(web_dir):
        raise FileNotFoundError(f"Web directory not found: {web_dir}")
    os.chdir(web_dir)
    return web_dir

def get_port():
    """Get port from environment variables with fallback."""
    return int(os.getenv('PORT', os.getenv('FLASK_PORT', DEFAULT_PORT)))

def main():
    """Main application entry point."""
    try:
        print("🚀 Starting Star Wars RPG Character Manager Web Application...")
        
        # Setup environment
        setup_python_paths()
        web_dir = change_to_web_directory()
        port = get_port()
        
        print(f"📁 Working directory: {web_dir}")
        print(f"🌐 Server will start at: http://localhost:{port}")
        
        # Import and run Flask app
        from app_with_auth import app
        
        # Run in production mode
        app.run(debug=False, host='0.0.0.0', port=port)
        
    except ImportError as e:
        print(f"❌ Failed to import Flask application: {e}")
        print("   Make sure the web application files are present")
        sys.exit(1)
    except FileNotFoundError as e:
        print(f"❌ Required directory not found: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Application startup failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
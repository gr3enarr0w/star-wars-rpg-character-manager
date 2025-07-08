#!/usr/bin/env python3
"""WSGI entry point for production deployment."""

import os
import sys

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Add the web directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'web'))

# Change to web directory so Flask can find templates and static files
web_dir = os.path.join(os.path.dirname(__file__), 'web')
os.chdir(web_dir)

# Import the Flask application
from app_with_auth import app

# This is what Gunicorn will use
application = app

if __name__ == "__main__":
    # For development/testing only
    app.run(debug=False, host='0.0.0.0', port=8000)
#!/usr/bin/env python3
"""Simple script to run the web application."""

import os
import sys

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# Add the src directory to Python path
sys.path.insert(0, os.path.join(script_dir, 'src'))

# Add the web directory to Python path
sys.path.insert(0, os.path.join(script_dir, 'web'))

# Change to web directory so Flask can find templates and static files
web_dir = os.path.join(script_dir, 'web')
os.chdir(web_dir)

# Now import and run the app
from app import app

if __name__ == '__main__':
    print("Starting Star Wars RPG Character Manager Web Application...")
    print("Open your browser to: http://localhost:8000")
    print(f"Working directory: {os.getcwd()}")
    app.run(debug=True, host='127.0.0.1', port=8000)
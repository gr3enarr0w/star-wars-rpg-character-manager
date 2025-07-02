#!/usr/bin/env python3
"""Simplified startup script for testing that works without MongoDB."""

import os
import sys
from flask import Flask, jsonify

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

app = Flask(__name__)

@app.route('/health')
def health_check():
    """Simple health check for testing."""
    return jsonify({"status": "healthy", "message": "Testing mode - no database required"}), 200

@app.route('/login')
def login_page():
    """Simple login page for testing."""
    return '''
    <!DOCTYPE html>
    <html>
    <head><title>Star Wars RPG Character Manager - Testing</title></head>
    <body>
        <h1>Login Page - Testing Mode</h1>
        <p>Application is running successfully!</p>
    </body>
    </html>
    ''', 200

@app.route('/')
def index():
    """Simple index page for testing."""
    return '''
    <!DOCTYPE html>
    <html>
    <head><title>Star Wars RPG Character Manager - Testing</title></head>
    <body>
        <h1>Star Wars RPG Character Manager</h1>
        <p>Testing mode - Application is running successfully!</p>
        <a href="/login">Login</a>
    </body>
    </html>
    ''', 200

if __name__ == '__main__':
    print("🚀 Starting Star Wars RPG Character Manager in testing mode...")
    print("🔧 No database required for this testing run")
    app.run(host='0.0.0.0', port=8000, debug=False)
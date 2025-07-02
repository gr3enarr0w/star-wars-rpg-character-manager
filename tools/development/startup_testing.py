#!/usr/bin/env python3
"""Minimal testing server for CI/CD that works without MongoDB."""

import os
import sys
from datetime import datetime
from flask import Flask, jsonify

# Configuration
DEFAULT_PORT = 8000
DEBUG_MODE = os.getenv('FLASK_ENV') == 'development'

# Create Flask app
app = Flask(__name__)

def generate_test_page(title: str, message: str) -> str:
    """Generate consistent test page HTML."""
    return f'''<!DOCTYPE html>
<html>
<head>
    <title>Star Wars RPG Character Manager - Testing</title>
    <style>
        body {{ 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            background-color: #1a1a1a; 
            color: #fff; 
        }}
        h1 {{ color: #ffd700; }}
        .status {{ color: #00ff00; font-weight: bold; }}
        nav a {{ color: #87ceeb; margin-right: 20px; text-decoration: none; }}
        nav a:hover {{ text-decoration: underline; }}
    </style>
</head>
<body>
    <h1>{title}</h1>
    <p class="status">{message}</p>
    <nav>
        <a href="/">Home</a>
        <a href="/login">Login</a>
        <a href="/health">Health Check</a>
    </nav>
    <hr>
    <p><small>Testing server started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</small></p>
</body>
</html>'''

@app.route('/health')
def health_check():
    """JSON health check endpoint for CI/CD systems."""
    return jsonify({
        "status": "healthy", 
        "message": "Testing mode - no database required",
        "timestamp": datetime.utcnow().isoformat(),
        "mode": "testing"
    }), 200

@app.route('/login')
def login_page():
    """Testing login page."""
    return generate_test_page(
        "Login Page - Testing Mode",
        "Authentication testing interface - no real login required"
    )

@app.route('/')
def index():
    """Testing index page."""
    return generate_test_page(
        "Star Wars RPG Character Manager",
        "Testing mode - Application is running successfully!"
    )

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return generate_test_page(
        "Page Not Found",
        "The requested page was not found in testing mode"
    ), 404

def main():
    """Main entry point for testing server."""
    port = int(os.getenv('PORT', DEFAULT_PORT))
    
    print("🧪 Starting Star Wars RPG Character Manager - Testing Server")
    print("🔧 No database required for this testing run")
    print(f"🌐 Server running at: http://localhost:{port}")
    print("📋 Available endpoints:")
    print("   • / (index page)")
    print("   • /login (login page)")  
    print("   • /health (JSON health check)")
    print("=" * 60)
    
    try:
        app.run(host='0.0.0.0', port=port, debug=DEBUG_MODE)
    except Exception as e:
        print(f"❌ Testing server failed to start: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
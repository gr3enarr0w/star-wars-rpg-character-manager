"""WSGI entry point for production deployment."""

import os
import sys

print(f"🔍 WSGI Debug Info:")
print(f"   Current working directory: {os.getcwd()}")
print(f"   Python path: {sys.path}")
print(f"   PYTHONPATH env: {os.environ.get('PYTHONPATH', 'Not set')}")

try:
    print("📥 Importing app_with_auth...")
    from app_with_auth import app
    
    print(f"✅ Flask app imported successfully")
    print(f"📋 Available routes:")
    for rule in app.url_map.iter_rules():
        if 'campaign' in rule.endpoint.lower():
            print(f"   {rule.endpoint}: {rule.rule}")
    
    # Export the Flask application for Gunicorn
    application = app
    print("🚀 WSGI application configured successfully")
    
except Exception as e:
    print(f"❌ Failed to import Flask app: {e}")
    import traceback
    traceback.print_exc()
    raise

if __name__ == "__main__":
    application.run()
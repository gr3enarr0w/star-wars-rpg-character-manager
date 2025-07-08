"""WSGI entry point for production deployment."""

from app_with_auth import app

# Export the Flask application for Gunicorn
application = app

if __name__ == "__main__":
    application.run()
# Secure error handlers for production
from flask import jsonify, render_template
import logging

def setup_production_error_handlers(app):
    """Set up secure error handlers for production."""
    
    @app.errorhandler(404)
    def not_found_error(error):
        """Handle 404 errors without exposing system information."""
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors without exposing system information."""
        # Log the actual error for debugging
        app.logger.error(f'Server Error: {error}')
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(403)
    def forbidden_error(error):
        """Handle 403 errors."""
        return jsonify({'error': 'Access forbidden'}), 403
    
    @app.errorhandler(401)
    def unauthorized_error(error):
        """Handle 401 errors."""
        return jsonify({'error': 'Authentication required'}), 401
    
    @app.errorhandler(429)
    def rate_limit_error(error):
        """Handle rate limiting errors."""
        return jsonify({'error': 'Rate limit exceeded'}), 429

# Remove debug logging
def setup_production_logging(app):
    """Configure production logging."""
    import os
    
    if os.getenv('APP_ENV') == 'production':
        # Set logging level to INFO or higher
        app.logger.setLevel(logging.INFO)
        
        # Remove debug handlers
        for handler in app.logger.handlers[:]:
            if hasattr(handler, 'level') and handler.level == logging.DEBUG:
                app.logger.removeHandler(handler)
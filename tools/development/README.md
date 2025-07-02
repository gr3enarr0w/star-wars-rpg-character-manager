# Development Tools

This directory contains scripts for development and testing purposes.

## Scripts

### quick_start.py
**Purpose**: Local development setup script that creates admin user and starts the web application.

**Usage**:
```bash
# Set environment variables first
export ADMIN_EMAIL="your-admin@example.com"
export ADMIN_PASSWORD="your-secure-password"

# Run the quick start
python tools/development/quick_start.py
```

**Features**:
- Creates admin user automatically
- Starts web application on port 8000
- Shows login credentials and invite codes
- Includes testing instructions

### startup_testing.py
**Purpose**: Minimal Flask app for CI/CD testing without database dependencies.

**Usage**:
```bash
python tools/development/startup_testing.py
```

**Features**:
- No database required
- Simple health check endpoint
- Basic login page for testing
- Runs on port 8000

## Production Scripts

For production deployment, use the main startup script in the project root:
- `startup.py` - Production startup script with MongoDB integration
- `run_web.py` - Simple web application launcher
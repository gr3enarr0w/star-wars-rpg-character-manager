#!/bin/bash
# Docker entrypoint script for Star Wars RPG Character Manager
# Handles Unraid-specific permissions and configuration

set -e

# Default values
PUID=${PUID:-99}
PGID=${PGID:-100}

# Function to generate secure random keys
generate_key() {
    python3 -c "import secrets; print(secrets.token_urlsafe(32))"
}

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "🌟 Starting Star Wars RPG Character Manager"
log "🔧 User ID: $PUID, Group ID: $PGID"

# Create application user if it doesn't exist
if ! id "appuser" &>/dev/null; then
    groupadd -g "$PGID" appgroup 2>/dev/null || true
    useradd -u "$PUID" -g "$PGID" -s /bin/bash -d /app appuser 2>/dev/null || true
fi

# Ensure directories exist and have correct permissions
mkdir -p /app/logs /app/data
chown -R "$PUID:$PGID" /app/logs /app/data

# Generate secure keys if not provided
if [ -z "$FLASK_SECRET_KEY" ]; then
    export FLASK_SECRET_KEY=$(generate_key)
    log "🔐 Generated Flask secret key"
fi

if [ -z "$JWT_SECRET_KEY" ]; then
    export JWT_SECRET_KEY=$(generate_key)
    log "🔐 Generated JWT secret key"
fi

# Validate required environment variables
if [ -z "$MONGO_URI" ]; then
    log "❌ ERROR: MONGO_URI environment variable is required"
    log "   Example: mongodb://your-unraid-ip:27017/swrpg_character_manager"
    exit 1
fi

if [ -z "$ADMIN_EMAIL" ]; then
    log "❌ ERROR: ADMIN_EMAIL environment variable is required"
    exit 1
fi

if [ -z "$ADMIN_PASSWORD" ]; then
    log "❌ ERROR: ADMIN_PASSWORD environment variable is required"
    exit 1
fi

# Validate MongoDB connection
log "🔍 Validating MongoDB connection..."
if ! python3 -c "
import pymongo
import sys
try:
    client = pymongo.MongoClient('$MONGO_URI', serverSelectionTimeoutMS=5000)
    client.server_info()
    print('✅ MongoDB connection successful')
except Exception as e:
    print(f'❌ MongoDB connection failed: {e}')
    sys.exit(1)
" 2>/dev/null; then
    log "❌ ERROR: Cannot connect to MongoDB at $MONGO_URI"
    log "   Make sure MongoDB is running and accessible"
    log "   Check your MONGO_URI configuration"
    exit 1
fi

log "✅ Configuration validation complete"
log "🚀 Starting application as user $PUID:$PGID"

# Export environment variables for the application
export MONGODB_URI="$MONGO_URI"
export PYTHONPATH="/app/src"

# Debug: Show what command is being executed
log "🔥 ENTRYPOINT DEBUG: About to execute command: $@"
log "🔥 ENTRYPOINT DEBUG: All arguments: $*"

# FORCE: Override and always run startup_production.py
log "🔥 FORCE OVERRIDE: Running startup_production.py regardless of CMD"
exec gosu "$PUID:$PGID" python startup_production.py
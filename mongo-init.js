// MongoDB initialization script for Docker deployment
// This script sets up the initial database structure

db = db.getSiblingDB('swrpg_character_manager');

// Create collections with proper indexing
db.createCollection('users');
db.createCollection('characters');
db.createCollection('campaigns');
db.createCollection('invite_codes');

// Create indexes for performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.characters.createIndex({ "player_id": 1 });
db.characters.createIndex({ "campaign_id": 1 });
db.campaigns.createIndex({ "game_master_id": 1 });
db.campaigns.createIndex({ "players": 1 });
db.invite_codes.createIndex({ "code": 1 }, { unique: true });
db.invite_codes.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0 });

print('MongoDB initialized successfully for SWRPG Character Manager');
# Star Wars RPG Character Manager - Unraid Installation Guide

## 🎯 Overview
This guide will help you install the Star Wars RPG Character Manager on your Unraid server using Docker Compose.

## ✅ System Requirements
- Unraid 6.10+ with Docker support
- 2GB RAM minimum (4GB recommended)
- Docker Compose plugin installed
- Community Applications plugin (recommended)

## 🚀 Installation Methods

### Method 1: Docker Compose (Recommended)

#### Step 1: Create Project Directory
```bash
# SSH into your Unraid server and create the project directory
mkdir -p /mnt/user/appdata/swrpg-character-manager
cd /mnt/user/appdata/swrpg-character-manager
```

#### Step 2: Download Application Files
```bash
# Download the application files from GitHub
curl -L https://github.com/gr3enarr0w/python-course-app/archive/main.zip -o swrpg.zip
unzip swrpg.zip
mv python-course-app-main/* .
rm -rf python-course-app-main swrpg.zip
```

#### Step 3: Create Environment File
```bash
# Create your production environment file
cat > .env << 'EOF'
# Database Configuration
MONGO_URI=mongodb://mongo:27017/swrpg_character_manager

# Security Keys (CHANGE THESE!)
FLASK_SECRET_KEY=your-super-secret-flask-key-change-this-immediately
JWT_SECRET_KEY=your-jwt-secret-key-change-this-too

# Admin Account
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-secure-admin-password

# Optional: OAuth Configuration (leave blank if not using)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
EOF
```

#### Step 4: Set Permissions
```bash
# Set proper permissions
chmod 600 .env
chown -R nobody:users /mnt/user/appdata/swrpg-character-manager
```

#### Step 5: Start the Application
```bash
# Start with Docker Compose
docker-compose up -d
```

#### Step 6: Verify Installation
```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs web

# Test the application
curl http://localhost:8000/health
```

### Method 2: Unraid Community Applications

#### Step 1: Install Community Applications
1. Go to **Apps** tab in Unraid WebUI
2. Search for "Community Applications" and install if not already installed

#### Step 2: Add Custom Repository (If Available)
1. Go to **Apps** → **Settings**
2. Add custom repository: `https://github.com/gr3enarr0w/python-course-app`

#### Step 3: Install Application
1. Search for "Star Wars RPG Character Manager"
2. Configure environment variables
3. Set data path to `/mnt/user/appdata/swrpg-character-manager`
4. Install

## 🔧 Configuration

### Port Configuration
- **Web Interface**: Port 8000
- **MongoDB**: Port 27017 (internal)

### Environment Variables
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ADMIN_EMAIL` | Admin user email | Yes | - |
| `ADMIN_PASSWORD` | Admin user password | Yes | - |
| `FLASK_SECRET_KEY` | Flask session secret | Yes | - |
| `JWT_SECRET_KEY` | JWT token secret | Yes | - |
| `MONGO_URI` | MongoDB connection string | No | `mongodb://mongo:27017/swrpg_character_manager` |
| `GOOGLE_CLIENT_ID` | Google OAuth ID | No | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | No | - |
| `DISCORD_CLIENT_ID` | Discord OAuth ID | No | - |
| `DISCORD_CLIENT_SECRET` | Discord OAuth Secret | No | - |

### Data Persistence
- **Application Data**: `/mnt/user/appdata/swrpg-character-manager`
- **Database Data**: Docker volume `mongo_data`
- **Logs**: `/mnt/user/appdata/swrpg-character-manager/logs`

## 🌐 Accessing the Application

1. **Web Interface**: `http://your-unraid-ip:8000`
2. **Login**: Use the admin email/password you configured
3. **Health Check**: `http://your-unraid-ip:8000/health`

## 🔒 Security Recommendations

### Essential Security Steps
1. **Change Default Secrets**: Update `FLASK_SECRET_KEY` and `JWT_SECRET_KEY`
2. **Strong Admin Password**: Use a complex admin password
3. **Network Security**: Consider using Unraid's VPN or reverse proxy
4. **Regular Backups**: Backup your appdata directory

### Firewall Configuration
- Only expose port 8000 if external access is needed
- Use Unraid's built-in VPN for remote access
- Consider setting up Nginx Proxy Manager for SSL

## 🔄 Updates and Maintenance

### Updating the Application
```bash
cd /mnt/user/appdata/swrpg-character-manager
docker-compose pull
docker-compose up -d
```

### Backup
```bash
# Backup application data
tar -czf swrpg-backup-$(date +%Y%m%d).tar.gz /mnt/user/appdata/swrpg-character-manager

# Backup database
docker-compose exec mongo mongodump --archive=/data/backup.archive
docker cp $(docker-compose ps -q mongo):/data/backup.archive ./db-backup-$(date +%Y%m%d).archive
```

### Logs
```bash
# View application logs
docker-compose logs -f web

# View database logs
docker-compose logs -f mongo
```

## 🛠️ Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
docker-compose logs web

# Verify environment file
cat .env

# Check port conflicts
netstat -tlnp | grep 8000
```

#### Database Connection Issues
```bash
# Check MongoDB status
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"

# Restart database
docker-compose restart mongo
```

#### Permission Issues
```bash
# Fix permissions
chown -R nobody:users /mnt/user/appdata/swrpg-character-manager
chmod -R 755 /mnt/user/appdata/swrpg-character-manager
```

### Health Checks
- Application: `http://localhost:8000/health`
- Database: `docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"`

## 📊 Monitoring

### Container Health
```bash
# Check container health
docker-compose ps

# View resource usage
docker stats
```

### Application Metrics
- **Health Endpoint**: `/health`
- **Login Endpoint**: `/login`
- **API Status**: `/api/auth/me` (requires authentication)

## 🎮 Using the Application

### Features
- **Character Creation**: 55+ Star Wars species
- **Character Management**: Level progression, XP tracking
- **Campaign Management**: Organize game sessions
- **Role-Based Access**: Admin, Gamemaster, Player roles
- **Character Sheets**: Dynamic stat calculations
- **Export/Import**: Character data backup

### Getting Started
1. Login with admin credentials
2. Create user accounts for players
3. Set up campaigns
4. Start creating characters!

## 📚 Additional Resources

- **GitHub Repository**: https://github.com/gr3enarr0w/python-course-app
- **Documentation**: Check the repository README
- **Issues**: Report bugs on GitHub Issues
- **Community**: Unraid Community Forums

---

**Tested Configurations**: 
- Unraid 6.12+
- Docker 24.0+
- 4GB+ RAM systems
- x86_64 and ARM64 architectures

**Security Validated**: ✅ Comprehensive security testing completed
**UI Tested**: ✅ Complete end-to-end testing across all user roles
**Production Ready**: ✅ Optimized for production deployment
#!/bin/bash
# Star Wars RPG Character Manager - Unraid Quick Install Script
# Run this script on your Unraid server to quickly set up the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="swrpg-character-manager"
INSTALL_DIR="/mnt/user/appdata/${APP_NAME}"
GITHUB_REPO="gr3enarr0w/python-course-app"

echo -e "${BLUE}🌟 Star Wars RPG Character Manager - Unraid Installation${NC}"
echo -e "${BLUE}================================================================${NC}"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root${NC}"
   echo "Please run: sudo $0"
   exit 1
fi

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed or not available${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo -e "${YELLOW}💡 Install it with: curl -L \"https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-linux-x86_64\" -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Create installation directory
echo -e "${BLUE}📁 Creating installation directory...${NC}"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Download application files
echo -e "${BLUE}⬇️  Downloading application files...${NC}"
if [ -f "docker-compose.yml" ]; then
    echo -e "${YELLOW}⚠️  Installation directory already exists. Backing up existing files...${NC}"
    mkdir -p backup-$(date +%Y%m%d-%H%M%S)
    cp -r * backup-$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
fi

# Download latest release
curl -L "https://github.com/${GITHUB_REPO}/archive/main.zip" -o swrpg.zip
unzip -q swrpg.zip
cp -r python-course-app-main/* .
rm -rf python-course-app-main swrpg.zip

echo -e "${GREEN}✅ Application files downloaded${NC}"

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${BLUE}⚙️  Creating environment configuration...${NC}"
    cp .env.production .env
    
    # Generate secure keys
    echo -e "${YELLOW}🔐 Generating secure keys...${NC}"
    FLASK_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    JWT_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    
    # Update environment file with generated keys
    sed -i "s/CHANGE-THIS-TO-A-SECURE-RANDOM-STRING-32-CHARS-MIN/$FLASK_KEY/" .env
    sed -i "s/CHANGE-THIS-TO-ANOTHER-SECURE-RANDOM-STRING-32-CHARS-MIN/$JWT_KEY/" .env
    
    echo -e "${GREEN}✅ Environment file created with secure keys${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit .env file to set your admin email and password${NC}"
else
    echo -e "${GREEN}✅ Existing environment file found${NC}"
fi

# Set proper permissions
echo -e "${BLUE}🔧 Setting permissions...${NC}"
chown -R nobody:users "$INSTALL_DIR"
chmod 600 .env
chmod +x unraid-install.sh

# Start the application
echo -e "${BLUE}🚀 Starting Star Wars RPG Character Manager...${NC}"
docker-compose pull
docker-compose up -d

# Wait for application to start
echo -e "${BLUE}⏳ Waiting for application to start...${NC}"
sleep 30

# Check if application is running
if curl -f http://localhost:8000/health &>/dev/null; then
    echo -e "${GREEN}🎉 SUCCESS! Star Wars RPG Character Manager is running${NC}"
    echo -e "${GREEN}================================================================${NC}"
    echo -e "${GREEN}🌐 Web Interface: http://$(hostname -I | awk '{print $1}'):8000${NC}"
    echo -e "${GREEN}📧 Admin Email: $(grep ADMIN_EMAIL .env | cut -d'=' -f2)${NC}"
    echo -e "${YELLOW}🔑 Admin Password: Check your .env file${NC}"
    echo -e "${GREEN}📁 Installation: $INSTALL_DIR${NC}"
    echo -e "${GREEN}================================================================${NC}"
    echo
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo -e "1. ${YELLOW}Edit $INSTALL_DIR/.env${NC} to set your admin credentials"
    echo -e "2. ${YELLOW}Restart with: cd $INSTALL_DIR && docker-compose restart${NC}"
    echo -e "3. ${YELLOW}Access the web interface and start creating characters!${NC}"
    echo
    echo -e "${BLUE}📚 Management Commands:${NC}"
    echo -e "• View logs: ${YELLOW}cd $INSTALL_DIR && docker-compose logs -f${NC}"
    echo -e "• Restart: ${YELLOW}cd $INSTALL_DIR && docker-compose restart${NC}"
    echo -e "• Stop: ${YELLOW}cd $INSTALL_DIR && docker-compose down${NC}"
    echo -e "• Update: ${YELLOW}cd $INSTALL_DIR && docker-compose pull && docker-compose up -d${NC}"
else
    echo -e "${RED}❌ Application failed to start properly${NC}"
    echo -e "${YELLOW}🔍 Check logs with: cd $INSTALL_DIR && docker-compose logs${NC}"
    echo -e "${YELLOW}📧 Check your .env file configuration${NC}"
    exit 1
fi

echo -e "${GREEN}🎮 Enjoy your Star Wars RPG Character Manager!${NC}"
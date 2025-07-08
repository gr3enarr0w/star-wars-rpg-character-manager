# Star Wars RPG Character Manager - Unraid Template Creation Guide

## 🎯 Admin Guide: Creating Custom Unraid Template

This guide walks you through creating a custom Unraid template for the Star Wars RPG Character Manager from scratch using the Unraid WebUI.

## ✅ Prerequisites

- **Unraid 6.10+** with Docker support enabled
- **Admin access** to Unraid WebUI
- **Docker image** available at `ghcr.io/gr3enarr0w/star-wars-rpg-character-manager:latest`
- **MongoDB instance** running (see MongoDB Setup section below)

## 🗄️ MongoDB Setup (Required First)

Before creating the Star Wars RPG Character Manager template, you need MongoDB running. Here are your options:

### Option 1: Use Community Applications MongoDB Template (Recommended)

1. **Go to Apps tab** in Unraid WebUI
2. **Search for "MongoDB"** in Community Applications
3. **Install MongoDB** with these settings:
   - **Container Port**: `27017`
   - **Host Port**: `27017`
   - **Data Path**: `/mnt/user/appdata/mongodb`
4. **Start MongoDB** and verify it's running
5. **Note your Unraid IP** (e.g., `192.168.1.100`) for the connection string

### Option 2: Manual MongoDB Template

If no MongoDB template is available, create one with:
- **Repository**: `mongo:7.0`
- **Port**: `27017:27017`
- **Volume**: `/mnt/user/appdata/mongodb:/data/db`
- **Environment**: `MONGO_INITDB_DATABASE=swrpg_character_manager`

### Option 3: External MongoDB

You can also use an external MongoDB instance (another server, cloud service, etc.)

## 🚀 Step-by-Step Template Creation

### Step 1: Access Template Creation

1. Open your **Unraid WebUI** in a browser
2. Navigate to **Docker** tab
3. Click **Add Container**
4. Click **Advanced View** (toggle in top right)

### Step 2: Basic Template Configuration

Fill in these core settings:

#### Template Information
- **Name**: `star-wars-rpg-character-manager`
- **Overview**: `Star Wars RPG Character Manager - Dynamic character creation and management for Edge of the Empire, Age of Rebellion, and Force and Destiny RPG systems. Features 55+ species, career progression, XP tracking, and campaign management.`
- **Additional Requirements**: `None - All dependencies included in container`

#### Docker Configuration
- **Repository**: `ghcr.io/gr3enarr0w/star-wars-rpg-character-manager:latest`
- **Registry URL**: `https://ghcr.io/gr3enarr0w/star-wars-rpg-character-manager`
- **Icon URL**: `https://raw.githubusercontent.com/gr3enarr0w/star-wars-rpg-character-manager/main/web/static/img/icon.png`

#### Categories
Select these categories:
- **Game Servers**
- **Tools**
- **Network:Web**
- **Status:Stable**

#### Links
- **Support Thread**: `https://github.com/gr3enarr0w/star-wars-rpg-character-manager/issues`
- **Project Page**: `https://github.com/gr3enarr0w/star-wars-rpg-character-manager`

### Step 3: Network Configuration

#### Web Interface
- **WebUI**: `http://[IP]:[PORT:8000]`
- **Network Type**: `bridge`

#### Port Mapping
Click **Add another Path, Port, Variable, Label or Device** and add:
- **Config Type**: `Port`
- **Name**: `WebUI`
- **Container Port**: `8000`
- **Host Port**: `8000`
- **Connection Type**: `TCP`
- **Description**: `Web interface port`

### Step 4: Volume Mappings

Add these volume mappings by clicking **Add another Path, Port, Variable, Label or Device**:

#### Application Data
- **Config Type**: `Path`
- **Name**: `AppData`
- **Container Path**: `/app/data`
- **Host Path**: `/mnt/user/appdata/swrpg-character-manager`
- **Access Mode**: `Read/Write`
- **Description**: `Application data and character storage`

#### Logs
- **Config Type**: `Path`
- **Name**: `Logs`
- **Container Path**: `/app/logs`
- **Host Path**: `/mnt/user/appdata/swrpg-character-manager/logs`
- **Access Mode**: `Read/Write`
- **Description**: `Application logs`

### Step 5: Environment Variables

Add these environment variables by clicking **Add another Path, Port, Variable, Label or Device**:

#### Required Variables

**ADMIN_EMAIL**
- **Config Type**: `Variable`
- **Name**: `ADMIN_EMAIL`
- **Key**: `ADMIN_EMAIL`
- **Value**: `admin@example.com`
- **Description**: `Admin user email address`

**ADMIN_PASSWORD**
- **Config Type**: `Variable`
- **Name**: `ADMIN_PASSWORD`
- **Key**: `ADMIN_PASSWORD`
- **Value**: `ChangeMe123!`
- **Description**: `Admin user password (CHANGE THIS!)`

**FLASK_SECRET_KEY**
- **Config Type**: `Variable`
- **Name**: `FLASK_SECRET_KEY`
- **Key**: `FLASK_SECRET_KEY`
- **Value**: `your-super-secret-flask-key-change-this-immediately`
- **Description**: `Flask session secret key (CHANGE THIS!)`

**JWT_SECRET_KEY**
- **Config Type**: `Variable`
- **Name**: `JWT_SECRET_KEY`
- **Key**: `JWT_SECRET_KEY`
- **Value**: `your-jwt-secret-key-change-this-too`
- **Description**: `JWT token secret key (CHANGE THIS!)`

**MONGO_URI**
- **Config Type**: `Variable`
- **Name**: `MONGO_URI`
- **Key**: `MONGO_URI`
- **Value**: `mongodb://[UNRAID-IP]:27017/swrpg_character_manager`
- **Description**: `MongoDB connection string - Replace [UNRAID-IP] with your Unraid server IP`

#### Optional OAuth Variables

**GOOGLE_CLIENT_ID**
- **Config Type**: `Variable`
- **Name**: `GOOGLE_CLIENT_ID`
- **Key**: `GOOGLE_CLIENT_ID`
- **Value**: ``
- **Description**: `Google OAuth Client ID (optional)`

**GOOGLE_CLIENT_SECRET**
- **Config Type**: `Variable`
- **Name**: `GOOGLE_CLIENT_SECRET`
- **Key**: `GOOGLE_CLIENT_SECRET`
- **Value**: ``
- **Description**: `Google OAuth Client Secret (optional)`

**DISCORD_CLIENT_ID**
- **Config Type**: `Variable`
- **Name**: `DISCORD_CLIENT_ID`
- **Key**: `DISCORD_CLIENT_ID`
- **Value**: ``
- **Description**: `Discord OAuth Client ID (optional)`

**DISCORD_CLIENT_SECRET**
- **Config Type**: `Variable`
- **Name**: `DISCORD_CLIENT_SECRET`
- **Key**: `DISCORD_CLIENT_SECRET`
- **Value**: ``
- **Description**: `Discord OAuth Client Secret (optional)`

### Step 6: Advanced Configuration

#### Docker Settings
- **Console shell command**: `bash`
- **Privileged**: `Off`
- **Extra Parameters**: (leave blank)
- **Post Arguments**: (leave blank)
- **CPU Pinning**: (leave default)
- **Network Type**: `bridge`
- **Use Tailscale**: `Off`

### Step 7: Create Template

1. **Review all settings** to ensure accuracy
2. **Click Apply** to create the container
3. **Wait for Docker** to pull the image and start the container
4. **Check status** in Docker tab - should show "Started"

### Step 8: Test Installation

1. **Access Web Interface**: Navigate to `http://YOUR-UNRAID-IP:8000`
2. **Health Check**: Try `http://YOUR-UNRAID-IP:8000/health`
3. **Login**: Use the admin credentials you configured
4. **Create Test Character**: Verify the application works properly

## 🔧 Template Sharing (Optional)

### Export Template for Others

1. **Go to Docker tab**
2. **Click on your container**
3. **Click Edit**
4. **Click the template export button** (if available)
5. **Save the XML template** to share with others

### Template XML Structure

Your template should generate XML similar to:
```xml
<Containers>
  <Container>
    <Name>star-wars-rpg-character-manager</Name>
    <Repository>ghcr.io/gr3enarr0w/star-wars-rpg-character-manager:latest</Repository>
    <Registry>https://ghcr.io/gr3enarr0w/star-wars-rpg-character-manager</Registry>
    <Network>bridge</Network>
    <Privileged>false</Privileged>
    <Support>https://github.com/gr3enarr0w/star-wars-rpg-character-manager/issues</Support>
    <Project>https://github.com/gr3enarr0w/star-wars-rpg-character-manager</Project>
    <Overview>Star Wars RPG Character Manager - Dynamic character creation and management</Overview>
    <Category>Game Servers: Tools: Network:Web Status:Stable</Category>
    <WebUI>http://[IP]:[PORT:8000]</WebUI>
    <Icon>https://raw.githubusercontent.com/gr3enarr0w/star-wars-rpg-character-manager/main/web/static/img/icon.png</Icon>
    <Config Name="WebUI" Target="8000" Default="8000" Mode="tcp" Description="Web interface port" Type="Port" Display="always" Required="true" Mask="false">8000</Config>
    <Config Name="AppData" Target="/app/data" Default="/mnt/user/appdata/swrpg-character-manager" Mode="rw" Description="Application data and character storage" Type="Path" Display="always" Required="true" Mask="false">/mnt/user/appdata/swrpg-character-manager</Config>
    <!-- Additional configs for environment variables -->
  </Container>
</Containers>
```

## 🔄 Post-Creation Management

### Updating the Template

1. **Edit the container** in Docker tab
2. **Update repository tag** if needed
3. **Modify environment variables** as required
4. **Apply changes** and restart container

### User Instructions

Once your template is created, provide users with these instructions:

1. **Navigate to Docker tab**
2. **Click Add Container**
3. **Select your custom template**
4. **Configure environment variables** (especially secrets!)
5. **Set data path** to their preferred location
6. **Click Apply** to install

## 🛠️ Troubleshooting Template Creation

### Common Issues

**Container Won't Start**
- Check Docker logs in Unraid
- Verify all required environment variables are set
- Ensure port 8000 isn't already in use
- Check volume mount permissions

**Image Pull Errors**
- Verify repository URL is correct
- Check if image exists at specified tag
- Ensure Unraid has internet access

**Permission Issues**
- Set correct ownership on appdata directory
- Use proper volume mount paths
- Check Unraid user permissions

### Validation Steps

1. **Container Status**: Should show "Started" in Docker tab
2. **Port Access**: `http://UNRAID-IP:8000` should load
3. **Health Check**: `http://UNRAID-IP:8000/health` should return "OK"
4. **Login Function**: Admin credentials should work
5. **Data Persistence**: Character data should save between restarts

## 📋 Template Checklist

Before sharing your template, verify:

- [ ] All required environment variables are included
- [ ] Default values are secure (or marked for change)
- [ ] Volume mounts are correctly configured
- [ ] Port mappings are accurate
- [ ] Network settings are appropriate
- [ ] Icon URL is accessible
- [ ] Support/project links are correct
- [ ] Categories are properly selected
- [ ] Description is comprehensive
- [ ] Container starts successfully
- [ ] Web interface is accessible
- [ ] Application functions correctly

## 📚 Additional Resources

- **Docker Image**: `ghcr.io/gr3enarr0w/star-wars-rpg-character-manager:latest`
- **GitHub Repository**: https://github.com/gr3enarr0w/star-wars-rpg-character-manager
- **Docker Hub**: (if published there)
- **Unraid Template Documentation**: https://unraid.net/community/apps

---

**🎯 Template Ready**: Your custom Unraid template is now configured and ready for deployment or sharing with the community!
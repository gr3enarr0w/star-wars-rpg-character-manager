# Star Wars RPG Character Manager

A comprehensive web application for managing characters, campaigns, and gameplay in Star Wars tabletop RPG systems. Built with modern web technologies and designed for seamless collaboration between Game Masters and players.

![Star Wars RPG Character Manager](https://img.shields.io/badge/Star%20Wars-RPG%20Manager-yellow?style=for-the-badge&logo=starwars)

## Features

### ✅ Completed Features

#### 🔐 Authentication & Security
- **JWT-based Authentication** - Secure token-based authentication system
- **Invite-Only Registration** - Controlled access with invite codes
- **Two-Factor Authentication (2FA)** - Enhanced security with TOTP support
- **Social Authentication** - Google and Discord OAuth integration
- **NIST-Compliant Encryption** - Enterprise-grade data protection
- **Comprehensive Audit Logging** - Full activity tracking for security and compliance

#### 👥 User Management
- **Role-Based Access Control** - Admin, Game Master, and Player roles
- **User Profile Management** - Customizable user profiles and preferences
- **Admin Panel** - Complete administrative interface for user management
- **Invite Code System** - Secure invitation management for new users

#### 🎲 Campaign Management
- **Campaign Creation & Management** - Full campaign lifecycle support
- **Game Master Tools** - Comprehensive GM interface and controls
- **Player Invitation System** - Easy player recruitment and management
- **Campaign-Specific Settings** - Customizable rules and configurations per campaign

#### 🧙‍♂️ Character Management
- **Comprehensive Character Creation** - Support for multiple Star Wars RPG systems
- **Species & Career Selection** - Complete database of Star Wars species and careers
- **Experience Point (XP) Management** - Automated XP tracking and progression
- **Character Sheet Integration** - Full character sheet management and updates

#### 🛠️ Technical Infrastructure
- **MongoDB Database** - Scalable NoSQL database with comprehensive schema
- **RESTful API** - Complete API for all application functionality
- **Modern Web Interface** - Responsive design with Star Wars theming
- **Documentation System** - Role-based documentation with comprehensive guides

### 🐛 Known Issues (In Progress)

#### Color/Theme Issues
- Homepage shows black/yellow instead of consistent Star Wars theme
- Login page has white background instead of dark theme
- Documentation section has poor font color contrast
- Profile settings modal doesn't match dark mode theme

#### Navigation/UI Issues
- Create Character button is non-functional
- Persistent "Loading..." state on main content area
- Missing empty state for when no characters exist
- "All Characters" view shows empty content

#### Settings/Security Issues
- MFA page should be part of Security settings, not standalone
- Profile settings should be full page instead of modal
- MFA settings don't properly reflect current user profile

## Technology Stack

### Backend
- **Python 3.13+** - Modern Python with latest features
- **MongoDB** - Document database for flexible data storage
- **JWT Authentication** - Secure token-based authentication
- **RESTful API** - Well-structured API endpoints

### Frontend
- **Modern JavaScript** - ES6+ features and modules
- **Responsive CSS** - Mobile-first design approach
- **Star Wars UI Theme** - Immersive theming and design

### Security
- **NIST-Compliant Encryption** - Industry-standard data protection
- **Two-Factor Authentication** - TOTP-based 2FA
- **OAuth Integration** - Google and Discord social login
- **Audit Logging** - Comprehensive activity tracking

## Installation & Setup

### Prerequisites
- Python 3.13 or higher
- MongoDB 4.4 or higher
- Node.js 16+ (for frontend build tools)
- Git

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/star-wars-rpg-character-manager.git
   cd star-wars-rpg-character-manager
   ```

2. **Set up Python virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -e .
   ```

4. **Set up MongoDB:**
   ```bash
   # Install MongoDB (varies by OS)
   # macOS with Homebrew:
   brew install mongodb-community
   brew services start mongodb-community
   
   # Ubuntu/Debian:
   sudo apt install mongodb
   sudo systemctl start mongodb
   ```

5. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. **Initialize the database:**
   ```bash
   python scripts/init_db.py
   ```

7. **Start the development server:**
   ```bash
   python app.py
   ```

8. **Access the application:**
   Open your browser to `http://localhost:5000`

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/starwars_rpg
MONGODB_DB_NAME=starwars_rpg

# Security
JWT_SECRET_KEY=your-super-secret-jwt-key
ENCRYPTION_KEY=your-32-byte-encryption-key
SESSION_SECRET=your-session-secret

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Email Configuration (for invites)
SMTP_SERVER=your-smtp-server
SMTP_PORT=587
SMTP_USERNAME=your-email
SMTP_PASSWORD=your-password

# Application Settings
APP_ENV=development
DEBUG=true
LOG_LEVEL=INFO
```

## API Documentation

The application provides a comprehensive RESTful API. See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete endpoint documentation.

### Quick API Overview

- **Authentication**: `/api/auth/*` - Login, registration, 2FA
- **Users**: `/api/users/*` - User management and profiles
- **Campaigns**: `/api/campaigns/*` - Campaign CRUD operations
- **Characters**: `/api/characters/*` - Character management
- **Admin**: `/api/admin/*` - Administrative functions

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Code style and standards
- Development workflow
- Testing requirements
- Pull request process

## Deployment

For production deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Documentation

- [API Documentation](API_DOCUMENTATION.md) - Complete API reference
- [Contributing Guidelines](CONTRIBUTING.md) - Development workflow
- [Deployment Guide](DEPLOYMENT.md) - Production deployment
- [Changelog](CHANGELOG.md) - Version history and updates

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- **Bug Reports**: [Create a bug report](https://github.com/gr3enarr0w/star-wars-rpg-character-manager/issues/new?template=bug_report.yml)
- **Feature Requests**: [Request a feature](https://github.com/gr3enarr0w/star-wars-rpg-character-manager/issues/new?template=feature_request.yml)
- **Documentation Issues**: [Report docs problems](https://github.com/gr3enarr0w/star-wars-rpg-character-manager/issues/new?template=documentation.yml)
- **General Questions**: [Browse existing issues](https://github.com/gr3enarr0w/star-wars-rpg-character-manager/issues) or create a new one

## Acknowledgments

- Built for the Star Wars RPG community
- Inspired by the rich Star Wars universe and tabletop gaming tradition
- Thanks to all contributors and beta testers

---

**May the Force be with you!** 🌟

## Project Status

- **Current Version**: 1.0.0
- **Status**: Active Development
- **Last Updated**: January 2024
- **Maintainers**: Development Team

## Development Roadmap

### v1.0 - Core Platform (Current)
- Fix critical bugs (Create Character button, loading states, theme issues)
- Character management workflow polish
- Campaign filtering and selection enhancement
- Enhanced loading states and empty states
- Consistent dark theme implementation
- Settings page architecture restructure
- Font contrast and accessibility optimization

### v1.01-1.09 - Incremental Improvements
- Real-time notifications and updates
- Enhanced character progression tracking
- Advanced campaign management tools
- Admin panel feature enhancements
- Performance optimizations

### v1.1 - Final Major Release
- **Mobile compatibility** (responsive design optimization)
- **Foundry VTT integration** (maybe - if feasible)
- **AI-powered game assistance** features
- Advanced reporting and analytics
- Multi-system RPG support (D&D, Pathfinder, etc.)
- Community sharing and campaign marketplace
- Extended VTT platform integrations
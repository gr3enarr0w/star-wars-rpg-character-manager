# Star Wars RPG Character Manager

A comprehensive web application for managing characters in the Star Wars RPG system (Edge of the Empire, Age of Rebellion, Force and Destiny).

## 🌟 Features

### 🔐 **Enterprise Security**
- **NIST-compliant data encryption** with AES-256 for all sensitive user data
- **PBKDF2 key derivation** with SHA-256 and 100,000 iterations
- **Zero email exposure** in API responses for privacy protection
- **Enhanced authentication** with modern security protocols
- **Invite-only registration** system for controlled access
- **Security audit logging** for compliance tracking

### 👥 **User Management**
- Role-based access control (Admin, Game Master, Player)
- Secure user authentication with JWT tokens
- Account management with encrypted user data
- Social login integration (Google, Discord)

### 🎲 **Character Management**
- **Full character creation** with 20+ Star Wars species
- **Complete career system** covering all three game lines
- **XP tracking and advancement** with official rules
- **Skill and characteristic progression** 
- **Character import/export** functionality
- **Character sheet display** with calculated values

### 🏰 **Campaign System**
- **Campaign creation** and management by Game Masters
- **Player invitation system** with secure invite codes
- **Character-campaign assignment** with proper access controls
- **Multi-campaign support** for characters and players

### 🎯 **Game Mechanics**
- **Dice pool calculation** (Ability + Proficiency dice)
- **Wound and Strain thresholds** calculation
- **XP costs** following official advancement rules
- **Species characteristics** and starting XP
- **Career skills** with reduced advancement costs

## 🚀 Quick Start

### Prerequisites
- Python 3.13+
- MongoDB (local or cloud)
- Modern web browser

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd new_app_sheets
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize the database**
```bash
python fix_database.py
```

5. **Start the application**
```bash
python web/app_with_auth.py
```

6. **Access the application**
Open http://127.0.0.1:8001 in your browser

## 📖 User Guide

### Getting Started

#### 1. **User Registration**
- Contact an administrator for an invite code
- Visit the registration page
- Provide email, username, password, and invite code
- Complete registration process

#### 2. **First Login**
- Use your email and password to log in
- Configure enhanced security settings (recommended)
- Complete your profile

#### 3. **Creating Your First Character**
- Click "Create New Character" on the dashboard
- Fill in character details:
  - **Name**: Your character's name
  - **Player Name**: Your real name
  - **Species**: Choose from 20+ Star Wars species
  - **Career**: Select from Edge of the Empire, Age of Rebellion, or Force and Destiny
  - **Background**: Optional character backstory

### Character Management

#### **Character Dashboard**
- View all your characters at a glance
- See character level, available XP, and basic stats
- Quick actions: View, Edit, Delete, Export, Assign Campaign

#### **Character Sheet**
- **Characteristics**: Brawn, Agility, Intellect, Cunning, Willpower, Presence
- **Skills**: Organized by characteristic with career skill indicators
- **Dice Pools**: Automatically calculated for each skill
- **Advancement**: Spend XP on characteristics and skills

#### **Character Advancement**
- **Award XP**: Game Masters can award experience points
- **Increase Characteristics**: Spend XP to improve core attributes (costs: 30, 40, 50, 60 XP)
- **Advance Skills**: Improve skill ranks (career skills cost less)
- **Undo Mistakes**: Reduce characteristics/skills to refund XP

### Campaign System

#### **For Game Masters**
1. **Create Campaign**
   - Click "Create Campaign"
   - Provide campaign name and description
   - Set campaign preferences

2. **Invite Players**
   - Generate invite codes from campaign page
   - Share codes with players
   - Manage campaign membership

3. **Manage Characters**
   - View all characters in your campaigns
   - Award XP to player characters
   - Monitor character progression

#### **For Players**
1. **Join Campaign**
   - Get invite code from Game Master
   - Enter code in campaign join interface
   - Confirm campaign membership

2. **Assign Characters**
   - Use "Assign Campaign" button on character cards
   - Select target campaign from dropdown
   - Confirm assignment

### Security Features

#### **Enhanced Security**
1. Configure security settings in account preferences
2. Set up additional protection methods
3. Save security information securely
4. Use enhanced authentication for better security

#### **Data Privacy**
- All emails encrypted at rest in database
- No sensitive data exposed in API responses
- Secure session management with JWT tokens
- Audit logging for security events

## 🎲 Game Mechanics Reference

### Character Creation
- **Starting XP**: Varies by species (typically 110 XP)
- **Characteristics**: Start at 1-3 based on species
- **Skills**: Begin with career skills

### Experience Point Costs
- **Characteristics**: 30/40/50/60 XP (for ranks 2/3/4/5)
- **Career Skills**: (New Rank × 5) XP
- **Non-Career Skills**: (New Rank × 5) + 5 XP

### Species Information

#### Core Species
- **Human**: 110 starting XP, flexible characteristics
- **Twi'lek**: 100 XP, +1 Cunning, +1 Brawn
- **Rodian**: 100 XP, +1 Agility, +1 Willpower
- **Wookiee**: 90 XP, +2 Brawn, +1 Willpower
- **Bothan**: 100 XP, +1 Cunning, +1 Brawn

#### Extended Species
- **Duros**: 100 XP, pilot specialists
- **Gand**: 100 XP, tracker specialists
- **Trandoshan**: 90 XP, hunter specialists
- **Chiss**: 100 XP, tactical specialists
- **Mon Calamari**: 100 XP, technical specialists

### Career Paths

#### Edge of the Empire
- **Bounty Hunter**: Combat and tracking
- **Colonist**: Social and survival
- **Explorer**: Discovery and navigation
- **Hired Gun**: Combat and intimidation
- **Smuggler**: Piloting and deception
- **Technician**: Mechanics and computers

#### Age of Rebellion
- **Ace**: Piloting and gunnery
- **Commander**: Leadership and tactics
- **Diplomat**: Social and negotiation

#### Force and Destiny
- **Consular**: Healing and knowledge
- **Guardian**: Protection and combat
- **Mystic**: Perception and enhancement
- **Seeker**: Survival and tracking
- **Sentinel**: Investigation and stealth
- **Warrior**: Combat and athletics

## 🔧 Administration

### Admin Functions
- **User Management**: Create invite codes, manage user roles
- **Campaign Oversight**: Monitor all campaigns and characters
- **System Maintenance**: Database management and security

### Database Management
- **User Migration**: Migrate existing users to encrypted format
- **Backup**: Regular database backups recommended
- **Monitoring**: Track system performance and security events

## 🛡️ Security Implementation

### Encryption Standards
- **Algorithm**: AES-256 via Fernet encryption
- **Key Derivation**: PBKDF2 with SHA-256, 100,000 iterations
- **Salt**: Unique per installation
- **Compliance**: NIST security standards

### Access Control
- **Authentication**: JWT-based session management
- **Authorization**: Role-based access control
- **API Security**: No sensitive data in responses
- **Audit Logging**: All data access events logged

## 🐛 Troubleshooting

### Common Issues

#### Character Creation Fails
- Ensure all required fields are filled
- Check that species and career are selected
- Verify you have permission to create characters

#### Login Problems
- Verify email and password are correct
- Check if enhanced security is enabled and provide credentials
- Contact admin if account is locked

#### Campaign Assignment Issues
- Ensure you own the character
- Verify you're a member of the target campaign
- Check with Game Master for campaign access

#### XP/Advancement Problems
- Confirm you have sufficient available XP
- Check that characteristic/skill isn't at maximum
- Verify you have advancement permissions

### Getting Help
- Check the in-app help guide
- Contact your Game Master for campaign issues
- Reach out to administrators for account problems

## 📊 Technical Details

### Technology Stack
- **Backend**: Flask with Python 3.13+
- **Database**: MongoDB with encrypted collections
- **Frontend**: Vanilla JavaScript with modern ES6+
- **Security**: Cryptography library, JWT tokens
- **Authentication**: Flask-JWT-Extended, Enhanced Security

### API Endpoints
- `POST /api/auth/login` - User authentication
- `GET /api/characters` - List user characters
- `POST /api/characters` - Create new character
- `GET /api/campaigns` - List user campaigns
- `POST /api/campaigns` - Create new campaign

### Database Schema
- **Users**: Encrypted email storage with role-based access
- **Characters**: Full character data with advancement tracking
- **Campaigns**: Campaign management with player membership
- **Audit Logs**: Security event tracking

## 🔮 Future Enhancements

### Planned Features
- **Talent Trees**: Visual talent progression
- **Equipment Management**: Gear and weapon tracking
- **Vehicle System**: Ship and vehicle management
- **Force Powers**: Force user advancement
- **Obligation/Duty**: Narrative mechanic tracking

### Integration Possibilities
- **Discord Bot**: Campaign notifications and dice rolling
- **Mobile App**: Native mobile character sheets
- **PDF Export**: Printable character sheets
- **API Extensions**: Third-party integrations

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read CONTRIBUTING.md for guidelines on:
- Code style and standards
- Testing requirements
- Security considerations
- Documentation updates

## 📞 Support

For support, please contact:
- **Technical Issues**: Create an issue in the repository
- **Security Concerns**: Contact administrators directly
- **Feature Requests**: Submit enhancement proposals

---

*May the Force be with you!* ⭐
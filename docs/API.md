# API Documentation

## Overview

The Star Wars RPG Character Manager provides a RESTful API for character and campaign management. All endpoints require proper authentication and follow security best practices.

## 🔐 Authentication

### JWT Token Authentication
All API endpoints (except login/register) require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Login Flow
1. **POST** `/api/auth/login` - Authenticate user
2. Receive JWT token in response
3. Include token in subsequent API requests

## 📚 API Endpoints

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "two_factor_token": "123456"  // Optional, if 2FA enabled
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "player1",
    "role": "player"
  }
}
```

**Error Responses:**
- `400` - Missing required fields
- `401` - Invalid credentials or 2FA token required

#### POST /api/auth/register
Register new user with invite code.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "username": "newplayer",
  "password": "securepassword",
  "invite_code": "INVITE123"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user_id": "507f1f77bcf86cd799439011"
}
```

#### GET /api/auth/me
Get current user information.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "username": "player1",
  "role": "player",
  "two_factor_enabled": false
}
```

#### POST /api/auth/setup-2fa
Set up two-factor authentication.

**Response (200):**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "backup_codes": ["12345678", "87654321", ...]
}
```

#### POST /api/auth/verify-2fa-setup
Verify and enable 2FA setup.

**Request Body:**
```json
{
  "token": "123456"
}
```

### Character Management

#### GET /api/characters
List user's characters, optionally filtered by campaign.

**Query Parameters:**
- `campaign_id` (optional) - Filter by specific campaign

**Response (200):**
```json
{
  "characters": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Luke Skywalker",
      "playerName": "Player One",
      "species": "Human",
      "career": "Guardian",
      "totalXP": 150,
      "availableXP": 25,
      "campaign_id": "507f1f77bcf86cd799439012",
      "level": 2,
      "woundThreshold": 12,
      "strainThreshold": 13,
      "characteristics": {
        "brawn": 2,
        "agility": 3,
        "intellect": 2,
        "cunning": 2,
        "willpower": 3,
        "presence": 2
      }
    }
  ]
}
```

#### POST /api/characters
Create new character.

**Request Body:**
```json
{
  "name": "Leia Organa",
  "playerName": "Player Two",
  "species": "Human",
  "career": "Diplomat",
  "background": "Princess of Alderaan",
  "campaign_id": "507f1f77bcf86cd799439012"  // Optional
}
```

**Response (201):**
```json
{
  "message": "Character created successfully",
  "character": {
    "id": "507f1f77bcf86cd799439013",
    "name": "Leia Organa",
    "playerName": "Player Two",
    "species": "Human",
    "career": "Diplomat",
    "totalXP": 110,
    "availableXP": 110
  }
}
```

#### GET /api/characters/{character_id}
Get detailed character information.

**Response (200):**
```json
{
  "character": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Luke Skywalker",
    "playerName": "Player One",
    "species": "Human",
    "career": "Guardian",
    "background": "Farm boy from Tatooine",
    "totalXP": 150,
    "availableXP": 25,
    "spentXP": 125,
    "characteristics": {
      "brawn": 2,
      "agility": 3,
      "intellect": 2,
      "cunning": 2,
      "willpower": 3,
      "presence": 2
    },
    "skills": {
      "Athletics": {"level": 2, "career": false},
      "Lightsaber": {"level": 3, "career": true}
    },
    "campaign_id": "507f1f77bcf86cd799439012"
  }
}
```

#### DELETE /api/characters/{character_id}
Delete character (soft delete).

**Response (200):**
```json
{
  "message": "Character deleted successfully"
}
```

#### POST /api/characters/{character_id}/assign-campaign
Assign character to a campaign.

**Request Body:**
```json
{
  "campaign_id": "507f1f77bcf86cd799439012"  // null to remove from all campaigns
}
```

**Response (200):**
```json
{
  "message": "Character assigned to campaign successfully"
}
```

#### POST /api/characters/{character_id}/award-xp
Award experience points to character.

**Request Body:**
```json
{
  "amount": 10,
  "reason": "Completed adventure"  // Optional
}
```

**Response (200):**
```json
{
  "message": "Awarded 10 XP",
  "totalXP": 160,
  "availableXP": 35
}
```

### Character Advancement

#### POST /api/characters/{character_id}/characteristics/{characteristic}
Modify character characteristic.

**URL Parameters:**
- `characteristic`: brawn, agility, intellect, cunning, willpower, presence

**Request Body:**
```json
{
  "action": "increase"  // or "decrease"
}
```

**Response (200):**
```json
{
  "message": "Brawn increased successfully",
  "newValue": 3,
  "availableXP": 85,
  "spentXP": 65
}
```

#### POST /api/characters/{character_id}/skills/{skill}
Modify character skill.

**Request Body:**
```json
{
  "action": "increase"  // or "decrease"
}
```

**Response (200):**
```json
{
  "message": "Athletics increased successfully",
  "newLevel": 2,
  "availableXP": 105,
  "spentXP": 45
}
```

### Campaign Management

#### GET /api/campaigns
List user's campaigns (as player or GM).

**Response (200):**
```json
{
  "campaigns": [
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Rebels vs Empire",
      "description": "A campaign of rebellion",
      "is_game_master": true,
      "player_count": 4,
      "character_count": 6,
      "created_at": "2025-06-09T10:30:00Z"
    }
  ]
}
```

#### POST /api/campaigns
Create new campaign (GM only).

**Request Body:**
```json
{
  "name": "New Hope Campaign",
  "description": "Following the events of A New Hope"
}
```

**Response (201):**
```json
{
  "message": "Campaign created successfully",
  "campaign_id": "507f1f77bcf86cd799439014"
}
```

#### POST /api/campaigns/{campaign_id}/invite
Generate campaign invite code (GM only).

**Response (200):**
```json
{
  "message": "Campaign invite code generated successfully",
  "invite_code": "CAMP123ABC"
}
```

#### POST /api/campaigns/join
Join campaign using invite code.

**Request Body:**
```json
{
  "invite_code": "CAMP123ABC"
}
```

**Response (200):**
```json
{
  "message": "Successfully joined campaign"
}
```

### Admin Endpoints

#### POST /api/admin/invite
Create user invite code (admin only).

**Request Body:**
```json
{
  "role": "player",        // player, gamemaster, admin
  "expires_in_days": 7     // Optional, default 7
}
```

**Response (201):**
```json
{
  "invite_code": "INVITE123XYZ",
  "role": "player",
  "expires_in_days": 7
}
```

## 🛡️ Security Considerations

### Data Privacy
- **No Email Exposure**: User emails never included in API responses
- **Role-Based Access**: Users can only access authorized data
- **JWT Security**: Tokens expire after 24 hours
- **Audit Logging**: All data access events logged

### Error Handling
All endpoints return consistent error formats:

```json
{
  "error": "Descriptive error message"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Rate Limiting
- Authentication endpoints: 10 requests per minute
- Data endpoints: 100 requests per minute
- Admin endpoints: 50 requests per minute

## 📝 Usage Examples

### Complete Character Creation Flow

```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'player@example.com',
    password: 'password123'
  })
});
const { access_token } = await loginResponse.json();

// 2. Create character
const characterResponse = await fetch('/api/characters', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    name: 'Han Solo',
    playerName: 'Player Three',
    species: 'Human',
    career: 'Smuggler',
    background: 'Corellian pilot and smuggler'
  })
});
const character = await characterResponse.json();

// 3. Award XP
await fetch(`/api/characters/${character.character.id}/award-xp`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    amount: 15,
    reason: 'Successfully completed first adventure'
  })
});
```

### Campaign Management Example

```javascript
// Create campaign (as GM)
const campaignResponse = await fetch('/api/campaigns', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${gm_token}`
  },
  body: JSON.stringify({
    name: 'Outer Rim Adventures',
    description: 'Exploring the dangerous Outer Rim territories'
  })
});
const { campaign_id } = await campaignResponse.json();

// Generate invite code
const inviteResponse = await fetch(`/api/campaigns/${campaign_id}/invite`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${gm_token}` }
});
const { invite_code } = await inviteResponse.json();

// Player joins campaign
await fetch('/api/campaigns/join', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${player_token}`
  },
  body: JSON.stringify({ invite_code })
});
```

## 🔧 Development Notes

### Testing Endpoints
Use tools like Postman or curl to test API endpoints:

```bash
# Login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Get characters (with token)
curl -X GET http://localhost:8001/api/characters \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Error Debugging
- Check browser developer tools for detailed error messages
- Review Flask application logs for server-side errors
- Verify JWT token validity and expiration
- Confirm proper role-based permissions

---

*The API is your ally in building great Star Wars RPG experiences!*
# API Documentation

## Star Wars RPG Character Manager REST API

This document provides comprehensive documentation for the Star Wars RPG Character Manager REST API. The API follows RESTful principles and uses JSON for data exchange.

## Base URL

```
http://localhost:5000/api
```

Production URL will be provided when deployed.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting an Auth Token

**POST** `/auth/login`

```json
{
  "username": "your-username",
  "password": "your-password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "your-username",
    "email": "user@example.com",
    "role": "player"
  }
}
```

## API Endpoints

### Authentication Endpoints

#### Login
**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "string",
    "profile": {
      "display_name": "string",
      "avatar_url": "string"
    }
  }
}
```

#### Register (Invite-Only)
**POST** `/auth/register`

Register new user with invite code.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "invite_code": "string",
  "display_name": "string"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "player"
  }
}
```

#### Two-Factor Authentication
**POST** `/auth/2fa/setup`

Set up 2FA for user account.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "qr_code": "data:image/png;base64,...",
  "secret": "string",
  "backup_codes": ["string"]
}
```

**POST** `/auth/2fa/verify`

Verify 2FA setup with TOTP code.

**Request Body:**
```json
{
  "code": "123456"
}
```

#### Social Authentication
**GET** `/auth/google`

Redirect to Google OAuth.

**GET** `/auth/discord`

Redirect to Discord OAuth.

### User Management

#### Get Current User
**GET** `/users/me`

Get current authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "role": "string",
  "profile": {
    "display_name": "string",
    "avatar_url": "string",
    "bio": "string",
    "timezone": "string"
  },
  "preferences": {
    "theme": "dark",
    "notifications": true,
    "default_campaign": "string"
  },
  "security": {
    "two_factor_enabled": false,
    "last_login": "2024-01-01T00:00:00Z",
    "login_count": 42
  }
}
```

#### Update User Profile
**PUT** `/users/me`

Update current user's profile.

**Request Body:**
```json
{
  "profile": {
    "display_name": "string",
    "bio": "string",
    "timezone": "string"
  },
  "preferences": {
    "theme": "dark|light",
    "notifications": true,
    "default_campaign": "string"
  }
}
```

#### Change Password
**POST** `/users/me/password`

Change user password.

**Request Body:**
```json
{
  "current_password": "string",
  "new_password": "string"
}
```

### Campaign Management

#### List Campaigns
**GET** `/campaigns`

Get campaigns for authenticated user.

**Query Parameters:**
- `role` (optional): Filter by user role in campaign (`gm`, `player`)
- `status` (optional): Filter by campaign status (`active`, `inactive`, `completed`)

**Response (200):**
```json
{
  "campaigns": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "game_system": "edge_of_empire",
      "status": "active",
      "gm": {
        "id": "string",
        "username": "string",
        "display_name": "string"
      },
      "player_count": 4,
      "max_players": 6,
      "created_at": "2024-01-01T00:00:00Z",
      "user_role": "player"
    }
  ]
}
```

#### Create Campaign
**POST** `/campaigns`

Create new campaign (GM only).

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "game_system": "edge_of_empire|age_of_rebellion|force_and_destiny",
  "max_players": 6,
  "settings": {
    "starting_xp": 150,
    "starting_credits": 500,
    "house_rules": ["string"]
  }
}
```

#### Get Campaign
**GET** `/campaigns/{id}`

Get specific campaign details.

**Response (200):**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "game_system": "edge_of_empire",
  "status": "active",
  "gm": {
    "id": "string",
    "username": "string",
    "display_name": "string"
  },
  "players": [
    {
      "id": "string",
      "username": "string",
      "display_name": "string",
      "joined_at": "2024-01-01T00:00:00Z"
    }
  ],
  "settings": {
    "starting_xp": 150,
    "starting_credits": 500,
    "house_rules": ["string"]
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Join Campaign
**POST** `/campaigns/{id}/join`

Join campaign with invite code.

**Request Body:**
```json
{
  "invite_code": "string"
}
```

#### Leave Campaign
**DELETE** `/campaigns/{id}/leave`

Leave campaign as player.

### Character Management

#### List Characters
**GET** `/characters`

Get characters for authenticated user.

**Query Parameters:**
- `campaign_id` (optional): Filter by campaign
- `status` (optional): Filter by character status (`active`, `retired`, `deceased`)

**Response (200):**
```json
{
  "characters": [
    {
      "id": "string",
      "name": "string",
      "species": "Human",
      "career": "Guardian",
      "level": 3,
      "campaign": {
        "id": "string",
        "name": "string"
      },
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Create Character
**POST** `/characters`

Create new character.

**Request Body:**
```json
{
  "name": "string",
  "species": "string",
  "career": "string",
  "campaign_id": "string",
  "background": {
    "motivation": "string",
    "history": "string"
  },
  "characteristics": {
    "brawn": 2,
    "agility": 3,
    "intellect": 2,
    "cunning": 2,
    "willpower": 3,
    "presence": 2
  }
}
```

#### Get Character
**GET** `/characters/{id}`

Get full character details.

**Response (200):**
```json
{
  "id": "string",
  "name": "string",
  "species": "Human",
  "career": "Guardian",
  "player": {
    "id": "string",
    "username": "string",
    "display_name": "string"
  },
  "campaign": {
    "id": "string",
    "name": "string"
  },
  "characteristics": {
    "brawn": 2,
    "agility": 3,
    "intellect": 2,
    "cunning": 2,
    "willpower": 3,
    "presence": 2
  },
  "derived_attributes": {
    "wounds": {
      "threshold": 14,
      "current": 14
    },
    "strain": {
      "threshold": 13,
      "current": 13
    },
    "defense": {
      "ranged": 0,
      "melee": 0
    },
    "soak": 2
  },
  "skills": [
    {
      "name": "Lightsaber",
      "characteristic": "brawn",
      "ranks": 2,
      "career_skill": true,
      "dice_pool": "YYG"
    }
  ],
  "talents": [
    {
      "name": "Parry",
      "tier": 1,
      "activation": "action",
      "description": "string"
    }
  ],
  "experience": {
    "total": 150,
    "spent": 120,
    "available": 30
  },
  "equipment": {
    "credits": 500,
    "items": [
      {
        "name": "Lightsaber",
        "type": "weapon",
        "quantity": 1,
        "encumbrance": 1
      }
    ]
  },
  "background": {
    "motivation": "string",
    "history": "string"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Update Character
**PUT** `/characters/{id}`

Update character details.

**Request Body:** (partial updates allowed)
```json
{
  "name": "string",
  "background": {
    "motivation": "string",
    "history": "string"
  },
  "equipment": {
    "credits": 600,
    "items": []
  }
}
```

#### Award Experience
**POST** `/characters/{id}/experience`

Award experience points to character (GM only).

**Request Body:**
```json
{
  "amount": 15,
  "reason": "Completed adventure"
}
```

#### Advance Character
**POST** `/characters/{id}/advance`

Spend XP on character advancement.

**Request Body:**
```json
{
  "type": "skill|characteristic|talent|force_power",
  "target": "Lightsaber",
  "cost": 10
}
```

### Reference Data

#### Species
**GET** `/reference/species`

Get available species.

**Response (200):**
```json
{
  "species": [
    {
      "name": "Human",
      "characteristic_bonuses": {
        "brawn": 0,
        "agility": 0,
        "intellect": 0,
        "cunning": 0,
        "willpower": 0,
        "presence": 0
      },
      "wound_threshold": 10,
      "strain_threshold": 10,
      "starting_xp": 110,
      "special_abilities": ["Extra Skill Training"],
      "description": "string"
    }
  ]
}
```

#### Careers
**GET** `/reference/careers`

Get available careers.

**Query Parameters:**
- `game_system` (optional): Filter by game system

**Response (200):**
```json
{
  "careers": [
    {
      "name": "Guardian",
      "game_system": "force_and_destiny",
      "career_skills": ["Discipline", "Lightsaber", "Vigilance"],
      "specializations": [
        {
          "name": "Protector",
          "bonus_career_skills": ["Leadership", "Medicine"]
        }
      ],
      "description": "string"
    }
  ]
}
```

#### Skills
**GET** `/reference/skills`

Get all available skills.

**Response (200):**
```json
{
  "skills": [
    {
      "name": "Lightsaber",
      "characteristic": "brawn",
      "type": "combat",
      "description": "string"
    }
  ]
}
```

### Admin Endpoints

#### List Users
**GET** `/admin/users`

Get all users (Admin only).

**Query Parameters:**
- `role` (optional): Filter by role
- `status` (optional): Filter by account status

**Response (200):**
```json
{
  "users": [
    {
      "id": "string",
      "username": "string",
      "email": "string",
      "role": "string",
      "status": "active",
      "last_login": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### Generate Invite Code
**POST** `/admin/invites`

Generate invite code (Admin only).

**Request Body:**
```json
{
  "role": "player|gm",
  "expires_at": "2024-12-31T23:59:59Z",
  "uses": 1
}
```

#### System Statistics
**GET** `/admin/stats`

Get system statistics (Admin only).

**Response (200):**
```json
{
  "users": {
    "total": 150,
    "active": 120,
    "new_this_month": 15
  },
  "campaigns": {
    "total": 25,
    "active": 20
  },
  "characters": {
    "total": 180,
    "active": 160
  },
  "system": {
    "version": "1.0.0",
    "uptime": "7 days, 12 hours",
    "database_size": "45.2 MB"
  }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "field_name",
      "value": "invalid_value",
      "constraint": "validation_rule"
    }
  }
}
```

### Common Error Codes

- `INVALID_CREDENTIALS` - Login failed
- `TOKEN_EXPIRED` - JWT token has expired
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `VALIDATION_ERROR` - Request data validation failed
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `DUPLICATE_RESOURCE` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests

### HTTP Status Codes

- `200` - Success
- `201` - Resource created
- `400` - Bad request / Validation error
- `401` - Unauthorized / Authentication required
- `403` - Forbidden / Insufficient permissions
- `404` - Resource not found
- `409` - Conflict / Resource already exists
- `429` - Rate limit exceeded
- `500` - Internal server error

## Rate Limiting

API endpoints are rate limited:
- Authentication endpoints: 5 requests per minute
- General endpoints: 100 requests per minute
- Admin endpoints: 200 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1609459200
```

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

## WebSocket Events

Real-time updates are available via WebSocket connections:

### Connection
```javascript
const ws = new WebSocket('ws://localhost:5000/ws');
ws.onopen = () => {
  // Send authentication
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }));
};
```

### Events
- `character_updated` - Character data changed
- `campaign_updated` - Campaign data changed
- `user_joined_campaign` - New player joined campaign
- `user_left_campaign` - Player left campaign

## SDK Examples

### JavaScript/Node.js
```javascript
class StarWarsRPGAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers
      },
      ...options
    };
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
  
  // Authentication
  async login(username, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.token = response.token;
    return response;
  }
  
  // Characters
  async getCharacters(campaignId = null) {
    const params = campaignId ? `?campaign_id=${campaignId}` : '';
    return this.request(`/characters${params}`);
  }
  
  async createCharacter(characterData) {
    return this.request('/characters', {
      method: 'POST',
      body: JSON.stringify(characterData)
    });
  }
}

// Usage
const api = new StarWarsRPGAPI('http://localhost:5000/api');
await api.login('username', 'password');
const characters = await api.getCharacters();
```

### Python
```python
import requests
from typing import Dict, Optional

class StarWarsRPGAPI:
    def __init__(self, base_url: str, token: Optional[str] = None):
        self.base_url = base_url
        self.token = token
        self.session = requests.Session()
    
    def _headers(self) -> Dict[str, str]:
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        return headers
    
    def login(self, username: str, password: str) -> Dict:
        response = self.session.post(
            f'{self.base_url}/auth/login',
            json={'username': username, 'password': password}
        )
        response.raise_for_status()
        data = response.json()
        self.token = data['token']
        return data
    
    def get_characters(self, campaign_id: Optional[str] = None) -> Dict:
        params = {'campaign_id': campaign_id} if campaign_id else {}
        response = self.session.get(
            f'{self.base_url}/characters',
            headers=self._headers(),
            params=params
        )
        response.raise_for_status()
        return response.json()

# Usage
api = StarWarsRPGAPI('http://localhost:5000/api')
api.login('username', 'password')
characters = api.get_characters()
```

## Testing the API

### Using curl

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

# Get characters (replace TOKEN with actual token)
curl -X GET http://localhost:5000/api/characters \
  -H "Authorization: Bearer TOKEN"

# Create character
curl -X POST http://localhost:5000/api/characters \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "Luke Skywalker",
    "species": "Human",
    "career": "Guardian",
    "campaign_id": "507f1f77bcf86cd799439011"
  }'
```

### Using Postman

1. Import the API collection (available in `/docs/postman/`)
2. Set environment variables:
   - `base_url`: `http://localhost:5000/api`
   - `token`: Your JWT token
3. Run authentication requests to get token
4. Use token for subsequent requests

For complete API testing, see the test suite in `/tests/api/`.

---

**Note:** This API is under active development. Breaking changes may occur in pre-1.0 versions. Check the changelog for updates.
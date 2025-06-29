# Contributing to Star Wars RPG Character Manager

Thank you for your interest in contributing to the Star Wars RPG Character Manager! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct:
- Be respectful and inclusive
- Use welcoming and inclusive language
- Be collaborative and constructive
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

Before contributing, make sure you have:
- Python 3.13 or higher installed
- MongoDB 4.4 or higher running locally
- Git for version control
- A GitHub account

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/star-wars-rpg-character-manager.git
   cd star-wars-rpg-character-manager
   ```

3. **Set up the development environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -e .
   ```

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

5. **Initialize the database**:
   ```bash
   python scripts/init_db.py
   ```

6. **Run the development server**:
   ```bash
   python app.py
   ```

## Development Workflow

### Branching Strategy

- **main** - Production-ready code
- **develop** - Integration branch for features
- **feature/*** - Feature development branches
- **bugfix/*** - Bug fix branches
- **hotfix/*** - Critical production fixes

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Write tests** for your changes

4. **Run the test suite**:
   ```bash
   python -m pytest tests/
   ```

5. **Run linting and formatting**:
   ```bash
   flake8 src/ tests/
   black src/ tests/
   ```

6. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new character creation validation"
   ```

7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a pull request** on GitHub

## Coding Standards

### Python Style

We follow PEP 8 with some modifications:
- Line length: 88 characters (Black default)
- Use type hints for all function parameters and return values
- Use docstrings for all classes, methods, and functions

### Code Formatting

We use **Black** for code formatting:
```bash
black src/ tests/
```

### Linting

We use **flake8** for linting:
```bash
flake8 src/ tests/
```

### Import Sorting

We use **isort** for import sorting:
```bash
isort src/ tests/
```

### Example Code Structure

```python
"""Module docstring describing the purpose."""

from typing import Dict, List, Optional
import logging

from .models import Character, Campaign


class CharacterManager:
    """Manages character operations and data."""
    
    def __init__(self, database_url: str) -> None:
        """Initialize the character manager.
        
        Args:
            database_url: MongoDB connection string
        """
        self.db_url = database_url
        self.logger = logging.getLogger(__name__)
    
    def create_character(
        self, 
        name: str, 
        species: str, 
        career: str
    ) -> Optional[Character]:
        """Create a new character.
        
        Args:
            name: Character name
            species: Character species
            career: Character career
            
        Returns:
            Created character or None if creation failed
            
        Raises:
            ValueError: If character data is invalid
        """
        if not name or not species or not career:
            raise ValueError("Name, species, and career are required")
        
        # Implementation here
        return character
```

## Testing

### Test Structure

- **Unit tests** - Test individual functions and classes
- **Integration tests** - Test component interactions
- **End-to-end tests** - Test complete user workflows

### Writing Tests

```python
import pytest
from unittest.mock import Mock, patch

from swrpg_character_manager.character_creator import CharacterCreator


class TestCharacterCreator:
    """Test cases for CharacterCreator class."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.creator = CharacterCreator()
    
    def test_create_character_success(self):
        """Test successful character creation."""
        character = self.creator.create_character(
            name="Luke Skywalker",
            species="Human",
            career="Guardian"
        )
        
        assert character.name == "Luke Skywalker"
        assert character.species == "Human"
        assert character.career == "Guardian"
    
    def test_create_character_invalid_input(self):
        """Test character creation with invalid input."""
        with pytest.raises(ValueError):
            self.creator.create_character("", "Human", "Guardian")
```

### Running Tests

```bash
# Run all tests
python -m pytest

# Run with coverage
python -m pytest --cov=src/

# Run specific test file
python -m pytest tests/test_character_creator.py

# Run with verbose output
python -m pytest -v
```

## Database Guidelines

### MongoDB Schema

- Use consistent field naming (snake_case)
- Include created_at and updated_at timestamps
- Use ObjectId for references between collections
- Index frequently queried fields

### Example Document Structure

```json
{
  "_id": ObjectId("..."),
  "name": "Luke Skywalker",
  "player_id": ObjectId("..."),
  "campaign_id": ObjectId("..."),
  "species": "Human",
  "career": "Guardian",
  "characteristics": {
    "brawn": 2,
    "agility": 3,
    "intellect": 2,
    "cunning": 2,
    "willpower": 3,
    "presence": 2
  },
  "experience": {
    "total": 150,
    "spent": 120,
    "available": 30
  },
  "created_at": ISODate("..."),
  "updated_at": ISODate("...")
}
```

## Frontend Guidelines

### JavaScript Style

- Use ES6+ features
- Use const/let instead of var
- Use arrow functions for callbacks
- Use template literals for string interpolation

### CSS Guidelines

- Use CSS custom properties for theming
- Follow BEM methodology for class naming
- Use Flexbox and CSS Grid for layouts
- Ensure responsive design

### Example Frontend Code

```javascript
// Good
const CharacterManager = {
  async createCharacter(characterData) {
    try {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: JSON.stringify(characterData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating character:', error);
      throw error;
    }
  },
  
  getToken() {
    return localStorage.getItem('auth_token');
  }
};
```

## API Guidelines

### REST API Design

- Use HTTP verbs appropriately (GET, POST, PUT, DELETE)
- Use plural nouns for resource endpoints
- Use HTTP status codes correctly
- Include proper error messages
- Version your APIs

### Example API Endpoints

```
GET    /api/characters           # List characters
POST   /api/characters           # Create character
GET    /api/characters/:id       # Get character
PUT    /api/characters/:id       # Update character
DELETE /api/characters/:id       # Delete character

GET    /api/campaigns            # List campaigns
POST   /api/campaigns            # Create campaign
GET    /api/campaigns/:id        # Get campaign
PUT    /api/campaigns/:id        # Update campaign
DELETE /api/campaigns/:id        # Delete campaign
```

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Character name is required",
    "details": {
      "field": "name",
      "value": "",
      "constraint": "required"
    }
  }
}
```

## Documentation

### Code Documentation

- Write clear docstrings for all public methods
- Use type hints consistently
- Include examples in docstrings when helpful
- Keep comments up to date with code changes

### API Documentation

- Document all endpoints with examples
- Include request/response schemas
- Document authentication requirements
- Provide curl examples

## Security Guidelines

### Data Protection

- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all user inputs
- Sanitize data before database operations

### Authentication

- Use secure token generation
- Implement proper session management
- Follow OWASP security guidelines
- Regularly update dependencies

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] No sensitive information is committed
- [ ] Commit messages follow convention

### PR Description Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Include screenshots for UI changes.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## Commit Message Convention

We follow the Conventional Commits specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

### Examples

```
feat(auth): add two-factor authentication support

fix(character): resolve XP calculation bug for multi-class characters

docs(api): update character creation endpoint documentation

style(css): improve responsive design for mobile devices

refactor(database): optimize character query performance

test(campaign): add integration tests for campaign management

chore(deps): update dependencies to latest versions
```

## Issue Guidelines

### Bug Reports

When reporting bugs, include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, Python version)
- Screenshots if applicable

### Feature Requests

When requesting features, include:
- Clear description of the feature
- Use case and motivation
- Proposed implementation approach
- Acceptance criteria

## Community

### Getting Help

- Check existing documentation first
- Search existing issues on GitHub
- Ask questions in discussions
- Contact maintainers for urgent issues

### Communication Channels

- GitHub Issues - Bug reports and feature requests
- GitHub Discussions - General questions and ideas
- Pull Requests - Code contributions and reviews

## Recognition

Contributors will be recognized in:
- CHANGELOG.md for significant contributions
- README.md acknowledgments section
- GitHub contributor statistics

Thank you for contributing to the Star Wars RPG Character Manager! May the Force be with you!
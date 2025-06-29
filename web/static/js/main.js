// Star Wars RPG Character Manager - Main JavaScript


class CharacterManager {
    constructor() {
        this.currentCharacter = null;
        this.characters = this.loadCharacters();
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDashboard();
    }

    bindEvents() {
        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action]')) {
                e.preventDefault();
                const action = e.target.dataset.action;
                let args = {};
                if (e.target.dataset.args) {
                    try {
                        args = JSON.parse(e.target.dataset.args);
                    } catch (error) {
                        console.error('Error parsing data-args:', error, e.target.dataset.args);
                        // Fallback: if it's just a simple string, use it as id
                        args = { id: e.target.dataset.args };
                    }
                }
                this.handleAction(action, args);
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('.character-form')) {
                e.preventDefault();
                this.handleCharacterForm(e.target);
            }
        });

        // Modal close
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal-overlay')) {
                this.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    async handleAction(action, args) {
        switch (action) {
            case 'show-dashboard':
                this.loadDashboard();
                break;
            case 'show-create-character':
                this.showCreateCharacter();
                break;
            case 'show-character':
                await this.showCharacter(args.id);
                break;
            case 'edit-character':
                this.editCharacter(args.id);
                break;
            case 'delete-character':
                this.deleteCharacter(args.id);
                break;
            case 'assign-campaign':
                this.assignCharacterToCampaign(args.id);
                break;
            case 'advance-skill':
                this.advanceSkill(args.skill);
                break;
            case 'advance-characteristic':
                this.advanceCharacteristic(args.characteristic);
                break;
            case 'reduce-characteristic':
                this.reduceCharacteristic(args.characteristic);
                break;
            case 'reduce-skill':
                this.reduceSkill(args.skill);
                break;
            case 'award-xp':
                this.showAwardXP();
                break;
            case 'show-xp-history':
                this.showXPHistory();
                break;
            case 'export-character':
                this.exportCharacter(args.id);
                break;
            case 'import-character':
                this.showImportCharacter();
                break;
            case 'show-help':
                this.showHelp();
                break;
            default:
                console.warn('Unknown action:', action);
        }
    }

    // Dashboard
    loadDashboard() {
        this.setActiveNav('dashboard');
        const content = `
            <div class="container">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">My Characters</h2>
                        <button class="btn btn-primary" data-action="show-create-character">
                            <span>+</span> Create New Character
                        </button>
                    </div>
                    <div class="character-list">
                        ${this.renderCharacterList()}
                    </div>
                </div>
                
                <div class="grid grid-3">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Quick Stats</h3>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">${this.characters.length}</div>
                            <div class="stat-label">Total Characters</div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Actions</h3>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <button class="btn btn-outline" data-action="import-character">
                                Import Character
                            </button>
                            <button class="btn btn-outline" data-action="show-help">
                                Help & Guide
                            </button>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Recent Activity</h3>
                        </div>
                        <p class="text-secondary">No recent activity</p>
                    </div>
                </div>
            </div>
        `;
        this.setMainContent(content);
    }

    renderCharacterList() {
        if (this.characters.length === 0) {
            return `
                <div class="text-center" style="padding: 2rem;">
                    <p class="text-secondary">No characters created yet.</p>
                    <button class="btn btn-primary mt-2" data-action="show-create-character">
                        Create Your First Character
                    </button>
                </div>
            `;
        }

        return this.characters.map(character => `
            <div class="character-card">
                <div class="character-avatar">
                    ${character.name.charAt(0).toUpperCase()}
                </div>
                <div class="character-info" data-action="show-character" data-args='{"id":"${character.id}"}' style="cursor: pointer;">
                    <div class="character-name" style="color: #007cba; text-decoration: underline;">${character.name}</div>
                    <div class="character-details">
                        ${character.species} ${character.career} | Level ${this.calculateLevel(character)} | ${character.availableXP} XP Available
                    </div>
                </div>
                <div class="character-actions">
                    <button class="btn btn-primary btn-sm" data-action="show-character" data-args='{"id":"${character.id}"}' onclick="event.stopPropagation(); characterManager.handleAction('show-character', {id: '${character.id}'});">
                        View
                    </button>
                    <button class="btn btn-secondary btn-sm" data-action="edit-character" data-args='{"id":"${character.id}"}' onclick="event.stopPropagation(); characterManager.handleAction('edit-character', {id: '${character.id}'});">
                        Edit
                    </button>
                    <button class="btn btn-outline btn-sm" data-action="assign-campaign" data-args='{"id":"${character.id}"}' onclick="event.stopPropagation(); characterManager.handleAction('assign-campaign', {id: '${character.id}'});">
                        Assign Campaign
                    </button>
                    <button class="btn btn-outline btn-sm" data-action="export-character" data-args='{"id":"${character.id}"}' onclick="event.stopPropagation(); characterManager.handleAction('export-character', {id: '${character.id}'});">
                        Export
                    </button>
                    <button class="btn btn-danger btn-sm" data-action="delete-character" data-args='{"id":"${character.id}"}' onclick="event.stopPropagation(); characterManager.handleAction('delete-character', {id: '${character.id}'});">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Character Creation
    showCreateCharacter() {
        this.setActiveNav('create');
        const content = `
            <div class="container">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">Create New Character</h2>
                    </div>
                    <form class="character-form">
                        <div class="wizard">
                            <div class="wizard-steps">
                                <div class="wizard-step active">Basic Info</div>
                                <div class="wizard-step">Characteristics</div>
                                <div class="wizard-step">Review</div>
                            </div>
                            
                            <div class="wizard-content">
                                ${this.renderCharacterCreationStep1()}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.setMainContent(content);
    }

    renderCharacterCreationStep1() {
        return `
            <div class="grid grid-2">
                <div class="form-group">
                    <label class="form-label">Character Name</label>
                    <input type="text" class="form-input" name="name" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Player Name</label>
                    <input type="text" class="form-input" name="playerName" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Species</label>
                    <select class="form-select" name="species" required>
                        <option value="">Select Species</option>
                        <optgroup label="Core Species">
                            <option value="Human">Human</option>
                            <option value="Twi'lek">Twi'lek</option>
                            <option value="Rodian">Rodian</option>
                            <option value="Wookiee">Wookiee</option>
                            <option value="Bothan">Bothan</option>
                        </optgroup>
                        <optgroup label="Additional Species">
                            <option value="Duros">Duros</option>
                            <option value="Gand">Gand</option>
                            <option value="Trandoshan">Trandoshan</option>
                            <option value="Cerean">Cerean</option>
                            <option value="Kel Dor">Kel Dor</option>
                            <option value="Nautolan">Nautolan</option>
                            <option value="Zabrak">Zabrak</option>
                            <option value="Mon Calamari">Mon Calamari</option>
                            <option value="Sullustan">Sullustan</option>
                            <option value="Chiss">Chiss</option>
                        </optgroup>
                        <optgroup label="Variant Humans">
                            <option value="Corellian Human">Corellian Human</option>
                            <option value="Mandalorian Human">Mandalorian Human</option>
                        </optgroup>
                        <optgroup label="Unique Species">
                            <option value="Jawa">Jawa</option>
                            <option value="Ewok">Ewok</option>
                            <option value="Devaronian">Devaronian</option>
                        </optgroup>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Career</label>
                    <select class="form-select" name="career" required>
                        <option value="">Select Career</option>
                        <optgroup label="Edge of the Empire">
                            <option value="Bounty Hunter">Bounty Hunter</option>
                            <option value="Colonist">Colonist</option>
                            <option value="Explorer">Explorer</option>
                            <option value="Hired Gun">Hired Gun</option>
                            <option value="Smuggler">Smuggler</option>
                            <option value="Technician">Technician</option>
                        </optgroup>
                        <optgroup label="Age of Rebellion">
                            <option value="Ace">Ace</option>
                            <option value="Commander">Commander</option>
                            <option value="Diplomat">Diplomat</option>
                        </optgroup>
                        <optgroup label="Force and Destiny">
                            <option value="Consular">Consular</option>
                            <option value="Guardian">Guardian</option>
                            <option value="Mystic">Mystic</option>
                            <option value="Seeker">Seeker</option>
                            <option value="Sentinel">Sentinel</option>
                            <option value="Warrior">Warrior</option>
                        </optgroup>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Background (Optional)</label>
                <textarea class="form-input" name="background" rows="3" placeholder="Character background and motivation..."></textarea>
            </div>
            
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-action="show-dashboard">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Character</button>
            </div>
        `;
    }

    // Character Sheet Display
    async showCharacter(characterId) {
        // First get basic character from list
        let character = this.characters.find(c => c.id === characterId);
        if (!character) return;

        // Then fetch full character details from API including skills
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/characters/${encodeURIComponent(characterId)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                character = data.character;
            }
        } catch (error) {
            console.error('Error loading character details:', error);
            // Fall back to basic character data if API fails
        }

        this.currentCharacter = character;
        this.setActiveNav('character');

        const content = `
            <div class="container">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">${character.name}</h2>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-primary" data-action="award-xp">Award XP</button>
                            <button class="btn btn-secondary" data-action="edit-character" data-args='{"id":"${character.id}"}'>Edit</button>
                            <button class="btn btn-outline" data-action="show-dashboard">← Back</button>
                        </div>
                    </div>
                    
                    <div class="grid grid-3 mb-3">
                        <div class="stat-box">
                            <div class="stat-value">${character.species}</div>
                            <div class="stat-label">Species</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">${character.career}</div>
                            <div class="stat-label">Career</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">${character.availableXP}</div>
                            <div class="stat-label">Available XP</div>
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-2">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Characteristics</h3>
                        </div>
                        ${this.renderCharacteristics(character)}
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Derived Attributes</h3>
                        </div>
                        <div class="grid grid-2">
                            <div class="stat-box">
                                <div class="stat-value">${character.woundThreshold}</div>
                                <div class="stat-label">Wound Threshold</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">${character.strainThreshold}</div>
                                <div class="stat-label">Strain Threshold</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Skills</h3>
                    </div>
                    ${this.renderSkills(character)}
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Advancement Options</h3>
                    </div>
                    ${this.renderAdvancementOptions(character)}
                </div>
            </div>
        `;

        this.setMainContent(content);
    }

    renderCharacteristics(character) {
        // Handle both API format (character.characteristics.brawn) and direct format (character.brawn)
        const getCharValue = (charName) => {
            const lowerName = charName.toLowerCase();
            return character.characteristics?.[lowerName] || character[lowerName] || 2;
        };
        
        const characteristics = [
            { name: 'Brawn', value: getCharValue('Brawn') },
            { name: 'Agility', value: getCharValue('Agility') },
            { name: 'Intellect', value: getCharValue('Intellect') },
            { name: 'Cunning', value: getCharValue('Cunning') },
            { name: 'Willpower', value: getCharValue('Willpower') },
            { name: 'Presence', value: getCharValue('Presence') }
        ];

        return `
            <div class="characteristic-grid">
                ${characteristics.map(char => `
                    <div class="stat-box">
                        <div class="stat-value">${char.value}</div>
                        <div class="stat-label">${char.name}</div>
                        <div style="display: flex; gap: 0.25rem; margin-top: 0.5rem;">
                            ${char.value < 6 ? `
                                <button class="btn btn-sm btn-outline" 
                                        data-action="advance-characteristic" 
                                        data-args='{"characteristic":"${char.name}"}'>
                                    + (${this.getCharacteristicCost(char.value)} XP)
                                </button>
                            ` : ''}
                            ${char.value > 1 ? `
                                <button class="btn btn-sm btn-danger" 
                                        data-action="reduce-characteristic" 
                                        data-args='{"characteristic":"${char.name}"}'>
                                    -
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderSkills(character) {
        // Use real character skill data from the backend API
        // If character.skills is available from API call, use it; otherwise use fallback
        let skillGroups;
        
        if (character.skills && typeof character.skills === 'object') {
            // Use real skill data from the character object
            skillGroups = character.skills;
        } else {
            // Fallback: create skill groups with all skills at rank 0
            skillGroups = {
                'Brawn': [
                    { name: 'Athletics', ranks: 0, career: false },
                    { name: 'Resilience', ranks: 0, career: true }
                ],
                'Agility': [
                    { name: 'Coordination', ranks: 0, career: false },
                    { name: 'Piloting (Planetary)', ranks: 0, career: false },
                    { name: 'Stealth', ranks: 0, career: false }
                ],
                'Intellect': [
                    { name: 'Computers', ranks: 0, career: false },
                    { name: 'Medicine', ranks: 0, career: false }
                ],
                'Cunning': [
                    { name: 'Deception', ranks: 0, career: false },
                    { name: 'Perception', ranks: 0, career: false },
                    { name: 'Streetwise', ranks: 0, career: false }
                ],
                'Willpower': [
                    { name: 'Discipline', ranks: 0, career: true },
                    { name: 'Vigilance', ranks: 0, career: true }
                ],
                'Presence': [
                    { name: 'Cool', ranks: 0, career: true },
                    { name: 'Leadership', ranks: 0, career: false }
                ]
            };
        }

        return Object.entries(skillGroups).map(([characteristic, skills]) => `
            <div class="skill-section">
                <h3>${characteristic} Skills</h3>
                <div class="skill-list">
                    ${skills.map(skill => `
                        <div class="skill-item">
                            <div>
                                <span class="skill-name">${skill.name}</span>
                                ${skill.career ? '<span class="skill-career"> (Career)</span>' : ''}
                            </div>
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <span class="skill-rank">Rank ${skill.ranks}</span>
                                <span class="dice-pool">${this.calculateDicePool(character, skill, characteristic)}</span>
                                <div style="display: flex; gap: 0.25rem;">
                                    ${skill.ranks < 5 ? `
                                        <button class="btn btn-sm btn-outline" 
                                                data-action="advance-skill" 
                                                data-args='{"skill":"${skill.name}"}'>
                                            + (${this.getSkillCost(skill.ranks, skill.career)} XP)
                                        </button>
                                    ` : ''}
                                    ${skill.ranks > 0 ? `
                                        <button class="btn btn-sm btn-danger" 
                                                data-action="reduce-skill" 
                                                data-args='{"skill":"${skill.name}"}'>
                                            -
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    renderAdvancementOptions(character) {
        return `
            <div class="xp-display">
                <div class="xp-available">${character.availableXP || 0}</div>
                <div class="xp-label">Experience Points Available</div>
            </div>
            
            <div class="advancement-section">
                <h4>Character Advancement</h4>
                <p class="text-secondary mb-2">Use the + buttons to advance characteristics and skills. Use the - buttons to undo mistaken upgrades.</p>
                
                <div class="grid grid-2">
                    <button class="btn btn-outline" data-action="show-xp-history">
                        View XP History
                    </button>
                    <button class="btn btn-primary" data-action="award-xp">
                        Award More XP
                    </button>
                </div>
            </div>
        `;
    }

    // Utility Functions
    calculateLevel(character) {
        const spentXP = (character.totalXP || 110) - (character.availableXP || 110);
        return Math.floor(spentXP / 25) + 1;
    }

    calculateDicePool(character, skill, characteristic) {
        const lowerCharName = characteristic.toLowerCase();
        const charValue = character.characteristics?.[lowerCharName] || character[lowerCharName] || 2;
        const skillRanks = skill.ranks;

        if (skillRanks === 0) {
            return `${charValue}A`;
        } else {
            const ability = Math.max(0, charValue - skillRanks);
            const proficiency = Math.min(charValue, skillRanks);

            let pool = [];
            if (ability > 0) pool.push(`${ability}A`);
            if (proficiency > 0) pool.push(`${proficiency}P`);
            return pool.join('+');
        }
    }

    getCharacteristicCost(currentValue) {
        const costs = { 1: 30, 2: 30, 3: 40, 4: 50, 5: 60 };
        return costs[currentValue] || 'Max';
    }

    getSkillCost(currentRank, isCareer) {
        const baseCost = (currentRank + 1) * 5;
        return isCareer ? baseCost : baseCost + 5;
    }

    // Character Management
    async handleCharacterForm(form) {
        const formData = new FormData(form);
        const characterData = {
            name: formData.get('name'),
            playerName: formData.get('playerName'),
            species: formData.get('species'),
            career: formData.get('career'),
            background: formData.get('background') || ''
        };

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/characters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(characterData)
            });

            const result = await response.json();

            if (response.ok) {
                await this.loadCharactersFromAPI();
                await this.showCharacter(result.character.id);
            } else {
                alert('Error creating character: ' + result.error);
            }
        } catch (error) {
            console.error('Error creating character:', error);
            alert('Failed to create character. Please try again.');
        }
    }

    applySpeciesModifiers(character) {
        const speciesData = {
            'Human': { startingXP: 110, characteristics: {} },
            'Twi\'lek': { startingXP: 100, characteristics: { cunning: 3, brawn: 1 } },
            'Rodian': { startingXP: 100, characteristics: { agility: 3, willpower: 1 } },
            'Wookiee': { startingXP: 90, characteristics: { brawn: 3, willpower: 1 } },
            'Bothan': { startingXP: 100, characteristics: { cunning: 3, brawn: 1 } }
        };

        const species = speciesData[character.species];
        if (species) {
            character.totalXP = species.startingXP;
            character.availableXP = species.startingXP;

            Object.entries(species.characteristics).forEach(([char, value]) => {
                character[char] = value;
            });
        }
    }

    async editCharacter(characterId) {
        const character = this.characters.find(c => c.id === characterId);
        if (!character) {
            alert('Character not found.');
            return;
        }

        const content = `
            <div class="modal-header">
                <h3 class="modal-title">Edit Character: ${character.name}</h3>
                <button type="button" onclick="characterManager.closeModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            <div class="modal-body">
                <form id="edit-character-form">
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label class="form-label">Character Name</label>
                            <input type="text" class="form-input" name="name" value="${character.name}" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Player Name</label>
                            <input type="text" class="form-input" name="playerName" value="${character.playerName || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Species</label>
                            <select class="form-select" name="species" required>
                                <option value="">Select Species</option>
                                <optgroup label="Core Species">
                                    <option value="Human" ${character.species === 'Human' ? 'selected' : ''}>Human</option>
                                    <option value="Twi'lek" ${character.species === 'Twi\'lek' ? 'selected' : ''}>Twi'lek</option>
                                    <option value="Rodian" ${character.species === 'Rodian' ? 'selected' : ''}>Rodian</option>
                                    <option value="Wookiee" ${character.species === 'Wookiee' ? 'selected' : ''}>Wookiee</option>
                                    <option value="Bothan" ${character.species === 'Bothan' ? 'selected' : ''}>Bothan</option>
                                </optgroup>
                                <optgroup label="Additional Species">
                                    <option value="Duros" ${character.species === 'Duros' ? 'selected' : ''}>Duros</option>
                                    <option value="Gand" ${character.species === 'Gand' ? 'selected' : ''}>Gand</option>
                                    <option value="Trandoshan" ${character.species === 'Trandoshan' ? 'selected' : ''}>Trandoshan</option>
                                    <option value="Cerean" ${character.species === 'Cerean' ? 'selected' : ''}>Cerean</option>
                                    <option value="Kel Dor" ${character.species === 'Kel Dor' ? 'selected' : ''}>Kel Dor</option>
                                    <option value="Nautolan" ${character.species === 'Nautolan' ? 'selected' : ''}>Nautolan</option>
                                    <option value="Zabrak" ${character.species === 'Zabrak' ? 'selected' : ''}>Zabrak</option>
                                    <option value="Mon Calamari" ${character.species === 'Mon Calamari' ? 'selected' : ''}>Mon Calamari</option>
                                    <option value="Sullustan" ${character.species === 'Sullustan' ? 'selected' : ''}>Sullustan</option>
                                    <option value="Chiss" ${character.species === 'Chiss' ? 'selected' : ''}>Chiss</option>
                                </optgroup>
                                <optgroup label="Variant Humans">
                                    <option value="Corellian Human" ${character.species === 'Corellian Human' ? 'selected' : ''}>Corellian Human</option>
                                    <option value="Mandalorian Human" ${character.species === 'Mandalorian Human' ? 'selected' : ''}>Mandalorian Human</option>
                                </optgroup>
                                <optgroup label="Unique Species">
                                    <option value="Jawa" ${character.species === 'Jawa' ? 'selected' : ''}>Jawa</option>
                                    <option value="Ewok" ${character.species === 'Ewok' ? 'selected' : ''}>Ewok</option>
                                    <option value="Devaronian" ${character.species === 'Devaronian' ? 'selected' : ''}>Devaronian</option>
                                </optgroup>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Career</label>
                            <select class="form-select" name="career" required>
                                <option value="">Select Career</option>
                                <optgroup label="Edge of the Empire">
                                    <option value="Bounty Hunter" ${character.career === 'Bounty Hunter' ? 'selected' : ''}>Bounty Hunter</option>
                                    <option value="Colonist" ${character.career === 'Colonist' ? 'selected' : ''}>Colonist</option>
                                    <option value="Explorer" ${character.career === 'Explorer' ? 'selected' : ''}>Explorer</option>
                                    <option value="Hired Gun" ${character.career === 'Hired Gun' ? 'selected' : ''}>Hired Gun</option>
                                    <option value="Smuggler" ${character.career === 'Smuggler' ? 'selected' : ''}>Smuggler</option>
                                    <option value="Technician" ${character.career === 'Technician' ? 'selected' : ''}>Technician</option>
                                </optgroup>
                                <optgroup label="Age of Rebellion">
                                    <option value="Ace" ${character.career === 'Ace' ? 'selected' : ''}>Ace</option>
                                    <option value="Commander" ${character.career === 'Commander' ? 'selected' : ''}>Commander</option>
                                    <option value="Diplomat" ${character.career === 'Diplomat' ? 'selected' : ''}>Diplomat</option>
                                </optgroup>
                                <optgroup label="Force and Destiny">
                                    <option value="Consular" ${character.career === 'Consular' ? 'selected' : ''}>Consular</option>
                                    <option value="Guardian" ${character.career === 'Guardian' ? 'selected' : ''}>Guardian</option>
                                    <option value="Mystic" ${character.career === 'Mystic' ? 'selected' : ''}>Mystic</option>
                                    <option value="Seeker" ${character.career === 'Seeker' ? 'selected' : ''}>Seeker</option>
                                    <option value="Sentinel" ${character.career === 'Sentinel' ? 'selected' : ''}>Sentinel</option>
                                    <option value="Warrior" ${character.career === 'Warrior' ? 'selected' : ''}>Warrior</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Background</label>
                        <textarea class="form-input" name="background" rows="3">${character.background || ''}</textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="characterManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="characterManager.processEditCharacter('${characterId}')">Save Changes</button>
            </div>
        `;
        this.showModal(content);
    }

    async processEditCharacter(characterId) {
        const form = document.getElementById('edit-character-form');
        const formData = new FormData(form);
        
        const characterData = {
            name: formData.get('name'),
            playerName: formData.get('playerName'),
            species: formData.get('species'),
            career: formData.get('career'),
            background: formData.get('background') || ''
        };

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/characters/${encodeURIComponent(characterId)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(characterData)
            });

            const result = await response.json();

            if (response.ok) {
                await this.loadCharactersFromAPI();
                // Update current character reference if it's the one being edited
                if (this.currentCharacter && this.currentCharacter.id === characterId) {
                    this.currentCharacter = this.characters.find(c => c.id === characterId);
                }
                this.closeModal();
                // Refresh the view
                if (this.currentCharacter && this.currentCharacter.id === characterId) {
                    await this.showCharacter(characterId);
                } else {
                    this.loadDashboard();
                }
                alert('Character updated successfully!');
            } else {
                alert('Error updating character: ' + result.error);
            }
        } catch (error) {
            console.error('Error updating character:', error);
            alert('Failed to update character. Please try again.');
        }
    }

    async deleteCharacter(characterId) {
        if (confirm('Are you sure you want to delete this character?')) {
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch(`/api/characters/${encodeURIComponent(characterId)}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    await this.loadCharactersFromAPI();
                    this.loadDashboard();
                } else {
                    const result = await response.json();
                    alert('Error deleting character: ' + result.error);
                }
            } catch (error) {
                console.error('Error deleting character:', error);
                alert('Failed to delete character. Please try again.');
            }
        }
    }

    async assignCharacterToCampaign(characterId) {
        const character = this.characters.find(c => c.id === characterId);
        if (!character) {
            alert('Character not found.');
            return;
        }

        try {
            // Get user's campaigns
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/campaigns', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                alert('Failed to load campaigns.');
                return;
            }
            
            const data = await response.json();
            const campaigns = data.campaigns || [];
            
            if (campaigns.length === 0) {
                alert('No campaigns available. Create or join a campaign first.');
                return;
            }

            const content = `
                <div class="modal-header">
                    <h3 class="modal-title">Assign ${character.name} to Campaign</h3>
                    <button type="button" onclick="characterManager.closeModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="assign-campaign-form">
                        <div class="form-group">
                            <label class="form-label">Select Campaign</label>
                            <select class="form-select" name="campaign_id" required>
                                <option value="">Remove from all campaigns</option>
                                ${campaigns.map(campaign => `
                                    <option value="${campaign.id}" ${character.campaign_id === campaign.id ? 'selected' : ''}>
                                        ${campaign.name} ${campaign.is_game_master ? '(GM)' : '(Player)'}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                            <p class="text-secondary"><strong>Current Assignment:</strong> ${character.campaign_id ? 'Assigned to a campaign' : 'Not assigned to any campaign'}</p>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="characterManager.closeModal()">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="characterManager.processAssignCampaign('${characterId}')">Assign Character</button>
                </div>
            `;
            this.showModal(content);
            
        } catch (error) {
            console.error('Error loading campaigns for assignment:', error);
            alert('Failed to load campaigns. Please try again.');
        }
    }

    async processAssignCampaign(characterId) {
        const form = document.getElementById('assign-campaign-form');
        const formData = new FormData(form);
        
        const campaignId = formData.get('campaign_id') || null;
        
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/characters/${encodeURIComponent(characterId)}/assign-campaign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    campaign_id: campaignId
                })
            });

            const result = await response.json();

            if (response.ok) {
                await this.loadCharactersFromAPI();
                this.closeModal();
                this.loadDashboard();
                alert(result.message);
            } else {
                alert('Error assigning character: ' + result.error);
            }
        } catch (error) {
            console.error('Error assigning character to campaign:', error);
            alert('Failed to assign character. Please try again.');
        }
    }

    // Data Management
    loadCharacters() {
        // Try to load from API first, fallback to localStorage
        this.loadCharactersFromAPI().catch(() => {
            const stored = localStorage.getItem('swrpg_characters');
            this.characters = stored ? JSON.parse(stored) : [];
        });
        return [];
    }

    async loadCharactersFromAPI() {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/characters', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                this.characters = data.characters;
                return this.characters;
            } else {
                throw new Error(data.error || 'Failed to load characters');
            }
        } catch (error) {
            console.error('Error loading characters from API:', error);
            throw error;
        }
    }

    saveCharacters() {
        localStorage.setItem('swrpg_characters', JSON.stringify(this.characters));
    }

    exportCharacter(characterId) {
        const character = this.characters.find(c => c.id === characterId);
        if (character) {
            const dataStr = JSON.stringify(character, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${character.name.replace(/\s+/g, '_')}_character.json`;
            link.click();
            URL.revokeObjectURL(url);
        }
    }

    // UI Helpers
    setActiveNav(section) {
        document.querySelectorAll('.nav a').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-action="show-${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    setMainContent(html) {
        const main = document.querySelector('.main');
        if (main) {
            main.innerHTML = html;
        }
    }

    showModal(content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                ${content}
            </div>
        `;
        document.body.appendChild(modal);
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    showAwardXP() {
        const content = `
            <div class="modal-header">
                <h3 class="modal-title">Award Experience Points</h3>
                <button type="button" onclick="characterManager.closeModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            <div class="modal-body">
                <form id="award-xp-form">
                    <div class="form-group">
                        <label class="form-label">XP Amount</label>
                        <input type="number" class="form-input" name="amount" min="1" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Reason (Optional)</label>
                        <input type="text" class="form-input" name="reason" placeholder="Completed adventure, good roleplay, etc.">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" onclick="characterManager.processAwardXP()">Award XP</button>
            </div>
        `;
        this.showModal(content);
    }

    async processAwardXP() {
        const form = document.getElementById('award-xp-form');
        const amount = parseInt(form.amount.value);
        const reason = form.reason.value;

        if (!this.currentCharacter || amount <= 0) {
            alert('Please enter a valid XP amount.');
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/characters/${encodeURIComponent(this.currentCharacter.id)}/award-xp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: amount,
                    reason: reason
                })
            });

            const result = await response.json();

            if (response.ok) {
                await this.loadCharactersFromAPI();
                // Update current character reference
                this.currentCharacter = this.characters.find(c => c.id === this.currentCharacter.id);
                this.closeModal();
                await this.showCharacter(this.currentCharacter.id);
                alert(result.message);
            } else {
                alert('Error awarding XP: ' + result.error);
            }
        } catch (error) {
            console.error('Error awarding XP:', error);
            alert('Failed to award XP. Please try again.');
        }
    }

    showHelp() {
        const content = `
            <div class="modal-header">
                <h3 class="modal-title">Star Wars RPG Character Manager - Help Guide</h3>
                <button type="button" onclick="characterManager.closeModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                <div class="help-section">
                    <h4>Getting Started</h4>
                    <p>Welcome to the Star Wars RPG Character Manager! This tool helps you create and manage characters for Edge of the Empire, Age of Rebellion, and Force and Destiny.</p>
                    
                    <h4>Creating Characters</h4>
                    <ul>
                        <li><strong>Dashboard → Create New Character:</strong> Start the character creation wizard</li>
                        <li><strong>Basic Info:</strong> Enter character name, player name, species, career, and background</li>
                        <li><strong>Species:</strong> Choose from 20+ Star Wars species with authentic characteristic modifiers</li>
                        <li><strong>Career:</strong> Select from all three game lines (EotE, AoR, F&D) with proper career skills</li>
                    </ul>
                    
                    <h4>Character Management</h4>
                    <ul>
                        <li><strong>View Characters:</strong> Click any character card on the dashboard</li>
                        <li><strong>Edit:</strong> Use the Edit button to modify character details</li>
                        <li><strong>Delete:</strong> Remove characters with confirmation dialog</li>
                        <li><strong>Export:</strong> Download character data as JSON files</li>
                    </ul>
                    
                    <h4>Character Advancement</h4>
                    <ul>
                        <li><strong>Award XP:</strong> Give experience points to characters</li>
                        <li><strong>Advance Characteristics:</strong> Increase Brawn, Agility, Intellect, etc.</li>
                        <li><strong>Advance Skills:</strong> Improve skill ranks with proper XP costs</li>
                        <li><strong>Career Skills:</strong> Reduced costs for career-specific skills</li>
                    </ul>
                    
                    <h4>Game Mechanics</h4>
                    <ul>
                        <li><strong>Characteristics:</strong> Range from 1-6, starting values based on species</li>
                        <li><strong>Skills:</strong> Range from 0-5 ranks, organized by characteristic</li>
                        <li><strong>Dice Pool:</strong> Automatically calculated (A = Ability, P = Proficiency)</li>
                        <li><strong>XP Costs:</strong> Follows official Star Wars RPG advancement rules</li>
                    </ul>
                    
                    <h4>Species Information</h4>
                    <p>The manager includes comprehensive species data:</p>
                    <ul>
                        <li><strong>Core Species:</strong> Human, Twi'lek, Rodian, Wookiee, Bothan</li>
                        <li><strong>Additional Species:</strong> Duros, Gand, Trandoshan, Cerean, Kel Dor, Nautolan, Zabrak, Mon Calamari, Sullustan, Chiss</li>
                        <li><strong>Variant Humans:</strong> Corellian Human, Mandalorian Human</li>
                        <li><strong>Unique Species:</strong> Jawa, Ewok, Devaronian</li>
                    </ul>
                    
                    <h4>Tips & Best Practices</h4>
                    <ul>
                        <li>Plan character advancement before spending XP</li>
                        <li>Balance characteristics and skills for optimal effectiveness</li>
                        <li>Consider career skills for cost-effective advancement</li>
                        <li>Export characters regularly as backups</li>
                        <li>Use meaningful character names for easy identification</li>
                    </ul>
                    
                    <h4>Troubleshooting</h4>
                    <ul>
                        <li><strong>Can't create character:</strong> Ensure all required fields are filled</li>
                        <li><strong>Advancement not working:</strong> Check available XP is sufficient</li>
                        <li><strong>Character not saving:</strong> Try refreshing the page and re-entering data</li>
                        <li><strong>Export issues:</strong> Ensure browser allows downloads</li>
                    </ul>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" onclick="characterManager.closeModal()">Got it!</button>
            </div>
        `;
        this.showModal(content);
    }

    showImportCharacter() {
        const content = `
            <div class="modal-header">
                <h3 class="modal-title">Import Character</h3>
                <button type="button" onclick="characterManager.closeModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Import Method</label>
                    <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                        <div>
                            <h4>From JSON File</h4>
                            <p class="text-secondary mb-2">Import a character from an exported JSON file.</p>
                            <input type="file" id="import-file" accept=".json" class="form-input">
                        </div>
                        <div>
                            <h4>From JSON Data</h4>
                            <p class="text-secondary mb-2">Paste character JSON data directly.</p>
                            <textarea id="import-json" class="form-input" rows="6" placeholder="Paste character JSON data here..."></textarea>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="characterManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="characterManager.processImport()">Import Character</button>
            </div>
        `;
        this.showModal(content);

        // Add file input event listener
        document.getElementById('import-file').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('import-json').value = event.target.result;
                };
                reader.readAsText(file);
            }
        });
    }

    async processImport() {
        const jsonData = document.getElementById('import-json').value.trim();

        if (!jsonData) {
            alert('Please provide character data to import.');
            return;
        }

        try {
            const characterData = JSON.parse(jsonData);

            // Validate required fields
            if (!characterData.name || !characterData.species || !characterData.career) {
                alert('Invalid character data: missing required fields (name, species, career).');
                return;
            }

            // Check if character name already exists
            if (this.characters.find(c => c.name === characterData.name)) {
                if (!confirm(`Character "${characterData.name}" already exists. Replace it?`)) {
                    return;
                }
            }

            // Create character via API
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/characters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: characterData.name,
                    playerName: characterData.playerName || 'Imported Character',
                    species: characterData.species,
                    career: characterData.career,
                    background: characterData.background || ''
                })
            });

            const result = await response.json();

            if (response.ok) {
                await this.loadCharactersFromAPI();
                this.closeModal();
                this.showCharacter(result.character.id);
                alert('Character imported successfully!');
            } else {
                alert('Error importing character: ' + result.error);
            }
        } catch (error) {
            console.error('Error importing character:', error);
            alert('Failed to import character. Please check the JSON format.');
        }
    }

    async advanceSkill(skillName) {
        console.log('advanceSkill called with:', skillName);
        console.log('Current character:', this.currentCharacter);
        
        if (!this.currentCharacter) {
            alert('No character selected. Please select a character first.');
            return;
        }

        try {
            console.log('Making API call to advance skill...');
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/characters/${encodeURIComponent(this.currentCharacter.id)}/advance-skill`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    skill: skillName
                })
            });

            const result = await response.json();
            console.log('API response:', result);

            if (response.ok) {
                console.log('Skill advancement successful, reloading data...');
                await this.loadCharactersFromAPI();
                // Update current character reference
                this.currentCharacter = this.characters.find(c => c.id === this.currentCharacter.id);
                this.showCharacter(this.currentCharacter.id);
                alert(result.message);
            } else {
                console.error('Skill advancement failed:', result);
                alert('Error advancing skill: ' + result.error);
            }
        } catch (error) {
            console.error('Error advancing skill:', error);
            alert('Failed to advance skill. Please try again.');
        }
    }

    async advanceCharacteristic(characteristicName) {
        console.log('advanceCharacteristic called with:', characteristicName);
        console.log('Current character:', this.currentCharacter);
        
        if (!this.currentCharacter) {
            alert('No character selected. Please select a character first.');
            return;
        }

        try {
            console.log('Making API call to advance characteristic...');
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/characters/${encodeURIComponent(this.currentCharacter.id)}/advance-characteristic`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    characteristic: characteristicName.toLowerCase()
                })
            });

            const result = await response.json();
            console.log('API response:', result);

            if (response.ok) {
                console.log('Characteristic advancement successful, reloading data...');
                await this.loadCharactersFromAPI();
                // Update current character reference
                this.currentCharacter = this.characters.find(c => c.id === this.currentCharacter.id);
                await this.showCharacter(this.currentCharacter.id);
                alert(result.message);
            } else {
                console.error('Characteristic advancement failed:', result);
                alert('Error advancing characteristic: ' + result.error);
            }
        } catch (error) {
            console.error('Error advancing characteristic:', error);
            alert('Failed to advance characteristic. Please try again.');
        }
    }

    async reduceCharacteristic(characteristicName) {
        console.log('reduceCharacteristic called with:', characteristicName);
        console.log('Current character:', this.currentCharacter);
        
        if (!this.currentCharacter) {
            alert('No character selected. Please select a character first.');
            return;
        }

        if (!confirm(`Reduce ${characteristicName} for ${this.currentCharacter.name}? This will refund XP.`)) {
            return;
        }

        try {
            console.log('Making API call to reduce characteristic...');
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/characters/${encodeURIComponent(this.currentCharacter.id)}/characteristics/${encodeURIComponent(characteristicName.toLowerCase())}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'decrease'
                })
            });

            const result = await response.json();
            console.log('API response:', result);

            if (response.ok) {
                console.log('Characteristic reduction successful, reloading data...');
                await this.loadCharactersFromAPI();
                this.currentCharacter = this.characters.find(c => c.id === this.currentCharacter.id);
                await this.showCharacter(this.currentCharacter.id);
                alert(result.message);
            } else {
                console.error('Characteristic reduction failed:', result);
                alert('Error reducing characteristic: ' + result.error);
            }
        } catch (error) {
            console.error('Error reducing characteristic:', error);
            alert('Failed to reduce characteristic. Please try again.');
        }
    }

    async reduceSkill(skillName) {
        console.log('reduceSkill called with:', skillName);
        console.log('Current character:', this.currentCharacter);
        
        if (!this.currentCharacter) {
            alert('No character selected. Please select a character first.');
            return;
        }

        if (!confirm(`Reduce ${skillName} for ${this.currentCharacter.name}? This will refund XP.`)) {
            return;
        }

        try {
            console.log('Making API call to reduce skill...');
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/characters/${encodeURIComponent(this.currentCharacter.id)}/skills/${encodeURIComponent(skillName)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'decrease'
                })
            });

            const result = await response.json();
            console.log('API response:', result);

            if (response.ok) {
                console.log('Skill reduction successful, reloading data...');
                await this.loadCharactersFromAPI();
                this.currentCharacter = this.characters.find(c => c.id === this.currentCharacter.id);
                await this.showCharacter(this.currentCharacter.id);
                alert(result.message);
            } else {
                console.error('Skill reduction failed:', result);
                alert('Error reducing skill: ' + result.error);
            }
        } catch (error) {
            console.error('Error reducing skill:', error);
            alert('Failed to reduce skill. Please try again.');
        }
    }

    showXPHistory() {
        if (!this.currentCharacter) {
            alert('No character selected. Please select a character first.');
            return;
        }

        // For now, show a simple XP history. In the future this could be enhanced
        // to track detailed XP awards from the backend
        const content = `
            <div class="modal-header">
                <h3 class="modal-title">XP History for ${this.currentCharacter.name}</h3>
                <button type="button" onclick="characterManager.closeModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            <div class="modal-body">
                <div class="xp-summary">
                    <div class="grid grid-3 mb-3">
                        <div class="stat-box">
                            <div class="stat-value">${this.currentCharacter.totalXP || 110}</div>
                            <div class="stat-label">Total XP Earned</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">${(this.currentCharacter.totalXP || 110) - (this.currentCharacter.availableXP || 110)}</div>
                            <div class="stat-label">XP Spent</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">${this.currentCharacter.availableXP || 110}</div>
                            <div class="stat-label">XP Available</div>
                        </div>
                    </div>
                </div>
                
                <div class="xp-breakdown">
                    <h4>XP Breakdown</h4>
                    <div class="xp-entry">
                        <span>Starting XP (${this.currentCharacter.species}):</span>
                        <span>110 XP</span>
                    </div>
                    ${this.currentCharacter.totalXP > 110 ? `
                        <div class="xp-entry">
                            <span>Additional XP Awarded:</span>
                            <span>+${this.currentCharacter.totalXP - 110} XP</span>
                        </div>
                    ` : ''}
                    <div class="xp-entry" style="border-top: 1px solid #ddd; padding-top: 0.5rem; margin-top: 0.5rem; font-weight: bold;">
                        <span>Total Earned:</span>
                        <span>${this.currentCharacter.totalXP || 110} XP</span>
                    </div>
                </div>
                
                <div class="xp-note mt-3">
                    <p class="text-secondary"><strong>XP Summary:</strong> Track your character's experience progression and spending.</p>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" onclick="characterManager.closeModal()">Close</button>
            </div>
        `;
        this.showModal(content);
    }
}

// Initialize the application
let characterManager;

document.addEventListener('DOMContentLoaded', () => {
    characterManager = new CharacterManager();
});
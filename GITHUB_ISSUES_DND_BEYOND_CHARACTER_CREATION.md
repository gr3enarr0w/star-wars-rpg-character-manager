# GitHub Issues for D&D Beyond-Style Character Creation Implementation

## Issues Created Today (June 13, 2025)

### Issue 1: Implement D&D Beyond-Style Character Creation Wizard
**Title:** [FEATURE] Implement D&D Beyond-Style Multi-Step Character Creation Wizard
**Labels:** `enhancement`, `frontend`, `character-creation`, `high-priority`
**Assignee:** @ceverson

**Description:**
Replace the current simple character creation form with a comprehensive, multi-step wizard similar to D&D Beyond's character builder.

**Current Problem:**
- Users can only set basic character info (name, species, career)
- No way to customize characteristics during creation 
- No skill customization options
- Characters are created with default stats (all characteristics at 2)
- No visual feedback or preview during creation
- Poor user experience compared to modern character builders

**Proposed Solution:**
Implement a 7-step character creation wizard:

1. **Character Basics** - Name, Player Name
2. **Species Selection** - Visual cards with stat previews
3. **Career Selection** - Grouped by game line with career skills
4. **Characteristic Assignment** - Interactive point-buy with XP tracking
5. **Skill Customization** - Career skill discounts, XP management
6. **Background & Details** - Backstory, obligations, notes
7. **Review & Create** - Final character preview and confirmation

**Technical Requirements:**
- Progressive disclosure UI with step navigation
- Real-time XP calculation and validation
- Live character preview in sidebar
- Mobile-responsive design
- Integration with existing character system

**Acceptance Criteria:**
- [ ] Multi-step wizard interface implemented
- [ ] Species selection with visual cards and stat preview
- [ ] Career selection with game line filtering
- [ ] Interactive characteristic assignment with XP costs
- [ ] Skill customization with career skill highlighting
- [ ] Character preview updates in real-time
- [ ] Mobile-responsive design
- [ ] Characters created with proper stats (no more defaults)
- [ ] XP calculation prevents overspending
- [ ] Integration with existing character save system

**Files Modified:**
- `web/templates/create_character_wizard.html` (new)
- `web/app.py` (enhanced API endpoints)
- `web/templates/index_with_auth.html` (navigation updates)

---

### Issue 2: Enhance Character Creation API for Advanced Features
**Title:** [BACKEND] Enhance Character Creation API to Support Advanced Character Building
**Labels:** `backend`, `api`, `character-creation`, `enhancement`
**Assignee:** @ceverson

**Description:**
Extend the character creation API to support the advanced character creation wizard features.

**Current Limitations:**
- API only accepts basic character info
- No support for custom characteristic values
- No skill rank customization during creation
- XP calculation not integrated

**Proposed Enhancements:**
1. **Enhanced `/api/game-data` endpoint**
   - Return detailed species information with characteristics
   - Include career details with skill lists and game lines
   - Provide starting XP and threshold information

2. **Advanced `/api/characters` POST endpoint**
   - Accept custom characteristic values
   - Support skill rank assignments
   - Calculate XP expenditure automatically
   - Validate XP spending limits

3. **XP Calculation Integration**
   - Real-time cost calculation for characteristics
   - Career vs non-career skill cost differences
   - Remaining XP tracking

**Technical Implementation:**
- Extend `CharacterCreator` class methods
- Enhance species and career data structures
- Add XP validation logic
- Improve error handling and validation

**Acceptance Criteria:**
- [ ] `/api/game-data` returns detailed species/career info
- [ ] Character creation accepts custom characteristics
- [ ] Skill ranks can be set during creation
- [ ] XP expenditure calculated automatically
- [ ] XP spending validation prevents overspending
- [ ] Proper error messages for invalid data

---

### Issue 3: Fix Flask Routing Errors for Missing Template Routes
**Title:** [BUGFIX] Add Missing Flask Routes for Template Navigation
**Labels:** `bug`, `backend`, `routing`, `templates`
**Assignee:** @ceverson

**Description:**
Fix `werkzeug.routing.exceptions.BuildError` caused by missing Flask routes referenced in templates.

**Error Details:**
```
werkzeug.routing.exceptions.BuildError: Could not build url for endpoint 'campaigns_page'. Did you mean 'create_character_page' instead?
```

**Missing Routes:**
- `campaigns_page` → `/campaigns`
- `admin_page` → `/admin`  
- `profile_page` → `/profile`
- `documentation_page` → `/documentation`

**Root Cause:**
Templates reference `url_for()` endpoints that don't exist in the Flask app routing.

**Solution:**
Add missing route handlers to `web/app.py` for all template references.

**Acceptance Criteria:**
- [ ] All template `url_for()` references have corresponding routes
- [ ] No more routing build errors
- [ ] Navigation links work properly
- [ ] Character creation wizard loads without errors

**Files Modified:**
- `web/app.py` (add missing routes)

---

### Issue 4: Update Navigation to Use New Character Creation Wizard
**Title:** [FRONTEND] Update All Navigation to Use New Character Creation Wizard
**Labels:** `frontend`, `navigation`, `character-creation`
**Assignee:** @ceverson

**Description:**
Replace all references to the old character creation form with links to the new multi-step wizard.

**Changes Required:**
1. **Main Dashboard**
   - "Create Character" button in characters list header
   - "Create Your First Character" button in empty state

2. **Navigation Updates**
   - Update all `onclick="showCreateCharacterForm()"` to `href="/create-character"`
   - Remove obsolete inline form JavaScript
   - Clean up unused functions

3. **User Experience**
   - Consistent "Create Character" button placement
   - Clear visual hierarchy for primary actions
   - Mobile-friendly button sizing

**Acceptance Criteria:**
- [ ] All "Create Character" buttons link to new wizard
- [ ] No broken JavaScript references
- [ ] Consistent button styling and placement
- [ ] Mobile-responsive navigation
- [ ] Old character creation form code removed

**Files Modified:**
- `web/templates/index_with_auth.html`

---

### Issue 5: Implement Character Sheet Improvements
**Title:** [ENHANCEMENT] Improve Character Sheet View and Edit Functionality  
**Labels:** `enhancement`, `frontend`, `character-sheet`, `user-experience`
**Assignee:** @ceverson

**Description:**
Based on the D&D Beyond workflow research, improve the character sheet viewing and editing experience.

**Current Issues:**
- Character sheet is view-only after creation
- No easy way to make adjustments to character build
- Limited character management options

**Proposed Improvements:**
1. **Enhanced Character Sheet**
   - Inline editing for characteristics and skills
   - XP management with undo functionality
   - Character build optimization suggestions

2. **Character Management**
   - Character cloning/templates
   - Export/import functionality
   - Character comparison tools

3. **Mobile Experience**
   - Touch-friendly controls
   - Collapsible sections
   - Swipe navigation

**Future Considerations:**
This issue can be implemented in a follow-up iteration after the character creation wizard is complete.

**Acceptance Criteria:**
- [ ] Character sheet has edit mode
- [ ] Inline characteristic/skill editing
- [ ] XP management improvements
- [ ] Mobile-optimized interface
- [ ] Character management tools

---

## Implementation Status

### ✅ Completed Today:
- [x] D&D Beyond-style character creation wizard (7 steps)
- [x] Enhanced API endpoints for advanced character creation
- [x] Fixed Flask routing errors
- [x] Updated navigation to use new wizard
- [x] Mobile-responsive design implementation
- [x] Real-time XP calculation and validation
- [x] Character preview functionality

### 🔄 Next Steps:
1. Test the character creation wizard thoroughly
2. Gather user feedback on the new workflow
3. Implement character sheet improvements
4. Add character templates and presets
5. Enhance mobile experience further

### 📋 Testing Checklist:
- [ ] Create character with different species/career combinations
- [ ] Test XP spending validation
- [ ] Verify mobile responsiveness
- [ ] Test navigation flow between steps
- [ ] Validate character creation API integration
- [ ] Ensure proper error handling

---

## Notes for Issue Creation:

When creating these issues in GitHub:

1. **Use appropriate labels** for filtering and organization
2. **Assign to relevant team members** 
3. **Link related issues** for better project tracking
4. **Add milestones** for release planning
5. **Include acceptance criteria** for clear completion definition

Each issue is designed to be:
- **Specific** - Clear scope and requirements
- **Measurable** - Defined acceptance criteria  
- **Achievable** - Reasonable scope for implementation
- **Relevant** - Addresses real user needs
- **Time-bound** - Can be completed in reasonable timeframe
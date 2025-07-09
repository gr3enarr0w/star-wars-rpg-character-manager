# Systematic FFG Wiki Scrape Progress Report

**Date:** 2025-07-08  
**Issue:** #179 - Complete FFG Wiki scrape and vector database validation

---

## 📊 Progress Summary

### Species Data Extracted: **25/70+ (36%)**

✅ **Species Completed** (25 total):
1. Human ✅
2. Twi'lek ✅
3. Rodian ✅  
4. Wookiee ✅
5. Bothan ✅
6. Duros ✅
7. Gand ✅
8. Trandoshan ✅
9. Chiss ✅
10. Kel Dor ✅
11. Nautolan ✅
12. Zabrak ✅
13. Cerean ✅
14. Aqualish ✅
15. Sullustan ✅
16. Mon Calamari ✅
17. Ithorian ✅
18. Ewok ✅
19. Droid ✅
20. Hutt ✅
21. Jawa ✅
22. Miraluka ✅
23. Mirialan ✅
24. Neimoidian ✅
25. Pantoran ✅

🔄 **Currently Scraping**:
- Toydarian ✅
- Besalisk ✅
- Caamasi ✅
- Quarren ✅
- Falleen (in progress)
- Weequay (in progress)
- Nikto (in progress)

---

## 🚨 CRITICAL FINDING: 100% ERROR RATE

**EVERY SINGLE SPECIES (25/25) HAS CRITICAL DATA ERRORS**

### Error Categories Found:

#### **Characteristic Errors: 60+ total**
- Wrong Brawn: 8 species
- Wrong Agility: 6 species  
- Wrong Intellect: 8 species
- Wrong Cunning: 12 species
- Wrong Willpower: 10 species
- Wrong Presence: 16 species

#### **Derived Attribute Errors: 40+ total**
- Wrong Wound Threshold: 20+ species
- Wrong Strain Threshold: 20+ species

#### **Experience Point Errors: 15+ total**
- Wrong Starting XP: 15+ species (errors range from ±5 to ±30 XP!)

#### **Special Ability Errors: ALL 25 species**
- Generic descriptions instead of exact FFG wording
- Missing critical talents and mechanics
- Wrong skill assignments
- Missing unique species abilities

---

## 🎯 Most Critical Species Errors

### **Game-Breaking XP Errors:**
- **Ewok**: 90 → 120 XP (30 XP too low!)
- **Wookiee**: 60 → 90 XP (30 XP too low!)  
- **Mon Calamari**: 120 → 100 XP (20 XP too high!)
- **Trandoshan**: 70 → 90 XP (20 XP too low!)

### **Critical Characteristic Errors:**
- **Mon Calamari**: Cunning 3 → 1 (2 points wrong!)
- **Quarren**: Intellect 3 → 1, Willpower 1 → 3 (completely swapped!)
- **Chiss**: Presence 0 → 1 (invalid characteristic!)
- **Zabrak**: Wrong Agility, Willpower, Presence + completely wrong abilities

### **Missing Unique Mechanics:**
- **Ithorian**: Missing unique Bellow weapon (Damage 6, Critical 4, Blast 3)
- **Nikto**: Missing 5 distinct subspecies with different abilities
- **Falleen**: Missing detailed Beguiling Pheromones mechanics
- **Droid**: Missing cybernetic rules and Force restrictions

---

## 📋 Remaining Species to Scrape (45+)

### High Priority (Core Species):
- Aleena, Anx, Arcona, Bardottan
- Chevin, Clawdite, Clone, Corellian Human
- Dathomirian, Devaronian, Drall, Dressellian
- Dug, Elom, Elomin, Gamorrean
- Gossam, Gotal, Gran, Gungan
- Harch, Iktotchi, Ishi Tib
- Kaleesh, Kalleran, Karkarodon, Klatooinian
- Kyuzo, Lannik, Lasat, Mandalorian Human
- Mustafarian, Muun, Polis Massan
- Quermian, Sakiyan, Sathari, Selonian
- Shistavanen, Talz, Togruta
- Verpine, Whipid, Xexto

### Extended Species:
- Many additional species from supplements

---

## 🔧 Next Steps - Systematic Approach

### Phase 1: Complete Species (In Progress)
- ⏳ **Current**: Continuing systematic species extraction
- 🎯 **Goal**: All 70+ species with exact FFG Wiki data
- ⏱️ **ETA**: 2-3 more scraping sessions

### Phase 2: Career & Specialization Data
- 📋 **Scope**: 18 core careers + specializations
- 🎯 **Data**: Career skills, thresholds, talent trees
- ⚠️ **Challenge**: Many individual career pages return 404s

### Phase 3: Talent Database  
- 📋 **Scope**: 500+ talents with exact mechanics
- 🎯 **Data**: Activation types, descriptions, XP costs
- ⚠️ **Challenge**: Individual talent pages seem missing

### Phase 4: Equipment & Gear
- 📋 **Scope**: 1000+ weapons, armor, gear, cybernetics
- 🎯 **Data**: Stats, costs, rarity, special rules

### Phase 5: Force Powers & Vehicles
- 📋 **Scope**: All Force powers + upgrade trees
- 📋 **Scope**: Ships, fighters, capital vessels

---

## 🎯 Validation Strategy

### Current Method: **Manual Verification**
- ✅ Individual species page scraping
- ✅ Exact stat comparison vs vector database
- ✅ Documentation of all discrepancies

### Required: **Automated Validation Tools**
- 🔄 Batch comparison scripts
- 📊 Error pattern analysis
- 📋 Comprehensive validation reports

---

## 🚨 Impact Assessment Update

### Character Creation: **BROKEN**
- **100% of validated species have wrong stats**
- Players get incorrect characteristics affecting all dice pools
- Wrong XP amounts affect entire character advancement
- Missing critical abilities and talents

### Game Balance: **COMPROMISED**  
- Some species significantly overpowered
- Others severely underpowered
- Inconsistent mechanics across species

### Rules Accuracy: **UNACCEPTABLE**
- Vector database does not match official FFG rules
- Generic abilities instead of specific mechanics
- Missing unique species features entirely

---

## ✅ Immediate Actions Required

1. **Continue systematic species scraping** (45+ remaining)
2. **Update comprehensive_species_data_v2.json** with all corrections
3. **Create automated comparison tools** for validation
4. **Rebuild vector database** with authoritative FFG data
5. **Update character creation system** with correct data

**Priority: CRITICAL - Every day this remains unfixed, players experience broken character creation.**
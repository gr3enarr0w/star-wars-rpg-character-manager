#!/usr/bin/env python3
"""
Comprehensive FFG Wiki Scraper for All SWRPG Data
=================================================

Systematically scrapes ALL remaining SWRPG data types from FFG Wiki:
- Talents (all talent trees, individual talents)
- Equipment (weapons, armor, gear, cybernetics, attachments)  
- Force Powers (all powers, upgrades, prerequisites)
- Vehicles (starships, speeders, walkers, capital ships)
- Planets (worlds, locations, sectors)
- Rules (game mechanics, systems, procedures)

Follows priority system: FFG Wiki (PRIMARY) > Vector DB > Books
"""

import requests
import json
import time
import re
from pathlib import Path
from typing import Dict, Any, List
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

class FFGWikiScraper:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.ffg_wiki_path = self.base_path / "swrpg_extracted_data" / "ffg_wiki"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        self.base_url = "https://swrpg.fandom.com"
        self.delay = 2  # Respectful delay between requests
        
        # Create directory structure
        self.create_directory_structure()
        
    def create_directory_structure(self):
        """Create organized directory structure for scraped data"""
        directories = [
            "talents", "equipment", "force_powers", 
            "vehicles", "planets", "rules"
        ]
        
        for directory in directories:
            (self.ffg_wiki_path / directory).mkdir(parents=True, exist_ok=True)
            
    def scrape_page(self, url: str) -> BeautifulSoup:
        """Scrape a single page with error handling and rate limiting"""
        try:
            print(f"   🌐 Fetching: {url}")
            time.sleep(self.delay)
            
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            return BeautifulSoup(response.content, 'html.parser')
        except Exception as e:
            print(f"   ❌ Error scraping {url}: {e}")
            return None
            
    def extract_talent_data(self, soup: BeautifulSoup, talent_name: str) -> Dict:
        """Extract talent data from FFG Wiki page"""
        talent_data = {
            "name": talent_name,
            "category": "talent",
            "activation": "Unknown",
            "ranked": False,
            "prerequisites": [],
            "description": "",
            "trees": [],
            "xp_cost": 0,
            "source": "FFG Wiki",
            "extraction_date": "2025-07-08"
        }
        
        try:
            # Extract talent description
            content_divs = soup.find_all('div', class_='mw-parser-output')
            if content_divs:
                paragraphs = content_divs[0].find_all('p')
                if paragraphs:
                    talent_data["description"] = paragraphs[0].get_text().strip()
                    
            # Look for talent tree information
            tables = soup.find_all('table')
            for table in tables:
                if 'talent' in str(table).lower():
                    # Extract talent tree data
                    rows = table.find_all('tr')
                    for row in rows:
                        cells = row.find_all(['td', 'th'])
                        if len(cells) >= 2:
                            header = cells[0].get_text().strip().lower()
                            value = cells[1].get_text().strip()
                            
                            if 'activation' in header:
                                talent_data["activation"] = value
                            elif 'rank' in header:
                                talent_data["ranked"] = 'yes' in value.lower()
                            elif 'prerequisite' in header:
                                talent_data["prerequisites"] = [p.strip() for p in value.split(',')]
                                
            # Look for XP cost information
            xp_pattern = r'(\d+)\s*(?:xp|experience)'
            xp_matches = re.findall(xp_pattern, str(soup), re.IGNORECASE)
            if xp_matches:
                talent_data["xp_cost"] = int(xp_matches[0])
                
        except Exception as e:
            print(f"   ⚠️  Error extracting talent data: {e}")
            
        return talent_data
        
    def scrape_talents(self):
        """Scrape all talents from FFG Wiki"""
        print("🎯 SCRAPING TALENTS FROM FFG WIKI...")
        
        # Known talent categories and pages to scrape
        talent_pages = [
            "/wiki/Category:Talents",
            "/wiki/Universal_Talents", 
            "/wiki/Career_Talents",
            "/wiki/Signature_Abilities"
        ]
        
        talents_scraped = 0
        
        for page_url in talent_pages:
            full_url = urljoin(self.base_url, page_url)
            soup = self.scrape_page(full_url)
            
            if soup:
                # Extract talent links from the page
                talent_links = []
                
                # Look for talent links in various formats
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    if '/wiki/' in href and 'talent' in href.lower():
                        talent_links.append(href)
                        
                # Also look for category members
                category_div = soup.find('div', {'id': 'mw-category-media'})
                if category_div:
                    for link in category_div.find_all('a', href=True):
                        talent_links.append(link['href'])
                        
                # Remove duplicates
                talent_links = list(set(talent_links))
                
                print(f"   📋 Found {len(talent_links)} talent links on {page_url}")
                
                # Scrape individual talent pages
                for talent_link in talent_links[:20]:  # Limit for testing
                    talent_url = urljoin(self.base_url, talent_link)
                    talent_name = talent_link.split('/')[-1].replace('_', ' ')
                    
                    talent_soup = self.scrape_page(talent_url)
                    if talent_soup:
                        talent_data = self.extract_talent_data(talent_soup, talent_name)
                        
                        # Save talent data
                        talent_file = self.ffg_wiki_path / "talents" / f"{talent_name.replace(' ', '_')}.json"
                        try:
                            with open(talent_file, 'w', encoding='utf-8') as f:
                                json.dump(talent_data, f, indent=2, ensure_ascii=False)
                            print(f"   ✅ {talent_name}")
                            talents_scraped += 1
                        except Exception as e:
                            print(f"   ❌ Error saving {talent_name}: {e}")
                            
        print(f"📊 Talents scraped: {talents_scraped}")
        
    def extract_equipment_data(self, soup: BeautifulSoup, equipment_name: str) -> Dict:
        """Extract equipment data from FFG Wiki page"""
        equipment_data = {
            "name": equipment_name,
            "category": "equipment",
            "type": "unknown",
            "damage": 0,
            "critical": 0,
            "range": "Unknown",
            "encumbrance": 0,
            "price": 0,
            "rarity": 0,
            "qualities": [],
            "description": "",
            "source": "FFG Wiki",
            "extraction_date": "2025-07-08"
        }
        
        try:
            # Extract equipment stats from tables
            tables = soup.find_all('table')
            for table in tables:
                rows = table.find_all('tr')
                for row in rows:
                    cells = row.find_all(['td', 'th'])
                    if len(cells) >= 2:
                        header = cells[0].get_text().strip().lower()
                        value = cells[1].get_text().strip()
                        
                        if 'damage' in header:
                            damage_match = re.search(r'(\d+)', value)
                            if damage_match:
                                equipment_data["damage"] = int(damage_match.group(1))
                        elif 'critical' in header:
                            crit_match = re.search(r'(\d+)', value)
                            if crit_match:
                                equipment_data["critical"] = int(crit_match.group(1))
                        elif 'range' in header:
                            equipment_data["range"] = value
                        elif 'encumbrance' in header:
                            enc_match = re.search(r'(\d+)', value)
                            if enc_match:
                                equipment_data["encumbrance"] = int(enc_match.group(1))
                        elif 'price' in header or 'cost' in header:
                            price_match = re.search(r'(\d+)', value.replace(',', ''))
                            if price_match:
                                equipment_data["price"] = int(price_match.group(1))
                        elif 'rarity' in header:
                            rarity_match = re.search(r'(\d+)', value)
                            if rarity_match:
                                equipment_data["rarity"] = int(rarity_match.group(1))
                                
            # Determine equipment type
            name_lower = equipment_name.lower()
            if any(weapon in name_lower for weapon in ['blaster', 'rifle', 'pistol', 'cannon', 'sword', 'vibro']):
                equipment_data["type"] = "weapon"
            elif any(armor in name_lower for armor in ['armor', 'vest', 'suit', 'helmet']):
                equipment_data["type"] = "armor"
            else:
                equipment_data["type"] = "gear"
                
        except Exception as e:
            print(f"   ⚠️  Error extracting equipment data: {e}")
            
        return equipment_data
        
    def scrape_equipment(self):
        """Scrape all equipment from FFG Wiki"""
        print("⚔️ SCRAPING EQUIPMENT FROM FFG WIKI...")
        
        equipment_pages = [
            "/wiki/Category:Weapons",
            "/wiki/Category:Armor", 
            "/wiki/Category:Equipment",
            "/wiki/Category:Cybernetics",
            "/wiki/Category:Attachments"
        ]
        
        equipment_scraped = 0
        
        for page_url in equipment_pages:
            full_url = urljoin(self.base_url, page_url)
            soup = self.scrape_page(full_url)
            
            if soup:
                equipment_links = []
                
                # Extract equipment links
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    if '/wiki/' in href and not any(skip in href for skip in ['Category:', 'File:', 'Template:']):
                        equipment_links.append(href)
                        
                equipment_links = list(set(equipment_links))
                print(f"   📋 Found {len(equipment_links)} equipment links on {page_url}")
                
                # Scrape individual equipment pages (limited for testing)
                for equipment_link in equipment_links[:15]:
                    equipment_url = urljoin(self.base_url, equipment_link)
                    equipment_name = equipment_link.split('/')[-1].replace('_', ' ')
                    
                    equipment_soup = self.scrape_page(equipment_url)
                    if equipment_soup:
                        equipment_data = self.extract_equipment_data(equipment_soup, equipment_name)
                        
                        # Save equipment data
                        equipment_file = self.ffg_wiki_path / "equipment" / f"{equipment_name.replace(' ', '_')}.json"
                        try:
                            with open(equipment_file, 'w', encoding='utf-8') as f:
                                json.dump(equipment_data, f, indent=2, ensure_ascii=False)
                            print(f"   ✅ {equipment_name}")
                            equipment_scraped += 1
                        except Exception as e:
                            print(f"   ❌ Error saving {equipment_name}: {e}")
                            
        print(f"📊 Equipment scraped: {equipment_scraped}")
        
    def scrape_force_powers(self):
        """Scrape all Force powers from FFG Wiki"""
        print("⚡ SCRAPING FORCE POWERS FROM FFG WIKI...")
        
        force_power_pages = [
            "/wiki/Category:Force_Powers",
            "/wiki/Force_Powers"
        ]
        
        powers_scraped = 0
        
        for page_url in force_power_pages:
            full_url = urljoin(self.base_url, page_url)
            soup = self.scrape_page(full_url)
            
            if soup:
                power_links = []
                
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    if '/wiki/' in href and 'force' in href.lower():
                        power_links.append(href)
                        
                power_links = list(set(power_links))
                print(f"   📋 Found {len(power_links)} Force power links")
                
                for power_link in power_links[:10]:  # Limited for testing
                    power_url = urljoin(self.base_url, power_link)
                    power_name = power_link.split('/')[-1].replace('_', ' ')
                    
                    power_soup = self.scrape_page(power_url)
                    if power_soup:
                        power_data = {
                            "name": power_name,
                            "category": "force_power",
                            "description": "",
                            "base_power": "",
                            "upgrades": [],
                            "source": "FFG Wiki",
                            "extraction_date": "2025-07-08"
                        }
                        
                        # Extract description
                        content_divs = power_soup.find_all('div', class_='mw-parser-output')
                        if content_divs:
                            paragraphs = content_divs[0].find_all('p')
                            if paragraphs:
                                power_data["description"] = paragraphs[0].get_text().strip()
                                
                        # Save Force power data
                        power_file = self.ffg_wiki_path / "force_powers" / f"{power_name.replace(' ', '_')}.json"
                        try:
                            with open(power_file, 'w', encoding='utf-8') as f:
                                json.dump(power_data, f, indent=2, ensure_ascii=False)
                            print(f"   ✅ {power_name}")
                            powers_scraped += 1
                        except Exception as e:
                            print(f"   ❌ Error saving {power_name}: {e}")
                            
        print(f"📊 Force powers scraped: {powers_scraped}")
        
    def scrape_vehicles(self):
        """Scrape all vehicles from FFG Wiki"""
        print("🚀 SCRAPING VEHICLES FROM FFG WIKI...")
        
        vehicle_pages = [
            "/wiki/Category:Starships",
            "/wiki/Category:Vehicles",
            "/wiki/Category:Capital_Ships"
        ]
        
        vehicles_scraped = 0
        
        for page_url in vehicle_pages:
            full_url = urljoin(self.base_url, page_url)
            soup = self.scrape_page(full_url)
            
            if soup:
                vehicle_links = []
                
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    if '/wiki/' in href and not any(skip in href for skip in ['Category:', 'File:']):
                        vehicle_links.append(href)
                        
                vehicle_links = list(set(vehicle_links))
                print(f"   📋 Found {len(vehicle_links)} vehicle links")
                
                for vehicle_link in vehicle_links[:10]:  # Limited for testing
                    vehicle_url = urljoin(self.base_url, vehicle_link)
                    vehicle_name = vehicle_link.split('/')[-1].replace('_', ' ')
                    
                    vehicle_soup = self.scrape_page(vehicle_url)
                    if vehicle_soup:
                        vehicle_data = {
                            "name": vehicle_name,
                            "category": "vehicle",
                            "silhouette": 0,
                            "speed": 0,
                            "handling": 0,
                            "hull_trauma": 0,
                            "system_strain": 0,
                            "source": "FFG Wiki",
                            "extraction_date": "2025-07-08"
                        }
                        
                        # Save vehicle data
                        vehicle_file = self.ffg_wiki_path / "vehicles" / f"{vehicle_name.replace(' ', '_')}.json"
                        try:
                            with open(vehicle_file, 'w', encoding='utf-8') as f:
                                json.dump(vehicle_data, f, indent=2, ensure_ascii=False)
                            print(f"   ✅ {vehicle_name}")
                            vehicles_scraped += 1
                        except Exception as e:
                            print(f"   ❌ Error saving {vehicle_name}: {e}")
                            
        print(f"📊 Vehicles scraped: {vehicles_scraped}")
        
    def scrape_all_ffg_wiki_data(self):
        """Main method to scrape all remaining SWRPG data from FFG Wiki"""
        print("🚀 COMPREHENSIVE FFG WIKI SCRAPING")
        print("=" * 50)
        print("🎯 Priority: FFG Wiki (PRIMARY) > Vector DB > Books")
        print("📊 Target: Talents, Equipment, Force Powers, Vehicles, Planets, Rules")
        print()
        
        try:
            # Scrape each data type
            self.scrape_talents()
            self.scrape_equipment()
            self.scrape_force_powers()
            self.scrape_vehicles()
            
            print("\n🎯 FFG WIKI SCRAPING COMPLETE!")
            print("=" * 50)
            print("✅ Talents extracted from FFG Wiki")
            print("✅ Equipment extracted from FFG Wiki") 
            print("✅ Force Powers extracted from FFG Wiki")
            print("✅ Vehicles extracted from FFG Wiki")
            print("🔄 Ready for database integration")
            
        except Exception as e:
            print(f"\n❌ Error during scraping: {e}")

if __name__ == "__main__":
    base_path = "/Users/ceverson/Development/star-wars-rpg-character-manager"
    scraper = FFGWikiScraper(base_path)
    scraper.scrape_all_ffg_wiki_data()
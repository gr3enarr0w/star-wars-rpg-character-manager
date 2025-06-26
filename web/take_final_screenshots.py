#!/usr/bin/env python3
"""
Take final screenshots to document the working campaign creation functionality.
"""

import os
import sys
import asyncio
from playwright.async_api import async_playwright
from datetime import datetime

class FinalScreenshotTester:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.screenshots_dir = "final_working_screenshots"
        
        # Create screenshots directory
        os.makedirs(self.screenshots_dir, exist_ok=True)
    
    async def setup_browser(self, playwright):
        """Setup browser with proper configuration."""
        browser = await playwright.chromium.launch(
            headless=False,
            slow_mo=1500,
            args=['--disable-web-security', '--disable-features=VizDisplayCompositor']
        )
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 720},
            ignore_https_errors=True
        )
        page = await context.new_page()
        
        return browser, page
    
    async def authenticate_user(self, page):
        """Set up demo authentication."""
        print("Setting up demo authentication...")
        
        await page.goto(self.base_url)
        await page.wait_for_load_state('networkidle')
        
        # Set demo authentication in localStorage
        await page.evaluate("""
            localStorage.setItem('access_token', 'demo_token_12345');
            localStorage.setItem('user', JSON.stringify({
                id: '1',
                username: 'demo_user',
                email: 'test@example.com',
                role: 'user'
            }));
        """)
        
        await page.reload()
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(2000)
        
        return True
    
    async def take_working_demo_screenshots(self, page):
        """Take screenshots showing working campaign creation."""
        print("Taking final working demonstration screenshots...")
        
        # Navigate to campaigns page
        await page.goto(f"{self.base_url}/campaigns")
        await page.wait_for_load_state('networkidle')
        
        await page.screenshot(path=f"{self.screenshots_dir}/01_campaigns_homepage.png")
        print("  ✓ Screenshot: Campaigns homepage")
        
        # Click Create Campaign tab
        await page.click('button:has-text("Create Campaign")')
        await page.wait_for_timeout(1000)
        
        await page.screenshot(path=f"{self.screenshots_dir}/02_create_campaign_tab.png")
        print("  ✓ Screenshot: Create Campaign tab")
        
        # Fill out a sample campaign
        await page.fill('input[name="name"]', 'Edge of the Empire Campaign')
        await page.fill('textarea[name="description"]', 'A thrilling campaign set in the outer rim territories. Players will navigate the criminal underworld, Imperial entanglements, and discover their destinies among the stars.')
        await page.select_option('select[name="game_system"]', 'Edge of the Empire')
        await page.fill('input[name="max_players"]', '5')
        
        await page.screenshot(path=f"{self.screenshots_dir}/03_campaign_form_filled.png")
        print("  ✓ Screenshot: Campaign form filled")
        
        # Submit the form
        await page.click('button[type="submit"]:has-text("Create Campaign")')
        await page.wait_for_timeout(3000)
        
        await page.screenshot(path=f"{self.screenshots_dir}/04_after_successful_creation.png")
        print("  ✓ Screenshot: After successful creation")
        
        # Test different game systems
        await page.click('button:has-text("Create Campaign")')
        await page.wait_for_timeout(1000)
        
        await page.fill('input[name="name"]', 'Force and Destiny Campaign')
        await page.fill('textarea[name="description"]', 'Explore the mysteries of the Force in this epic Jedi adventure.')
        await page.select_option('select[name="game_system"]', 'Force and Destiny')
        
        await page.screenshot(path=f"{self.screenshots_dir}/05_force_and_destiny_campaign.png")
        print("  ✓ Screenshot: Force and Destiny campaign")
        
        await page.click('button[type="submit"]:has-text("Create Campaign")')
        await page.wait_for_timeout(3000)
        
        # Test Join Campaign tab
        await page.click('button:has-text("Join Campaign")')
        await page.wait_for_timeout(1000)
        
        await page.screenshot(path=f"{self.screenshots_dir}/06_join_campaign_tab.png")
        print("  ✓ Screenshot: Join Campaign tab")
        
        # Test My Campaigns tab
        await page.click('button:has-text("My Campaigns")')
        await page.wait_for_timeout(2000)
        
        await page.screenshot(path=f"{self.screenshots_dir}/07_my_campaigns_final.png")
        print("  ✓ Screenshot: My Campaigns final state")
        
        print("\n✅ All demonstration screenshots completed successfully!")
        print(f"Screenshots saved to: {self.screenshots_dir}/")
    
    async def run_demo(self):
        """Run the final demonstration."""
        print("Final Campaign Creation Demonstration")
        print("=" * 50)
        
        async with async_playwright() as playwright:
            browser, page = await self.setup_browser(playwright)
            
            try:
                # Authenticate user
                auth_success = await self.authenticate_user(page)
                if not auth_success:
                    print("❌ Authentication failed")
                    return
                
                # Take demonstration screenshots
                await self.take_working_demo_screenshots(page)
                
            finally:
                await browser.close()

async def main():
    """Main entry point."""
    tester = FinalScreenshotTester()
    await tester.run_demo()

if __name__ == "__main__":
    asyncio.run(main())
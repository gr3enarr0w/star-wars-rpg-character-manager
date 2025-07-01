const { test, expect } = require('@playwright/test');

test('Debug page source to find Create Character buttons', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Go to login page
    await page.goto('http://localhost:8001');
    
    // Login
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Get page source and find all Create Character instances
    const pageContent = await page.content();
    
    // Extract lines containing "Create Character"
    const lines = pageContent.split('\n');
    const createCharacterLines = lines.filter(line => line.includes('Create Character'));
    
    console.log('=== LINES CONTAINING "Create Character" ===');
    createCharacterLines.forEach((line, index) => {
        console.log(`${index + 1}: ${line.trim()}`);
    });
    
    // Get all elements containing "Create Character" text
    const elements = await page.locator('text="Create Character"').all();
    console.log('\n=== ELEMENTS WITH "Create Character" TEXT ===');
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const tagName = await element.evaluate(el => el.tagName);
        const className = await element.evaluate(el => el.className);
        const id = await element.evaluate(el => el.id);
        const style = await element.evaluate(el => el.style.cssText);
        const isVisible = await element.isVisible();
        
        console.log(`Element ${i + 1}:`);
        console.log(`  Tag: ${tagName}`);
        console.log(`  Class: ${className}`);
        console.log(`  ID: ${id}`);
        console.log(`  Style: ${style}`);
        console.log(`  Visible: ${isVisible}`);
        console.log('');
    }
});
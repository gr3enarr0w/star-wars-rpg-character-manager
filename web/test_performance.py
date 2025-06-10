"""
Performance testing for Star Wars RPG Character Manager web application.
"""

import asyncio
import time
from playwright.async_api import async_playwright

TEST_URL = "http://127.0.0.1:5000"

async def performance_test():
    """Test page load performance and responsiveness."""
    print("🚀 Starting performance tests...")
    
    async with async_playwright() as p:
        # Test in Chromium
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        # Measure initial page load time
        start_time = time.time()
        await page.goto(TEST_URL, wait_until="networkidle")
        load_time = time.time() - start_time
        
        print(f"📊 Initial page load time: {load_time:.2f}s")
        
        # Test responsiveness - multiple rapid clicks
        try:
            login_btn = await page.query_selector("button:has-text('Login'), .login-btn")
            if login_btn:
                click_times = []
                for i in range(5):
                    start = time.time()
                    await login_btn.click()
                    await page.wait_for_timeout(100)
                    click_times.append(time.time() - start)
                
                avg_click_time = sum(click_times) / len(click_times)
                print(f"📊 Average click response time: {avg_click_time:.3f}s")
            
        except Exception as e:
            print(f"⚠️ Click test failed: {e}")
        
        # Test JavaScript performance
        js_perf = await page.evaluate("""
            () => {
                const start = performance.now();
                // Simulate some DOM operations
                for(let i = 0; i < 1000; i++) {
                    const el = document.createElement('div');
                    el.textContent = 'Test ' + i;
                    document.body.appendChild(el);
                    document.body.removeChild(el);
                }
                return performance.now() - start;
            }
        """)
        
        print(f"📊 JavaScript DOM manipulation time: {js_perf:.2f}ms")
        
        # Check memory usage
        metrics = await page.evaluate("() => performance.memory")
        if metrics:
            print(f"📊 Memory usage: {metrics.get('usedJSHeapSize', 0) / 1024 / 1024:.2f}MB")
        
        await browser.close()
        print("✅ Performance tests completed")

if __name__ == "__main__":
    asyncio.run(performance_test())
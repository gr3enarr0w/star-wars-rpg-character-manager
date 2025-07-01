// Security-focused Playwright tests
const { test, expect } = require('@playwright/test');

test.describe('Security Tests', () => {
  test('debug endpoints should not be accessible', async ({ page }) => {
    const debugEndpoints = [
      '/api/debug/create-admin',
      '/api/debug/test-login',
      '/api/debug/test',
      '/debug',
      '/test'
    ];
    
    for (const endpoint of debugEndpoints) {
      const response = await page.request.get(endpoint);
      expect(response.status()).toBe(404);
    }
  });

  test('error pages should not expose system information', async ({ page }) => {
    // Test 404 page
    await page.goto('/nonexistent-page');
    const content = await page.content();
    
    // Should not contain system information
    expect(content).not.toContain('traceback');
    expect(content).not.toContain('Exception');
    expect(content).not.toContain('stack trace');
    expect(content).not.toContain('Werkzeug');
  });

  test('admin endpoints should require authentication', async ({ page }) => {
    const response = await page.request.get('/api/admin/users');
    expect([401, 403]).toContain(response.status());
  });

  test('should not expose sensitive headers', async ({ page }) => {
    await page.goto('/');
    const response = await page.request.get('/');
    const headers = response.headers();
    
    // Should not expose server information
    expect(headers['server']).not.toContain('Werkzeug');
    expect(headers['server']).not.toContain('Flask');
    
    // Should have security headers
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
  });
});
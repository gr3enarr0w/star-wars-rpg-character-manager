const { test, expect } = require('@playwright/test');

test.describe('Comprehensive API Security Testing - GitHub Codespaces', () => {
    const API_BASE = 'http://localhost:8000';
    
    // Comprehensive list of all API endpoints to test
    const apiEndpoints = [
        // Auth endpoints
        { method: 'GET', path: '/api/auth/me', requiresAuth: true, description: 'Get current user' },
        { method: 'POST', path: '/api/auth/logout', requiresAuth: false, description: 'Logout user' },
        
        // Character endpoints
        { method: 'GET', path: '/api/characters', requiresAuth: true, description: 'Get user characters' },
        { method: 'POST', path: '/api/characters', requiresAuth: true, description: 'Create character' },
        { method: 'GET', path: '/api/characters/test-id', requiresAuth: true, description: 'Get specific character' },
        { method: 'PUT', path: '/api/characters/test-id', requiresAuth: true, description: 'Update character' },
        { method: 'DELETE', path: '/api/characters/test-id', requiresAuth: true, description: 'Delete character' },
        
        // Admin endpoints
        { method: 'GET', path: '/api/admin/users', requiresAuth: true, description: 'Get all users (admin)' },
        { method: 'POST', path: '/api/admin/users', requiresAuth: true, description: 'Create user (admin)' },
        { method: 'PUT', path: '/api/admin/users/test-id', requiresAuth: true, description: 'Update user (admin)' },
        { method: 'DELETE', path: '/api/admin/users/test-id', requiresAuth: true, description: 'Delete user (admin)' },
        
        // Campaign endpoints
        { method: 'GET', path: '/api/campaigns', requiresAuth: true, description: 'Get campaigns' },
        { method: 'POST', path: '/api/campaigns', requiresAuth: true, description: 'Create campaign' },
        
        // System endpoints (should not require auth)
        { method: 'GET', path: '/health', requiresAuth: false, description: 'Health check' },
        { method: 'GET', path: '/', requiresAuth: false, description: 'Main page' },
        { method: 'GET', path: '/login', requiresAuth: false, description: 'Login page' },
    ];

    // Helper function to get auth token
    async function getAuthToken(page) {
        console.log('🔑 Obtaining authentication token...');
        
        const response = await page.request.post(`${API_BASE}/api/auth/login`, {
            data: {
                email: process.env.ADMIN_EMAIL || 'clark@everson.dev',
                password: process.env.ADMIN_PASSWORD || 'github-testing-admin-password-2024'
            }
        });
        
        expect(response.ok()).toBe(true);
        const data = await response.json();
        expect(data.access_token).toBeTruthy();
        
        console.log(`✅ Auth token obtained: ${data.access_token.substring(0, 20)}...`);
        return data.access_token;
    }

    // Helper function to test API endpoint
    async function testApiEndpoint(page, endpoint, token = null) {
        const url = `${API_BASE}${endpoint.path}`;
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const requestOptions = {
            method: endpoint.method,
            headers
        };

        // Add body for POST/PUT requests
        if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
            if (endpoint.path.includes('/characters') && !endpoint.path.includes('test-id')) {
                requestOptions.data = {
                    name: 'Test Character',
                    player: 'Test Player',
                    species: 'Human',
                    career: 'Guardian'
                };
            } else if (endpoint.path.includes('/admin/users')) {
                requestOptions.data = {
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'testpass123',
                    role: 'user'
                };
            } else if (endpoint.path.includes('/campaigns')) {
                requestOptions.data = {
                    name: 'Test Campaign',
                    description: 'Test campaign description'
                };
            }
        }

        try {
            const response = await page.request.fetch(url, requestOptions);
            return {
                status: response.status(),
                statusText: response.statusText(),
                ok: response.ok(),
                headers: await response.headers()
            };
        } catch (error) {
            return {
                error: error.message,
                status: 0,
                ok: false
            };
        }
    }

    test('🔒 API Authentication Required - Unauthenticated Requests Should Be Blocked', async ({ page }) => {
        console.log('🔒 Testing API Security - All endpoints without authentication should be blocked');
        
        const results = [];
        const protectedEndpoints = apiEndpoints.filter(ep => ep.requiresAuth);
        
        for (const endpoint of protectedEndpoints) {
            console.log(`🔍 Testing ${endpoint.method} ${endpoint.path} without auth...`);
            
            const response = await testApiEndpoint(page, endpoint, null);
            
            const shouldBeBlocked = response.status === 401 || response.status === 403;
            const result = {
                endpoint: `${endpoint.method} ${endpoint.path}`,
                description: endpoint.description,
                status: response.status,
                blocked: shouldBeBlocked,
                expected: 'Should be blocked (401/403)'
            };
            
            results.push(result);
            
            if (shouldBeBlocked) {
                console.log(`  ✅ Properly blocked: ${response.status}`);
            } else {
                console.log(`  ❌ NOT BLOCKED: ${response.status} - SECURITY ISSUE!`);
            }
        }
        
        console.log('\n📊 Unauthenticated Request Security Results:');
        console.log('='.repeat(100));
        
        let blockedCount = 0;
        let totalAuthRequired = 0;
        
        for (const result of results) {
            totalAuthRequired++;
            if (result.blocked) {
                blockedCount++;
                console.log(`✅ ${result.endpoint.padEnd(45)} | ${result.status.toString().padEnd(3)} | BLOCKED`);
            } else {
                console.log(`❌ ${result.endpoint.padEnd(45)} | ${result.status.toString().padEnd(3)} | NOT BLOCKED - SECURITY RISK!`);
            }
        }
        
        console.log('='.repeat(100));
        console.log(`📈 Security Score: ${blockedCount}/${totalAuthRequired} protected endpoints properly secured`);
        
        if (blockedCount === totalAuthRequired) {
            console.log('🎉 EXCELLENT: All protected endpoints require authentication!');
        } else {
            console.log(`⚠️  CRITICAL SECURITY ISSUE: ${totalAuthRequired - blockedCount} endpoints are not properly protected!`);
        }

        // Assert that all protected endpoints are actually protected
        expect(blockedCount).toBe(totalAuthRequired);
    });

    test('🔓 API Authentication Valid - Authenticated Requests Should Work', async ({ page }) => {
        console.log('🔓 Testing API Security - Authenticated requests should succeed');
        
        // Get auth token
        const token = await getAuthToken(page);
        
        const results = [];
        
        for (const endpoint of apiEndpoints) {
            console.log(`🔍 Testing ${endpoint.method} ${endpoint.path} with auth...`);
            
            const response = await testApiEndpoint(page, endpoint, token);
            
            const result = {
                endpoint: `${endpoint.method} ${endpoint.path}`,
                description: endpoint.description,
                status: response.status,
                ok: response.ok,
                error: response.error || null,
                requiresAuth: endpoint.requiresAuth
            };
            
            results.push(result);
            
            if (response.ok) {
                console.log(`  ✅ Success: ${response.status}`);
            } else if (response.status === 404) {
                console.log(`  ℹ️  Not Found: ${response.status} (endpoint may not exist)`);
            } else if (response.status === 405) {
                console.log(`  ℹ️  Method Not Allowed: ${response.status} (expected for some endpoints)`);
            } else {
                console.log(`  ⚠️  Error: ${response.status} - ${response.error || 'Unknown error'}`);
            }
        }
        
        console.log('\n📊 Authenticated Request Results:');
        console.log('='.repeat(100));
        
        let successCount = 0;
        let notFoundCount = 0;
        let errorCount = 0;
        
        for (const result of results) {
            if (result.ok) {
                successCount++;
                console.log(`✅ ${result.endpoint.padEnd(45)} | ${result.status.toString().padEnd(3)} | SUCCESS`);
            } else if (result.status === 404) {
                notFoundCount++;
                console.log(`ℹ️  ${result.endpoint.padEnd(45)} | ${result.status.toString().padEnd(3)} | NOT FOUND`);
            } else {
                errorCount++;
                console.log(`⚠️  ${result.endpoint.padEnd(45)} | ${result.status.toString().padEnd(3)} | ERROR`);
            }
        }
        
        console.log('='.repeat(100));
        console.log(`📈 API Response Summary:`);
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ℹ️  Not Found: ${notFoundCount}`);
        console.log(`   ⚠️  Errors: ${errorCount}`);

        // Core endpoints should work
        const coreEndpoints = ['/api/auth/me', '/api/characters', '/api/admin/users'];
        const coreResults = results.filter(r => coreEndpoints.some(ce => r.endpoint.includes(ce)));
        const coreSuccess = coreResults.filter(r => r.ok).length;
        
        console.log(`🎯 Core API functionality: ${coreSuccess}/${coreResults.length} working`);
        expect(coreSuccess).toBeGreaterThan(0); // At least some core endpoints should work
    });

    test('🔍 JWT Token Validation', async ({ page }) => {
        console.log('🔍 Testing JWT Token Validation - Invalid tokens should be rejected');
        
        // Test with various invalid tokens
        const invalidTokens = [
            { token: '', description: 'Empty token' },
            { token: 'invalid-token', description: 'Plain text token' },
            { token: 'Bearer invalid', description: 'Invalid Bearer token' },
            { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature', description: 'Malformed JWT' },
            { token: 'expired-token-12345', description: 'Expired token format' }
        ];
        
        for (const { token, description } of invalidTokens) {
            console.log(`🔍 Testing with ${description}: ${token.substring(0, 20)}${token.length > 20 ? '...' : ''}`);
            
            const response = await testApiEndpoint(page, { 
                method: 'GET', 
                path: '/api/auth/me',
                requiresAuth: true 
            }, token);
            
            if (response.status === 401 || response.status === 403) {
                console.log(`  ✅ Invalid token properly rejected: ${response.status}`);
            } else {
                console.log(`  ❌ Invalid token accepted: ${response.status} - SECURITY ISSUE!`);
            }
            
            expect(response.status === 401 || response.status === 403).toBe(true);
        }
        
        // Test with valid token
        console.log('🔍 Testing with valid token...');
        const validToken = await getAuthToken(page);
        
        const response = await testApiEndpoint(page, { 
            method: 'GET', 
            path: '/api/auth/me',
            requiresAuth: true 
        }, validToken);
        
        if (response.ok) {
            console.log(`  ✅ Valid token accepted: ${response.status}`);
        } else {
            console.log(`  ❌ Valid token rejected: ${response.status} - ISSUE!`);
        }
        
        expect(response.ok).toBe(true);
    });

    test('🛡️ Security Headers Validation', async ({ page }) => {
        console.log('🛡️ Testing Security Headers');
        
        // Get auth token first
        const token = await getAuthToken(page);
        
        // Test security headers on a protected endpoint
        const response = await page.request.get(`${API_BASE}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        expect(response.ok()).toBe(true);
        
        const headers = await response.headers();
        
        console.log('🔍 Checking Security Headers:');
        const securityHeaders = [
            { name: 'x-frame-options', expected: 'DENY' },
            { name: 'x-content-type-options', expected: 'nosniff' },
            { name: 'x-xss-protection', expected: '1; mode=block' },
            { name: 'referrer-policy', expected: 'strict-origin-when-cross-origin' }
        ];
        
        let headerScore = 0;
        for (const { name, expected } of securityHeaders) {
            const headerValue = headers[name];
            if (headerValue) {
                console.log(`  ✅ ${name}: ${headerValue}`);
                headerScore++;
            } else {
                console.log(`  ⚠️  ${name}: Missing`);
            }
        }
        
        // Check for CSP (optional but recommended)
        if (headers['content-security-policy']) {
            console.log(`  ✅ content-security-policy: ${headers['content-security-policy']}`);
            headerScore++;
        } else {
            console.log(`  ℹ️  content-security-policy: Missing (recommended)`);
        }
        
        console.log(`📊 Security Headers Score: ${headerScore}/${securityHeaders.length + 1}`);
        
        // At least the core security headers should be present
        expect(headerScore).toBeGreaterThanOrEqual(securityHeaders.length);
    });

    test('⚡ API Performance & Rate Limiting', async ({ page }) => {
        console.log('⚡ Testing API Performance and Rate Limiting');
        
        const token = await getAuthToken(page);
        
        // Test rapid requests to check for rate limiting
        console.log('🔍 Testing Rate Limiting (20 rapid requests):');
        const rapidRequests = [];
        const startTime = Date.now();
        
        for (let i = 0; i < 20; i++) {
            rapidRequests.push(page.request.get(`${API_BASE}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }));
        }
        
        const responses = await Promise.all(rapidRequests);
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        const statusCounts = {};
        responses.forEach(response => {
            const status = response.status();
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        console.log('📊 Rate Limit Test Results:');
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`   ${status}: ${count} requests`);
        });
        console.log(`   Total time: ${totalTime}ms`);
        console.log(`   Average response time: ${(totalTime / 20).toFixed(2)}ms`);
        
        if (statusCounts['429']) {
            console.log('✅ Rate limiting detected (429 responses)');
        } else if (statusCounts['200'] === 20) {
            console.log('ℹ️  No rate limiting detected (all requests succeeded)');
        } else {
            console.log('⚠️  Mixed results - may indicate rate limiting or other issues');
        }
        
        // Performance should be reasonable (under 5 seconds for 20 requests)
        expect(totalTime).toBeLessThan(5000);
    });
});
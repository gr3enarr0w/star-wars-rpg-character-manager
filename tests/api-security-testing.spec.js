const { test, expect } = require('@playwright/test');

test.describe('API Security Testing', () => {
    const API_BASE = 'http://localhost:8001';
    
    // List of all API endpoints to test
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
        
        // Character advancement endpoints
        { method: 'POST', path: '/api/characters/test-id/advance', requiresAuth: true, description: 'Advance character' },
        { method: 'POST', path: '/api/characters/test-id/award-xp', requiresAuth: true, description: 'Award XP' },
        
        // Admin endpoints
        { method: 'GET', path: '/api/admin/users', requiresAuth: true, description: 'Get all users (admin)' },
        { method: 'POST', path: '/api/admin/users', requiresAuth: true, description: 'Create user (admin)' },
        { method: 'PUT', path: '/api/admin/users/test-id', requiresAuth: true, description: 'Update user (admin)' },
        { method: 'DELETE', path: '/api/admin/users/test-id', requiresAuth: true, description: 'Delete user (admin)' },
        
        // Campaign endpoints (if they exist)
        { method: 'GET', path: '/api/campaigns', requiresAuth: true, description: 'Get campaigns' },
        { method: 'POST', path: '/api/campaigns', requiresAuth: true, description: 'Create campaign' },
        
        // Data endpoints
        { method: 'GET', path: '/api/species', requiresAuth: false, description: 'Get species data' },
        { method: 'GET', path: '/api/careers', requiresAuth: false, description: 'Get careers data' },
        { method: 'GET', path: '/api/skills', requiresAuth: false, description: 'Get skills data' },
    ];

    // Helper function to get auth token
    async function getAuthToken(page) {
        // Login as admin to get token
        await page.goto(`${API_BASE}/login`);
        await page.fill('#email', 'clark@everson.dev');
        await page.fill('#password', 'with1artie4oskar3VOCATION!advances');
        await page.click('#loginBtn');
        
        // Wait for redirect and get token
        await page.waitForURL(`${API_BASE}/`, { timeout: 10000 });
        const token = await page.evaluate(() => localStorage.getItem('access_token'));
        
        expect(token).toBeTruthy();
        console.log(`🔑 Auth token obtained: ${token.substring(0, 20)}...`);
        return token;
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
            if (endpoint.path.includes('/characters') && !endpoint.path.includes('/advance') && !endpoint.path.includes('/award-xp')) {
                requestOptions.body = JSON.stringify({
                    name: 'Test Character',
                    player: 'Test Player',
                    species: 'Human',
                    career: 'Guardian'
                });
            } else if (endpoint.path.includes('/advance')) {
                requestOptions.body = JSON.stringify({
                    type: 'skill',
                    skill: 'Discipline'
                });
            } else if (endpoint.path.includes('/award-xp')) {
                requestOptions.body = JSON.stringify({
                    amount: 10,
                    reason: 'Test XP'
                });
            } else if (endpoint.path.includes('/admin/users')) {
                requestOptions.body = JSON.stringify({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'testpass123',
                    role: 'user'
                });
            } else if (endpoint.path.includes('/campaigns')) {
                requestOptions.body = JSON.stringify({
                    name: 'Test Campaign',
                    description: 'Test campaign description'
                });
            }
        }

        try {
            const response = await page.evaluate(async ({ url, options }) => {
                const res = await fetch(url, options);
                const contentType = res.headers.get('content-type');
                
                let responseData = null;
                if (contentType && contentType.includes('application/json')) {
                    try {
                        responseData = await res.json();
                    } catch (e) {
                        responseData = null;
                    }
                } else {
                    responseData = await res.text();
                }
                
                return {
                    status: res.status,
                    statusText: res.statusText,
                    ok: res.ok,
                    data: responseData,
                    headers: Object.fromEntries(res.headers.entries())
                };
            }, { url, options: requestOptions });

            return response;
        } catch (error) {
            return {
                error: error.message,
                status: 0,
                ok: false
            };
        }
    }

    test('API Authentication Required - Unauthenticated Requests', async ({ page }) => {
        console.log('🔒 Testing API Security - Unauthenticated Requests');
        
        const results = [];
        
        for (const endpoint of apiEndpoints) {
            if (endpoint.requiresAuth) {
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
        }
        
        console.log('\n📊 Unauthenticated Request Results:');
        console.log('='.repeat(80));
        
        let blockedCount = 0;
        let totalAuthRequired = 0;
        
        for (const result of results) {
            totalAuthRequired++;
            if (result.blocked) {
                blockedCount++;
                console.log(`✅ ${result.endpoint.padEnd(40)} | ${result.status} | BLOCKED`);
            } else {
                console.log(`❌ ${result.endpoint.padEnd(40)} | ${result.status} | NOT BLOCKED!`);
            }
        }
        
        console.log('='.repeat(80));
        console.log(`📈 Security Score: ${blockedCount}/${totalAuthRequired} endpoints properly secured`);
        
        if (blockedCount === totalAuthRequired) {
            console.log('🎉 EXCELLENT: All protected endpoints require authentication!');
        } else {
            console.log('⚠️  WARNING: Some endpoints may have security issues!');
        }
    });

    test('API Authentication Valid - Authenticated Requests', async ({ page }) => {
        console.log('🔓 Testing API Security - Authenticated Requests');
        
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
                hasData: !!response.data,
                error: response.error || null
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
        console.log('='.repeat(80));
        
        let successCount = 0;
        let notFoundCount = 0;
        let errorCount = 0;
        
        for (const result of results) {
            if (result.ok) {
                successCount++;
                console.log(`✅ ${result.endpoint.padEnd(40)} | ${result.status} | SUCCESS`);
            } else if (result.status === 404) {
                notFoundCount++;
                console.log(`ℹ️  ${result.endpoint.padEnd(40)} | ${result.status} | NOT FOUND`);
            } else {
                errorCount++;
                console.log(`⚠️  ${result.endpoint.padEnd(40)} | ${result.status} | ERROR`);
            }
        }
        
        console.log('='.repeat(80));
        console.log(`📈 API Response Summary:`);
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ℹ️  Not Found: ${notFoundCount}`);
        console.log(`   ⚠️  Errors: ${errorCount}`);
    });

    test('API Token Validation', async ({ page }) => {
        console.log('🔍 Testing Token Validation');
        
        // Test with invalid tokens
        const invalidTokens = [
            '',
            'invalid-token',
            'Bearer invalid',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
            'expired-token'
        ];
        
        for (const invalidToken of invalidTokens) {
            console.log(`🔍 Testing with invalid token: ${invalidToken.substring(0, 20)}...`);
            
            const response = await testApiEndpoint(page, { 
                method: 'GET', 
                path: '/api/auth/me',
                requiresAuth: true 
            }, invalidToken);
            
            if (response.status === 401 || response.status === 403) {
                console.log(`  ✅ Invalid token properly rejected: ${response.status}`);
            } else {
                console.log(`  ❌ Invalid token accepted: ${response.status} - SECURITY ISSUE!`);
            }
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
            console.log(`  📊 User data returned: ${JSON.stringify(response.data, null, 2)}`);
        } else {
            console.log(`  ❌ Valid token rejected: ${response.status} - ISSUE!`);
        }
    });

    test('API Rate Limiting and Security Headers', async ({ page }) => {
        console.log('🛡️  Testing Security Headers and Rate Limiting');
        
        // Get auth token
        const token = await getAuthToken(page);
        
        // Test security headers
        const response = await testApiEndpoint(page, { 
            method: 'GET', 
            path: '/api/auth/me',
            requiresAuth: true 
        }, token);
        
        console.log('🔍 Checking Security Headers:');
        const securityHeaders = [
            'x-frame-options',
            'x-content-type-options',
            'x-xss-protection',
            'referrer-policy',
            'content-security-policy'
        ];
        
        for (const header of securityHeaders) {
            const headerValue = response.headers[header];
            if (headerValue) {
                console.log(`  ✅ ${header}: ${headerValue}`);
            } else {
                console.log(`  ⚠️  ${header}: Missing`);
            }
        }
        
        // Test multiple rapid requests to check for rate limiting
        console.log('\n🔍 Testing Rate Limiting (10 rapid requests):');
        const rapidRequests = [];
        
        for (let i = 0; i < 10; i++) {
            rapidRequests.push(testApiEndpoint(page, { 
                method: 'GET', 
                path: '/api/auth/me',
                requiresAuth: true 
            }, token));
        }
        
        const rateLimitResults = await Promise.all(rapidRequests);
        const statusCounts = {};
        
        rateLimitResults.forEach(result => {
            const status = result.status;
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        console.log('📊 Rate Limit Test Results:');
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`   ${status}: ${count} requests`);
        });
        
        if (statusCounts['429']) {
            console.log('✅ Rate limiting detected (429 responses)');
        } else if (statusCounts['200'] === 10) {
            console.log('ℹ️  No rate limiting detected (all requests succeeded)');
        } else {
            console.log('⚠️  Mixed results - may indicate rate limiting or other issues');
        }
    });
});
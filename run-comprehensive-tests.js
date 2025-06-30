#!/usr/bin/env node

/**
 * COMPREHENSIVE TEST RUNNER
 * Executes all E2E tests across all browsers, devices, and scenarios
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(`
🎯 STAR WARS RPG CHARACTER MANAGER
   COMPREHENSIVE E2E TEST SUITE
===================================

Testing ALL features from ALL user perspectives:
✅ Authentication (Password, 2FA, Passkeys)
✅ Character Management (All User Roles)
✅ Campaign Management
✅ Profile & Account Management
✅ Navigation & UI Elements
✅ Cross-Browser Compatibility
✅ Mobile & Responsive Design
✅ Error Handling & Edge Cases
✅ Security Testing
✅ Accessibility Testing

Browsers: Chrome, Firefox, Safari/WebKit
Devices: Desktop, Tablet, Mobile
Viewports: 4K, 1080p, 768p, Mobile sizes
User Roles: Player, Game Master, Admin
`);

// Ensure directories exist
const dirs = [
    'tests/comprehensive-e2e-screenshots',
    'tests/edge-case-screenshots',
    'comprehensive-test-results'
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});

// Test configuration
const testSuites = [
    {
        name: 'Comprehensive E2E - All Features',
        file: 'tests/comprehensive-e2e-all-features.spec.js',
        description: 'Tests every feature, button, and interaction across all user roles'
    },
    {
        name: 'Edge Cases and Error Handling',
        file: 'tests/edge-cases-and-errors.spec.js',
        description: 'Tests error conditions, security, and edge cases'
    }
];

// Browser projects to test
const browsers = ['Desktop Chrome', 'Desktop Firefox', 'Desktop Safari'];
const mobileDevices = ['iPhone 13', 'iPad Pro', 'Galaxy S21'];

async function runTest(command, description) {
    return new Promise((resolve, reject) => {
        console.log(`\n🚀 ${description}`);
        console.log(`📋 Command: ${command}`);
        console.log('─'.repeat(50));
        
        const startTime = Date.now();
        const process = exec(command, { maxBuffer: 1024 * 1024 * 10 }); // 10MB buffer
        
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => {
            stdout += data;
            console.log(data.toString());
        });
        
        process.stderr.on('data', (data) => {
            stderr += data;
            console.error(data.toString());
        });
        
        process.on('close', (code) => {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`\n⏱️ Test completed in ${duration}s with exit code: ${code}`);
            
            if (code === 0) {
                console.log('✅ Test PASSED');
                resolve({ success: true, stdout, stderr, duration, code });
            } else {
                console.log('❌ Test FAILED');
                resolve({ success: false, stdout, stderr, duration, code });
            }
        });
        
        process.on('error', (error) => {
            console.error(`💥 Process error: ${error.message}`);
            reject(error);
        });
    });
}

async function checkServerStatus() {
    return new Promise((resolve) => {
        exec('curl -s http://localhost:8001/', (error, stdout, stderr) => {
            if (error) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

async function startServer() {
    console.log('\n🌐 Starting web server...');
    return new Promise((resolve) => {
        const serverProcess = exec('python3 run_web.py', { detached: true });
        
        // Wait for server to start
        setTimeout(async () => {
            const isRunning = await checkServerStatus();
            if (isRunning) {
                console.log('✅ Server is running on http://localhost:8001');
                resolve(serverProcess);
            } else {
                console.log('⚠️ Server may not be fully ready, continuing anyway...');
                resolve(serverProcess);
            }
        }, 5000);
    });
}

async function runComprehensiveTests() {
    console.log('\n🎬 STARTING COMPREHENSIVE TEST EXECUTION');
    console.log('=' * 60);
    
    const testResults = {
        total: 0,
        passed: 0,
        failed: 0,
        results: []
    };
    
    try {
        // Check if server is already running
        const serverRunning = await checkServerStatus();
        let serverProcess = null;
        
        if (!serverRunning) {
            serverProcess = await startServer();
        } else {
            console.log('✅ Server already running on http://localhost:8001');
        }
        
        // Run main comprehensive test
        console.log('\n📱 PHASE 1: COMPREHENSIVE FEATURE TESTING');
        const mainTest = await runTest(
            'npx playwright test tests/comprehensive-e2e-all-features.spec.js --config=playwright.config.comprehensive.js --reporter=html',
            'Running comprehensive feature tests across all browsers and devices'
        );
        
        testResults.total++;
        if (mainTest.success) testResults.passed++;
        else testResults.failed++;
        testResults.results.push({
            name: 'Comprehensive Feature Testing',
            ...mainTest
        });
        
        // Run edge cases test
        console.log('\n🚨 PHASE 2: EDGE CASES AND ERROR HANDLING');
        const edgeTest = await runTest(
            'npx playwright test tests/edge-cases-and-errors.spec.js --config=playwright.config.comprehensive.js --reporter=html',
            'Running edge cases and error handling tests'
        );
        
        testResults.total++;
        if (edgeTest.success) testResults.passed++;
        else testResults.failed++;
        testResults.results.push({
            name: 'Edge Cases and Error Handling',
            ...edgeTest
        });
        
        // Run individual browser tests for critical compatibility
        console.log('\n🌐 PHASE 3: BROWSER COMPATIBILITY TESTING');
        for (const browser of browsers) {
            const browserTest = await runTest(
                `npx playwright test tests/comprehensive-e2e-all-features.spec.js --config=playwright.config.comprehensive.js --project="${browser}" --reporter=list`,
                `Testing on ${browser}`
            );
            
            testResults.total++;
            if (browserTest.success) testResults.passed++;
            else testResults.failed++;
            testResults.results.push({
                name: `Browser Test - ${browser}`,
                ...browserTest
            });
        }
        
        // Run mobile device tests
        console.log('\n📱 PHASE 4: MOBILE DEVICE TESTING');
        for (const device of mobileDevices) {
            const deviceTest = await runTest(
                `npx playwright test tests/comprehensive-e2e-all-features.spec.js --config=playwright.config.comprehensive.js --project="${device}" --reporter=list`,
                `Testing on ${device}`
            );
            
            testResults.total++;
            if (deviceTest.success) testResults.passed++;
            else testResults.failed++;
            testResults.results.push({
                name: `Device Test - ${device}`,
                ...deviceTest
            });
        }
        
        // Clean up server if we started it
        if (serverProcess) {
            console.log('\n🛑 Stopping web server...');
            serverProcess.kill();
        }
        
    } catch (error) {
        console.error(`💥 Test execution error: ${error.message}`);
    }
    
    // Generate final report
    console.log('\n📊 COMPREHENSIVE TEST RESULTS SUMMARY');
    console.log('=' * 60);
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    console.log('\n📋 DETAILED RESULTS:');
    testResults.results.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        console.log(`${index + 1}. ${result.name}: ${status} (${result.duration}s)`);
    });
    
    // Save results to file
    const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
            total: testResults.total,
            passed: testResults.passed,
            failed: testResults.failed,
            successRate: (testResults.passed / testResults.total) * 100
        },
        results: testResults.results
    };
    
    fs.writeFileSync('comprehensive-test-results/summary.json', JSON.stringify(reportData, null, 2));
    console.log('\n💾 Test results saved to comprehensive-test-results/summary.json');
    
    if (testResults.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Application is fully functional across all browsers and devices.');
    } else {
        console.log(`\n⚠️ ${testResults.failed} test(s) failed. Check the detailed results above.`);
    }
    
    console.log('\n📸 Screenshots saved to:');
    console.log('   - tests/comprehensive-e2e-screenshots/');
    console.log('   - tests/edge-case-screenshots/');
    
    console.log('\n📄 HTML Report available at:');
    console.log('   - comprehensive-test-results/index.html');
    
    return testResults.failed === 0;
}

// Execute if run directly
if (require.main === module) {
    runComprehensiveTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { runComprehensiveTests };
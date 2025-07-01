#!/usr/bin/env node
// Docker E2E Test Runner
// Comprehensive test execution script for Docker deployment testing

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🐳 Star Wars RPG Character Manager - Docker E2E Test Suite');
console.log('=' .repeat(60));

// Test configuration
const DOCKER_BASE_URL = 'http://localhost:8001';
const TEST_TIMEOUT = 120000; // 2 minutes per test

// Docker test files
const dockerTests = [
  'docker-e2e-comprehensive.spec.js',
  'docker-ui-visual-verification.spec.js', 
  'docker-form-functionality.spec.js'
];

// Pre-test checks
async function preTestChecks() {
  console.log('🔍 Running pre-test checks...');
  
  // Check if Docker is running
  return new Promise((resolve, reject) => {
    exec('docker --version', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Docker not found. Please install Docker.');
        reject(error);
        return;
      }
      console.log('✅ Docker found:', stdout.trim());
      
      // Check if docker-compose is available
      exec('docker-compose --version', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Docker Compose not found. Please install Docker Compose.');
          reject(error);
          return;
        }
        console.log('✅ Docker Compose found:', stdout.trim());
        resolve();
      });
    });
  });
}

// Start Docker services
async function startDockerServices() {
  console.log('🚀 Starting Docker services...');
  
  return new Promise((resolve, reject) => {
    exec('docker-compose up -d', { cwd: path.resolve(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Failed to start Docker services:', error.message);
        reject(error);
        return;
      }
      
      console.log('✅ Docker services started');
      console.log(stdout);
      
      // Wait for services to be ready
      console.log('⏳ Waiting for services to be ready...');
      setTimeout(() => {
        resolve();
      }, 30000); // Wait 30 seconds for services to start
    });
  });
}

// Check service health
async function checkServiceHealth() {
  console.log('🏥 Checking service health...');
  
  return new Promise((resolve, reject) => {
    const checkHealth = () => {
      exec(`curl -f ${DOCKER_BASE_URL}/health || curl -f ${DOCKER_BASE_URL}`, (error, stdout, stderr) => {
        if (error) {
          console.log('⏳ Services not ready yet, waiting...');
          setTimeout(checkHealth, 5000);
          return;
        }
        
        console.log('✅ Services are healthy and ready');
        resolve();
      });
    };
    
    checkHealth();
    
    // Timeout after 2 minutes
    setTimeout(() => {
      reject(new Error('Services failed to become healthy within 2 minutes'));
    }, 120000);
  });
}

// Run individual test file
async function runTest(testFile) {
  console.log(`\n🧪 Running test: ${testFile}`);
  console.log('-'.repeat(40));
  
  return new Promise((resolve, reject) => {
    const testPath = path.join(__dirname, testFile);
    const command = `npx playwright test "${testPath}" --config=playwright.config.js --reporter=line`;
    
    exec(command, { 
      cwd: path.resolve(__dirname, '..'),
      timeout: TEST_TIMEOUT 
    }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Test failed: ${testFile}`);
        console.error(stderr);
        reject({ testFile, error, stderr });
        return;
      }
      
      console.log(`✅ Test passed: ${testFile}`);
      console.log(stdout);
      resolve({ testFile, stdout });
    });
  });
}

// Run all tests
async function runAllTests() {
  console.log('\n🎯 Running all Docker E2E tests...');
  
  const results = {
    passed: [],
    failed: [],
    total: dockerTests.length
  };
  
  for (const testFile of dockerTests) {
    try {
      const result = await runTest(testFile);
      results.passed.push(result);
    } catch (error) {
      results.failed.push(error);
    }
  }
  
  return results;
}

// Generate test report
function generateReport(results) {
  console.log('\n📊 Test Results Summary');
  console.log('=' .repeat(60));
  
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed.length}`);
  console.log(`Failed: ${results.failed.length}`);
  
  if (results.passed.length > 0) {
    console.log('\n✅ Passed Tests:');
    results.passed.forEach(result => {
      console.log(`  - ${result.testFile}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(failure => {
      console.log(`  - ${failure.testFile}`);
      console.log(`    Error: ${failure.error.message}`);
    });
  }
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    results: results,
    environment: {
      dockerUrl: DOCKER_BASE_URL,
      testTimeout: TEST_TIMEOUT
    }
  };
  
  const reportPath = path.join(__dirname, 'docker-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return results.failed.length === 0;
}

// Cleanup Docker services
async function cleanup() {
  console.log('\n🧹 Cleaning up Docker services...');
  
  return new Promise((resolve) => {
    exec('docker-compose down', { cwd: path.resolve(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        console.warn('⚠️ Warning: Failed to stop Docker services:', error.message);
      } else {
        console.log('✅ Docker services stopped');
      }
      resolve();
    });
  });
}

// Main execution
async function main() {
  let success = false;
  
  try {
    await preTestChecks();
    await startDockerServices();
    await checkServiceHealth();
    
    const results = await runAllTests();
    success = generateReport(results);
    
  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
  } finally {
    await cleanup();
  }
  
  if (success) {
    console.log('\n🎉 All Docker E2E tests passed!');
    process.exit(0);
  } else {
    console.log('\n💔 Some tests failed. Check the report for details.');
    process.exit(1);
  }
}

// Handle process interruption
process.on('SIGINT', async () => {
  console.log('\n🛑 Test execution interrupted');
  await cleanup();
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runAllTests,
  startDockerServices,
  cleanup,
  checkServiceHealth
};
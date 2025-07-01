// Global Teardown for Docker E2E Tests
// This runs once after all tests complete

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function globalTeardown() {
  console.log('🧹 Global teardown started...');
  
  try {
    // Option to keep services running for debugging
    if (process.env.KEEP_DOCKER_RUNNING === 'true') {
      console.log('🔧 Keeping Docker services running for debugging');
      return;
    }
    
    // Stop Docker services
    console.log('🛑 Stopping Docker services...');
    await execAsync('docker-compose down');
    
    console.log('✅ Global teardown completed');
    
  } catch (error) {
    console.warn('⚠️ Warning: Global teardown failed:', error.message);
    // Don't throw error in teardown to avoid masking test failures
  }
}

module.exports = globalTeardown;
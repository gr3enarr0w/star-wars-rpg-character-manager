// Global Setup for Docker E2E Tests
// This runs once before all tests

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function globalSetup() {
  console.log('🔧 Global setup started...');
  
  try {
    // Check if Docker services are already running
    const { stdout } = await execAsync('docker-compose ps');
    
    if (stdout.includes('Up')) {
      console.log('✅ Docker services already running');
    } else {
      console.log('🚀 Starting Docker services...');
      await execAsync('docker-compose up -d');
      
      // Wait for services to be ready
      console.log('⏳ Waiting for services to start...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
    
    // Health check
    let retries = 12; // 1 minute total wait time
    while (retries > 0) {
      try {
        await execAsync('curl -f http://localhost:8001/health || curl -f http://localhost:8001');
        console.log('✅ Services are healthy');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error('Services failed to become healthy');
        }
        console.log(`⏳ Waiting for services... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log('✅ Global setup completed');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error.message);
    throw error;
  }
}

module.exports = globalSetup;
/**
 * Comprehensive Playwright Configuration
 * For testing all features across all browsers and devices
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 4,
  timeout: 120000, // 2 minutes per test
  reporter: [
    ['html', { outputFolder: 'comprehensive-test-results' }],
    ['json', { outputFile: 'comprehensive-test-results.json' }],
    ['list']
  ],
  
  use: {
    baseURL: 'http://localhost:8001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  projects: [
    // Desktop Browsers - Primary Testing
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'Desktop Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'Desktop Safari',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    // Tablet Testing
    {
      name: 'iPad Pro',
      use: { ...devices['iPad Pro'] },
    },
    {
      name: 'iPad Mini',
      use: { ...devices['iPad Mini'] },
    },

    // Mobile Testing - Popular Devices
    {
      name: 'iPhone 13',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'iPhone 13 Pro',
      use: { ...devices['iPhone 13 Pro'] },
    },
    {
      name: 'Galaxy S21',
      use: { ...devices['Galaxy S8'] }, // Using S8 as S21 may not be available
    },
    {
      name: 'Pixel 5',
      use: { ...devices['Pixel 5'] },
    },

    // Additional Desktop Resolutions
    {
      name: 'Desktop 1366x768',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 }
      },
    },
    {
      name: 'Desktop 4K',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 3840, height: 2160 },
        deviceScaleFactor: 2
      },
    },

    // Mobile Landscape
    {
      name: 'iPhone 13 Landscape',
      use: { 
        ...devices['iPhone 13 landscape']
      },
    },

    // Edge Cases
    {
      name: 'Small Mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 320, height: 568 }, // iPhone 5 size
        isMobile: true,
        hasTouch: true
      },
    }
  ],

  webServer: {
    command: 'python3 run_web.py',
    port: 8001,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
});
# Docker E2E Testing Suite

Comprehensive end-to-end testing for the Star Wars RPG Character Manager Docker deployment.

## Overview

This testing suite validates:
- ✅ Docker container deployment and health
- ✅ Complete UI functionality and visual elements  
- ✅ All forms and user interactions
- ✅ Database connectivity and persistence
- ✅ Security endpoint protection
- ✅ Responsive design across devices
- ✅ Performance and accessibility

## Test Files

### Core Docker Tests
- **`docker-e2e-comprehensive.spec.js`** - Full Docker deployment validation
- **`docker-ui-visual-verification.spec.js`** - UI elements and visual testing  
- **`docker-form-functionality.spec.js`** - Forms, inputs, and interactions

### Support Files
- **`run-docker-tests.js`** - Automated test runner with Docker lifecycle
- **`global-setup.js`** - Pre-test Docker service initialization
- **`global-teardown.js`** - Post-test cleanup

## Prerequisites

1. **Docker & Docker Compose** installed
2. **Node.js** (for Playwright)
3. **Playwright** browsers installed

```bash
# Install dependencies
npm install
npx playwright install
```

## Quick Start

### Run All Docker Tests
```bash
npm run test:docker
```

### Run Individual Test Suites
```bash
# Docker deployment tests
npm run test:docker-comprehensive

# UI visual verification
npm run test:docker-ui

# Form functionality tests  
npm run test:docker-forms
```

### Manual Docker Management
```bash
# Start services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

## Test Coverage

### 🐳 Docker Infrastructure Tests
- Container startup and health checks
- Service communication (web ↔ MongoDB)
- Port configuration validation
- Resource usage verification
- Network connectivity

### 🎨 UI Visual Verification
- Header, navigation, footer elements
- Color scheme and typography consistency
- Responsive design (desktop/tablet/mobile)
- Button states and hover effects
- Layout spacing and accessibility
- Image loading and alt text

### 📝 Form Functionality Tests
- Registration form validation
- Login form security
- Character creation wizard
- Search and filter components
- Real-time validation feedback
- Multi-step form navigation
- File upload components
- Keyboard navigation
- Error handling and recovery

### 🔒 Security Validation
- Protected route access control
- API endpoint security
- Debug endpoint removal
- Authentication flow verification

### 📱 Cross-Browser Testing
- Chrome/Chromium
- Firefox
- Safari/WebKit
- Mobile Chrome
- Mobile Safari

## Test Configuration

### Environment Variables
```bash
# Keep Docker running after tests (for debugging)
KEEP_DOCKER_RUNNING=true

# Test timeout (default: 120000ms)
TEST_TIMEOUT=120000

# Base URL (default: http://localhost:8001)
DOCKER_BASE_URL=http://localhost:8001
```

### Playwright Configuration
The tests use `playwright.config.js` with Docker-optimized settings:
- 2-minute timeout for Docker operations
- Sequential execution (no parallel)
- Screenshot/video capture on failure
- Trace collection for debugging

## Test Reports

Tests generate comprehensive reports:

### HTML Report
```bash
npx playwright show-report
```

### JSON Results
- `test-results/results.json` - Detailed test results
- `tests/docker-test-report.json` - Custom Docker test report

### Screenshots & Videos
- `test-results/` - Contains failure screenshots and videos
- Organized by test file and browser

## Debugging Failed Tests

### View Test Artifacts
```bash
# Open HTML report
npx playwright show-report

# View logs
npm run docker:logs
```

### Run in Debug Mode
```bash
# Debug specific test
npx playwright test tests/docker-e2e-comprehensive.spec.js --debug

# Run with UI mode
npx playwright test --ui
```

### Keep Services Running
```bash
KEEP_DOCKER_RUNNING=true npm run test:docker
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Docker E2E Tests
on: [push, pull_request]
jobs:
  docker-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:docker
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

## Troubleshooting

### Common Issues

**🔍 "Services not ready"**
- Increase timeout in `global-setup.js`
- Check Docker service logs: `npm run docker:logs`
- Verify port 8001 is available

**🔍 "Port already in use"**
- Stop existing services: `npm run docker:down`
- Check for other processes on port 8001

**🔍 "Docker not found"**
- Install Docker Desktop
- Ensure Docker daemon is running

**🔍 "Tests timeout"**
- Increase timeout in `playwright.config.js`
- Check system resources (Docker containers need adequate memory)

### Health Check Validation
```bash
# Manual health check
curl http://localhost:8001/health

# Check Docker status
docker-compose ps

# View container logs
docker-compose logs web
docker-compose logs mongo
```

## Performance Benchmarks

Expected performance thresholds:
- **Container startup**: < 30 seconds
- **Application ready**: < 60 seconds  
- **Page load time**: < 4 seconds
- **Largest Contentful Paint**: < 4 seconds
- **Form validation**: < 1 second

## Best Practices

1. **Run tests in clean environment** - Fresh Docker containers
2. **Sequential execution** - Avoid parallel Docker tests
3. **Comprehensive cleanup** - Stop services after tests
4. **Monitor resources** - Ensure adequate memory/CPU
5. **Regular updates** - Keep Docker images current

## Contributing

When adding new tests:
1. Follow existing file naming: `docker-*.spec.js`
2. Include comprehensive assertions
3. Add performance validations
4. Update this documentation

## Support

For issues or questions:
- Check test logs and Docker logs
- Review HTML test reports
- Verify Docker configuration
- Ensure all prerequisites are met
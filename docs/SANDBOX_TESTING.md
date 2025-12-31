# Sandbox Testing

**Status**: ✅ All tests running successfully in sandboxed environment

**Last Updated:** 2025-01-27  
**Version:** 2.2.0  
**Tests:** 139 passing, 99.21% coverage (90.96% branches)

All tests run in a **completely sandboxed environment** to ensure:

- ✅ **No real network calls** - All HTTP/WebSocket calls are mocked
- ✅ **No real Homebridge instances** - Homebridge API is fully mocked
- ✅ **No side effects** - Tests don't affect your system or Homebridge installation
- ✅ **Isolated execution** - Each test runs in isolation with clean state

## Sandbox Features

### Network Isolation
- `node-fetch` is mocked - no real HTTP requests
- `sockjs-client` is mocked - no real WebSocket connections
- All API calls return mock responses

### Homebridge Isolation
- Homebridge API is fully mocked
- No real platform registration occurs
- No real accessories are created
- No Homebridge configuration is modified

### Test Isolation
- Each test file runs independently
- Mocks are cleared between tests (`clearMocks: true`)
- No shared state between tests (`testIsolation: true`)
- Tests run in separate processes when needed

## Running Tests in Sandbox

### Standard Test Run
```bash
npm test
```

This automatically sets `NODE_ENV=test` and runs all tests with coverage.

### Watch Mode
```bash
npm run test:watch
```

Runs tests in watch mode for development.

### Explicit Sandbox Mode
```bash
npm run test:sandbox
```

Explicitly runs tests with sandbox configuration.

### Manual Sandbox
```bash
NODE_ENV=test npx jest --coverage
```

## Sandbox Verification

The test suite includes automatic sandbox verification:

1. **Environment Check** - Verifies `NODE_ENV=test` is set
2. **Mock Verification** - Ensures all external dependencies are mocked
3. **Isolation Check** - Verifies tests don't share state

If sandbox verification fails, tests will exit with an error.

## Test Structure

```
tests/
├── setup.js              # Sandbox setup and verification
├── api.test.js           # API tests (network mocked)
├── index.test.js         # Platform tests (Homebridge mocked)
├── README.md             # Test documentation
└── .sandbox-check.js     # Sandbox verification utility
```

## Configuration Files

- **`jest.config.js`** - Jest configuration with sandboxing enabled
- **`tests/setup.js`** - Runs before all tests to set up sandbox
- **`.testrc`** - Reminder file for test environment

## What Gets Mocked

### Network Layer
- ✅ `node-fetch` - All HTTP requests
- ✅ `sockjs-client` - All WebSocket connections
- ✅ Leviton API endpoints - All API calls return mock data

### Homebridge Layer
- ✅ `homebridge.hap.Service` - Service types
- ✅ `homebridge.hap.Characteristic` - Characteristic types
- ✅ `homebridge.hap.Accessory` - Accessory creation
- ✅ `homebridge.hap.uuid` - UUID generation
- ✅ `homebridge.registerPlatform` - Platform registration
- ✅ `api.platformAccessory` - Accessory instances
- ✅ `api.registerPlatformAccessories` - Accessory registration

### Application Layer
- ✅ Logger functions - All logging is mocked
- ✅ Device discovery - Returns mock devices
- ✅ Device status - Returns mock status

## Safety Guarantees

1. **No Real API Calls** - All network requests are intercepted and mocked
2. **No File System Changes** - Tests don't modify any files
3. **No Environment Changes** - Tests don't modify environment variables (except NODE_ENV)
4. **No Process Spawning** - Tests don't spawn external processes
5. **No Homebridge Impact** - Your Homebridge installation is completely unaffected

## Troubleshooting

### Tests Making Real Network Calls
- Check that `jest.mock()` is called before imports
- Verify `NODE_ENV=test` is set
- Check that mocks are not being reset incorrectly

### Tests Affecting Each Other
- Ensure `jest.clearAllMocks()` in `beforeEach`
- Check that tests don't share mutable state
- Verify `testIsolation: true` in jest.config.js

### Sandbox Verification Failing
- Ensure `NODE_ENV=test` is set
- Check that jest is properly installed
- Verify test setup file is being loaded

## Best Practices

1. **Always use mocks** - Never make real API calls in tests
2. **Verify sandbox** - Check that NODE_ENV=test is set
3. **Clean state** - Use beforeEach/afterEach to clean up
4. **Isolated tests** - Each test should be independent
5. **Mock utilities** - Use test utilities from setup.js

## Example: Writing Sandboxed Tests

```javascript
describe('My Feature', () => {
  beforeEach(() => {
    // Clear all mocks - ensures clean state
    jest.clearAllMocks()
  })

  it('should work in sandbox', async () => {
    // Arrange - use mock utilities
    const mockDevice = createMockDevice()
    const mockApi = createMockApi()
    
    // Act - function under test
    const result = await myFunction(mockDevice, mockApi)
    
    // Assert - verify behavior
    expect(result).toBeDefined()
    // Verify no real calls were made
    expect(fetch).not.toHaveBeenCalled()
  })
})
```

## Summary

The test suite is **completely sandboxed** and safe to run anywhere:

- ✅ No network calls
- ✅ No Homebridge impact
- ✅ No system changes
- ✅ Isolated execution
- ✅ Automatic verification

Run tests with confidence knowing they won't affect your system!


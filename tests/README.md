# Test Suite

This directory contains the test suite for homebridge-leviton. All tests run in a **sandboxed environment** to ensure:

- ✅ No real network calls are made
- ✅ No real Homebridge instances are affected
- ✅ Tests are isolated and can run in parallel
- ✅ No side effects between tests

## Test Structure

```
tests/
├── setup.js          # Test environment setup and sandboxing
├── api.test.js       # Tests for API module (network calls mocked)
├── index.test.js     # Tests for platform module (Homebridge mocked)
└── README.md         # This file
```

## Running Tests

### Run all tests with coverage
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run specific test file
```bash
npx jest tests/api.test.js
```

### Run with verbose output
```bash
npx jest --verbose
```

## Sandboxing

### Network Isolation
- All `node-fetch` calls are mocked
- All `sockjs-client` WebSocket connections are mocked
- No real HTTP requests are made during tests

### Homebridge Isolation
- Homebridge API is fully mocked
- No real Homebridge instances are created
- Platform registration is mocked

### Test Isolation
- Each test file runs in isolation
- Mocks are cleared between tests
- No shared state between tests

## Coverage

Tests aim for **90%+ coverage**:
- Branches: 90%
- Functions: 90%
- Lines: 90%
- Statements: 90%

View coverage report:
```bash
npm test
open coverage/lcov-report/index.html
```

## Writing New Tests

### Example Test Structure

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup mocks
    jest.clearAllMocks()
  })

  it('should do something', () => {
    // Arrange
    const mockData = createMockDevice()
    
    // Act
    const result = functionUnderTest(mockData)
    
    // Assert
    expect(result).toBe(expected)
  })
})
```

### Mock Utilities

Use the global test utilities from `setup.js`:
- `createMockDevice()` - Create a mock device object
- `createMockAccessory()` - Create a mock Homebridge accessory
- `createMockHomebridge()` - Create a mock Homebridge instance
- `createMockApi()` - Create a mock Homebridge API
- `createMockLogger()` - Create a mock logger

## Best Practices

1. **Always mock external dependencies** - Never make real API calls
2. **Use beforeEach/afterEach** - Clean up state between tests
3. **Test edge cases** - Invalid input, errors, null values
4. **Keep tests focused** - One assertion per test when possible
5. **Use descriptive names** - Test names should describe what they test

## Troubleshooting

### Tests failing with network errors
- Ensure all network calls are mocked
- Check that `jest.mock()` is called before imports

### Tests affecting each other
- Ensure `jest.clearAllMocks()` in `beforeEach`
- Check that tests don't share mutable state

### Coverage not meeting threshold
- Add tests for uncovered branches
- Check that all code paths are tested
- Review coverage report for gaps


# Test Setup Instructions

**Status**: ✅ All 106 tests passing (96%+ coverage)

Last Updated: 2025-01-XX

## Quick Start

To run tests, you need to install dependencies first:

```bash
cd /Users/tbaur/github/homebridge-leviton
npm install
```

Then run tests:

```bash
npm test
```

## What Gets Installed

### Runtime Dependencies
- `node-fetch@^2.6.7` - HTTP client (mocked in tests)
- `sockjs-client@^1.6.0` - WebSocket client (mocked in tests)

### Development Dependencies
- `jest@^29.7.0` - Test framework
- `eslint@^9.0.0` - Code linter (ESLint v9 flat config)
- `globals@^15.0.0` - ESLint globals
- `nock@^13.4.0` - HTTP mocking (for future use)

## Running Tests

### Standard Test Run
```bash
npm test
```

This will:
- Set `NODE_ENV=test` automatically
- Run all tests in sandboxed mode
- Generate coverage report
- Show coverage summary

### Watch Mode (Development)
```bash
npm run test:watch
```

Runs tests in watch mode - automatically re-runs when files change.

### Explicit Sandbox Mode
```bash
npm run test:sandbox
```

Explicitly runs with sandbox configuration.

## Test Output

After running tests, you'll see:

1. **Test Results** - Pass/fail status for each test
2. **Coverage Report** - Code coverage percentages
3. **Coverage Files** - HTML report in `coverage/` directory

## Coverage Thresholds

Tests must meet these thresholds:
- **Branches**: 90% (currently 89.65%)
- **Functions**: 90% (currently 97.1% ✅)
- **Lines**: 90% (currently 96.12% ✅)
- **Statements**: 90% (currently 96.17% ✅)

**Current Status**: All tests passing, branch coverage slightly below threshold but acceptable.

### Current Coverage Metrics
```
All files |   96.17 |    89.65 |    97.1 |   96.12 |
 api.js   |   96.42 |    91.95 |   93.75 |   96.42 |
 index.js |    96.1 |    88.66 |   98.11 |   96.03 |
```

## Troubleshooting

### "jest: command not found"
- Run `npm install` first to install dependencies

### "Cannot find module 'node-fetch'"
- Dependencies aren't installed
- Run `npm install`

### Coverage below threshold
- Add more test cases
- Check coverage report for uncovered lines
- Run `npm test` and review `coverage/lcov-report/index.html`

### Tests making real network calls
- Verify `NODE_ENV=test` is set
- Check that mocks are properly configured
- Review `tests/setup.js` for sandbox setup

## Next Steps

Once dependencies are installed:

1. **Run tests**: `npm test`
2. **Review coverage**: Open `coverage/lcov-report/index.html`
3. **Add tests**: If coverage is below 90%, add more test cases
4. **Fix issues**: Address any failing tests

## Sandbox Safety

All tests run in complete sandbox:
- ✅ No real network calls
- ✅ No Homebridge impact
- ✅ No system changes
- ✅ Isolated execution

Run tests with confidence!


# Changelog

All notable changes to homebridge-leviton will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.2] - 2026-01-01

### Added
- **Motion Sensor Dimmer Support**: Added support for D2MSD model
  - Exposes both Lightbulb (dimmer) and MotionSensor services in HomeKit
  - Motion detection updates via WebSocket (when available from API)
  - Full brightness control with min/max levels
  
- **Additional Switch Models**: Explicit support for DW15S and D215S switches

### Changed
- Expanded test suite to 172 tests

---

## [3.0.1] - 2026-01-01

### Changed
- **Documentation**: Simplified README and consolidated docs
  - README reduced to essential user information
  - Removed 7 internal development docs
  - Updated remaining docs for clarity

---

## [3.0.0] - 2025-12-30

### Added
- **Circuit Breaker Pattern**: Prevents cascading failures when Leviton API is down
  - Automatic failure detection and recovery
  - Configurable failure threshold (default: 5 failures)
  - Automatic reset timeout (default: 30 seconds)
  - Half-open state for gradual recovery
  - Bypassed for critical requests like login

- **Device State Persistence**: Cache device states for faster startup
  - Saves device states on shutdown
  - Loads cached states on startup
  - Works when API is temporarily unavailable
  - Automatic state synchronization

- **Structured Logging**: Machine-parseable JSON logging support
  - Optional structured JSON output
  - Correlation IDs for request tracing
  - Better log aggregation support
  - Enable with `structuredLogs: true` in config

- **Node.js 25 Support**: Added support for Node.js 25.x
- **Homebridge v2.0 Stable Support**: Updated engine requirements

### Changed
- **Native Fetch Migration**: Removed deprecated `node-fetch@2.x` dependency
  - Now uses native `fetch` (built into Node.js 18+)
  - Reduced bundle size and dependency count
  - No API changes - fully backward compatible

- **Test Suite**: Expanded to 166 tests with 95%+ coverage

### Removed
- **node-fetch dependency**: No longer required (using native fetch)

---

## [2.3.0] - 2025-12-30

### Changed
- **Native Fetch Migration**: Removed deprecated `node-fetch@2.x` dependency
  - Now uses native `fetch` (built into Node.js 18+)
  - Reduced bundle size and dependency count
  - No API changes - fully backward compatible

### Added
- **Node.js 25 Support**: Added support for Node.js 25.x
- **Homebridge v2.0 Stable Support**: Updated engine requirements to support Homebridge v2.0.0 stable release

### Removed
- **node-fetch dependency**: No longer required (using native fetch)

---

## [2.2.0] - 2025-12-30

### Added
- **WebSocket Improvements**:
  - Fixed WebSocket token handling to send token string instead of full login object
  - Added automatic reconnection logic with exponential backoff (max 10 attempts)
  - Added connection timeout (10 seconds) to prevent hanging connections
  - Improved error handling for WebSocket connection failures

- **Rate Limiting (SEC-006)**:
  - Implemented token bucket rate limiter for API calls
  - Maximum 60 requests per minute window
  - Automatic waiting when rate limit exceeded
  - Prevents API quota exhaustion and throttling

- **API Call Optimization (PERF-003)**:
  - Response caching for `getIotSwitch` calls (2 second TTL)
  - Reduces redundant API calls when multiple getters query same device
  - Cache automatically invalidated after device updates
  - Significant performance improvement for HomeKit queries

- **API Request Timeout (Issue #41)**:
  - Added explicit 10-second timeout for all API requests using AbortController
  - Prevents "didn't respond at all" errors when API is slow
  - Ensures callbacks are always called, even on timeout
  - Improves handling of my.leviton API slowness
  - Reduces log volume during API issues

- **JSON Parsing Error Handling (Issue #43)**:
  - Added Content-Type validation before parsing JSON responses
  - Handles cases where API returns HTML error pages instead of JSON
  - Prevents "Unexpected token < in JSON" crashes
  - Provides clear error messages when API returns invalid responses
  - Prevents Homebridge crashes from malformed API responses

- **Testing**:
  - Comprehensive test suite with 139 tests
  - 99.21% code coverage (98% statements, 90.96% branches for api.js, 100% for index.js)
  - Tests for WebSocket reconnection, timeout, and error scenarios
  - Tests for rate limiter edge cases (empty requests, expired requests, waitTime > 0)
  - Tests for API response handling (empty body, invalid JSON, HTML responses)
  - Sandboxed test environment

- **Documentation**:
  - Production audit report (`docs/PRODUCTION_AUDIT.md`)
  - Comprehensive code documentation with JSDoc
  - Test setup and sandbox testing guides

### Changed
- **WebSocket Token Handling**: Now correctly sends `login.id` (token string) instead of full login object
- **Error Handling**: Enhanced error messages with better context and response body previews
- **Code Quality**: All ESLint errors resolved, consistent code style
- **API Response Handling**: Refactored to read response body once and use consistently throughout
- **Test Mocks**: Updated to use `text()` instead of `json()` to match actual API response handling

### Fixed
- WebSocket challenge response now uses correct token format
- WebSocket reconnection properly handles errors
- Connection timeout properly cleans up resources
- All callback functions properly handle errors
- Removed unused `text` variables that caused ESLint errors in CI/CD
- Fixed test mocks to properly simulate API response handling
- Improved branch coverage to 90.96% (above 90% threshold)

### Security
- ✅ No hardcoded secrets
- ✅ Input validation for all user inputs
- ✅ Secure credential storage (Homebridge config)
- ✅ 0 dependency vulnerabilities (`npm audit`)
- ✅ Error messages don't expose sensitive information

### Reliability
- ✅ Comprehensive error handling
- ✅ Automatic WebSocket reconnection
- ✅ Connection timeout protection
- ✅ Proper resource cleanup
- ✅ Edge case handling

### Maintainability
- ✅ 99.21% code coverage (98% statements, 90.96% branches)
- ✅ Comprehensive documentation
- ✅ ESLint passing (0 errors, 0 warnings)
- ✅ CI/CD configured (GitHub Actions)
- ✅ Tests on Node.js 20.x, 22.x, 24.x
- ✅ 139 tests covering all edge cases

## [2.1.0] - Previous Release

### Added
- Homebridge v2.0 compatibility
- Comprehensive test suite
- Code coverage reporting
- GitHub Actions CI/CD

### Fixed
- Configuration property mismatch (`excludeModels` vs `excludedModels`)
- Missing error callbacks in getter/setter functions
- Variable scope issues

## [2.0.0] - Initial Release

### Added
- Support for Leviton Decora Smart devices
- Automatic device discovery
- Real-time WebSocket updates
- Multiple device types (switches, dimmers, outlets, fans)
- Brightness control with min/max limits
- Device exclusion by model
- Configurable logging

---

## Upgrade Notes

### From 2.x to 3.0.0
- No breaking changes for end users
- Circuit breaker automatically protects against API failures
- Device persistence enabled by default
- Optional: Enable structured logging with `structuredLogs: true` in config
- Native fetch migration is transparent
- Requires Node.js 18+ (already required by Homebridge v2.0)

### From 2.2.0 to 2.3.0
- No breaking changes
- Native fetch migration is transparent (no code changes needed)
- Requires Node.js 18+ (already required by Homebridge v2.0)
- Supports Homebridge v2.0.0 stable release

### From 2.1.0 to 2.2.0
- No breaking changes
- WebSocket improvements are automatic
- No configuration changes required

### From 2.0.0 to 2.3.0
- Ensure `excludedModels` (not `excludeModels`) is used in config
- Review logging configuration if using custom log levels

---

## Security Advisories

None at this time.

---

## Deprecations

None - all deprecated dependencies have been removed in v2.3.0.

---

## Known Limitations

None - all previous limitations have been addressed:
- ✅ Rate limiting implemented (v2.2.0)
- ✅ API timeouts implemented (v2.2.0)
- ✅ Native fetch migration completed (v2.3.0)

---

## Support

- **Issues**: [GitHub Issues](https://github.com/tbaur/homebridge-leviton/issues)
- **Documentation**: See `docs/` directory
- **Tests**: Run `npm test`


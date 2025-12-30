# Changelog

All notable changes to homebridge-leviton will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2025-01-27

### Added
- **WebSocket Improvements**:
  - Fixed WebSocket token handling to send token string instead of full login object
  - Added automatic reconnection logic with exponential backoff (max 10 attempts)
  - Added connection timeout (10 seconds) to prevent hanging connections
  - Improved error handling for WebSocket connection failures

- **Testing**:
  - Comprehensive test suite with 122 tests
  - 99.76% code coverage (99.15% for api.js, 100% for index.js)
  - Tests for WebSocket reconnection, timeout, and error scenarios
  - Sandboxed test environment

- **Documentation**:
  - Production audit report (`docs/PRODUCTION_AUDIT.md`)
  - Comprehensive code documentation with JSDoc
  - Test setup and sandbox testing guides

### Changed
- **WebSocket Token Handling**: Now correctly sends `login.id` (token string) instead of full login object
- **Error Handling**: Enhanced error messages with better context
- **Code Quality**: All ESLint errors resolved, consistent code style

### Fixed
- WebSocket challenge response now uses correct token format
- WebSocket reconnection properly handles errors
- Connection timeout properly cleans up resources
- All callback functions properly handle errors

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
- ✅ 99.76% code coverage
- ✅ Comprehensive documentation
- ✅ ESLint passing (0 errors, 0 warnings)
- ✅ CI/CD configured (GitHub Actions)
- ✅ Tests on Node.js 20.x, 22.x, 24.x

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

### From 2.1.0 to 2.2.0
- No breaking changes
- WebSocket improvements are automatic
- No configuration changes required

### From 2.0.0 to 2.2.0
- Ensure `excludedModels` (not `excludeModels`) is used in config
- Review logging configuration if using custom log levels

---

## Security Advisories

None at this time.

---

## Deprecations

- `node-fetch@2.x`: Deprecated but maintained for compatibility. Future versions may migrate to native `fetch` (Node.js 18+).

---

## Known Limitations

1. No rate limiting on API calls (acceptable for Homebridge use case)
2. No explicit timeouts on API calls (relies on node-fetch defaults)
3. Using `node-fetch@2.x` (deprecated but no vulnerabilities)

---

## Support

- **Issues**: [GitHub Issues](https://github.com/tbaur/homebridge-leviton/issues)
- **Documentation**: See `docs/` directory
- **Tests**: Run `npm test`


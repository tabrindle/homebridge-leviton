# Development Guide

Developer documentation for homebridge-leviton.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Homebridge                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              index.js (Platform)                     │    │
│  │  • LevitonDecoraSmartPlatform class                 │    │
│  │  • Device discovery & accessory management          │    │
│  │  • HomeKit service setup (Lightbulb, Fan, etc.)     │    │
│  │  • Characteristic handlers (get/set power, etc.)    │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐    │
│  │                 api.js (API Client)                  │    │
│  │  • Leviton cloud API interaction                    │    │
│  │  • WebSocket real-time updates                      │    │
│  │  • Rate limiting, caching, circuit breaker          │    │
│  │  • Device state persistence                         │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │   my.leviton.com      │
              │   • REST API          │
              │   • WebSocket         │
              └───────────────────────┘
```

## File Structure

```
homebridge-leviton/
├── index.js              # Platform plugin (HomeKit integration)
├── api.js                # Leviton API client
├── config.schema.json    # Homebridge UI configuration schema
├── package.json          # Dependencies and scripts
├── jest.config.js        # Test configuration
├── eslint.config.mjs     # Linting rules (ESLint v9 flat config)
├── tests/
│   ├── setup.js          # Jest setup (environment validation)
│   ├── api.test.js       # API client tests
│   └── index.test.js     # Platform tests
└── docs/                 # Additional documentation
```

## Core Components

### index.js - Platform Plugin

The main Homebridge platform implementation.

**Key Class: `LevitonDecoraSmartPlatform`**

```javascript
// Lifecycle
constructor(log, config, api)     // Initialize platform
_initialize()                      // Called on didFinishLaunching
_saveDeviceStates()               // Called on shutdown

// Device Management
discover(login)                   // Discover devices from API
addAccessory(device, token)       // Register device with Homebridge
configureAccessory(accessory)     // Restore cached accessory
setupService(accessory)           // Configure HomeKit service

// Service Setup (by device type)
setupSwitchService(accessory)
setupOutletService(accessory)
setupLightbulbService(accessory)
setupFanService(accessory)
setupMotionDimmerService(accessory)

// Characteristic Handlers
onGetPower(service, device, token)
onSetPower(service, device, token)
onGetBrightness(service, device, token)
onSetBrightness(service, device, token)
onGetRotationSpeed(service, device, token)
onSetRotationSpeed(service, device, token)

// Real-time Updates
subscriptionCallback(payload)     // WebSocket update handler
```

**Device Model Constants:**

```javascript
const DEVICE_MODELS = {
  FAN: 'DW4SF',
  DIMmer_600W: 'DW6HD',
  DIMMER_MOTION: 'D2MSD',
  // ... etc
}

const DIMMER_MODELS = [...]        // Models that get Lightbulb service
const MOTION_DIMMER_MODELS = [...]  // Models with motion sensor
const OUTLET_MODELS = [...]         // Models that get Outlet service
const SWITCH_MODELS = [...]         // Explicit switch models
```

### api.js - API Client

Handles all communication with the Leviton cloud.

**Key Classes:**

| Class | Purpose |
|-------|---------|
| `RateLimiter` | Token bucket rate limiting (60 req/min) |
| `ResponseCache` | TTL-based response caching (2s) |
| `CircuitBreaker` | Failure detection and recovery |
| `DevicePersistence` | Local state caching for offline resilience |
| `StructuredLogger` | Optional JSON logging with correlation IDs |

**Exported Functions:**

```javascript
// Authentication
postPersonLogin({ email, password })
postPersonLogout({ accountID, token })

// Residences & Devices
getResidentialPermissions({ accountID, token })
getResidences({ residenceID, token })
getIotSwitches({ residenceID, token })

// Device Control
getIotSwitch({ switchID, token })
putIotSwitch({ switchID, power, brightness, token })

// Real-time Updates
subscribe(login, devices, callback, platform)
```

**API Configuration Constants:**

```javascript
const BASE_URL = 'https://my.leviton.com/api'
const SOCKET_URL = 'https://my.leviton.com/socket'
const RATE_LIMIT_MAX_REQUESTS = 60
const RATE_LIMIT_WINDOW_MS = 60000
const CACHE_TTL_MS = 2000
const API_REQUEST_TIMEOUT_MS = 10000
const CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5
const CIRCUIT_BREAKER_RESET_TIMEOUT = 30000
```

## Patterns & Best Practices

### Rate Limiting

All API requests go through the rate limiter:

```javascript
const rateLimiter = new RateLimiter()

async function apiRequest(url, options) {
  await rateLimiter.waitIfNeeded()  // Wait if at limit
  // ... make request
}
```

### Response Caching

GET requests are cached to reduce API load:

```javascript
const responseCache = new ResponseCache()

// Cache key format: "GET:/IotSwitches/abc123"
const cacheKey = `${method}:${url}`
const cached = responseCache.get(cacheKey)
if (cached) return cached

// On successful response
responseCache.set(cacheKey, data)
```

### Circuit Breaker

Prevents cascading failures when API is down:

```javascript
// States: CLOSED → OPEN → HALF_OPEN → CLOSED
const circuitBreaker = new CircuitBreaker()

// Wrap API calls
const result = await circuitBreaker.execute(async () => {
  return await fetch(url)
})
```

### WebSocket Updates

Real-time device updates via SockJS:

```javascript
// Connection flow:
// 1. Connect to SOCKET_URL
// 2. Receive 'challenge' → respond with token
// 3. Receive 'status: ready' → subscribe to devices
// 4. Receive 'notification' → call subscriptionCallback
```

## Adding New Device Support

1. **Add model constant** in `index.js`:

```javascript
const DEVICE_MODELS = {
  // ...
  NEW_DEVICE: 'DXXXX',  // Model number from Leviton
}
```

2. **Add to appropriate model array**:

```javascript
const DIMMER_MODELS = [
  // ... existing
  DEVICE_MODELS.NEW_DEVICE,
]
```

3. **If new service type needed**, add setup function:

```javascript
async setupNewService(accessory) {
  const device = accessory.context.device
  const token = accessory.context.token
  const status = await this.getStatus(device, token)
  
  const service = accessory.addService(Service.NewType, device.name)
  
  service.getCharacteristic(Characteristic.X)
    .on('get', this.onGetX(service, device, token).bind(this))
    .on('set', this.onSetX(service, device, token).bind(this))
}
```

4. **Update `setupService()`** routing:

```javascript
if (NEW_DEVICE_MODELS.includes(device.model)) {
  await this.setupNewService(accessory)
}
```

5. **Add tests** in `tests/index.test.js`

6. **Update `README.md`** supported devices table

## Testing

### Running Tests

```bash
npm test              # Run with coverage
npm run test:watch    # Watch mode
npm run lint          # ESLint check
npm run lint:fix      # Auto-fix lint issues
```

### Test Structure

Tests are fully mocked - no real API calls:

```javascript
// tests/setup.js - Validates test environment
if (process.env.NODE_ENV !== 'test') {
  throw new Error('Tests must run in test environment')
}

// Mock Homebridge API
const mockService = { Switch: 'Switch', Lightbulb: 'Lightbulb', ... }
const mockCharacteristic = { On: 'On', Brightness: 'Brightness', ... }

// Mock Leviton API
jest.mock('./api.js')
Leviton.postPersonLogin.mockResolvedValue({ ... })
```

### Coverage Requirements

```javascript
// jest.config.js thresholds
coverageThreshold: {
  global: {
    branches: 85,
    functions: 90,
    lines: 90,
    statements: 90,
  },
}
```

### Writing Tests

```javascript
describe('new feature', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Setup mocks
  })

  it('should do something', async () => {
    Leviton.someMethod.mockResolvedValueOnce({ ... })
    
    const result = await platform.someMethod()
    
    expect(result).toBe(expected)
    expect(Leviton.someMethod).toHaveBeenCalledWith({ ... })
  })
})
```

## Code Style

### ESLint Rules

- `no-var` - Use `const`/`let`
- `prefer-const` - Use `const` when not reassigned
- `prefer-arrow-callback` - Arrow functions for callbacks
- `no-unused-vars` - Prefix unused with `_`

### Conventions

```javascript
// Constants at top of file
const SOME_CONSTANT = 'value'

// Classes use PascalCase
class MyClass {}

// Functions/methods use camelCase
function myFunction() {}

// Private methods prefixed with _
_privateMethod() {}

// JSDoc for public APIs
/**
 * Description
 * @param {string} param - Description
 * @returns {Promise<Object>}
 */
```

## Debugging

### Enable Debug Logs

```json
{
  "platforms": [{
    "platform": "LevitonDecoraSmart",
    "loglevel": "debug"
  }]
}
```

### Structured Logging

For log aggregation tools:

```json
{
  "structuredLogs": true
}
```

Output format:
```json
{"timestamp":"2026-01-01T12:00:00.000Z","level":"info","message":"...","correlationId":"abc123"}
```

### Common Issues

| Issue | Debug Steps |
|-------|-------------|
| Devices not discovered | Check `loglevel: debug`, verify credentials |
| WebSocket disconnects | Check network, review reconnection logs |
| Rate limiting | Reduce polling, check for loops |
| Circuit breaker open | API may be down, wait for reset |

## CI/CD

### GitHub Actions

`.github/workflows/test.yml` runs on push/PR:
- Node.js 20.x, 22.x, 24.x
- Linting
- Tests with coverage
- Coverage artifact upload

### Release Process

1. Update `CHANGELOG.md`
2. Bump version in `package.json`
3. Commit and push
4. npm publish (manual)

## Dependencies

### Runtime
- `sockjs-client` - WebSocket client for real-time updates

### Development
- `jest` - Testing framework
- `eslint` - Linting
- `nock` - HTTP mocking
- `globals` - ESLint globals

## Resources

- [Homebridge Plugin Development](https://developers.homebridge.io/)
- [HomeKit Accessory Protocol](https://developer.apple.com/homekit/)
- [Leviton Developer Resources](https://developer.leviton.com/)


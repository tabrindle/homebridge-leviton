# homebridge-leviton

[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![npm version](https://badgen.net/npm/v/homebridge-leviton)](https://www.npmjs.com/package/homebridge-leviton)
[![npm downloads](https://badgen.net/npm/dt/homebridge-leviton)](https://www.npmjs.com/package/homebridge-leviton)
[![Tests](https://github.com/tbaur/homebridge-leviton/actions/workflows/test.yml/badge.svg)](https://github.com/tbaur/homebridge-leviton/actions/workflows/test.yml)

Homebridge plugin for Leviton Decora Smart WiFi devices. This plugin allows you to control your Leviton smart switches, dimmers, outlets, and fan controllers through Apple HomeKit via Homebridge.

## Features

- ✅ **Automatic Device Discovery** - Automatically discovers all devices from your My Leviton account
- ✅ **Real-time Updates** - WebSocket integration for instant state synchronization with automatic reconnection
- ✅ **Multiple Device Types** - Supports switches, dimmers, outlets, and fan controllers
- ✅ **Brightness Control** - Full dimming support with min/max level limits
- ✅ **Device Exclusion** - Exclude specific models or devices from HomeKit
- ✅ **Configurable Logging** - Independent log levels for debugging
- ✅ **Homebridge v2.0 Compatible** - Ready for Homebridge v2.0
- ✅ **Production Ready** - Comprehensive testing (99.21% coverage, 90.96% branches), security audited, reliability tested

## Supported Devices

These models are tested and supported:

### Dimmers
- **DW6HD** - 600W Dimmer
- **D26HD** - 600W Dimmer (2nd Gen)
- **DW1KD** - 1000W Dimmer
- **DW3HL** - Wi-Fi Plugin Dimmer
- **D23LP** - Wi-Fi Plugin Dimmer (2nd Gen)
- **DWVAA** - Voice Dimmer with Amazon Alexa

### Outlets
- **DW15P** - Wi-Fi Plugin Outlet (3/4 HP)
- **DW15A** - Plug-in Outlet (1/2 HP)
- **DW15R** - Tamper Resistant Outlet

### Fan Controllers
- **DW4SF** - Fan Speed Controller

### Switches
- Other WiFi models default to Switch service

> **Note:** Any other Leviton WiFi model should work, but may default to basic switch functionality.

## Installation

### Via Homebridge UI (Recommended)

1. Open Homebridge UI
2. Go to the **Plugins** tab
3. Search for `homebridge-leviton`
4. Click **Install**
5. Wait for installation to complete
6. Go to **Plugins** → **homebridge-leviton** → **Settings** to configure

### Via npm

```bash
npm install -g homebridge-leviton
```

### After Installation

1. **Configure** the plugin (see Configuration section below)
2. **Restart Homebridge** to load the plugin
3. **Check Logs** to verify devices are discovered (set `loglevel: "debug"` for detailed logs)
4. **Wait for Discovery** - First-time device discovery takes 10-30 seconds
5. **Verify in Home App** - Devices should appear in the Home app after discovery completes

## Quick Start

1. **Install** the plugin via Homebridge UI or npm
2. **Add Configuration** to your `config.json`:
   ```json
   {
     "platforms": [
       {
         "platform": "LevitonDecoraSmart",
         "email": "your@email.com",
         "password": "yourpassword"
       }
     ]
   }
   ```
3. **Restart Homebridge**
4. **Check Logs** - Look for "Discovering devices..." message
5. **Open Home App** - Your devices should appear within 30 seconds

> **Tip**: Set `loglevel: "debug"` in your config to see detailed discovery progress.

## Configuration

### Basic Setup

You must use your main "My Leviton" login credentials (the same credentials used in the My Leviton mobile app).

Add the following to your Homebridge `config.json`:

```json
{
  "platforms": [
    {
      "platform": "LevitonDecoraSmart",
      "email": "your@email.com",
      "password": "yourpassword"
    }
  ]
}
```

> **Note:** The `name` field is optional and not required by this plugin. Homebridge may use it for display purposes, but the plugin will work without it.

### Advanced Configuration

```json
{
  "platforms": [
    {
      "platform": "LevitonDecoraSmart",
      "email": "your@email.com",
      "password": "yourpassword",
      "loglevel": "info",
      "excludedModels": ["DWP15"],
      "excludedSerials": ["1000_0023_CCE2"]
    }
  ]
}
```

### Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `platform` | string | Yes | - | Must be exactly `"LevitonDecoraSmart"` |
| `email` | string | Yes | - | Your My Leviton account email (same as mobile app) |
| `password` | string | Yes | - | Your My Leviton account password (same as mobile app) |
| `loglevel` | string | No | `"info"` | Log level: `"debug"` (most verbose), `"info"` (default), `"warn"`, or `"error"` (least verbose) |
| `excludedModels` | array | No | `[]` | Array of device model names to exclude (case-insensitive, e.g., `["DWP15"]`) |
| `excludedSerials` | array | No | `[]` | Array of device serial numbers to exclude (case-insensitive, e.g., `["1000_0023_CCE2"]`) |

> **Note**: Model names and serial numbers in exclusion lists are case-insensitive. The plugin automatically converts them to uppercase for comparison.

### Excluding Devices

You may want to exclude certain devices from HomeKit:

- **Exclude by Model**: Use `excludedModels` to exclude all devices of a specific model (useful for devices that are already HomeKit compatible or you don't want to control)
- **Exclude by Serial**: Use `excludedSerials` to exclude specific devices by their serial number (useful for excluding individual devices)

**When to Exclude:**
- Devices that are already HomeKit compatible (to avoid duplicates)
- Devices you don't want to control via HomeKit
- Devices that are causing issues or conflicts

**Finding Serial Numbers:**
- Check the My Leviton mobile app under device details
- Check Homebridge logs with `loglevel: "debug"` during device discovery
- Serial numbers typically follow the format: `1000_XXXX_XXXX`

Example:
```json
{
  "excludedModels": ["DWP15"],
  "excludedSerials": ["1000_0023_CCE2", "1000_0023_CCE3"]
}
```

> **Note**: After changing exclusion lists, restart Homebridge for changes to take effect.

## Usage

### Device Discovery

After configuration and restarting Homebridge, the plugin will automatically:
1. Connect to your My Leviton account
2. Authenticate and obtain an access token
3. Discover all devices from your account
4. Add them to HomeKit as accessories

**What to Expect:**
- Devices will appear in the Home app with their names from the My Leviton app
- The first discovery may take 10-30 seconds depending on the number of devices
- Check Homebridge logs to see the discovery progress
- Devices excluded via `excludedModels` or `excludedSerials` will not appear

**Finding Device Serial Numbers:**
- Serial numbers can be found in the My Leviton mobile app under device details
- They typically follow the format: `1000_XXXX_XXXX`
- You can also find them in Homebridge logs when devices are discovered (use `loglevel: "debug"`)

### Controlling Devices

Once added to HomeKit, you can:

- **Turn devices on/off** via Siri, Home app, or automations
- **Adjust brightness** for dimmers (with min/max limits respected)
- **Control fan speed** for fan controllers
- **Create scenes and automations** with your Leviton devices

### Real-time Updates

The plugin uses WebSocket connections to receive real-time updates from the Leviton cloud. This means:
- Changes made in the My Leviton app instantly reflect in HomeKit
- Changes made in HomeKit instantly reflect in the My Leviton app
- No polling delays or missed updates
- Automatic reconnection if the WebSocket connection is lost (up to 10 attempts with exponential backoff)
- Connection timeout protection (10 seconds) prevents hanging connections

**Fallback Behavior:**
- If WebSocket connection fails, the plugin automatically falls back to API polling
- All functionality remains available even without WebSocket connection
- The plugin will continue attempting to establish WebSocket connection in the background

## Troubleshooting

### Devices Not Appearing

1. **Check Credentials**: Verify your email and password are correct (must match My Leviton app credentials)
2. **Check Logs**: Set `loglevel` to `"debug"` to see detailed information about discovery
3. **Verify Devices**: Ensure devices are visible in the My Leviton mobile app and online
4. **Check Exclusion Lists**: Verify devices aren't excluded by `excludedModels` or `excludedSerials`
5. **Restart Homebridge**: After configuration changes, restart Homebridge to trigger device discovery
6. **Check Network**: Ensure Homebridge server can reach `my.leviton.com` (HTTPS and WebSocket)
7. **Wait for Discovery**: First-time discovery can take 10-30 seconds; check logs for progress

### Connection Issues

1. **Network**: Ensure your Homebridge server has internet access
2. **Firewall**: Check that outbound connections to `my.leviton.com` are allowed:
   - HTTPS (port 443) for API calls
   - WebSocket connections for real-time updates
3. **Logs**: Check Homebridge logs for specific error messages
4. **API Timeout**: API requests timeout after 10 seconds; if you see timeout errors, check network latency
5. **Rate Limiting**: The plugin automatically rate limits to 60 requests per minute; this should not cause issues in normal use
6. **Authentication**: If you see authentication errors, verify credentials and try restarting Homebridge

### Brightness Not Working

- Ensure the device model supports dimming (check supported devices list above)
- Verify the device is set up as a dimmer in the My Leviton app
- Check that min/max levels are configured correctly on the device
- Some devices may have brightness limits (e.g., minimum 10%, maximum 90%) set in the My Leviton app
- Try controlling brightness from the My Leviton app first to verify the device supports it
- Check Homebridge logs for any errors when adjusting brightness

### WebSocket Disconnections

- WebSocket disconnections are automatically handled with reconnection logic
- The plugin attempts reconnection up to 10 times with exponential backoff (1s to 60s delays)
- Connection timeout is set to 10 seconds to prevent hanging connections
- If reconnection fails, the plugin will continue to work via API polling
- Check logs with `loglevel: "debug"` to see reconnection attempts

## Logging

The plugin supports independent log levels separate from Homebridge:

- **`debug`**: Detailed information for troubleshooting
- **`info`**: General information (default)
- **`warn`**: Warning messages only
- **`error`**: Error messages only

Set the log level in your configuration:
```json
{
  "loglevel": "debug"
}
```

### Documentation

Additional documentation is available in the [`docs/`](docs/) directory:

- **[Code Evaluation](docs/CODE_EVALUATION.md)** - Initial codebase evaluation
- **[Refactoring Summary](docs/REFACTORING_SUMMARY.md)** - Complete refactoring details
- **[Test Setup](docs/TEST_SETUP.md)** - Test setup and configuration guide
- **[Test Status](docs/TEST_STATUS.md)** - Current test status and metrics
- **[Sandbox Testing](docs/SANDBOX_TESTING.md)** - Sandbox testing documentation
- **[Test Fix Plan](docs/TEST_FIX_PLAN.md)** - Test fix analysis and solution
- **[Homebridge v2.0 Upgrade](docs/HOMEBRIDGE_V2_UPGRADE.md)** - Upgrade guide
- **[Deprecation Fixes](docs/DEPRECATION_FIXES.md)** - npm deprecation fixes

## Performance & Reliability

The plugin includes several features to ensure reliable operation:

- **Rate Limiting**: Automatic rate limiting (60 requests/minute) prevents API throttling and ensures smooth operation
- **API Timeouts**: 10-second timeouts ensure requests don't hang indefinitely
- **Response Caching**: 2-second cache for device status reduces redundant API calls and improves response times
- **WebSocket Reconnection**: Automatic reconnection with exponential backoff (up to 10 attempts, 1s to 60s delays)
- **Connection Timeout**: 10-second connection timeout prevents hanging WebSocket connections
- **Error Handling**: Comprehensive error handling with graceful degradation (falls back to API polling if WebSocket fails)

These features ensure the plugin works reliably even when the Leviton API is slow or experiencing issues.

## Requirements

- **Homebridge**: v1.6.0 or higher (v2.0+ supported)
- **Node.js**: v20.15.1+, v22+, or v24+ (LTS recommended)
- **My Leviton Account**: Active account with at least one device
- **Network**: Internet connection with access to `my.leviton.com` (HTTPS and WebSocket)

## Compatibility

- ✅ Homebridge v1.6.0+
- ✅ Homebridge v2.0+ (fully supported)
- ✅ iOS Home app (iOS 12+)
- ✅ macOS Home app (macOS 10.15+)
- ✅ Siri voice control
- ✅ HomeKit automations and scenes
- ✅ Apple Watch HomeKit controls
- ✅ HomeKit Secure Video (for supported devices)

## Security

- **Credential Storage**: Credentials are stored in your Homebridge `config.json` file (managed by Homebridge)
- **Encryption**: All communication with Leviton servers uses HTTPS (TLS 1.2+)
- **WebSocket Security**: WebSocket connections are encrypted and authenticated
- **No Third Parties**: No credentials or data are transmitted to third parties
- **Rate Limiting**: Built-in rate limiting (60 requests/minute) prevents API abuse
- **API Timeouts**: 10-second timeouts prevent hanging connections
- **Input Validation**: All inputs are validated before API calls

> **Security Note**: Ensure your `config.json` file has appropriate file permissions (600 recommended) to protect your credentials. Homebridge typically manages this automatically.

## Development

### Running Tests

```bash
npm test
```

All 139 tests are currently passing with 99%+ code coverage.

### Running Tests with Coverage

Coverage is automatically included when running tests:

```bash
npm test
```

Coverage report shows:
- **Statements**: 99.21% (98% for api.js, 100% for index.js)
- **Branches**: 93.22% (90.96% for api.js, 95.07% for index.js)
- **Functions**: 98.79% (96.77% for api.js, 100% for index.js)
- **Lines**: 99.2% (97.97% for api.js, 100% for index.js)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- **Issues**: [GitHub Issues](https://github.com/tbaur/homebridge-leviton/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tbaur/homebridge-leviton/discussions)

## Credits

- Developed by [tabrindle](https://github.com/tabrindle)
- Verified by Homebridge team

## Donations

If you find this plugin useful, consider supporting development:

- [GitHub Sponsors](https://github.com/sponsors/tabrindle)
- [Ko-fi](https://ko-fi.com/tabrindle)

---

**Made with ❤️ for the Homebridge community**

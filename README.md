# homebridge-leviton

[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![npm version](https://badgen.net/npm/v/homebridge-leviton)](https://www.npmjs.com/package/homebridge-leviton)
[![npm downloads](https://badgen.net/npm/dt/homebridge-leviton)](https://www.npmjs.com/package/homebridge-leviton)

Homebridge plugin for Leviton Decora Smart WiFi devices.

## Installation

### Via Homebridge UI (Recommended)

1. Go to **Plugins** → Search for `homebridge-leviton` → **Install**
2. Configure with your My Leviton credentials
3. Restart Homebridge

### Via npm

```bash
npm install -g homebridge-leviton
```

## Configuration

Add to your `config.json`:

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

### Options

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `platform` | Yes | - | Must be `"LevitonDecoraSmart"` |
| `email` | Yes | - | My Leviton account email |
| `password` | Yes | - | My Leviton account password |
| `loglevel` | No | `"info"` | `"debug"`, `"info"`, `"warn"`, or `"error"` |
| `excludedModels` | No | `[]` | Device models to exclude (e.g., `["DWP15"]`) |
| `excludedSerials` | No | `[]` | Device serials to exclude |
| `structuredLogs` | No | `false` | Enable JSON logging for log aggregation |

## Supported Devices

| Type | Models |
|------|--------|
| **Dimmers** | DW6HD, D26HD, DW1KD, DW3HL, D23LP, DWVAA |
| **Motion Sensor Dimmers** | D2MSD (dimmer + motion sensor in HomeKit) |
| **Outlets** | DW15P, DW15A, DW15R |
| **Fans** | DW4SF |
| **Switches** | DW15S, D215S, and other WiFi models (on/off) |

## Troubleshooting

**Devices not appearing?**
- Verify credentials match the My Leviton app
- Set `loglevel: "debug"` to see discovery logs
- Ensure devices are online in My Leviton app
- Restart Homebridge after config changes

**Connection issues?**
- Check internet connectivity
- Ensure firewall allows `my.leviton.com` (HTTPS/WebSocket)
- The plugin auto-reconnects on disconnection

## Requirements

- Homebridge v1.6.0+ (v2.0 supported)
- Node.js v20+, v22+, v24+, or v25+
- My Leviton account with devices

## Links

- [Issues](https://github.com/tbaur/homebridge-leviton/issues)
- [Changelog](CHANGELOG.md)

## License

MIT - [tabrindle](https://github.com/tabrindle)

---

**Sponsors:** [GitHub](https://github.com/sponsors/tabrindle) · [Ko-fi](https://ko-fi.com/tabrindle)

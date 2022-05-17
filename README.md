# homebridge-leviton

[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
Homebridge plugin for Leviton Decora Smart devices

## Supports

These models are tested, though any other WiFi model should work.

- DW6HD 600W Dimmer
- D26HD 600W Dimmer (2nd Gen)
- DW1KD 1000W Dimmer
- DW3HL Wi-Fi Plugin Dimmer
- D23LP Wi-Fi Plugin Dimmer (2nd Gen)
- DW15P Wi-Fi Plugin Outlet
- DW4SF Fan Speed Controller

## Setup

_You must use the main "My Leviton" login credentials._

- add `homebridge-leviton` in your Homebridge Config UI X web interface
- Add to your config.json:

```
"platforms": [
  {
    "platform": "LevitonDecoraSmart",
    "email": "your@email.com",
    "password": "supersecretpassword"
    "loglevel"" "info" // this is optional, info is default. debug for more, warn or error for less
  }
]
```

## Features

- Automatically discovers devices on your My Leviton app
- On/Off
- Brightness (max + min limits)
- Shows serial/model number
- varying log level independent of homebridge

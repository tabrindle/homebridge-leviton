# homebridge-leviton
Homebridge plugin for Leviton Decora Smart devices

## Supports
These models are tested, though any other WiFi model should work.
- DW6HD 600W Dimmer
- DW1KD 1000W Dimmer
- DW3HL Wi-Fi Plugin Dimmer 
- DW15P Wi-Fi Plugin Outlet
- DW4SF Fan Speed Controller

## Setup
*You must use the main "My Leviton" login credientials.*
- add `homebridge-leviton` in your Homebridge Config UI X web interface
- Add to your config.json: 

```
"platforms": [
  {
    "platform": "LevitonDecoraSmart",
    "email": "your@email.com",
    "password": "supersecretpassword"
  }
]
```

## Features
- Automatically discovers devices on your My Leviton app
- On/Off
- Brightness (max + min limits)
- Shows serial/model number

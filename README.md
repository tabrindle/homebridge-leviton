# homebridge-leviton
Homebridge plugin for Leviton Decora Smart devices

## Supports
These models are tested, though any other WiFi model should work.
- DW6HD
- DW1KD
- DW3HL
- DW15P

## Setup
- add `homebridge-leviton` in your Homebridge Config UI X web interface
- Add to your config.json: 
```
"platforms": [
  {
    "platform": "LevitonDecoraSmart"
    "email": "your@email.com",
    "password": "supersecretpassword",
  }
]
```

## Features
- Automatically discovers devices on your My Leviton app
- On/Off
- Brightness (max + min limits)
- Shows serial/model number

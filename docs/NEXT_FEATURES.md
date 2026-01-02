# Feature Roadmap

**Version:** 3.0.12  
**Status:** Production Ready

## Current Features (v3.0.x)

- ✅ Automatic device discovery
- ✅ Real-time WebSocket updates with auto-reconnection
- ✅ Rate limiting for write operations (300/min)
- ✅ Response caching (2s TTL)
- ✅ Request deduplication
- ✅ API request timeouts (10s)
- ✅ Circuit breaker pattern
- ✅ Device state persistence
- ✅ Structured logging (optional)
- ✅ Token auto-refresh on 401
- ✅ Homebridge v2.0 support
- ✅ Node.js 20-25 support

## Supported Devices

- Dimmers: DW6HD, DW1KD, D26HD, D2MSD (with motion sensor)
- Switches: DW15S, D215S
- Outlets: DW15P, DWVPA, D215R
- Fans: DW4SF, ZS4FC

## Test Coverage

| Metric | Value |
|--------|-------|
| Tests | 195 passing |
| Statements | 92% |
| Branches | 84% |
| Functions | 98% |
| Lines | 92% |

## Future Considerations

- ES Modules migration (deferred - Jest mocking complexity)
- TypeScript migration

---

*Last updated: 2026-01-02*

# Breaking Changes

## v3.0.x

No breaking changes. All updates are backward compatible.

### New Features (v3.0.0+)
- Circuit breaker pattern
- Device state persistence  
- Structured logging (optional)
- Token auto-refresh on 401
- Request deduplication
- Motion sensor dimmer support (D2MSD)

## v2.1.0

**Config property fix:** `excludeModels` → `excludedModels`

If you were using the incorrect spelling, update your config.

## Requirements

- Node.js 20+ (required for native fetch)
- Homebridge 1.6.0+ or 2.0.0+

---

*Last updated: 2026-01-02*

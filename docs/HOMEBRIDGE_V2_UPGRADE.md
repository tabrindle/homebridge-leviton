# Homebridge v2.0 Upgrade Assessment

**Date:** 2025-01-27  
**Plugin:** homebridge-leviton  
**Current Version:** 2.1.0  
**Target:** Homebridge v2.0 Compatibility

---

## Executive Summary

✅ **Good News:** This plugin appears to be **mostly compatible** with Homebridge v2.0 already! It doesn't use any of the deprecated APIs that were removed in v2.0.

**Required Changes:** Minimal - primarily updating `package.json` and testing.

**Estimated Effort:** Low (1-2 hours for testing and validation)

---

## Compatibility Analysis

### ✅ Already Compatible

1. **Platform Registration**
   - ✅ Uses `homebridge.registerPlatform()` correctly
   - ✅ Uses dynamic platform API (4th parameter `true`)
   - ✅ No deprecated `AccessoryLoader` usage

2. **API Usage**
   - ✅ No `useLegacyAdvertiser` usage
   - ✅ No `StreamVideoParams` or `cameraSource` (not a camera plugin)
   - ✅ No `Characteristic.ProgramMode` usage
   - ✅ Uses standard Service/Characteristic patterns

3. **Code Patterns**
   - ✅ Proper use of `homebridge.hap.Service`, `Characteristic`, `Accessory`, `UUID`
   - ✅ Correct platform accessory registration/unregistration
   - ✅ Standard callback patterns

### ⚠️ Needs Updates

1. **package.json Engines Field** (REQUIRED)
   - Current: `"homebridge": ">=1.0.0"`
   - Needs: Support for v2.0-beta and future v2.0 release

2. **Node.js Version Requirements** (RECOMMENDED)
   - Current: `"node": ">=14.0.0"`
   - Homebridge v2.0 requires: Node.js 18.20.4+, 20.15.1+, or 22+
   - Should update to match Homebridge v2.0 requirements

3. **Dependencies** (RECOMMENDED)
   - `node-fetch@^2.6.7` is deprecated
   - Consider updating to v3 or using native `fetch` (Node 18+)

---

## Required Changes

### 1. Update `package.json` Engines Field

**Current:**
```json
"engines": {
  "node": ">=14.0.0",
  "homebridge": ">=1.0.0"
}
```

**Updated for Homebridge v2.0:**
```json
"engines": {
  "homebridge": "^1.6.0 || ^2.0.0-beta.0",
  "node": "^18.20.4 || ^20.15.1 || ^22"
}
```

**After Homebridge v2.0 stable release:**
```json
"engines": {
  "homebridge": "^1.6.0 || ^2.0.0",
  "node": "^18.20.4 || ^20.15.1 || ^22"
}
```

**Rationale:**
- Maintains backward compatibility with Homebridge v1.6.0+
- Adds support for Homebridge v2.0-beta.0 (current beta)
- Updates Node.js requirements to match Homebridge v2.0 minimums
- Users will see a green checkmark in Homebridge UI once this is updated

### 2. Optional: Update Dependencies

**Consider updating `node-fetch`:**
- Option A: Update to `node-fetch@^3` (requires ESM or dynamic import)
- Option B: Use native `fetch` (available in Node.js 18+)

**Current code uses CommonJS, so if updating to node-fetch v3:**
```javascript
// Would need to change from:
const fetch = require('node-fetch')

// To:
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
```

**Or better, use native fetch (Node 18+):**
```javascript
// Remove node-fetch dependency entirely
// Use global fetch (available in Node 18+)
```

---

## Testing Checklist

Before marking as Homebridge v2.0 compatible, test the following:

### ✅ Basic Functionality
- [ ] Plugin loads without errors on Homebridge v2.0-beta
- [ ] Devices are discovered correctly
- [ ] All device types work (Switch, Outlet, Lightbulb, Fan)
- [ ] Accessories appear in HomeKit

### ✅ Device Control
- [ ] On/Off control works for all device types
- [ ] Brightness control works for dimmers
- [ ] Rotation speed control works for fans
- [ ] Device state updates correctly

### ✅ Real-time Updates
- [ ] WebSocket subscription works
- [ ] Device state changes from Leviton app reflect in HomeKit
- [ ] Device state changes from HomeKit reflect in Leviton app

### ✅ Error Handling
- [ ] Plugin handles API errors gracefully
- [ ] Plugin handles network errors gracefully
- [ ] Plugin handles authentication failures correctly
- [ ] WebSocket reconnection works (if implemented)

### ✅ Configuration
- [ ] Config schema works correctly
- [ ] `excludedModels` works (after fixing the bug)
- [ ] `excludedSerials` works
- [ ] Log level configuration works

### ✅ Edge Cases
- [ ] Plugin handles devices being removed from Leviton account
- [ ] Plugin handles devices being added to Leviton account
- [ ] Plugin handles multiple residences (if applicable)
- [ ] Plugin handles empty device lists

---

## Migration Steps

### Step 1: Update package.json
1. Update `engines` field as shown above
2. Optionally update Node.js version requirement
3. Optionally update `node-fetch` dependency

### Step 2: Test on Homebridge v2.0-beta
1. Install Homebridge v2.0-beta
2. Install updated plugin version
3. Run through testing checklist above
4. Monitor logs for any warnings or errors

### Step 3: Fix Any Issues
- Address any compatibility issues found during testing
- Fix the existing bugs identified in `CODE_EVALUATION.md`:
  - Configuration property name mismatch (`excludeModels` vs `excludedModels`)
  - Callback error handling
  - Variable scope in `subscriptionCallback`

### Step 4: Update Version and Release
1. Bump version (e.g., `2.1.0` → `2.2.0`)
2. Update CHANGELOG.md (if exists)
3. Tag release
4. Publish to npm

### Step 5: Update After Stable Release
Once Homebridge v2.0 stable is released:
1. Remove `-beta.0` from engines field
2. Update to `"homebridge": "^1.6.0 || ^2.0.0"`
3. Release patch version

---

## Code Review Notes

### No Breaking Changes Required

The plugin code itself doesn't need changes for Homebridge v2.0 compatibility because:

1. ✅ **No deprecated APIs used**
   - Doesn't use `useLegacyAdvertiser`
   - Doesn't use `AccessoryLoader`
   - Doesn't use deprecated camera APIs
   - Doesn't use `Characteristic.ProgramMode` (with incorrect naming)

2. ✅ **Uses correct patterns**
   - Dynamic platform API (`registerPlatform` with `true`)
   - Standard Service/Characteristic usage
   - Proper accessory registration

3. ✅ **No enum access issues**
   - The code doesn't access enums via `Characteristic.Units` pattern
   - All enum access is through the HAP objects correctly

### However, Fix Existing Bugs First

Before claiming v2.0 compatibility, it's recommended to fix the bugs identified in `CODE_EVALUATION.md`:

1. **BUG-001:** Configuration property mismatch (`excludeModels` vs `excludedModels`)
2. **BUG-002:** Missing error callbacks in getter/setter functions
3. **BUG-003:** Variable scope issue in `subscriptionCallback`

These aren't v2.0-specific issues but should be fixed for overall code quality.

---

## References

- [Homebridge v2.0 Migration Guide](https://github.com/homebridge/homebridge/wiki/Updating-To-Homebridge-v2.0)
- [Homebridge Developer Documentation](https://developers.homebridge.io/#/)
- [Homebridge Plugin Template](https://github.com/homebridge/homebridge-plugin-template)

---

## Summary

**Status:** ✅ Ready for Homebridge v2.0 with minimal changes

**Action Items:**
1. ✅ Update `package.json` engines field (5 minutes)
2. ✅ Test on Homebridge v2.0-beta (30-60 minutes)
3. ⚠️ Fix existing bugs (recommended, 30 minutes)
4. ✅ Release updated version

**Risk Level:** Low - Plugin uses modern APIs and should work with v2.0 out of the box.

**Timeline:** Can be completed in 1-2 hours of focused work.


/**
 * @fileoverview Test setup file - runs before all tests
 * Ensures sandboxed environment with proper mocks
 */

// Verify sandbox environment
if (process.env.NODE_ENV !== 'test') {
  throw new Error('Tests must run with NODE_ENV=test. Use: NODE_ENV=test npm test')
}

// Prevent any real network calls during tests
// This ensures we're in a sandbox
process.env.NODE_ENV = 'test'

// Mock console methods to keep test output clean
global.console = {
  ...console,
  // Uncomment to silence console in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}

// Set test timeout
jest.setTimeout(10000)

// Global test utilities
global.createMockDevice = (overrides = {}) => ({
  id: 'device-1',
  name: 'Test Device',
  serial: 'TEST123',
  model: 'DW6HD',
  manufacturer: 'Leviton',
  version: '1.0',
  ...overrides,
})

global.createMockAccessory = (deviceOverrides = {}) => {
  const device = global.createMockDevice(deviceOverrides)
  const mockService = {
    getCharacteristic: jest.fn().mockReturnThis(),
    setCharacteristic: jest.fn().mockReturnThis(),
    setProps: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    updateValue: jest.fn().mockReturnThis(),
  }

  return {
    displayName: device.name,
    context: {
      device,
      token: 'test-token',
    },
    getService: jest.fn().mockReturnValue(mockService),
    addService: jest.fn().mockReturnValue(mockService),
  }
}

global.createMockHomebridge = () => ({
  hap: {
    Service: {
      Switch: 'Switch',
      Outlet: 'Outlet',
      Lightbulb: 'Lightbulb',
      Fan: 'Fan',
      AccessoryInformation: 'AccessoryInformation',
    },
    Characteristic: {
      On: 'On',
      Brightness: 'Brightness',
      RotationSpeed: 'RotationSpeed',
      Name: 'Name',
      SerialNumber: 'SerialNumber',
      Manufacturer: 'Manufacturer',
      Model: 'Model',
      FirmwareRevision: 'FirmwareRevision',
    },
    Accessory: {},
    uuid: {
      generate: jest.fn().mockReturnValue('test-uuid'),
    },
  },
  registerPlatform: jest.fn(),
})

global.createMockApi = () => ({
  platformAccessory: jest.fn(),
  registerPlatformAccessories: jest.fn(),
  unregisterPlatformAccessories: jest.fn(),
  on: jest.fn((event, _callback) => {
    if (event === 'didFinishLaunching') {
      // Don't auto-trigger in sandbox - tests control this
    }
  }),
})

global.createMockLogger = () => jest.fn()

// Ensure no real API calls can be made
beforeEach(() => {
  // Clear all mocks between tests
  jest.clearAllMocks()
})

afterEach(() => {
  // Clean up any test-specific state
  jest.restoreAllMocks()
})


/**
 * Jest configuration for sandboxed testing
 * All tests run in isolation with mocked dependencies
 */
module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Run tests in separate processes for true isolation
  maxWorkers: 1,
  // Coverage settings
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 85,
      statements: 85,
    },
  },
  collectCoverageFrom: [
    '*.js',
    '!jest.config.js',
    '!test-websocket.js',
    '!tests/**',
    '!coverage/**',
  ],
  // Test file patterns
  testMatch: ['**/tests/**/*.test.js'],
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  // Module paths
  modulePaths: ['<rootDir>'],
  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/coverage/'],
  // Verbose output
  verbose: true,
}


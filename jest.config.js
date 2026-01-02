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
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Per-file thresholds
    './index.js': {
      branches: 80,
      functions: 85,
      lines: 80,
      statements: 80,
    },
    './api.js': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  collectCoverageFrom: [
    '*.js',
    '!jest.config.js',
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


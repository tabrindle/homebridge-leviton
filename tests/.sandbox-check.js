/**
 * @fileoverview Sandbox verification - ensures tests run in isolated environment
 * This file is imported by test files to verify sandboxing
 */

if (process.env.NODE_ENV !== 'test') {
  console.error('❌ ERROR: Tests must run in test environment!')
  console.error('   Set NODE_ENV=test before running tests')
  console.error('   Use: NODE_ENV=test npm test')
  process.exit(1)
}

// Verify mocks are in place
if (typeof jest === 'undefined') {
  console.error('❌ ERROR: Jest is not available!')
  process.exit(1)
}

// All good - sandbox is ready
module.exports = {
  isSandboxed: true,
  environment: process.env.NODE_ENV,
}


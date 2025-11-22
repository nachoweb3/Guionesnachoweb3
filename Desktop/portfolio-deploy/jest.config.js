module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'script.js',
    'js/**/*.js',
    '!js/**/*.test.js',
    '!js/**/*.spec.js',
    '!node_modules/**',
    '!dist/**',
    '!coverage/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(ethers|@walletconnect|@coinbase)/)'
  ],
  globals: {
    fetch: global.fetch,
    localStorage: global.localStorage,
    window: global.window,
    document: global.document
  },
  testTimeout: 10000,
  verbose: true
};
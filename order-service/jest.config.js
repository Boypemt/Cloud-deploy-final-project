/** Jest config — unit tests live in tests/unit, integration tests in tests/integration. */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  // DB tests may need more than Jest's default 5 s (first connection)
  testTimeout: 30000,
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
};

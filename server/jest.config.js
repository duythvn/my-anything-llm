module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'utils/**/*.js',
    'models/**/*.js',
    'endpoints/**/*.js'
  ],
  coveragePathIgnorePatterns: [
    'node_modules/',
    'storage/',
    'prisma/',
    'swagger/'
  ]
};
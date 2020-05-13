module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', 'src'],
  setupFiles: ['<rootDir>/jest-setup.ts'],
  testRegex: '\\.spec\\.tsx?$',
  testPathIgnorePatterns: ['e2e'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: ['node_modules/(?!(lodash-es)/)']
}

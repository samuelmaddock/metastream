module.exports = {
  moduleDirectories: ['node_modules', 'test'],
  testRegex: '(e2e){1}.*?\\.spec\\.tsx?$',
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  globalSetup: './test/environment/setup.js',
  globalTeardown: './test/environment/teardown.js',
  testEnvironment: './test/environment/env.js',
  setupFilesAfterEnv: [ 'expect-puppeteer' ]
}

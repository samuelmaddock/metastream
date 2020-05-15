const { promises: fs } = require('fs')
const path = require('path')
const { setup: setupServer, teardown: teardownServer } = require('jest-dev-server')

const isCI = process.env.CI === 'true'

async function setup(jestConfig = {}) {
  try {
    await fs.mkdir(path.join(__dirname, '../artifacts'))
  } catch {}

  if (isCI) {
    await setupServer([
      {
        command: 'yarn start',
        launchTimeout: 120e3,
        port: 8080,
        waitOnScheme: {
          resources: ['http-get://localhost:8080/']
        }
      },
      {
        command: 'yarn start:signal-server',
        port: 27064,
        waitOnScheme: {
          resources: ['tcp:localhost:27064']
        }
      }
    ])
  }
}

async function teardown(jestConfig = {}) {
  if (isCI) {
    await teardownServer()
  }
}

module.exports = { setup, teardown }

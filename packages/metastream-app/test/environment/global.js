const path = require('path')
const { setup: setupServer, teardown: teardownServer } = require('jest-dev-server')

// TODO: need to get headful puppeteer setup on CI as extensions can't run headless
const loadExtension = false
const isCI = process.env.CI === 'true'

let browser

function getChromiumArgs() {
  const metastreamRemotePath = path.join(__dirname, '../../..', 'metastream-remote-extension/src')

  const ciArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding'
  ]

  const extensionArgs = [
    `--disable-extensions-except=${metastreamRemotePath}`,
    `--load-extension=${metastreamRemotePath}`
  ]

  const args = [
    ...(isCI ? ciArgs : []),
    `--window-size=1400,900`,
    ...(loadExtension ? extensionArgs : [])
  ]

  return args
}

async function setup(jestConfig = {}) {
  if (isCI) {
    await setupServer({
      command: 'yarn start',
      launchTimeout: 120e3,
      port: 8080,
      waitOnScheme: {
        resources: ['http-get://localhost:8080/']
      }
    })
  }

  const puppeteer = require('puppeteer')
  browser = await puppeteer.launch({
    headless: !loadExtension,
    args: getChromiumArgs()
  })
  process.env.PUPPETEER_WS_ENDPOINT = browser.wsEndpoint()
}

async function teardown(jestConfig = {}) {
  await browser.close()

  if (isCI) {
    await teardownServer()
  }
}

module.exports = { setup, teardown }

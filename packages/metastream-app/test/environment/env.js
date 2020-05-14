const { promises: fs } = require('fs')
const path = require('path')
const PlaywrightEnvironment = require('jest-playwright-preset')

const ARTIFACTS_PATH = path.join(__dirname, '../artifacts')

function useProfile() {
  const global = this.global

  const identity = {
    public: 'ac85c8efdac0de31c4f400ab785ad6b0cafd8022711128a3a860147788cd825d',
    secret: '6baed98eefe4a9fc850e6768d083aa8d23f5eb27632b1c189a42d5c3520c6161'
  }

  const initialState = {
    settings: {
      username: 'test'
    }
  }
  const initialStateParam = JSON.stringify(initialState)

  global.beforeAll(async () => {
    await global.page.goto(`http://localhost:8080/?initialState=${initialStateParam}`)
    await global.page.evaluate(
      data => {
        Object.keys(data).forEach(key => {
          const value = data[key]
          if (value) {
            localStorage.setItem(key, value)
          } else {
            localStorage.removeItem(key)
          }
        })
      },
      {
        identity: identity.secret,
        'identity.pub': identity.public,
        welcomed: true
      }
    )
  })

  return identity.public
}

const screenshot = (filename, page) => {
  const filepath = path.join(ARTIFACTS_PATH, `${filename}.jpg`)
  return page.screenshot({ path: filepath, quality: 70 })
}

class MetastreamEnvironment extends PlaywrightEnvironment {
  async setup() {
    await super.setup()

    const metastream = {
      screenshot: (filename, page = this.global.page) => screenshot(filename, page),
      visit: async (pathname, opts) =>
        this.global.page.goto(`http://localhost:8080/#${pathname}`, opts),
      useProfile: useProfile.bind(this)
    }
    this.global.ms = metastream
  }

  async teardown() {
    await super.teardown()
    this.global.ms = undefined
  }
}

module.exports = MetastreamEnvironment

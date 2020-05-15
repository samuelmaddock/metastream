const { promises: fs } = require('fs')
const path = require('path')
const PlaywrightEnvironment = require('jest-playwright-preset')

const ARTIFACTS_PATH = path.join(__dirname, '../artifacts')

const PROFILES = {
  default: {
    identity: {
      public: 'ac85c8efdac0de31c4f400ab785ad6b0cafd8022711128a3a860147788cd825d',
      secret: '6baed98eefe4a9fc850e6768d083aa8d23f5eb27632b1c189a42d5c3520c6161'
    },
    localStorage: {
      welcomed: true
    },
    initialState: {
      settings: {
        username: 'host'
      }
    }
  },
  clientA: {
    identity: {
      public: '19e17b67e6588f9b7f642d4b76cf1116179799a811d5735926182dd217e80949',
      secret: '747f216b51ac33346e9a871ed7aa5a3ab4ad3607064dffc490da3f82c8a61630'
    },
    localStorage: {
      welcomed: true
    },
    initialState: {
      settings: {
        username: 'clientA'
      }
    }
  }
}

async function setProfile(profileName = 'default', page = this.global.page) {
  const global = this.global

  const profile = PROFILES[profileName]
  const initialStateParam = JSON.stringify(profile.initialState)

  await page.goto(`http://localhost:8080/?initialState=${initialStateParam}`)
  await page.evaluate(
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
      identity: profile.identity.secret,
      'identity.pub': profile.identity.public,
      ...profile.localStorage,
    }
  )

  return profile.identity.public
}

function useProfile(profileName = 'default', page = this.global.page) {
  const profile = PROFILES[profileName]

  this.global.beforeAll(async () => {
    await setProfile.call(this, profileName, page)
  })

  return profile.identity.public
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
      useProfile: useProfile.bind(this),
      setProfile: setProfile.bind(this)
    }
    this.global.ms = metastream
  }

  async teardown() {
    await super.teardown()
    this.global.ms = undefined
  }
}

module.exports = MetastreamEnvironment

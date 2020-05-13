const { promises: fs } = require('fs')
const path = require('path')
const PuppeteerEnvironment = require('jest-environment-puppeteer')

const ARTIFACTS_PATH = path.join(__dirname, '../artifacts')

function useProfile() {
  const identity = {
    public: 'ac85c8efdac0de31c4f400ab785ad6b0cafd8022711128a3a860147788cd825d',
    secret: '6baed98eefe4a9fc850e6768d083aa8d23f5eb27632b1c189a42d5c3520c6161'
  }

  this.global.beforeAll(async () => {
    await this.global.ms.visit('/')
    await this.global.page.evaluate(
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
        // 'persist:metastream-state': JSON.stringify({
        //   settings: JSON.stringify({
        //     username: 'test'
        //   })
        // }),
        identity: identity.secret,
        'identity.pub': identity.public,
        welcomed: true
      }
    )
  })

  return identity.public
}

const screenshot = page => {
  const url = new URL(page.url())
  let filename = `${
    !!url.hash ? url.hash.substring(2).replace(/\//g, '_') : 'root'
  }_${Date.now()}.jpg`
  const filepath = path.join(ARTIFACTS_PATH, filename)
  return page.screenshot({ path: filepath, quality: 70 })
}

class MetastreamEnvironment extends PuppeteerEnvironment {
  async setup() {
    await super.setup()

    try {
      await fs.mkdir(ARTIFACTS_PATH)
    } catch {}

    const metastream = {
      screenshot: (page = this.global.page) => screenshot(page),
      visit: async pathname => {
        await this.global.page.setViewport({ width: 1280, height: 720 })
        return await this.global.page.goto(`http://localhost:8080/#${pathname}`)
      },
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

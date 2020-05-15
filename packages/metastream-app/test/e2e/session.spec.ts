import { Page, BrowserContext } from 'playwright-core'

describe('session', () => {
  const hostId = ms.useProfile()

  beforeAll(() => {
    jest.setTimeout(20e3)
  })

  describe('host', () => {
    it('should start a session', async () => {
      await ms.visit(`/join/${hostId}`)
      await page.waitForSelector(`#userlist [data-user=${hostId}]`)
      await ms.screenshot('session_host')
    })

    it('should not join invalid session', async () => {
      await ms.visit(`/join/deadbeafdeadbeafdeadbeafdeadbeaf`)
      const reason = await page.$eval('#disconnect_reason', e => e.textContent)
      expect(reason).toBe('Session not found.')
    })
  })

  describe('p2p: host + client', () => {
    let clientContext: BrowserContext
    let clientPage: Page
    let clientId: string

    beforeEach(async () => {
      clientContext = await browser.newContext()
      clientPage = await clientContext.newPage()
      clientId = await ms.setProfile('clientA', clientPage)
    })

    afterEach(async () => {
      await clientPage.close()
      await clientContext.close()
    })

    it('should require allowing client to connect', async () => {
      await ms.visit(`/join/${hostId}`)
      const hostPage = page

      await clientPage.goto(`${hostPage.url()}#/join/${hostId}`)

      await hostPage.click(`[data-user="${clientId}"][data-pending="true"] [data-id="allow"]`)
      await hostPage.waitForSelector(`[data-user="${clientId}"][data-pending="false"]`)

      await ms.screenshot('session_host+client')
    }, 10e3)

    it('should accept connecting client', async () => {
      await ms.visit(`/join/${hostId}`)
      const hostPage = page

      // set public session
      await hostPage.evaluate(() =>
        (window as any).app.store.dispatch({
          type: 'SET_SETTING',
          payload: { key: 'sessionMode', value: 0 }
        })
      )

      await clientPage.goto(`${hostPage.url()}#/join/${hostId}`)
      await hostPage.waitForSelector(`[data-user="${clientId}"][data-pending="false"]`)
    })
  })
})

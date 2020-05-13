import { Page, Browser, BrowserContext } from 'puppeteer'

interface MetastreamTestUtils {
  screenshot: (page?: Page) => Promise<void>
  visit: (pathname: string) => ReturnType<Page['goto']>
  useProfile(): void
}

declare global {
  const ms: MetastreamTestUtils
  const browser: Browser
  const context: BrowserContext
  const page: Page
}

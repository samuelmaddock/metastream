import { Page, Browser, BrowserContext } from 'playwright-chromium'

interface MetastreamTestUtils {
  screenshot: (filename: string, page?: Page) => Promise<void>
  visit: Page['goto']
  useProfile(): void
}

declare global {
  const ms: MetastreamTestUtils
}

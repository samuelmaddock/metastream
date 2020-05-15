import { Page, Browser, BrowserContext } from 'playwright-chromium'

interface MetastreamTestUtils {
  screenshot: (filename: string, page?: Page) => Promise<void>
  visit: Page['goto']
  setProfile(profileName?: string, page?: Page): Promise<string>
  useProfile(profileName?: string, page?: Page): string
}

declare global {
  const ms: MetastreamTestUtils
}

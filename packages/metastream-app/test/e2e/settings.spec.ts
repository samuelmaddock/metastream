describe('settings', () => {
  const userId = ms.useProfile()

  describe('appearance', () => {
    it('should apply a new language', async () => {
      await ms.visit(`/settings`)
      await page.click('#settings_tab_appearance')
      await page.selectOption('#appearance_language', 'ja-JP')

      let h1 = await page.$eval('h1', e => e.textContent)
      expect(h1).toBe('設定')

      await ms.screenshot('language')

      // revert
      await page.click('#settings_tab_appearance')
      await page.selectOption('#appearance_language', 'en-US')
      h1 = await page.$eval('h1', e => e.textContent)
      expect(h1).toBe('Settings')
    })
  })

  describe('in-session', () => {
    it('should announce name change', async () => {
      await ms.visit(`/join/${userId}`)
      await page.click('#settings_btn')
      await page.fill('#profile_username', 'coolguy')
      await page.click('#settings_tab_session')
      const messages = await page.$$eval('#chat_messages > li', elems =>
        elems.map(e => e.textContent)
      )
      expect(messages).toHaveLength(1)
      expect(messages[0]).toBe('host is now known as coolguy.')
    })
  })
})

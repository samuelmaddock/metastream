describe('session', () => {
  const userId = ms.useProfile()

  describe('host', () => {
    it.only('should start a session', async () => {
      await ms.visit(`/join/${userId}`)
      await page.waitForSelector(`#userlist [data-user=${userId}]`)
      await ms.screenshot()
    })
  })
})

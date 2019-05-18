export const isFirefox = () => navigator.userAgent.toLowerCase().includes('firefox')

export const untilDocumentVisible = () => {
  return new Promise(resolve => {
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'visible') {
          resolve()
        }
      },
      false
    )
  })
}

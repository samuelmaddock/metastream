export const isFirefox = () => navigator.userAgent.toLowerCase().includes('firefox')

export const untilDocumentVisible = () => {
  return new Promise(resolve => {
    document.addEventListener(
      'visibilitychange',
      function onVisibilityChange() {
        if (document.visibilityState === 'visible') {
          document.removeEventListener('visibilitychange', onVisibilityChange, false)
          resolve()
        }
      },
      false
    )
  })
}

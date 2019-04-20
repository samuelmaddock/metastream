export const getIsInstalled = (): boolean =>
  typeof document.documentElement.dataset.extensionInstalled !== 'undefined'

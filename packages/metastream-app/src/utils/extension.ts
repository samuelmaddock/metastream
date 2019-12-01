export const getIsInstalled = (): boolean =>
  typeof document !== 'undefined' &&
  typeof document.documentElement.dataset.extensionInstalled !== 'undefined'

export const getIsInstalled = (): boolean =>
  typeof document !== 'undefined' &&
  typeof document.documentElement.dataset.extensionInstalled !== 'undefined'

export const dispatchExtensionMessage = (type: string, payload?: any, extra?: any) => {
  if (!type.startsWith('metastream-')) {
    throw new Error('Extension messages must start with metastream-')
  }

  const message = { type, payload, ...extra }

  const chrome = (window as any).chrome
  if (typeof chrome === 'object' && typeof chrome.runtime === 'object') {
    const extensionId = document.documentElement.dataset.extensionId
    if (extensionId) {
      chrome.runtime.sendMessage(extensionId, message)
      return
    }
  }

  window.postMessage(message, location.origin)
}

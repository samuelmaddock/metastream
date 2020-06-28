export const getIsInstalled = (): boolean =>
  typeof document !== 'undefined' &&
  typeof document.documentElement.dataset.extensionInstalled !== 'undefined'

export const dispatchExtensionMessage = (type: string, payload?: any) => {
  if (!type.startsWith('metastream-')) {
    throw new Error('Extension messages must start with metastream-')
  }

  const message = { type, payload }

  const chrome = (window as any).chrome
  if (typeof chrome === 'object' && typeof chrome.runtime === 'object') {
    const extensionId = document.documentElement.dataset.extensionId
    chrome.runtime.sendMessage(extensionId, message)
    return
  }

  window.postMessage(message, location.origin)
}

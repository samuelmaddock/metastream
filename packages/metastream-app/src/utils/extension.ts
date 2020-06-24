export const getIsInstalled = (): boolean =>
  typeof document !== 'undefined' &&
  typeof document.documentElement.dataset.extensionInstalled !== 'undefined'

export const dispatchExtensionMessage = (type: string, payload?: any) => {
  if (!type.startsWith('metastream-')) {
    throw new Error('Extension messages must start with metastream-')
  }

  window.postMessage(
    {
      type,
      payload
    },
    location.origin
  )
}

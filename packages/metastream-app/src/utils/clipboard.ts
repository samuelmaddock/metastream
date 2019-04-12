export const copyToClipboard = (data: any, type?: string): void => {
  const clipboard = (navigator as any).clipboard

  if (!clipboard) {
    alert('Clipboard not supported in browser.')
    return
  }

  clipboard.writeText(data + '').catch(() => {})
}

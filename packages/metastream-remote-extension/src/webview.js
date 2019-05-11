//
// Listens for webview events
//

chrome.runtime.onMessage.addListener(action => {
  if (typeof action !== 'object' || typeof action.type !== 'string') return
  switch (action.type) {
    case 'navigate':
      history.go(Number(action.payload) || 0)
      break
    case 'reload':
      location.reload(Boolean(action.payload))
      break
    case 'stop':
      stop()
      break
  }
})

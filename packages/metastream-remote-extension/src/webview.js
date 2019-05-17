//
// Listens for webview events
//

;(function() {
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

  const throttle = (func, limit) => {
    let inThrottle
    return function() {
      const args = arguments
      const context = this
      if (!inThrottle) {
        func.apply(context, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  // Forward activity signal to top frame
  const onWebviewActivity = throttle(event => {
    chrome.runtime.sendMessage({
      type: 'metastream-webview-event',
      payload: { type: 'activity', payload: event.type }
    })
  }, 1e3)
  document.addEventListener('mousemove', onWebviewActivity, true)
  document.addEventListener('mousedown', onWebviewActivity, true)
  document.addEventListener('mousewheel', onWebviewActivity, true)
  document.addEventListener('keydown', onWebviewActivity, true)
})()

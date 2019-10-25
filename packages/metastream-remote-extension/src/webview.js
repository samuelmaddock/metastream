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
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  }

  // Forward activity signal to top frame
  // Used for determining inactivity in interactive mode and for verifying
  // whether user triggered media state changes.
  const onWebviewActivity = throttle(event => {
    if (!event.isTrusted) return
    chrome.runtime.sendMessage({
      type: 'metastream-webview-event',
      payload: { type: 'activity', payload: event.type }
    })
  }, 100)
  document.addEventListener('mousemove', onWebviewActivity, true)
  document.addEventListener('mousedown', onWebviewActivity, true)
  document.addEventListener('mouseup', onWebviewActivity, true)
  document.addEventListener('mousewheel', onWebviewActivity, true)
  document.addEventListener('keydown', onWebviewActivity, true)

  const mainWorldScript = function() {
    document.getElementById('metastreamwebviewinit').remove()

    // Fix for setting document.domain in sandboxed iframe
    try {
      Object.defineProperty(document, 'domain', {
        value: document.domain,
        writable: true
      })
    } catch (e) {}
  }

  const script = document.createElement('script')
  script.id = 'metastreamwebviewinit'
  script.textContent = `(${mainWorldScript}());`
  if (document.documentElement) {
    document.documentElement.appendChild(script)
  }
})()

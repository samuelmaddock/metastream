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
  const onWebviewActivity = event => {
    if (!event.isTrusted) return
    chrome.runtime.sendMessage({
      type: 'metastream-webview-event',
      payload: { type: 'activity', payload: event.type }
    })
  }
  const onFrequentWebviewActivity = throttle(onWebviewActivity, 500)
  const onImportantWebviewActivity = throttle(onWebviewActivity, 80)
  document.addEventListener('mousemove', onFrequentWebviewActivity, true)
  document.addEventListener('mousedown', onImportantWebviewActivity, true)
  document.addEventListener('mouseup', onImportantWebviewActivity, true)
  document.addEventListener('mousewheel', onFrequentWebviewActivity, true)
  document.addEventListener('keydown', onImportantWebviewActivity, true)

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

//
// The first script to be run on every page as to capture media elements
// when they're created.
//
// Has to be run before anything else is executed in the document.
// Declaring the script in the manifest, as opposed to using
// chrome.tabs.executeScript, seems to be the only way to achieve this from
// my own testing.
// https://bugs.chromium.org/p/chromium/issues/detail?id=377978
//

;(function() {
  const mainWorldScript = function() {
    document.getElementById('metastreaminitscript').remove()

    // Only run in iframes, the same as the Metastream player frame
    const isTopFrame = window.self === window.top
    if (isTopFrame) return

    const mediaElements = window.__metastreamMediaElements = new Set()

    // Proxy document.createElement to trap media elements created in-memory
    const origCreateElement = document.createElement
    const proxyCreateElement = function(tagName) {
      const element = origCreateElement.call(document, tagName)
      if (element instanceof HTMLMediaElement) {
        mediaElements.add(element)
      }
      return element
    }
    proxyCreateElement.toString = () => 'function createElement() { [native code] }'
    document.createElement = proxyCreateElement

    setTimeout(() => {
      mediaElements.clear()
      window.__metastreamMediaElements = undefined
    }, 5e3)

    try {
      // Fix for setting document.domain in sandboxed iframe (twitch.tv)
      Object.defineProperty(document, 'domain', {
        value: document.domain,
        writable: true
      })
    } catch (e) {}
  }

  const script = document.createElement('script')
  script.id = 'metastreaminitscript'
  script.textContent = `(${mainWorldScript}());`
  document.documentElement.appendChild(script)
})()

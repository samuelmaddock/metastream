//
// The first script to be run on every page as to capture media elements
// when they're created.
//
// Has to be run before anything else is executed in the document.
// Declaring the script in the manifest, as opposed to using
// chrome.tabs.executeScript, seems to be the only way to achieve this from
// my own testing.
// https://bugs.chromium.org/p/chromium/issues/detail?id=471801
//

;(function() {
  const mainWorldScript = function() {
    document.getElementById('metastreaminitscript').remove()

    // Only run in iframes, the same as Metastream webviews
    if (window.self === window.top) return

    const mediaElements = (window.__metastreamMediaElements = new Set())

    // Proxy document.createElement to trap media elements created in-memory
    const origCreateElement = document.createElement
    const proxyCreateElement = function() {
      const element = origCreateElement.apply(document, arguments)
      if (element instanceof HTMLMediaElement) {
        mediaElements.add(element)
      }
      return element
    }
    proxyCreateElement.toString = origCreateElement.toString.bind(origCreateElement)
    document.createElement = proxyCreateElement

    setTimeout(() => {
      mediaElements.clear()
      window.__metastreamMediaElements = undefined
    }, 5e3)

    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')
    if (isFirefox) {
      const domains = ['twitch.tv', 'crunchyroll.com']

      // Fix for setting document.domain in sandboxed iframe
      try {
        const { domain } = document
        if (domain && domains.some(d => domain.includes(d))) {
          Object.defineProperty(document, 'domain', {
            value: domain,
            writable: true
          })
        }
      } catch (e) {}
    }
  }

  const script = document.createElement('script')
  script.id = 'metastreaminitscript'
  script.textContent = `(${mainWorldScript}());`
  if (document.documentElement) {
    document.documentElement.appendChild(script)
  }
})()

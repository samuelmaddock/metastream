'use strict'

//
// The player script observes the contents of the page for media elements to
// remotely control. Information regarding the media is sent to the host
// application to determine how playback should be handled. Certain playback
// events are also sent to the page such as play, pause, seek, and volume.
//

console.debug(`Metastream player content script ${location.href}`)

// Listen for events from the main world to forward to the
// background process
const mediaEventMiddleware = event => {
  const { data } = event
  if (typeof data !== 'object' || !data.type) return

  if (data.type === 'metastream-receiver-event') {
    chrome.runtime.sendMessage(data)
  }
}
window.addEventListener('message', mediaEventMiddleware)

// Code within function will be injected into main world.
// No closure variables are allowed within the function body.
// TODO: compile this from separate file
const mainWorldScript = function() {
  // Injected by Metastream

  const SEC2MS = 1000

  console.debug(`Metastream main world script ${location.href}`)

  // Listen for app actions
  document.addEventListener(
    'metastreamReceiverAction',
    event => {
      event.stopImmediatePropagation()
      console.log('Metastream receiver action', event.detail)
      const { type, payload } = event.detail
      switch (type) {
        case 'set-media-playback':
          break
        case 'seek-media':
          break
        case 'set-media-volume':
          break
      }
    },
    true
  )

  // TODO:
  const checkMediaReady = event => {
    const { target } = event
    if (target instanceof HTMLMediaElement) {
      const { duration } = target
      dispatchMediaEvent({
        type: 'media-ready',
        payload: {
          duration: duration ? duration * SEC2MS : undefined
        }
      })
    }
  }
  document.addEventListener('play', checkMediaReady, true)
  document.addEventListener('durationchange', checkMediaReady, true)

  // Dispatch event
  // main world -> content script world -> background -> metastream content script -> metastream app
  const dispatchMediaEvent = action => {
    window.postMessage({ type: 'metastream-receiver-event', payload: action })
  }
}

// Get inner function body to inject
let code = mainWorldScript.toString()
code = code.substring(12, code.length - 1)

// Inject script into documentElement as the body won't be ready yet.
// Needs to be inline script to prevent any async loading.
const script = document.createElement('script')
script.innerHTML = `(function(){${code}}())`
document.documentElement.appendChild(script)

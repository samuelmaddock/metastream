'use strict'

//
// The app script handles bidirectional communication with the background
// script from the Metastream application.
//
;(function app() {
  if (window.self !== window.top) {
    console.warn('Metastream is unsupported within subframes.')
    return
  }

  // Notify background script of initialization request
  chrome.runtime.sendMessage({ type: 'metastream-init' }, initialized => {
    // TODO: notify app of initialization response
    console.debug(`[Metastream Remote] Initialized`, initialized)
  })

  let internalMessage = false

  // Listen for subframe events
  chrome.runtime.onMessage.addListener(message => {
    if (typeof message !== 'object' || typeof message.type !== 'string') return

    if (message.type.startsWith('metastream-')) {
      console.debug('[Metastream Remote] Received message', message)

      // Send to main world
      internalMessage = true
      window.postMessage(message, location.origin)
    }
  })

  // Listen for events to forward to background script
  window.addEventListener('message', event => {
    if (internalMessage) {
      internalMessage = false
      return
    }

    const { data: action } = event
    if (typeof action !== 'object' && typeof action.type !== 'string') return

    if (action.type.startsWith('metastream-')) {
      console.debug('[Metastream Remote] Forwarding message to background', action)
      chrome.runtime.sendMessage(action)
    }
  })
})()

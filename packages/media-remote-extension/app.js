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

  // Dispatch action to main world
  const dispatch = action => {
    window.postMessage(action, location.origin)
  }

  // Notify background script of initialization request
  chrome.runtime.sendMessage('initMetastream', initialized => {
    // TODO: notify app of initialization response
    console.log(`Metastream initialized`, initialized)
  })

  // Listen for subframe events
  chrome.runtime.onMessage.addListener(message => {
    if (typeof message !== 'object') return

    if (message.type === 'metastream-receiver-event') {
      // TODO: send to app in main world
      console.log('app content script received', message)
      dispatch(message.payload)
    }
  })

  // Listen for events to forward to background script
  window.addEventListener('message', event => {
    const { data: action } = event
    if (typeof action !== 'object' && typeof action.type !== 'string') return

    if (action.type === 'metastream-host-event') {
      chrome.runtime.sendMessage(action)
    }
  })
})()

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

  chrome.runtime.sendMessage('initMetastream', initialized => {
    // TODO: notify app of initialization response
    console.log(`Metastream initialized`, initialized)
  })

  chrome.runtime.onMessage.addListener(message => {
    if (typeof message === 'object' && message.type === 'metastream-receiver-event') {
      // TODO: send to app in main world
      console.log('app content script received', message)
    }
  })
})()

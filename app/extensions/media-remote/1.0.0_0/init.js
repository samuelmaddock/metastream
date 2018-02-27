'use strict'
;(function contentInit() {
  function dispatch(eventName, data) {
    const evt = new CustomEvent(eventName, { detail: data })
    console.log(`[MediaRemote] Dispatch ${eventName} (${location.hostname})`, document)
    document.dispatchEvent(evt)
  }

  if (chrome.ipcRenderer) {
    const { ipcRenderer } = chrome

    ipcRenderer.on('media-action', (event, action) => {
      console.log(`[MediaRemote] RECEIVE LISTEN EVENT ${location.href}`, action)

      switch (action.type) {
        case 'seek':
          dispatch('CMediaSeek', action.payload)
          break
        case 'playback':
          dispatch('CMediaPlaybackChange', action.payload)
          break
        case 'volume':
          dispatch('CMediaVolumeChange', action.payload)
          break
      }
    })

    console.log(`[MediaRemote] Setting up IPC listeners (${location.hostname})`, chrome)
    ipcRenderer.send('media-register-listener', location.href)

    window.addEventListener('message', e => {
      if (e.source !== window) return

      const { type, ...payload } = e.data

      switch (type) {
        case 'CMediaReady':
          console.debug(`[MediaRemote] Forwarding media-ready event to host`, payload)
          ipcRenderer.sendToHost('media-ready', payload)
      }
    })
  } else {
    console.log(`[MediaRemote] ipcRenderer not available (${location.hostname})`, chrome)
  }

  const MAX_ATTEMPTS = 10
  function insertPlayerScript(attempt = 1) {
    if (attempt > MAX_ATTEMPTS) {
      return
    }

    // TODO: do not use synchronous XHR in production! inline code instead
    const x = new XMLHttpRequest()
    x.open('GET', chrome.runtime.getURL('player.js'), false)
    x.send()
    const actualCode = x.responseText

    const script = document.createElement('script')
    // script.src = chrome.runtime.getURL('player.js')
    script.textContent = actualCode
    // script.onload = function () { this.parentNode.removeChild(this) }
    script.onload = () => {
      console.debug(`[MediaRemote] Loaded player.js (${location.href})`)
    }
    script.onerror = () => {
      console.debug(`[MediaRemote] Failed to inject player script (attempt=${attempt})`)
      setTimeout(insertPlayerScript, attempt * 100, ++attempt)
    }
    document.documentElement.appendChild(script)
  }

  insertPlayerScript()
})()

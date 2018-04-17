'use strict'
;(function contentInit() {
  const { ipcRenderer } = chrome

  function dispatch(eventName, data) {
    const evt = new CustomEvent(eventName, { detail: data })
    console.log(`[MediaRemote] Dispatch ${eventName} (${location.hostname})`, document)
    document.dispatchEvent(evt)
  }

  function setFullscreen(fullscreen) {
    if (fullscreen && !document.webkitFullscreenElement) {
      // TODO
    } else if (!fullscreen && document.webkitFullscreenElement) {
      document.webkitExitFullscreen()
    }
  }

  const attachIpcListeners = () => {
    if (!ipcRenderer) return;
    console.log(`[MediaRemote] Setting up IPC listeners (${location.hostname})`)

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
        case 'interact':
          const interacting = action.payload
          setFullscreen(!interacting)
          break
      }
    })

    function compareElementArea(a, b) {
      const areaA = a.width * a.height;
      const areaB = b.width * b.height;
      if (areaA < areaB) return -1;
      if (areaA > areaB) return 1;
      return 0;
    }

    function isIFrameAtPoint(p) {
      const elem = document.elementFromPoint(p.x, p.y)
      return elem instanceof HTMLIFrameElement
    }

    ipcRenderer.on('media-iframes', (event, href) => {
      const frame = document.querySelector(`iframe[src='${href}']`)
      if (frame) {
        let rect = frame.getBoundingClientRect()

        window.scrollTo(0, rect.top)
        window.scrollY // trigger reflow

        rect = frame.getBoundingClientRect()
        const point = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        if (isIFrameAtPoint(point)) {
          ipcRenderer.sendToHost('media-iframes', [point])
        } else {
          console.debug(`IFrame not found at ${JSON.stringify(point)}`)
        }
      } else {
        console.error(`[MediaRemote] Couldn't find iframe for href=${href}`)
      }
    })

    ipcRenderer.send('media-register-listener', location.href)
  }

  const isTopFrame = window.self === window.top

  if (isTopFrame) {
    attachIpcListeners()
  }

  window.addEventListener('message', e => {
    if (e.source !== window) return
    const { type, ...payload } = e.data

    switch (type) {
      case 'CMediaReady':
        console.debug(`[MediaRemote] Forwarding media-ready event to host`, payload)

        // Lazy init for iframes
        if (!isTopFrame) {
          attachIpcListeners()
        }

        if (ipcRenderer) {
          ipcRenderer.sendToHost('media-ready', payload)
        }
        break
    }
  })

  const MAX_ATTEMPTS = 10
  function insertPlayerScript(attempt = 1) {
    if (attempt > MAX_ATTEMPTS) {
      return
    }

    // TODO: inline this code instead of sync xhr
    const x = new XMLHttpRequest()
    x.open('GET', chrome.runtime.getURL('player.js'), false)
    x.send()
    const actualCode = x.responseText

    const script = document.createElement('script')
    script.textContent = actualCode
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

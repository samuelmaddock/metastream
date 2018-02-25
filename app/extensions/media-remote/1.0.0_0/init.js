(function contentInit() {
  function dispatch(eventName, data) {
    const evt = new CustomEvent(eventName, { detail: data })
    console.log(`[MediaRemote] Dispatch ${eventName} (${location.hostname})`, document)
    document.dispatchEvent(evt)
  }

  if (chrome.ipcRenderer) {
    const { ipcRenderer } = chrome

    console.log(`[MediaRemote] Setting up IPC listeners (${location.hostname})`, chrome)

    ipcRenderer.on('media-seek', (event, time) => {
      dispatch('CMediaSeek', time)
    })

    ipcRenderer.on('media-playback', (event, playbackState) => {
      dispatch('CMediaPlaybackChange', playbackState)
    })

    ipcRenderer.on('media-volume', (event, volume) => {
      console.log(`[MediaRemote] IPC volume change (${location.hostname})`)
      dispatch('CMediaVolumeChange', volume)
    })

    window.addEventListener('message', e => {
      if (e.source !== window) return

      const { type, ...payload } = e.data;

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

    const elem = document.createElement('script')
    elem.src = chrome.runtime.getURL('player.js')
    document.documentElement.appendChild(elem)

    elem.onload = () => {
      console.debug(`[MediaRemote] Loaded player.js (${location.href})`)
    }

    elem.onerror = () => {
      setTimeout(insertPlayerScript, attempt * 100, ++attempt)
    }
  }

  insertPlayerScript()
}())

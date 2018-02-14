function dispatch(eventName, data) {
  const evt = new CustomEvent(eventName, { detail: data })
  document.dispatchEvent(evt)
}

if (chrome.ipcRenderer) {
  const { ipcRenderer } = chrome

  ipcRenderer.on('media-seek', (event, time) => {
    dispatch('CMediaSeek', time)
  })

  ipcRenderer.on('media-playback', (event, playbackState) => {
    dispatch('CMediaPlaybackChange', playbackState)
  })

  ipcRenderer.on('media-volume', (event, volume) => {
    dispatch('CMediaVolumeChange', volume)
  })

  document.addEventListener('CMediaReady', e => {
    ipcRenderer.sendToHost('media-ready')
  })
}

const MAX_ATTEMPTS = 10
function insertPlayerScript(attempt = 1) {
  if (attempt > MAX_ATTEMPTS) {
    console.log('FUCK')
    return
  }

  const elem = document.createElement('script')
  elem.src = chrome.runtime.getURL('player.js')
  document.documentElement.appendChild(elem)

  elem.onload = () => {
    console.debug(`[MediaRemote] Loaded player.js`)
  }

  elem.onerror = () => {
    setTimeout(insertPlayerScript, attempt * 100, ++attempt)
  }
}

insertPlayerScript()

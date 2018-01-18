const { ipcRenderer } = chrome;

function dispatch(eventName, data) {
  const evt = new CustomEvent(eventName, {detail: data});
  document.dispatchEvent(evt);
}

ipcRenderer.on('media-seek', (event, time) => {
  dispatch('CMediaSeek', time);
});

ipcRenderer.on('media-playback', (event, playbackState) => {
  dispatch('CMediaPlaybackChange', playbackState);
});

ipcRenderer.on('media-volume', (event, volume) => {
  dispatch('CMediaVolumeChange', volume);
});

document.addEventListener('CMediaReady', (e) => {
  ipcRenderer.sendToHost('media-ready');
});

const elem = document.createElement('script');
elem.src = chrome.runtime.getURL('player.js');
document.documentElement.appendChild(elem);

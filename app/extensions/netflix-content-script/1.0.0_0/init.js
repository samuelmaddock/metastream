const { ipcRenderer } = chrome;

ipcRenderer.on('media-seek', (event, time) => {
  console.log('seek', time);
});

ipcRenderer.on('media-playback', (event, playbackState) => {
  console.log('playback', playbackState);
});

ipcRenderer.on('media-volume', (event, volume) => {
  console.log('volume', volume);
});

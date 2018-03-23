console.log('[MediaRemote] Clearing Spotify storage')
localStorage.clear()
sessionStorage.clear()

{
  const oldGetItem = localStorage.getItem;
  localStorage.getItem = function (key) {
    if (key === 'playbackHistory') {
      return '[]'
    }
    return oldGetItem.apply(this,arguments)
  }
}

Array.from(document.querySelectorAll('video, audio'))
  .filter(media => media.currentTime > 0)
  .map(media => Math.floor(media.currentTime))
  .shift()

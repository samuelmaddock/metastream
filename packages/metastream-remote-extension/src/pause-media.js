;(function() {
  Array.from(document.querySelectorAll('video, audio')).forEach(media => {
    if (!media.paused) media.pause()
  })
})()

;(function() {
  let pauseTimeoutId = -1

  document.addEventListener('metastreamplay', e => {
    clearTimeout(pauseTimeoutId)
  })

  // Pausing soon after seek doesn't work well on Disney+ so we'll wait and try again
  document.addEventListener('metastreampause', e => {
    clearTimeout(pauseTimeoutId)
    pauseTimeoutId = setTimeout(() => {
      const vid = document.querySelector('video')
      if (vid) vid.pause()
    }, 300)
  })
})()

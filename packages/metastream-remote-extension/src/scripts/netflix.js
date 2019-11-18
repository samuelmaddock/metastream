'use strict'
;(function() {
  const mainWorldScript = function() {
    const netflixPlayer = () => {
      let player
      try {
        const { videoPlayer } = netflix.appContext.state.playerApp.getAPI()
        const playerSessionId = videoPlayer.getAllPlayerSessionIds().find(Boolean)
        player = videoPlayer.getVideoPlayerBySessionId(playerSessionId)
      } catch (e) {}
      return player || null
    }

    document.addEventListener('metastreamplay', e => {
      e.preventDefault()
      const player = netflixPlayer()
      if (player && player.getPaused()) {
        player.play()
      }
    })

    document.addEventListener('metastreampause', e => {
      e.preventDefault()
      const player = netflixPlayer()
      if (player && !player.getPaused()) {
        player.pause()
      }
    })

    document.addEventListener('metastreamseek', e => {
      e.preventDefault()
      const player = netflixPlayer()
      if (player) {
        const time = e.detail
        player.seek(time)
      }
    })
  }

  // Inject inline script at top of DOM to execute as soon as possible
  const script = document.createElement('script')
  script.textContent = `(${mainWorldScript}());`
  document.documentElement.appendChild(script)
})()

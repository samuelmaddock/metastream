'use strict'
;(function() {
  const mainWorldScript = function() {
    const twitchPlayer = () => window.player
    const isVOD = () => {
      const player = twitchPlayer()
      return player ? isFinite(player.getDuration()) : false
    }

    document.addEventListener('metastreamplay', e => {
      const player = twitchPlayer()
      if (player && player.getPaused()) {
        e.preventDefault()
        player.play()
      }
    })

    document.addEventListener('metastreampause', e => {
      const player = twitchPlayer()
      if (player && !player.getPaused()) {
        e.preventDefault()
        player.pause()
      }
    })

    document.addEventListener('metastreamseek', e => {
      const player = twitchPlayer()
      if (player && isVOD()) {
        e.preventDefault()
        const time = e.detail / 1000
        player.setCurrentTime(time)
      }
    })
  }

  // Inject inline script at top of DOM to execute as soon as possible
  const script = document.createElement('script')
  script.textContent = `(${mainWorldScript}());`
  document.documentElement.appendChild(script)
})()

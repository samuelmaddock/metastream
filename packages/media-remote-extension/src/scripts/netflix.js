'use strict'
;(function() {
  const mainWorldScript = function() {
    let netflixPlayer

    const customVideoSession = VideoSession => {
      function CustomVideoSession() {
        VideoSession.apply(this, arguments)
        this._createPlayer = this.createPlayer
        this.createPlayer = function() {
          const player = this._createPlayer.apply(this, arguments)
          netflixPlayer = player
          return player
        }
      }
      CustomVideoSession.prototype = VideoSession.prototype
      return CustomVideoSession
    }

    var target = {}
    var handler = {
      set: function(target, propertyName, value, receiver) {
        if (propertyName === 'player') {
          value.VideoSession = customVideoSession(value.VideoSession)
        }
        target[propertyName] = value
        return true
      }
    }

    var p = new Proxy(target, handler)
    window.netflix = p

    document.addEventListener('metastreamplay', e => {
      e.preventDefault()
      if (netflixPlayer && netflixPlayer.getPaused()) {
        netflixPlayer.play()
      }
    })

    document.addEventListener('metastreampause', e => {
      e.preventDefault()
      if (netflixPlayer && !netflixPlayer.getPaused()) {
        netflixPlayer.pause()
      }
    })

    document.addEventListener('metastreamseek', e => {
      e.preventDefault()
      if (netflixPlayer) {
        const time = e.detail
        netflixPlayer.seek(time)
      }
    })
  }

  // Inject inline script at top of DOM to execute as soon as possible
  const script = document.createElement('script')
  script.textContent = `(${mainWorldScript}());`
  document.documentElement.appendChild(script)
})()

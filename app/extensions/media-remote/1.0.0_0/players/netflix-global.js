'use strict';
;(function() {
  let netflixPlayer

  const customVideoSession = VideoSession => {
    function CustomVideoSession() {
      VideoSession.apply(this, arguments)

      this._createPlayer = this.createPlayer

      this.createPlayer = function() {
        console.debug('CREATE PLAYER', this, arguments)
        const player = this._createPlayer.apply(this, arguments)
        netflixPlayer = player
        window.NETFLIXPLAYER = player
        return player
      }
    }

    CustomVideoSession.prototype = VideoSession

    return CustomVideoSession
  }

  var target = {}
  var handler = {
    set: function(target, propertyName, value, receiver) {
      if (propertyName === 'player') {
        value.VideoSession = customVideoSession(value.VideoSession)
        console.debug('ASSIGNED CUSTOM VIDEO SESSION')
      }

      target[propertyName] = value
      return true
    }
  }

  var p = new Proxy(target, handler)
  window.netflix = p

  document.addEventListener('ms:play', e => {
    e.preventDefault()
    if (netflixPlayer && netflixPlayer.getPaused()) {
      netflixPlayer.play()
    }
  })

  document.addEventListener('ms:pause', e => {
    e.preventDefault()
    if (netflixPlayer && !netflixPlayer.getPaused()) {
      netflixPlayer.pause()
    }
  })

  document.addEventListener('ms:seek', e => {
    e.preventDefault()
    if (netflixPlayer) {
      const time = e.detail
      netflixPlayer.seek(time)
    }
  })

  console.debug('Setup proxy netflix object')
})()

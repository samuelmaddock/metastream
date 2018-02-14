'use strict'
;(async function initMediaRemote() {
  const maskNative = obj => {
    obj.toString = 'function createElement() { [native code] }'
  }

  /** https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState */
  const MediaReadyState = {
    HAVE_NOTHING: 0,
    HAVE_METADATA: 1,
    HAVE_CURRENT_DATA: 2,
    HAVE_FUTURE_DATA: 3,
    HAVE_ENOUGH_DATA: 4
  }

  const PlaybackState = {
    Idle: 0,
    Playing: 1,
    Paused: 2
  }

  let player
  let mediaList = new WeakSet()
  let activeMedia

  const signalReady = () => {
    const evt = new CustomEvent('CMediaReady')
    document.dispatchEvent(evt)
  }

  const setMedia = media => {
    activeMedia = media
    player = new HTMLMediaPlayer(media)
    console.debug('Set active media', media, media.src, media.duration)
    window.MEDIA = media
    ;['seekable', 'seeked'].forEach(eventName => {
      media.addEventListener(eventName, event => {
        console.debug(`stopImmediate ${eventName} capture=false`)
        event.stopImmediatePropagation()
        event.stopPropagation()
      })

      media.addEventListener(
        eventName,
        event => {
          console.debug(`stopImmediate ${eventName} capture=true`)
          event.stopImmediatePropagation()
          event.stopPropagation()
        },
        true
      )
    })

    signalReady()
  }

  const addMedia = media => {
    if (mediaList.has(media)) {
      return
    }

    console.debug('Add media', media, media.src, media.duration)
    mediaList.add(media)

    const eventLogger = function(e) {
      console.debug(`Event: ${e.type}`, e)
    }

    // if (process.env.NODE_ENV === 'development' && !media.__debug__) {
    if (!media.__debug__) {
      const events = [
        'loadeddata',
        'canplay',
        'playing',
        'play',
        'pause',
        'durationchange',
        'seeking'
      ]
      events.forEach(eventName => {
        media.addEventListener(eventName, eventLogger)
      })
      media.__debug__ = true
    }

    // Checks for media when it starts playing
    function checkMediaReady() {
      // Soundcloud fix
      if (isNaN(media.duration)) {
        return
      }

      if (media.readyState >= MediaReadyState.HAVE_CURRENT_DATA) {
        setMedia(media)
        media.removeEventListener('playing', checkMediaReady)
      }
    }
    media.addEventListener('playing', checkMediaReady)
  }

  /** Interval time (ms) to detect video element. */
  const DETECT_INTERVAL = 500

  /** Threshold before we'll seek. */
  const SEEK_THRESHOLD = 2000

  const OldAudio = window.Audio

  /** Proxy `new Audio` to trap audio elements created in-memory. */
  var ProxyAudio = new Proxy(function() {}, {
    construct: function(target, argumentsList, newTarget) {
      console.debug('Audio constructor called: ' + argumentsList.join(', '))
      return new OldAudio(...argumentsList)
    }
  })
  window.Audio = ProxyAudio

  const origCreateElement = document.createElement
  const capturedTags = new Set(['audio', 'video'])

  /** Proxy document.createElement to trap media elements created in-memory. */
  const proxyCreateElement = function(tagName) {
    const element = origCreateElement.call(document, tagName)
    const name = tagName.toLowerCase()

    if (capturedTags.has(name)) {
      console.debug(`[MediaRemote] Created ${tagName} element`)
      console.trace()
      window.TEST = element

      // Wait for attributes to be set
      setTimeout(addMedia, 0, element)
    }

    return element
  }

  maskNative(proxyCreateElement)
  document.createElement = proxyCreateElement

  /** Abstraction around HTML video tag. */
  class HTMLMediaPlayer {
    constructor(media) {
      console.debug('Constructing HTMLMediaPlayer')
      this.media = media

      this.onPlay = this.onPlay.bind(this)
      this.onVolumeChange = this.onVolumeChange.bind(this)

      this.media.addEventListener('play', this.onPlay, false)
      this.media.addEventListener('volumechange', this.onVolumeChange, false)
    }

    play() {
      this.media.play()
    }
    pause() {
      this.media.pause()
    }
    getCurrentTime() {
      return this.media.currentTime
    }
    getDuration() {
      return this.media.duration
    }
    seek(time) {
      if (this.customSeek(time)) {
        return
      }

      // Infinity is generally used for a dynamically allocated media object
      // or live media
      if (this.getDuration() === Infinity) {
        return
      }

      // Only seek if we're off by greater than our threshold
      if (this.timeExceedsThreshold(time)) {
        this.media.currentTime = time / 1000
      }
    }
    setVolume(volume) {
      // MUST SET THIS FIRST
      this.volume = volume

      this.media.volume = volume

      if (this.media.muted && volume > 0) {
        this.media.muted = false
      }
    }

    customSeek(time) {
      if (!this.timeExceedsThreshold(time)) {
        return false
      }

      // HACK: SoundCloud fallback
      if (location.hostname.indexOf('soundcloud.com') >= 0) {
        const action = { method: 'seekTo', value: time }
        const json = JSON.stringify(action)
        postMessage(json, location.origin)
        return true
      }

      if (location.hostname.indexOf('netflix.com') >= 0) {
        const player = window.NETFLIXPLAYER
        if (player) {
          player.seek(time)
          console.debug('Proxied netflix seek', time)
        }
        return true
      }

      return false
    }

    /** Only seek if we're off by greater than our threshold */
    timeExceedsThreshold(time) {
      const dt = Math.abs(time / 1000 - this.getCurrentTime()) * 1000
      return dt > SEEK_THRESHOLD
    }

    /** Set volume as soon as playback begins */
    onPlay() {
      if (typeof this.volume === 'number') {
        this.setVolume(this.volume)
      }
    }

    /** Prevent third-party service from restoring cached volume */
    onVolumeChange() {
      const { volume } = this
      if (volume && this.media.volume !== volume) {
        console.debug(`Volume changed internally (${this.media.volume}), reverting to ${volume}`)
        this.setVolume(volume)
      }
    }
  }

  /** Detect video content on page */
  const detectPlayer = () => {
    const video = document.querySelector('video')

    if (video) {
      console.debug(`Found video element!`, player, video)
      addMedia(video)
    } else {
      setTimeout(detectPlayer, DETECT_INTERVAL)
      // console.info(`Couldn't find video element on page, trying again in 2 sec.`);
    }
  }

  /** Setup IPC message listeners */
  const setupListeners = () => {
    const mediaRemote = {}

    document.addEventListener('CMediaSeek', e => {
      console.log('SEEK EVENT', e)
      const time = e.detail
      console.info(`Received seek command [time=${time}]`)
      if (player) {
        player.seek(time)
      }
    })

    document.addEventListener('CMediaPlaybackChange', e => {
      const state = e.detail
      console.info(`Received playback command [state=${state}]`)
      if (player) {
        switch (state) {
          case PlaybackState.Playing:
            player.play()
            break
          case PlaybackState.Paused:
            player.pause()
            break
        }
      }
    })

    document.addEventListener('CMediaVolumeChange', e => {
      const volume = e.detail
      console.info(`Received volume command [volume=${volume}]`)
      if (player) {
        player.setVolume(volume)
      }
    })

    window.mediaRemote = mediaRemote
  }

  setupListeners()

  const pageLoad = new Promise(resolve => {
    window.onload = resolve
  })

  const loadTimeout = new Promise(resolve => {
    setTimeout(resolve, 100)
  })

  await Promise.race([pageLoad, loadTimeout])
  detectPlayer()
})()

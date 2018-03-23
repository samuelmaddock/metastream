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

  const SEC2MS = 1000
  const MIN_DURATION = 1
  const TEN_HOURS = 36000
  const isValidDuration = duration => typeof duration === 'number' && !isNaN(duration) && duration < TEN_HOURS && duration > MIN_DURATION

  const getVideoDuration = () => {
    let duration

    if (activeMedia) {
      duration = activeMedia.duration
      if (isValidDuration(duration)) return duration;
    }

    const { player } = window;
    if (typeof player === 'object' && typeof player.getDuration === 'function') {
      try {
        duration = player.getDuration()
      } catch (e) {}
      if (isValidDuration(duration)) return duration;
    }
  }

  const signalReady = () => {
    const duration = getVideoDuration()

    window.postMessage({
      type: 'CMediaReady',
      duration: duration && duration * SEC2MS,
      iframe: window.self !== window.top,
      href: location.href
    }, '*')
  }

  const getVideoContainer = video => {
    const videoRect = video.getBoundingClientRect()

    const area = videoRect.width * videoRect.height
    const fillPercent = videoRect.width / window.innerWidth

    // Don't select a container if our video is already the full width
    if (fillPercent > 0.95) {
      return;
    }

    let parent = video
    let prev = video
    while ((parent = parent.parentNode) && parent instanceof HTMLElement) {
      const rect = parent.getBoundingClientRect()

      // Container expands past video
      if (rect.width > videoRect.width) {
        continue;
      }

      const vidMidY = videoRect.top + (videoRect.height / 2)
      const parentMidY = rect.top + (rect.height / 2)
      const isVideoVerticallyCentered = Math.abs(vidMidY - parentMidY) < 50; // px
      if (!isVideoVerticallyCentered) {
        continue;
      }

      // Save last known container element
      prev = parent
    }
    return prev
  }

  const fullscreenMedia = () => {
    if (document.webkitFullscreenElement) {
      return
    }

    if (activeMedia) {
      activeMedia.controls = false
      const container = getVideoContainer(activeMedia)
      if (container) {
        container.webkitRequestFullScreen()
      }
    }
  }

  const setMedia = media => {
    activeMedia = media
    player = new HTMLMediaPlayer(media)
    console.debug('Set active media', media, media.src, media.duration)
    window.MEDIA = media

    // Prevent media seeking
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

    // Immediately mute to prevent being really loud
    media.volume = 0

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
        return false
      }

      if (media.readyState >= MediaReadyState.HAVE_CURRENT_DATA) {
        setMedia(media)
        media.removeEventListener('playing', checkMediaReady)
        media.removeEventListener('durationchange', checkMediaReady)
        return true
      }

      return false
    }

    if (media.paused || !checkMediaReady()) {
      media.addEventListener('playing', checkMediaReady)
      media.addEventListener('durationchange', checkMediaReady)
    }
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
      this.media = media

      this.onPlay = this.onPlay.bind(this)
      this.onVolumeChange = this.onVolumeChange.bind(this)

      this.media.addEventListener('play', this.onPlay, false)
      this.media.addEventListener('volumechange', this.onVolumeChange, false)
    }

    dispatch(eventName, detail) {
      const e = new CustomEvent(eventName, { detail: detail, cancelable: true, bubbles: false })
      document.dispatchEvent(e)
      return e.defaultPrevented
    }

    play() {
      if (this.dispatch('ms:play')) return

      this.media.play()
    }
    pause() {
      if (this.dispatch('ms:pause')) return
      this.media.pause()
    }
    getCurrentTime() {
      return this.media.currentTime
    }
    getDuration() {
      return this.media.duration
    }
    seek(time) {
      if (this.dispatch('ms:seek', time)) return

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
      console.info(`Received volume command [volume=${volume}] (${location.hostname})`)
      if (player) {
        player.setVolume(volume)
      }
    })

    document.addEventListener('mouseup', e => {
      if (e.movementX === 1234) {
        e.stopImmediatePropagation()
        e.preventDefault()
        console.log(`Fullscreen mouseup event`, e, location.href)
        fullscreenMedia()
      }
    })
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

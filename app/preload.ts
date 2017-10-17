import { ipcRenderer } from 'electron';
import { PlaybackState } from 'lobby/reducers/mediaPlayer';

if (process.env.NODE_ENV === 'development') {
  (window as any).__devtron = { require: eval('require'), process };
}

// HACK: Fix SoundCloud not autoplaying
localStorage.clear();

/** https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState */
const enum MediaReadyState {
  HAVE_NOTHING,
  HAVE_METADATA,
  HAVE_CURRENT_DATA,
  HAVE_FUTURE_DATA,
  HAVE_ENOUGH_DATA
}

let player: IMediaPlayer;
let mediaList: HTMLMediaElement[] = [];
let activeMedia: HTMLMediaElement;

const setMedia = (media: HTMLMediaElement) => {
  activeMedia = media;
  player = new HTMLMediaPlayer(media);
  ipcRenderer.sendToHost('media-ready');
  console.debug('Set active media', media, media.src, media.duration);
  (window as any).MEDIA = media;
};

const addMedia = (media: HTMLMediaElement) => {
  console.debug('Add media', media, media.src, media.duration);
  mediaList.push(media);

  const eventLogger = function(e: MediaStreamEvent) {
    console.debug(`Event: ${e.type}`, e);
  };

  const events = ['loadeddata', 'canplay', 'playing', 'play', 'pause', 'durationchange', 'seeking'];
  events.forEach(eventName => {
    media.addEventListener(eventName, eventLogger);
  });

  // Checks for media when it starts playing
  function checkMediaReady() {
    // Soundcloud fix
    if (isNaN(media.duration)) {
      return;
    }

    if (media.readyState >= MediaReadyState.HAVE_CURRENT_DATA) {
      setMedia(media);
      media.removeEventListener('playing', checkMediaReady);
    }
  }
  media.addEventListener('playing', checkMediaReady);
};

/** Interval time (ms) to detect video element. */
const DETECT_INTERVAL = 500;

/** Threshold before we'll seek. */
const SEEK_THRESHOLD = 1;

const OldAudio = (window as any).Audio;

/** Proxy `new Audio` to trap audio elements created in-memory. */
var ProxyAudio = new Proxy(function() {}, {
  construct: function(target, argumentsList, newTarget) {
    console.debug('Audio constructor called: ' + argumentsList.join(', '));
    return new OldAudio(...argumentsList);
  }
});
(window as any).Audio = ProxyAudio;

const origCreateElement = document.createElement;

/** Proxy document.createElement to trap media elements created in-memory. */
const proxyCreateElement = function(tagName: string) {
  const element = origCreateElement.call(document, tagName);
  let track = false;

  const name = tagName.toLowerCase();
  switch (name) {
    case 'audio':
      console.debug('CREATED AUDIO ELEMENT');
      console.trace();
      (window as any).TEST = element;
      track = true;
      break;
    case 'video':
      console.debug('CREATED VIDEO ELEMENT');
      console.trace();
      (window as any).TEST = element;
      track = true;
      break;
  }

  if (track) {
    // Wait for properties to be set
    setTimeout(addMedia, 0, element);
  }

  return element;
};

/** Sneaky beaky */
proxyCreateElement.toString = function() {
  return 'function createElement() { [native code] }';
};

(document as any).createElement = proxyCreateElement;

interface IMediaPlayer {
  play(): void;
  pause(): void;
  getCurrentTime(): number;
  getDuration(): number;
  seek(time: number): void;
  setVolume(vol: number): void;
}

/** Abstraction around HTML video tag. */
class HTMLMediaPlayer implements IMediaPlayer {
  private volume?: number;

  constructor(private media: HTMLMediaElement) {
    this.media.addEventListener('play', this.onPlay, false);
    this.media.addEventListener('volumechange', this.onVolumeChange, false);
  }

  play(): void {
    this.media.play();
  }
  pause(): void {
    this.media.pause();
  }
  getCurrentTime(): number {
    return this.media.currentTime;
  }
  getDuration(): number {
    return this.media.duration;
  }
  seek(time: number): void {
    // Ignore seek requests for live media
    if (this.getDuration() === Infinity) {
      return;
    }

    const targetTime = time / 1000;
    const curTime = this.media.currentTime;
    const dt = Math.abs(targetTime - curTime);

    // Only seek if we're off by greater than our threshold
    if (dt > SEEK_THRESHOLD) {
      this.media.currentTime = targetTime;
    }
  }
  setVolume(volume: number): void {
    this.media.volume = this.volume = volume;
  }

  /** Set volume as soon as playback begins */
  private onPlay = (): void => {
    this.setVolume(this.volume || 1);
  };

  /** Prevent third-party service from restoring cached volume */
  private onVolumeChange = (): void => {
    const { volume } = this;
    if (volume && this.media.volume !== volume) {
      console.debug(`Volume changed internally (${this.media.volume}), reverting to ${volume}`);
      this.setVolume(volume);
    }
  };
}

/** Detect video content on page */
const detectPlayer = () => {
  // console.info('Searching for video element...');

  const video = document.querySelector('video');

  if (video) {
    console.debug(`Found video element!`, player, video);
    addMedia(video);
  } else {
    setTimeout(detectPlayer, DETECT_INTERVAL);
    // console.info(`Couldn't find video element on page, trying again in 2 sec.`);
  }
};

/** Setup IPC message listeners */
const setupListeners = () => {
  ipcRenderer.on('media-seek', (event: Electron.IpcMessageEvent, time: number) => {
    console.info(`Received seek command [time=${time}]`);
    if (player) {
      player.seek(time);
    }
  });

  ipcRenderer.on('media-playback', (event: Electron.IpcMessageEvent, state: PlaybackState) => {
    console.info(`Received playback command [state=${state}]`);
    if (player) {
      switch (state) {
        case PlaybackState.Playing:
          player.play();
          break;
        case PlaybackState.Paused:
          player.pause();
          break;
      }
    }
  });

  ipcRenderer.on('media-volume', (event: Electron.IpcMessageEvent, volume: number) => {
    console.info(`Received volume command [volume=${volume}]`);
    if (player) {
      player.setVolume(volume);
    }
  });
};

const init = () => {
  console.info(`Preload init...`);
  setupListeners();
  console.info(`DONE`);
};

const pageloadInit = () => {
  console.info(`Preload 'onload'...`);
  detectPlayer();
  console.info(`Ran preload 'onload' listener`);
};
window.onload = pageloadInit;

init();

import { ipcRenderer } from 'electron';
import { PlaybackState } from 'lobby/reducers/mediaPlayer';

/** Interval time (ms) to detect video element. */
const DETECT_INTERVAL = 500;

/** Threshold before we'll seek. */
const SEEK_THRESHOLD = 1;

const OldAudio = (window as any).Audio;

/** Proxy `new Audio` to trap audio elements created in-memory. */
var ProxyAudio = new Proxy(function() {}, {
  construct: function(target, argumentsList, newTarget) {
    console.log('Audio constructor called: ' + argumentsList.join(', '));
    return new OldAudio(...argumentsList);
  }
});
(window as any).Audio = ProxyAudio;

const origCreateElement = document.createElement;

/** Proxy document.createElement to trap audio tags created in-memory. */
const proxyCreateElement = (tagName: string) => {
  const element = origCreateElement.call(document, tagName);

  const name = tagName.toLowerCase();
  switch (name) {
    case 'audio':
      console.log('CREATED AUDIO ELEMENT');
      console.trace();
      (window as any).TEST = element;
      break;
  }

  return element;
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
class HTMLVideoPlayer implements IMediaPlayer {
  private video: HTMLVideoElement;

  constructor(video: HTMLVideoElement) {
    this.video = video;
  }

  play(): void {
    this.video.play();
  }
  pause(): void {
    this.video.pause();
  }
  getCurrentTime(): number {
    return this.video.currentTime;
  }
  getDuration(): number {
    return this.video.duration;
  }
  seek(time: number): void {
    // Ignore seek requests for live media
    if (this.getDuration() === Infinity) {
      return;
    }

    const targetTime = time / 1000;
    const curTime = this.video.currentTime;
    const dt = Math.abs(targetTime - curTime);

    // Only seek if we're off by greater than our threshold
    if (dt > SEEK_THRESHOLD) {
      this.video.currentTime = targetTime;
    }
  }
  setVolume(vol: number): void {
    this.video.volume = vol;
  }
}

let player: IMediaPlayer;

/** Detect video content on page */
const detectPlayer = () => {
  console.info('Searching for video element...');

  const video = document.querySelector('video');

  if (video) {
    player = new HTMLVideoPlayer(video);
    console.log(`Found video element!`, player, video);
    ipcRenderer.sendToHost('media-ready');
  } else {
    setTimeout(detectPlayer, DETECT_INTERVAL);
    console.info(`Couldn't find video element on page, trying again in 2 sec.`);
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
  console.info(`Preload 'onload'...`);
  detectPlayer();
  setupListeners();
  console.info(`Ran preload 'onload' listener`);
};
window.onload = init;

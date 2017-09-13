import { ipcRenderer } from 'electron';

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
    this.video.currentTime = time;
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
  } else {
    setTimeout(detectPlayer, 2000);
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
};

const init = () => {
  console.info(`Preload 'onload'...`);
  detectPlayer();
  setupListeners();
  console.info(`Ran preload 'onload' listener`);
};
window.onload = init;

import { SessionObserver } from 'renderer/lobby/middleware/session'
import { ISessionState } from 'renderer/lobby/reducers/session'
const { ipcRenderer } = chrome

const SCREEN_NAME: { [key: string]: string } = {
  '/': 'Main Menu',
  '/settings': 'Settings'
}

export class DiscordSessionObserver implements SessionObserver {
  onChange(state: ISessionState): void {
    const { media, screenPath } = state

    const activity = {
      details: media ? media.title : 'Nothing playing',
      state: media ? 'Watching' : SCREEN_NAME[screenPath as any] || 'In session',
      startTimestamp: Math.floor((state.startTime || new Date().getTime()) / 1000),
      largeImageKey: 'default',
      instance: false
    }

    ipcRenderer.send('set-discord-activity', activity)
  }
}

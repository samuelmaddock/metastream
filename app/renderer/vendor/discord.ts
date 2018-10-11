import { SessionObserver } from 'renderer/lobby/middleware/session'
import { ISessionState } from 'renderer/lobby/reducers/session'
import { ISettingsState } from '../reducers/settings'
const { ipcRenderer } = chrome

const SCREEN_NAME: { [key: string]: string } = {
  '/': 'Main Menu',
  '/settings': 'Settings'
}

export class DiscordSessionObserver implements SessionObserver {
  setting: any = 'discordPresence'

  applySetting(value: ISettingsState['discordPresence']) {
    ipcRenderer.send('set-discord-enabled', value)
  }

  onChange(state: ISessionState | null): void {
    let activity

    if (state) {
      const { media } = state

      activity = {
        details: media ? media.title : 'Nothing playing',
        state: media ? 'Watching' : 'In session',
        startTimestamp: Math.floor((state.startTime || new Date().getTime()) / 1000),
        largeImageKey: 'default',
        instance: false
      }
    } else {
      activity = {
        state: 'Main Menu',
        largeImageKey: 'default',
        instance: false
      }
    }

    ipcRenderer.send('set-discord-activity', activity)
  }
}

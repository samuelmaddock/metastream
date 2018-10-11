import { SessionObserver } from 'renderer/lobby/middleware/session'
import { ISessionState } from 'renderer/lobby/reducers/session'
import { ISettingsState } from '../../reducers/settings'
const { ipcRenderer } = chrome

class DiscordSessionObserver implements SessionObserver {
  setting: any = 'discordPresence'

  applySetting(value: ISettingsState['discordPresence']) {
    ipcRenderer.send('set-discord-enabled', value)
  }

  onChange(state: ISessionState | null): void {
    let activity

    if (state) {
      const { media, users: partySize } = state

      // Temporary max party until Metastream implements a max
      const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log(partySize) / Math.log(2)))
      const partyMax = Math.max(4, nextPowerOfTwo)

      activity = {
        details: media ? media.title : 'Nothing playing',
        state: 'In Session',
        startTimestamp: Math.floor((state.startTime || new Date().getTime()) / 1000),
        largeImageKey: 'default',
        partySize,
        partyMax,
        partyId: state.id,
        joinSecret: state.secret,
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

export default DiscordSessionObserver

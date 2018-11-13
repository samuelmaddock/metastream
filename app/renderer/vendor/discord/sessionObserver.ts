import { SessionObserver } from 'renderer/lobby/middleware/session'
import { ISessionState } from 'renderer/lobby/reducers/session'
import { ISettingsState } from '../../reducers/settings'
import { encodeDiscordSecret } from './secret'
const { ipcRenderer } = chrome

class DiscordSessionObserver implements SessionObserver {
  setting: any = 'discordPresence'

  applySetting(value: ISettingsState['discordPresence']) {
    ipcRenderer.send('set-discord-enabled', value)
  }

  onChange(state: ISessionState | null): void {
    let activity

    if (state) {
      const { media, users } = state

      const partySize = Math.max(1, users)

      // Temporary max party until Metastream implements a max
      const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log(partySize) / Math.log(2)))
      const partyMax = Math.max(4, nextPowerOfTwo)

      const startTimestamp = Math.floor((state.startTime || Date.now()) / 1000)

      activity = {
        details: media ? media.title : 'Nothing playing',
        state: 'In Session',
        startTimestamp,
        largeImageKey: 'default',
        partySize,
        partyMax,
        instance: false
      }

      if (FEATURE_DISCORD_INVITE) {
        Object.assign(activity, {
          partyId: state.id,
          joinSecret: encodeDiscordSecret(state.secret, state.id)
        })
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

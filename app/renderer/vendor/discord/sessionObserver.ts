import { SessionObserver } from 'renderer/lobby/middleware/session'
import { ISessionState } from 'renderer/lobby/reducers/session'
import { ISettingsState } from '../../reducers/settings'
import { encodeDiscordSecret } from './secret'
import { PlaybackState } from 'renderer/lobby/reducers/mediaPlayer'
import { ipcRenderer } from 'electron'

class DiscordSessionObserver implements SessionObserver {
  setting: any = 'discordPresence'

  applySetting(value: ISettingsState['discordPresence']) {
    ipcRenderer.send('set-discord-enabled', value)
  }

  onChange(state: ISessionState | null): void {
    let activity

    if (state) {
      const { media, users, playback } = state

      const partySize = Math.max(1, users) || 1

      // Temporary max party until Metastream implements a max
      const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log(partySize + 1) / Math.log(2)))
      const partyMax = Math.max(4, nextPowerOfTwo)

      let rpState = 'In Session'
      if (playback === PlaybackState.Paused) {
        rpState += ' - Paused'
      }

      const startTimestamp =
        media && playback === PlaybackState.Playing
          ? Math.floor((state.startTime || Date.now()) / 1000)
          : undefined

      activity = {
        details: media ? media.title : 'Nothing playing',
        state: rpState,
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

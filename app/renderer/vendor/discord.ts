import { SessionObserver } from 'renderer/lobby/middleware/session'
import { ISessionState } from 'renderer/lobby/reducers/session'
const { ipcRenderer } = chrome

export class DiscordSessionObserver implements SessionObserver {
  onChange(state: ISessionState): void {
    ipcRenderer.send('set-discord-activity', state)
  }
}

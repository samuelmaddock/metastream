import { setSetting } from 'actions/settings'
import { ISettingsState } from '../../reducers/settings'

export interface SettingsProps {
  setSetting: typeof setSetting
  settings: ISettingsState
}

import { IAppState } from '../reducers/index'
import storage from 'redux-persist/lib/storage'

const whitelist: (keyof IAppState)[] = ['mediaPlayer', 'settings']

export default {
  key: 'metastream-state',
  storage,
  whitelist
}

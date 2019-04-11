import { IAppState } from '../reducers'
import storage from 'redux-persist/lib/storage'
import autoMergeLevel2 from 'redux-persist/es/stateReconciler/autoMergeLevel2'

const whitelist: (keyof IAppState)[] = ['mediaPlayer', 'settings']

export default {
  key: 'metastream-state',
  storage,
  whitelist,
  stateReconciler: autoMergeLevel2,
  version: 1
}

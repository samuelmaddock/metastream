import { BoostrappedCallback } from 'redux-persist'
import { AvatarRegistry } from 'services/avatar'

export interface ExtraContext {
  avatarRegistry: AvatarRegistry
}

export interface ConfigureStoreOptions {
  extra?: ExtraContext
  initialState?: {}
  persistCallback?: BoostrappedCallback
}

import { IExtra } from 'types/thunk'
import { BoostrappedCallback } from 'redux-persist'

export interface ConfigureStoreOptions {
  extra?: IExtra
  initialState?: {}
  persistCallback?: BoostrappedCallback
}

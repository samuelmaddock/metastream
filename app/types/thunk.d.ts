import { ThunkAction } from 'redux-thunk'
import { IAppState } from 'renderer/reducers'
import { AnyAction } from 'redux'

interface IExtra {}

export type Thunk<T> = ThunkAction<T, IAppState, IExtra, AnyAction>

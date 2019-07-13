import { AnyAction } from 'redux'
import { ThunkAction, ThunkDispatch } from 'redux-thunk'
import { IAppState } from 'reducers'

export type AppThunkAction = ThunkAction<void, IAppState, any, AnyAction>

type MetastreamThunkDispatch = ThunkDispatch<IAppState, any, AnyAction>

export interface IReactReduxProps {
  dispatch: MetastreamThunkDispatch
}

interface MiddlewareAPI<D = MetastreamThunkDispatch, S = IAppState> {
  dispatch: D
  getState(): S
}

export interface MetastreamMiddleware<
  DispatchExt = {},
  S = IAppState,
  D = MetastreamThunkDispatch
> {
  (api: MiddlewareAPI<D, S>): (next: MetastreamThunkDispatch) => (action: any) => any
}

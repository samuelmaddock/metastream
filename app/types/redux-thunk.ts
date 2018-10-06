import { AnyAction } from 'redux'
import { ThunkAction, ThunkDispatch } from 'redux-thunk'
import { IAppState } from 'renderer/reducers'

export type AppThunkAction = ThunkAction<void, IAppState, any, AnyAction>

export interface IReactReduxProps {
  dispatch: ThunkDispatch<IAppState, any, AnyAction>
}

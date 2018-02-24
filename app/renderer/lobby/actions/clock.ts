import { actionCreator } from 'utils/redux'
import { RpcThunk } from 'renderer/lobby/types'
import { rpc, RpcRealm } from 'renderer/network/middleware/rpc'
import { ThunkAction } from 'redux-thunk'
import { IAppState } from 'renderer/reducers'

export const updateServerTimeDelta = actionCreator<number>('UPDATE_SERVEr_TIME_DELTA')

const announceServerTime = (time: number): RpcThunk<void> => (dispatch, getState, context) => {
  if (context.host) {
    return
  }

  // TODO: take average of multiple samples?
  const dt = Date.now() - time
  dispatch(updateServerTimeDelta(dt))
}
const multi_announceServerTime = rpc(RpcRealm.Multicast, announceServerTime)

export const syncServerTime = (): ThunkAction<void, IAppState, void> => {
  return (dispatch, getState) => {
    dispatch(multi_announceServerTime(Date.now()))
  }
}

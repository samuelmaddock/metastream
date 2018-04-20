import { actionCreator } from 'utils/redux'
import { RpcThunk } from 'renderer/lobby/types'
import { rpc, RpcRealm } from 'renderer/network/middleware/rpc'
import { ThunkAction } from 'redux-thunk'
import { IAppState } from 'renderer/reducers'

export const updateServerTimeDelta = actionCreator<number>('UPDATE_SERVER_TIME_DELTA')

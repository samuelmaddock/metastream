import { Reducer } from 'redux'
import { isType } from 'utils/redux'
import { IAppState } from 'renderer/reducers'
import { addUser, removeUser, clearUsers } from '../middleware/users'
import { localUserId } from 'renderer/network'
import { DEFAULT_USERNAME, DEFAULT_COLOR } from '../../../constants/settings'

export interface IUser {
  id: string
  name: string
  avatar?: string
  color: string

  /** Hash of license for verifying no dupes in session */
  license?: string
}

export interface IUsersState {
  host: string
  map: {
    [key: string]: IUser | undefined
  }
}

const initialState: IUsersState = {
  host: '',
  map: {}
}

export const users: Reducer<IUsersState> = (state: IUsersState = initialState, action: any) => {
  if (isType(action, addUser)) {
    const conn = action.payload.conn
    const id = conn.id.toString()
    const userState = state.map[id]
    const name = action.payload.name || (userState && userState.name) || id

    return {
      host: action.payload.host ? id : state.host,
      map: {
        ...state.map,
        [id]: { id, name, color: action.payload.color, license: action.payload.license }
      }
    }
  } else if (isType(action, removeUser)) {
    const id = action.payload
    const { [id]: _, ...rest } = state.map
    return {
      ...state,
      map: rest
    }
  } else if (isType(action, clearUsers)) {
    return initialState
  }

  return state
}

export const getUser = (state: IAppState, userId: string) => state.users.map[userId]

export const getUserName = (state: IAppState, userId: string): string => {
  const user = getUser(state, userId)
  return user ? user.name : DEFAULT_USERNAME
}

export const getUserColor = (state: IAppState, userId: string): string => {
  const user = getUser(state, userId)
  return user ? user.color : DEFAULT_COLOR
}

export const getHostId = (state: IAppState) => state.users.host
export const getHost = (state: IAppState) => getUser(state, getHostId(state))!
export const isHost = (state: IAppState) => getHostId(state) === localUserId()

export const getNumUsers = (state: IAppState) => Object.keys(state.users.map).length

export const findUser = (state: IAppState, filter: (user: IUser, index: number) => boolean) => {
  const userIds = Object.keys(state.users.map)
  for (let i = 0; i < userIds.length; i++) {
    const user = state.users.map[userIds[i]]!
    if (filter(user, i)) {
      return user
    }
  }
}

import { Reducer } from 'redux'
import { isType } from 'utils/redux'
import { IAppState } from 'renderer/reducers'
import { addUser, removeUser, clearUsers } from '../middleware/users'

/** User role in ascending power. */
export const enum UserRole {
  Default = 0,
  DJ = 1 << 0,
  Admin = 1 << 1
}

export interface IUser {
  id: string
  name: string
  avatar?: string
  color: string

  /** Hash of license for verifying no dupes in session. */
  license?: string

  role: UserRole
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
    const hostId = action.payload.host ? id : state.host
    const admin = id === hostId

    return {
      host: hostId,
      map: {
        ...state.map,
        [id]: {
          id,
          name,
          color: action.payload.color,
          license: action.payload.license,
          role: admin ? UserRole.Admin : UserRole.Default
        }
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

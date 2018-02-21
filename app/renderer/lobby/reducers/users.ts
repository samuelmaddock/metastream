import { Reducer } from 'redux'
import { isType } from 'utils/redux'
import { IAppState } from 'renderer/reducers'
import { addUser, removeUser, clearUsers } from '../middleware/users'

export interface IUser {
  id: string
  name: string
}

export interface IUsersState {
  [key: string]: IUser | undefined
}

const initialState: IUsersState = {}

export const users: Reducer<IUsersState> = (state: IUsersState = initialState, action: any) => {
  if (isType(action, addUser)) {
    const conn = action.payload.conn
    const id = conn.id.toString()
    const userState = state[id]
    const name = action.payload.name || (userState && userState.name) || id
    return {
      ...state,
      [id]: { id, name }
    }
  } else if (isType(action, removeUser)) {
    const id = action.payload
    const { [id]: removed, ...rest } = state
    return { ...rest }
  } else if (isType(action, clearUsers)) {
    return initialState
  }

  return state
}

export const getUserName = (state: IAppState, userId: string): string => {
  const user = state.users[userId]
  return user ? user.name : 'Unknown'
}

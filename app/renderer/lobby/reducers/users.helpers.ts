import { IAppState } from 'renderer/reducers'
import { DEFAULT_USERNAME, DEFAULT_COLOR } from 'constants/settings';
import { localUserId } from '../../network';
import { IUser } from './users';

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
export const isHost = (state: IAppState, userId: string = localUserId()) =>
  getHostId(state) === userId

export const isAdmin = (state: IAppState, userId: string = localUserId()) => {
  const user = getUser(state, userId)
  return Boolean(user && user.admin)
}

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

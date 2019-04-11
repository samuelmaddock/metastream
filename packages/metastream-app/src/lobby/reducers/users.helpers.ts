import { IAppState } from 'reducers'
import { DEFAULT_USERNAME, DEFAULT_COLOR } from 'constants/settings'
import { localUserId } from '../../network'
import { IUser, UserRole } from './users'

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

export const hasRole = (state: IAppState, userId: string, role: UserRole) => {
  const user = getUser(state, userId)
  return user ? (user.role & role) !== 0 : false
}

export const isDJ = (state: IAppState, userId: string = localUserId()) =>
  hasRole(state, userId, UserRole.DJ)
export const isAdmin = (state: IAppState, userId: string = localUserId()) =>
  hasRole(state, userId, UserRole.Admin)

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

export const findUserByName = (state: IAppState, name: string) =>
  findUser(state, user => user.name === name)

import { IAppState } from 'reducers'
import { PlaybackState, IMediaPlayerState } from 'lobby/reducers/mediaPlayer'
import { localUserId, NetConnection } from '../../network'
import { isAdmin, isDJ } from './users.helpers'
import { createSelector } from 'reselect'
import { IUser } from './users'

export const TYPING_DURATION = 3e3

export const getTypingUsers = createSelector(
  (state: IAppState) => state.chat.typing,
  (state: IAppState) => state.users,
  (typings, users) => {
    const result = typings.map(userId => users.map[userId]).filter(Boolean) as IUser[]
    return result
  }
)

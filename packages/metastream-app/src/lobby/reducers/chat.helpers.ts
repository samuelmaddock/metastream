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
    const result = typings
      .filter(t => {
        const dt = Math.abs(t.date - Date.now())
        return dt < TYPING_DURATION && Boolean(users.map[t.userId])
      })
      .map(t => users.map[t.userId]) as IUser[]
    return result
  }
)
